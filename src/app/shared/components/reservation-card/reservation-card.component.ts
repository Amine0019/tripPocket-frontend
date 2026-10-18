import { CurrencyPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { recordDateLabel, recordTitle, typeIcon, typeLabel } from '../../../core/services/reservation.mapper';
import { ReservationRecord } from '../../models/reservation.model';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';

@Component({
  selector: 'app-reservation-card',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, StatusBadgeComponent],
  templateUrl: './reservation-card.component.html',
  styleUrl: './reservation-card.component.scss'
})
export class ReservationCardComponent {
  @Input({ required: true }) reservation!: ReservationRecord;
  @Output() cancel = new EventEmitter<string>();

  readonly typeLabel = typeLabel;
  readonly typeIcon = typeIcon;

  get title(): string {
    return recordTitle(this.reservation);
  }

  get dateLabel(): string {
    return recordDateLabel(this.reservation);
  }

  get cancellable(): boolean {
    return this.reservation.status === 'PENDING' || this.reservation.status === 'CONFIRMED';
  }
}
