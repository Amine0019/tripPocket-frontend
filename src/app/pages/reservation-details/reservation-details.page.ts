import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TravelStore } from '../../core/services/travel.store';
import { ToastService } from '../../core/services/toast.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';

@Component({
  selector: 'app-reservation-details-page',
  standalone: true,
  imports: [CurrencyPipe, RouterLink, StatusBadgeComponent, ModalComponent],
  templateUrl: './reservation-details.page.html',
  styleUrl: './reservation-details.page.scss'
})
export class ReservationDetailsPage {
  private readonly store = inject(TravelStore);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  readonly confirmOpen = signal(false);
  readonly reservation = computed(() => this.store.reservationById(this.route.snapshot.paramMap.get('id') ?? ''));
  readonly trip = computed(() => {
    const item = this.reservation();
    return item ? this.store.tripById(item.tripId) : undefined;
  });

  pay(): string {
    const item = this.reservation();
    return item ? this.store.paymentLabel(item.paymentMethod) : '';
  }

  cancel(): void {
    const item = this.reservation();
    if (!item) return;
    this.store.cancelReservation(item.id);
    this.confirmOpen.set(false);
    this.toast.show('Cancelled', `${item.title} is now cancelled.`);
  }
}
