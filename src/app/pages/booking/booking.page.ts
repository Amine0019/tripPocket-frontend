import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BookingDraft, BookingDraftService } from '../../core/services/booking-draft.service';
import {
  PAYMENT_METHODS,
  RESERVATION_TYPES,
  errorMessage,
  formatDay,
  isBackendId,
  paymentLabel,
  typeIcon,
  typeLabel
} from '../../core/services/reservation.mapper';
import { ReservationService } from '../../core/services/reservation.service';
import { ToastService } from '../../core/services/toast.service';
import { TravelStore } from '../../core/services/travel.store';
import { BookingStepperComponent } from '../../shared/components/booking-stepper/booking-stepper.component';
import { BookingSummaryComponent } from '../../shared/components/booking-summary/booking-summary.component';
import { ReservationChatComponent } from '../../shared/components/reservation-chat/reservation-chat.component';
import { PaymentMethod } from '../../shared/models/enums/payment-method.enum';
import { ReservationType } from '../../shared/models/enums/reservation-type.enum';
import {
  ReservationAvailability,
  ReservationRecord,
  ReservationRequest
} from '../../shared/models/reservation.model';

const MAX_TRAVELERS = 20;

@Component({
  selector: 'app-booking-page',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, RouterLink, BookingStepperComponent, BookingSummaryComponent, ReservationChatComponent],
  templateUrl: './booking.page.html',
  styleUrl: './booking.page.scss'
})
export class BookingPage implements OnInit {
  private readonly store = inject(TravelStore);
  private readonly booking = inject(BookingDraftService);
  private readonly reservationService = inject(ReservationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly types = RESERVATION_TYPES;
  readonly methods = PAYMENT_METHODS;
  readonly TRIP = ReservationType.TRIP;
  readonly typeLabel = typeLabel;
  readonly typeIcon = typeIcon;
  readonly paymentLabel = paymentLabel;
  readonly formatDay = formatDay;

  readonly step = signal(1);
  readonly draft = this.booking.draft;
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly created = signal<ReservationRecord | null>(null);
  readonly availability = signal<ReservationAvailability | null>(null);

  readonly trip = computed(() => this.store.tripById(this.draft().tripId));
  readonly user = this.store.user;
  /** Mock trips (ids like "japan") only exist in the browser and cannot be booked. */
  readonly isDemoTrip = computed(() => !isBackendId(this.draft().tripId));
  readonly isTripPackage = computed(() => this.draft().reservationType === ReservationType.TRIP);

  readonly tripDates = computed(() => {
    const trip = this.trip();
    if (!trip?.startDate || !trip.endDate) return trip ? `${trip.durationDays} days` : '';
    return `${formatDay(trip.startDate, false)} – ${formatDay(trip.endDate)}`;
  });

  readonly summaryDates = computed(() => {
    const draft = this.draft();
    return this.isTripPackage() || !draft.reservationDate ? this.tripDates() : formatDay(draft.reservationDate);
  });

  readonly maxTravelers = computed(() => {
    const spots = this.availability()?.spotsLeft;
    return this.isTripPackage() && spots != null ? Math.min(MAX_TRAVELERS, spots) : MAX_TRAVELERS;
  });

  readonly total = computed(() => {
    const trip = this.trip();
    const draft = this.draft();
    if (!trip) return 0;
    return this.isTripPackage() ? trip.pricePerPerson * draft.travelers : draft.amount ?? 0;
  });

  /** Why the booking cannot be sent, or null. */
  readonly blockedReason = computed(() => {
    if (this.isDemoTrip()) return 'Demo trip — booking unavailable. Choose a trip created by an admin.';
    const availability = this.availability();
    if (!availability || availability.bookable) return null;
    // A full trip (or a trip without price) only blocks the trip package, not a hotel or an activity
    const reason = availability.reason ?? '';
    const onlyBlocksPackage = reason === 'This trip is fully booked' || reason.includes('no price');
    return onlyBlocksPackage && !this.isTripPackage() ? null : availability.reason;
  });

  ngOnInit(): void {
    const tripId = this.route.snapshot.paramMap.get('tripId') ?? '';
    if (!this.draft().tripId || this.draft().tripId !== tripId) {
      this.booking.start(tripId, this.store.lastSearch().travelers);
    }
    this.store.ensureTripLoaded(tripId);
    this.loadAvailability(tripId);
  }

  update<K extends keyof BookingDraft>(key: K, value: BookingDraft[K]): void {
    this.error.set(null);
    this.booking.patch({ [key]: value } as Partial<BookingDraft>);
  }

  selectType(type: ReservationType): void {
    const trip = this.trip();
    this.booking.patch({
      reservationType: type,
      reservationDate: type === ReservationType.TRIP ? '' : this.draft().reservationDate || trip?.startDate || '',
      amount: type === ReservationType.TRIP ? null : this.draft().amount
    });
  }

  next(): void {
    const problem = this.validateStep(this.step());
    if (problem) {
      this.error.set(problem);
      return;
    }
    this.error.set(null);
    if (this.step() < 5) {
      this.step.update((value) => value + 1);
    }
  }

  back(): void {
    this.error.set(null);
    if (this.step() > 1) {
      this.step.update((value) => value - 1);
    }
  }

  confirm(): void {
    const draft = this.draft();
    const blocked = this.blockedReason();
    const problem = blocked ?? this.validateStep(1) ?? this.validateStep(3);
    if (problem) {
      this.error.set(problem);
      this.toast.show('Booking not possible', problem);
      return;
    }

    const request: ReservationRequest = {
      type: draft.reservationType,
      reservationDate: this.isTripPackage() ? null : draft.reservationDate,
      travelers: draft.travelers,
      paymentMethod: draft.paymentMethod,
      price: this.isTripPackage() ? null : draft.amount ?? 0,
      notes: draft.notes.trim() || null
    };

    this.submitting.set(true);
    this.error.set(null);
    this.store.createReservation(draft.tripId, request).subscribe({
      next: (record) => {
        this.submitting.set(false);
        this.created.set(record);
        this.step.set(6);
        this.toast.show('Reservation sent', `${record.confirmationNumber} is pending confirmation.`);
        this.loadAvailability(draft.tripId);
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        const message = errorMessage(err, 'The booking could not be saved.');
        this.error.set(message);
        this.toast.show('Booking failed', message);
        this.loadAvailability(draft.tripId);
      }
    });
  }

  /** The booking assistant filled everything: check the fields and go to the review step. */
  goReview(): void {
    const stepOne = this.validateStep(1);
    const stepThree = this.validateStep(3);
    if (stepOne || stepThree) {
      this.step.set(stepOne ? 1 : 3);
      this.error.set(stepOne ?? stepThree);
      return;
    }
    this.error.set(null);
    this.step.set(5);
  }

  goReservations(): void {
    void this.router.navigate(['/reservations']);
  }

  private loadAvailability(tripId: string): void {
    if (!isBackendId(tripId)) {
      this.availability.set(null);
      return;
    }
    this.reservationService.getAvailability(Number(tripId)).subscribe({
      next: (availability) => this.availability.set(availability),
      error: () => this.availability.set(null)
    });
  }

  private validateStep(step: number): string | null {
    const draft = this.draft();
    const trip = this.trip();
    if (step === 1) {
      if (!Number.isInteger(draft.travelers) || draft.travelers < 1) return 'At least 1 traveler is required.';
      if (draft.travelers > MAX_TRAVELERS) return `At most ${MAX_TRAVELERS} travelers per reservation.`;
      const spots = this.availability()?.spotsLeft;
      if (this.isTripPackage() && spots != null && draft.travelers > spots) {
        return spots === 0 ? 'This trip is fully booked.' : `Only ${spots} spot${spots > 1 ? 's' : ''} left on this trip.`;
      }
    }
    if (step === 3 && !this.isTripPackage()) {
      if (!draft.reservationDate) return 'Choose the date of this reservation.';
      if (trip?.startDate && draft.reservationDate < trip.startDate) return 'The date must be within the trip dates.';
      if (trip?.endDate && draft.reservationDate > trip.endDate) return 'The date must be within the trip dates.';
      if (draft.amount != null && draft.amount < 0) return 'The amount cannot be negative.';
    }
    if (step === 3 && draft.notes.length > 500) return 'Notes must be at most 500 characters.';
    return null;
  }

  protected readonly PaymentMethod = PaymentMethod;
}
