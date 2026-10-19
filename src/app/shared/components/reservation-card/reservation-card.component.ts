import { CurrencyPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  recordDateLabel,
  recordTitle,
  reservationPhoto,
  typeIcon,
  typeImage,
  typeLabel
} from '../../../core/services/reservation.mapper';
import { TravelStore } from '../../../core/services/travel.store';
import { ImgFallbackDirective } from '../../directives/img-fallback.directive';
import { ReservationRecord } from '../../models/reservation.model';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';

@Component({
  selector: 'app-reservation-card',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, StatusBadgeComponent, ImgFallbackDirective],
  templateUrl: './reservation-card.component.html',
  styleUrl: './reservation-card.component.scss'
})
export class ReservationCardComponent {
  private readonly store = inject(TravelStore);

  @Input({ required: true }) reservation!: ReservationRecord;
  @Output() cancel = new EventEmitter<string>();

  readonly typeLabel = typeLabel;
  readonly typeIcon = typeIcon;

  /** Trip cover for a trip package (demo trips use their local photo), a photo of the service otherwise. */
  get photo(): string {
    const r = this.reservation;
    return reservationPhoto(r.type, r.tripId, this.store.tripById(r.tripId)?.image);
  }

  get fallbackPhoto(): string {
    return typeImage(this.reservation.type);
  }

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
