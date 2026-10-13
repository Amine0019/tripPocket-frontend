import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import { TripService } from '../../../core/services/trip.service';
import { TripCoverImageComponent } from '../../../shared/components/trip-cover-image/trip-cover-image.component';
import { TripStatus } from '../../../shared/models/enums/trip-status.enum';
import { Trip } from '../../../shared/models/trip.model';

declare const Swal: any;

@Component({
  selector: 'app-admin-trip-view-page',
  standalone: true,
  imports: [CommonModule, RouterLink, TripCoverImageComponent],
  templateUrl: './admin-trip-view.page.html',
  styleUrl: './admin-trip-view.page.scss'
})
export class AdminTripViewPage implements OnInit {
  private readonly tripService = inject(TripService);
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

    const title = currentTrip.title || currentTrip.destination;
    const swalAvailable = typeof Swal !== 'undefined';
    let confirmed = false;

    if (swalAvailable) {
      const result = await Swal.fire({
        title: 'Delete trip?',
        html: `Are you sure you want to delete <strong>${title}</strong> (#${currentTrip.id})?<br>This action cannot be undone.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#ef7d62',
        cancelButtonColor: '#1b7c6e'
      });
      confirmed = result.isConfirmed;
    } else {
      confirmed = window.confirm(`Delete trip "${title}" (#${currentTrip.id})?`);
    }

    if (!confirmed) return;

    this.tripService.deleteTrip(currentTrip.id).subscribe({
      next: () => {
        this.toast.show('Trip deleted', `"${title}" has been deleted.`);
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
