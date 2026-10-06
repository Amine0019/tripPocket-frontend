import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-booking-stepper',
  standalone: true,
  templateUrl: './booking-stepper.component.html',
  styleUrl: './booking-stepper.component.scss'
})
export class BookingStepperComponent {
  @Input() step = 1;
  @Input() steps: string[] = ['Trip', 'Traveler', 'Reservation', 'Payment', 'Review', 'Done'];
}
