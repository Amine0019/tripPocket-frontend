import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import {
  NEXT_STATUSES,
  errorMessage,
  formatDay,
  paymentLabel,
  statusLabel,
  typeIcon,
  typeLabel
} from '../../../core/services/reservation.mapper';
import { ReservationService } from '../../../core/services/reservation.service';
import { ToastService } from '../../../core/services/toast.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { ReservationStatus } from '../../../shared/models/enums/reservation-status.enum';
import { ReservationResponse } from '../../../shared/models/reservation.model';

@Component({
  selector: 'app-admin-reservation-view-page',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe, StatusBadgeComponent],
  templateUrl: './admin-reservation-view.page.html',
  styleUrl: './admin-reservation-view.page.scss'
})
export class AdminReservationViewPage implements OnInit {
  private readonly reservationService = inject(ReservationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly typeLabel = typeLabel;
  readonly typeIcon = typeIcon;
  readonly paymentLabel = paymentLabel;
  readonly statusLabel = statusLabel;
  readonly formatDay = formatDay;

  readonly reservation = signal<ReservationResponse | null>(null);
  readonly tripReservations = signal<ReservationResponse[]>([]);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error.set('Invalid reservation id.');
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.reservationService.getById(id).subscribe({
      next: (reservation) => {
        this.reservation.set(reservation);
        this.loading.set(false);
        if (reservation.tripId != null) {
          this.reservationService.getByTrip(reservation.tripId).subscribe({
            next: (list) => this.tripReservations.set(list.filter((r) => r.id !== reservation.id)),
            error: () => this.tripReservations.set([])
          });
        }
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err, 'This reservation could not be loaded.'));
        this.loading.set(false);
      }
    });
  }

  nextStatuses(status: ReservationStatus): ReservationStatus[] {
    return NEXT_STATUSES[status] ?? [];
  }

  setStatus(status: ReservationStatus): void {
    const current = this.reservation();
    if (!current || this.busy()) return;
    this.busy.set(true);
    this.reservationService.updateStatus(current.id, status).subscribe({
      next: (updated) => {
        this.reservation.set(updated);
        this.busy.set(false);
        this.toast.show('Status updated', `${updated.confirmationNumber} is now ${statusLabel(updated.status).toLowerCase()}.`);
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.toast.show('Status not changed', errorMessage(err));
      }
    });
  }

  async remove(): Promise<void> {
    const current = this.reservation();
    if (!current) return;
    const result = await Swal.fire({
      title: 'Delete this reservation?',
      text: `${current.confirmationNumber ?? '#' + current.id} will be removed permanently.`,
      icon: 'warning',
      iconColor: '#ef4444',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      reverseButtons: true,
      focusCancel: true,
      customClass: {
        popup: 'tp-swal-popup',
        title: 'tp-swal-title',
        confirmButton: 'tp-swal-confirm-btn',
        cancelButton: 'tp-swal-cancel-btn'
      }
    });
    if (!result.isConfirmed) return;
    this.busy.set(true);
    this.reservationService.delete(current.id).subscribe({
      next: () => {
        this.toast.show('Reservation deleted', `${current.confirmationNumber ?? 'The reservation'} was removed.`);
        void this.router.navigate(['/admin/reservations']);
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.toast.show('Delete failed', errorMessage(err));
      }
    });
  }
}
