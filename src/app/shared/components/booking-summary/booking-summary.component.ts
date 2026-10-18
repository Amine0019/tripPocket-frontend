import { CurrencyPipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Trip } from '../../../core/models/models';

@Component({
  selector: 'app-booking-summary',
  standalone: true,
  imports: [CurrencyPipe],
  templateUrl: './booking-summary.component.html',
  styleUrl: './booking-summary.component.scss'
})
export class BookingSummaryComponent {
  @Input({ required: true }) trip!: Trip;
  @Input() travelers = 2;
  @Input() dates = '';
  /** What is being booked, e.g. "Trip package" or "Hotel". */
  @Input() label = '';
  /** Total to display; when null the trip price per person x travelers is used. */
  @Input() amount: number | null = null;

  total(): number {
    return this.amount ?? this.trip.pricePerPerson * this.travelers;
  }
}
