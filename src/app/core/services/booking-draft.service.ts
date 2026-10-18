import { Injectable, signal } from '@angular/core';
import { PaymentMethod } from '../../shared/models/enums/payment-method.enum';
import { ReservationType } from '../../shared/models/enums/reservation-type.enum';

/**
 * What the traveler is filling in the booking stepper.
 * No card data is ever kept here: payment is a simulation in this project.
 */
export interface BookingDraft {
  tripId: string;
  /** Free label kept for older callers (trip details page); the stepper shows the real trip dates. */
  dateLabel: string;
  travelers: number;
  reservationType: ReservationType;
  /** yyyy-MM-dd; empty for a trip package (the server uses the trip start date). */
  reservationDate: string;
  /** Estimated amount for a hotel, flight... (a trip package price is computed by the server). */
  amount: number | null;
  paymentMethod: PaymentMethod;
  notes: string;
}

const empty = (tripId = ''): BookingDraft => ({
  tripId,
  dateLabel: '',
  travelers: 2,
  reservationType: ReservationType.TRIP,
  reservationDate: '',
  amount: null,
  paymentMethod: PaymentMethod.CREDIT_CARD,
  notes: ''
});

@Injectable({ providedIn: 'root' })
export class BookingDraftService {
  readonly draft = signal<BookingDraft>(empty());

  start(tripId: string, travelers = 2, dateLabel = ''): void {
    this.draft.set({ ...empty(tripId), travelers: Math.max(1, travelers || 1), dateLabel });
  }

  patch(partial: Partial<BookingDraft>): void {
    this.draft.update((current) => ({ ...current, ...partial }));
  }

  /** Starts a new draft already filled (used by the AI suggestions "Book" button). */
  prefill(tripId: string, partial: Partial<BookingDraft>): void {
    this.draft.set({ ...empty(tripId), ...partial, tripId });
  }
}
