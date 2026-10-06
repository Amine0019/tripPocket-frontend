import { Component, computed, inject, signal } from '@angular/core';
import { ReservationStatus } from '../../core/models/models';
import { TravelStore } from '../../core/services/travel.store';
import { ToastService } from '../../core/services/toast.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ReservationCardComponent } from '../../shared/components/reservation-card/reservation-card.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';

@Component({
  selector: 'app-reservations-page',
  standalone: true,
  imports: [PageHeaderComponent, ReservationCardComponent, EmptyStateComponent, ModalComponent],
  templateUrl: './reservations.page.html',
  styleUrl: './reservations.page.scss'
})
export class ReservationsPage {
  private readonly store = inject(TravelStore);
  private readonly toast = inject(ToastService);

  readonly status = signal<ReservationStatus | 'ALL'>('ALL');
  readonly pendingId = signal<string | null>(null);
  readonly statuses: Array<ReservationStatus | 'ALL'> = ['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

  readonly items = computed(() => {
    const status = this.status();
    return this.store.reservations().filter((item) => status === 'ALL' || item.status === status);
  });

  askCancel(id: string): void {
    this.pendingId.set(id);
  }

  confirmCancel(): void {
    const id = this.pendingId();
    if (!id) return;
    this.store.cancelReservation(id);
    this.pendingId.set(null);
    this.toast.show('Reservation cancelled', 'Your booking status was updated.');
  }
}
