import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PaymentMethod, Reservation, ReservationType } from '../../core/models/models';
import { BookingDraft, BookingDraftService } from '../../core/services/booking-draft.service';
import { ToastService } from '../../core/services/toast.service';
import { TravelStore } from '../../core/services/travel.store';
import { BookingStepperComponent } from '../../shared/components/booking-stepper/booking-stepper.component';
import { BookingSummaryComponent } from '../../shared/components/booking-summary/booking-summary.component';

@Component({
  selector: 'app-booking-page',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, RouterLink, BookingStepperComponent, BookingSummaryComponent],
  templateUrl: './booking.page.html',
  styleUrl: './booking.page.scss'
})
export class BookingPage implements OnInit {
  private readonly store = inject(TravelStore);
  private readonly booking = inject(BookingDraftService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly step = signal(1);
  readonly draft = this.booking.draft;
  readonly types: ReservationType[] = ['TRIP', 'ACTIVITY', 'ACCOMMODATION', 'TRANSPORT'];
  readonly methods: PaymentMethod[] = ['CARD', 'PAYPAL', 'CASH', 'BANK_TRANSFER'];

  readonly trip = computed(() => this.store.tripById(this.draft().tripId));
  readonly total = computed(() => {
    const trip = this.trip();
    return trip ? trip.pricePerPerson * this.draft().travelers : 0;
  });

  ngOnInit(): void {
    const tripId = this.route.snapshot.paramMap.get('tripId') ?? '';
    if (!this.draft().tripId || this.draft().tripId !== tripId) {
      this.booking.start(tripId, this.store.lastSearch().travelers, this.store.lastSearch().dates);
    }
  }

  update<K extends keyof BookingDraft>(key: K, value: BookingDraft[K]): void {
    this.booking.patch({ [key]: value } as Partial<BookingDraft>);
  }

  next(): void {
    if (this.step() < 6) {
      this.step.update((value) => value + 1);
    }
  }

  back(): void {
    if (this.step() > 1) {
      this.step.update((value) => value - 1);
    }
  }

  confirm(): void {
    const trip = this.trip();
    const draft = this.draft();
    if (!trip) return;
    const reservation: Reservation = {
      id: `res-${Date.now()}`,
      tripId: trip.id,
      tripTitle: trip.title,
      title: `${trip.title} ${draft.reservationType.toLowerCase()} booking`,
      type: draft.reservationType,
      dateLabel: draft.dateLabel,
      date: new Date().toISOString().slice(0, 10),
      paymentMethod: draft.paymentMethod,
      amount: this.total(),
      status: 'CONFIRMED',
      travelers: draft.travelers
    };
    this.store.addReservation(reservation);
    this.store.updateUser({ firstName: draft.firstName, lastName: draft.lastName, email: draft.email });
    this.toast.show('Booking confirmed', `${trip.title} is now in My trips.`);
    this.step.set(6);
  }

  goReservations(): void {
    void this.router.navigate(['/reservations']);
  }
}
