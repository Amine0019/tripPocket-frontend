import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RESERVATION_STATUSES, RESERVATION_TYPES, errorMessage, recordTitle, statusLabel, typeLabel } from '../../core/services/reservation.mapper';
import { ToastService } from '../../core/services/toast.service';
import { TravelStore } from '../../core/services/travel.store';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ReservationAiAssistantComponent } from '../../shared/components/reservation-ai-assistant/reservation-ai-assistant.component';
import { ReservationCardComponent } from '../../shared/components/reservation-card/reservation-card.component';
import { ReservationStatus } from '../../shared/models/enums/reservation-status.enum';
import { ReservationType } from '../../shared/models/enums/reservation-type.enum';

interface BookedTrip {
  tripId: string;
  title: string;
  count: number;
}

@Component({
  selector: 'app-reservations-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    PageHeaderComponent,
    ReservationCardComponent,
    EmptyStateComponent,
    ModalComponent,
    LoadingComponent,
    ReservationAiAssistantComponent
  ],
  templateUrl: './reservations.page.html',
  styleUrl: './reservations.page.scss'
})
export class ReservationsPage implements OnInit {
  private readonly store = inject(TravelStore);
  private readonly toast = inject(ToastService);

  readonly statuses = RESERVATION_STATUSES;
  readonly types = RESERVATION_TYPES;
  readonly statusLabel = statusLabel;
  readonly typeLabel = typeLabel;

  readonly status = signal<ReservationStatus | 'ALL'>('ALL');
  readonly type = signal<ReservationType | 'ALL'>('ALL');
  readonly search = signal('');
  readonly pendingId = signal<string | null>(null);
  readonly cancelling = signal(false);
  readonly aiTripId = signal<string | null>(null);

  readonly loading = this.store.reservationsLoading;
  readonly error = this.store.reservationsError;
  readonly all = this.store.reservationList;

  readonly items = computed(() => {
    const status = this.status();
    const type = this.type();
    const query = this.search().trim().toLowerCase();
    return this.all().filter((item) =>
      (status === 'ALL' || item.status === status) &&
      (type === 'ALL' || item.type === type) &&
      (!query ||
        recordTitle(item).toLowerCase().includes(query) ||
        (item.confirmationNumber ?? '').toLowerCase().includes(query) ||
        (item.tripDestination ?? '').toLowerCase().includes(query) ||
        (item.notes ?? '').toLowerCase().includes(query))
    );
  });

  readonly countFor = (status: ReservationStatus | 'ALL'): number =>
    status === 'ALL' ? this.all().length : this.all().filter((item) => item.status === status).length;

  /** Trips with at least one saved, non-cancelled reservation: the AI can check them. */
  readonly bookedTrips = computed<BookedTrip[]>(() => {
    const trips = new Map<string, BookedTrip>();
    for (const item of this.all()) {
      if (item.demo || item.status === ReservationStatus.CANCELLED || !item.tripId) continue;
      const current = trips.get(item.tripId);
      trips.set(item.tripId, { tripId: item.tripId, title: item.tripTitle, count: (current?.count ?? 0) + 1 });
    }
    return [...trips.values()];
  });

  readonly pendingTitle = computed(() => {
    const id = this.pendingId();
    const item = id ? this.all().find((r) => r.id === id) : undefined;
    return item ? recordTitle(item) : '';
  });

  ngOnInit(): void {
    this.store.loadReservationsFromBackend();
  }

  reload(): void {
    this.store.loadReservationsFromBackend();
  }

  clearFilters(): void {
    this.status.set('ALL');
    this.type.set('ALL');
    this.search.set('');
  }

  toggleAi(tripId: string): void {
    this.aiTripId.set(this.aiTripId() === tripId ? null : tripId);
  }

  askCancel(id: string): void {
    this.pendingId.set(id);
  }

  confirmCancel(): void {
    const id = this.pendingId();
    if (!id || this.cancelling()) return;
    this.cancelling.set(true);
    this.store.cancelReservation(id).subscribe({
      next: () => {
        this.cancelling.set(false);
        this.pendingId.set(null);
        this.toast.show('Reservation cancelled', 'Your booking status was updated.');
      },
      error: (err: unknown) => {
        this.cancelling.set(false);
        this.pendingId.set(null);
        this.toast.show('Cancellation failed', errorMessage(err));
      }
    });
  }
}
