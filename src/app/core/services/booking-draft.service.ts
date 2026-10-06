import { Injectable, signal } from '@angular/core';
import { PaymentMethod, ReservationType } from '../models/models';

export interface BookingDraft {
  tripId: string;
  dateLabel: string;
  travelers: number;
  firstName: string;
  lastName: string;
  email: string;
  reservationType: ReservationType;
  paymentMethod: PaymentMethod;
  cardName: string;
  cardNumber: string;
  notes: string;
}

const empty = (tripId = ''): BookingDraft => ({
  tripId,
  dateLabel: 'May 18 – May 25',
  travelers: 2,
  firstName: 'Alex',
  lastName: 'Morgan',
  email: 'alex.morgan@email.com',
  reservationType: 'TRIP',
  paymentMethod: 'CARD',
  cardName: 'Alex Morgan',
  cardNumber: '•••• 2841',
  notes: ''
});

@Injectable({ providedIn: 'root' })
export class BookingDraftService {
  readonly draft = signal<BookingDraft>(empty());

  start(tripId: string, travelers = 2, dateLabel = 'May 18 – May 25'): void {
    this.draft.set({ ...empty(tripId), travelers, dateLabel });
  }

  patch(partial: Partial<BookingDraft>): void {
    this.draft.update((current) => ({ ...current, ...partial }));
  }
}
