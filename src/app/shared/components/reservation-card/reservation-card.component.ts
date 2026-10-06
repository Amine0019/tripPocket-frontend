import { CurrencyPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Reservation } from '../../../core/models/models';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';

@Component({
  selector: 'app-reservation-card',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, StatusBadgeComponent],
  templateUrl: './reservation-card.component.html',
  styleUrl: './reservation-card.component.scss'
})
export class ReservationCardComponent {
  @Input({ required: true }) reservation!: Reservation;
  @Output() cancel = new EventEmitter<string>();

  typeLabel(type: string): string {
    return type.charAt(0) + type.slice(1).toLowerCase();
  }
}
