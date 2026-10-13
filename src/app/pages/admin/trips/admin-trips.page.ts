import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import { TripService } from '../../../core/services/trip.service';
import { TripCoverImageComponent } from '../../../shared/components/trip-cover-image/trip-cover-image.component';
import { TripStatus } from '../../../shared/models/enums/trip-status.enum';
import { Trip } from '../../../shared/models/trip.model';

import { TravelStore } from '../../../core/services/travel.store';

declare const Swal: any;

@Component({
  selector: 'app-admin-trips-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, TripCoverImageComponent],
  templateUrl: './admin-trips.page.html',
  styleUrl: './admin-trips.page.scss'
})
export class AdminTripsPage implements OnInit {
  private readonly tripService = inject(TripService);
  private readonly store       = inject(TravelStore);
  private readonly toast       = inject(ToastService);
  private readonly router      = inject(Router);

  // ── State ──────────────────────────────────────────────────────────
  allTrips           = signal<Trip[]>([]);
  loading            = signal<boolean>(true);
  error              = signal<string>('');
  searchQuery        = signal<string>('');
  activeStatusFilter = signal<TripStatus | null>(null);
  userFilterId       = signal<number | null>(null);
  viewMode           = signal<'grid' | 'table'>('grid');

  searchControl   = new FormControl('', { nonNullable: true });
  userIdControl   = new FormControl<string>('', { nonNullable: true });

  readonly TripStatus = TripStatus;

  // ── Stats ──────────────────────────────────────────────────────────
  totalCount     = computed(() => this.allTrips().length);
  plannedCount   = computed(() => this.allTrips().filter(t => t.status === TripStatus.PLANNED).length);
  ongoingCount   = computed(() => this.allTrips().filter(t => t.status === TripStatus.ONGOING).length);
  completedCount = computed(() => this.allTrips().filter(t => t.status === TripStatus.COMPLETED).length);

  // ── Filtered Trips ─────────────────────────────────────────────────
  filteredTrips = computed(() => {
    let list = this.allTrips();
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.activeStatusFilter();

    if (status) {
      list = list.filter(t => t.status === status);
    }

    if (query) {
      list = list.filter(t => {
        const dest = (t.destination || '').toLowerCase();
        const title = (t.title || '').toLowerCase();
        const sub = (t.subtitle || '').toLowerCase();
        const badge = (t.badge || '').toLowerCase();
        return dest.includes(query) || title.includes(query) || sub.includes(query) || badge.includes(query);
      });
    }

    return list;
  });

  ngOnInit(): void {
    this.searchControl.valueChanges.subscribe(val => {
      this.searchQuery.set(val);
    });

    this.loadAllTrips();
  }

  loadAllTrips(): void {
    this.loading.set(true);
    this.error.set('');
    this.userFilterId.set(null);
    this.userIdControl.setValue('');

    this.tripService.getAllTrips().subscribe({
      next: (trips) => {
        this.allTrips.set(trips);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load trips from backend. Ensure backend is running.');
        this.loading.set(false);
      }
    });
  }

  filterByUser(): void {
    const rawVal = this.userIdControl.value.trim();
    if (!rawVal) {
      this.loadAllTrips();
      return;
    }

    const userId = Number(rawVal);
    if (isNaN(userId)) {
      this.toast.show('Invalid ID', 'Please enter a valid numeric user ID');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.userFilterId.set(userId);

    this.tripService.getTripsByUserId(userId).subscribe({
      next: (trips) => {
        this.allTrips.set(trips);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(`Failed to load trips for user #${userId}.`);
        this.loading.set(false);
      }
    });
  }

  clearUserFilter(): void {
    this.userIdControl.setValue('');
    this.loadAllTrips();
  }

  setStatusFilter(status: TripStatus | string | null): void {
    this.activeStatusFilter.set((status as TripStatus) ?? null);
  }

  toggleViewMode(mode: 'grid' | 'table'): void {
    this.viewMode.set(mode);
  }

  viewTrip(id: number): void {
    void this.router.navigate(['/admin/trips', id]);
  }

  editTrip(id: number): void {
    void this.router.navigate(['/admin/trips', id, 'edit']);
  }

  async deleteTrip(trip: Trip): Promise<void> {
    const title = trip.title || trip.destination;
    const swalAvailable = typeof Swal !== 'undefined';
    let confirmed = false;

    if (swalAvailable) {
      const result = await Swal.fire({
        title: 'Delete trip?',
        html: `Are you sure you want to delete <strong>${title}</strong> (#${trip.id})?<br>This action cannot be undone.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#ef7d62',
        cancelButtonColor: '#1b7c6e'
      });
      confirmed = result.isConfirmed;
    } else {
      confirmed = window.confirm(`Are you sure you want to delete "${title}" (#${trip.id})?`);
    }

    if (!confirmed) return;

    this.tripService.deleteTrip(trip.id).subscribe({
      next: () => {
        this.toast.show('Trip deleted', `"${title}" has been removed.`);
        this.allTrips.update(trips => trips.filter(t => t.id !== trip.id));
        this.store.removeTrip(trip.id);
      },
      error: () => {
        this.toast.show('Error', 'Failed to delete trip. Please try again.');
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
