import { Component, Input } from '@angular/core';
import { ReservationStatus, TripBadge } from '../../../core/models/models';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.scss'
})
export class StatusBadgeComponent {
  @Input() badge?: TripBadge | null;
  @Input() status?: ReservationStatus | string | null;
  @Input() overlay = true;

  get label(): string {
    if (this.badge === 'BEST_SELLER') return 'Best seller';
    if (this.badge === 'FEW_SPOTS_LEFT') return 'Few spots left';
    if (this.badge === 'TRENDING') return 'Trending';
    if (this.status) {
      return this.status.charAt(0) + this.status.slice(1).toLowerCase();
    }
    return '';
  }

  get tone(): string {
    if (this.badge === 'BEST_SELLER') return 'mint';
    if (this.badge === 'FEW_SPOTS_LEFT') return 'sand';
    if (this.badge === 'TRENDING') return 'ink';
    if (this.status === 'CONFIRMED' || this.status === 'COMPLETED') return 'mint';
    if (this.status === 'PENDING') return 'sand';
    if (this.status === 'CANCELLED') return 'mute';
    return 'mint';
  }
}
