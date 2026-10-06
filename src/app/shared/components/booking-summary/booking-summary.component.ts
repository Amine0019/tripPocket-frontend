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
  @Input() dates = 'May 18 – May 25';

  total(): number {
    return this.trip.pricePerPerson * this.travelers;
  }
}
