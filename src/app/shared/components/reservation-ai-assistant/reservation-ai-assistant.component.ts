import { CurrencyPipe } from '@angular/common';
import { Component, Input, OnChanges, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BookingDraftService } from '../../../core/services/booking-draft.service';
import { errorMessage, formatDay, typeIcon, typeLabel } from '../../../core/services/reservation.mapper';
import { ReservationService } from '../../../core/services/reservation.service';
import { TravelStore } from '../../../core/services/travel.store';
import { ReservationStatus } from '../../models/enums/reservation-status.enum';
import { TripCheckResponse, TripCheckSuggestion } from '../../models/reservation.model';

/**
 * "Analyze my trip with AI": checks the traveler's bookings for one trip (rules in Java + LLM)
 * and suggests what is missing. "Book" pre-fills the booking stepper; nothing is booked automatically.
 */
@Component({
  selector: 'app-reservation-ai-assistant',
  standalone: true,
  imports: [CurrencyPipe],
  templateUrl: './reservation-ai-assistant.component.html',
  styleUrl: './reservation-ai-assistant.component.scss'
})
export class ReservationAiAssistantComponent implements OnChanges {
  private readonly reservationService = inject(ReservationService);
  private readonly booking = inject(BookingDraftService);
  private readonly store = inject(TravelStore);
  private readonly router = inject(Router);

  @Input({ required: true }) tripId!: string;

  readonly typeLabel = typeLabel;
  readonly typeIcon = typeIcon;
  readonly formatDay = formatDay;

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly result = signal<TripCheckResponse | null>(null);
  /** Checklist items ticked by the traveler (kept only in this page). */
  readonly done = signal<Set<number>>(new Set());

  readonly scoreTone = computed(() => {
    const score = this.result()?.readinessScore ?? 0;
    return score >= 75 ? 'good' : score >= 45 ? 'mid' : 'low';
  });

  /** Gauge arc length for the SVG ring (circumference of r=34 is ~213.6). */
  readonly dash = computed(() => {
    const score = Math.max(0, Math.min(100, this.result()?.readinessScore ?? 0));
    return `${(score / 100) * 213.6} 213.6`;
  });

  ngOnChanges(): void {
    this.result.set(null);
    this.error.set(null);
    this.done.set(new Set());
  }

  analyze(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    this.reservationService.checkTrip(Number(this.tripId)).subscribe({
      next: (result) => {
        this.result.set(result);
        this.done.set(new Set());
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err, 'The analysis failed, please try again.'));
        this.loading.set(false);
      }
    });
  }

  toggle(index: number): void {
    const next = new Set(this.done());
    if (next.has(index)) next.delete(index); else next.add(index);
    this.done.set(next);
  }

  /** Pre-fills the booking stepper with the suggestion and opens it. */
  book(suggestion: TripCheckSuggestion): void {
    const mine = this.store.reservationList().filter(
      (item) => item.tripId === this.tripId && !item.demo && item.status !== ReservationStatus.CANCELLED
    );
    const travelers = mine.reduce((max, item) => Math.max(max, item.travelers), 0) || 2;
    const min = suggestion.estimatedPriceMin;
    const max = suggestion.estimatedPriceMax;
    const amount = min != null && max != null ? Math.round((min + max) / 2) : min ?? max ?? null;

    this.booking.prefill(this.tripId, {
      reservationType: suggestion.type,
      reservationDate: suggestion.type === 'TRIP' ? '' : suggestion.suggestedDate ?? '',
      travelers,
      amount: suggestion.type === 'TRIP' ? null : amount,
      notes: suggestion.title
    });
    void this.router.navigate(['/booking', this.tripId]);
  }
}
