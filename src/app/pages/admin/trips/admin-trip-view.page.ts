import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import { TripService } from '../../../core/services/trip.service';
import { TripCoverImageComponent } from '../../../shared/components/trip-cover-image/trip-cover-image.component';
import { TripStatus } from '../../../shared/models/enums/trip-status.enum';
import { Trip } from '../../../shared/models/trip.model';

import { TravelStore } from '../../../core/services/travel.store';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-trip-view-page',
  standalone: true,
  imports: [CommonModule, RouterLink, TripCoverImageComponent],
  templateUrl: './admin-trip-view.page.html',
  styleUrl: './admin-trip-view.page.scss'
})
export class AdminTripViewPage implements OnInit {
  private readonly tripService = inject(TripService);
  private readonly store       = inject(TravelStore);
  private readonly toast       = inject(ToastService);
  private readonly router      = inject(Router);
  private readonly route       = inject(ActivatedRoute);

  tripId: number | null = null;
  trip = signal<Trip | null>(null);
  loading = signal<boolean>(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.tripId = Number(id);
      this.loadTrip(this.tripId);
    } else {
      void this.router.navigate(['/admin/trips']);
    }
  }

  loadTrip(id: number): void {
    this.loading.set(true);
    this.tripService.getTripById(id).subscribe({
      next: (data) => {
        this.trip.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.toast.show('Error', 'Trip not found.');
        void this.router.navigate(['/admin/trips']);
      }
    });
  }

  async deleteTrip(): Promise<void> {
    const currentTrip = this.trip();
    if (!currentTrip) return;

    const destination = currentTrip.destination || 'Trip';
    const rawTitle = currentTrip.title || destination;
    const displayTitle = rawTitle.length > 60 ? `${rawTitle.slice(0, 57)}…` : rawTitle;

    const result = await Swal.fire({
      title: 'Delete this trip?',
      html: `
        <div style="text-align: left; margin-top: 10px; font-family: inherit;">
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; margin-bottom: 12px;">
            <div style="font-size: 11px; font-weight: 700; color: #1b7c6e; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">
              ${destination}
            </div>
            <div style="font-size: 15px; font-weight: 600; color: #1c2c34; line-height: 1.4;">
              ${displayTitle}
            </div>
          </div>
          <p style="margin: 0; color: #64748b; font-size: 13.5px; line-height: 1.5;">
            Are you sure you want to permanently delete this trip? <strong>This action cannot be undone</strong> and will remove it from all traveler listings.
          </p>
        </div>
      `,
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

    this.tripService.deleteTrip(currentTrip.id).subscribe({
      next: () => {
        this.toast.show('Trip deleted', `"${displayTitle}" has been deleted.`);
        this.store.removeTrip(currentTrip.id);
        void this.router.navigate(['/admin/trips']);
      },
      error: () => {
        this.toast.show('Error', 'Failed to delete trip.');
      }
    });
  }

  getStatusClass(status?: TripStatus): string {
    switch (status) {
      case TripStatus.PLANNED:
        return 'status-planned';
      case TripStatus.ONGOING:
        return 'status-ongoing';
      case TripStatus.COMPLETED:
        return 'status-completed';
      default:
        return 'status-default';
    }
  }
}
