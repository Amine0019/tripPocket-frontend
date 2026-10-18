import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  errorMessage,
  formatDay,
  fromApi,
  isBackendId,
  paymentLabel,
  recordDateLabel,
  recordTitle,
  typeIcon,
  typeLabel
} from '../../core/services/reservation.mapper';
import { ReservationService } from '../../core/services/reservation.service';
import { ToastService } from '../../core/services/toast.service';
import { TravelStore } from '../../core/services/travel.store';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ReservationAiAssistantComponent } from '../../shared/components/reservation-ai-assistant/reservation-ai-assistant.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { ReservationStatus } from '../../shared/models/enums/reservation-status.enum';
import { ReservationRecord } from '../../shared/models/reservation.model';

interface TimelineStep {
  label: string;
  state: 'done' | 'current' | 'todo' | 'cancelled';
}

@Component({
  selector: 'app-reservation-details-page',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink, StatusBadgeComponent, ModalComponent, LoadingComponent, ReservationAiAssistantComponent],
  templateUrl: './reservation-details.page.html',
  styleUrl: './reservation-details.page.scss'
})
export class ReservationDetailsPage implements OnInit {
  private readonly store = inject(TravelStore);
  private readonly reservationService = inject(ReservationService);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  readonly typeLabel = typeLabel;
  readonly typeIcon = typeIcon;
  readonly paymentLabel = paymentLabel;
  readonly formatDay = formatDay;

  readonly id = this.route.snapshot.paramMap.get('id') ?? '';
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly reservation = signal<ReservationRecord | null>(null);
  readonly confirmOpen = signal(false);
  readonly cancelling = signal(false);

  readonly title = computed(() => {
    const item = this.reservation();
    return item ? recordTitle(item) : '';
  });
  readonly dateLabel = computed(() => {
    const item = this.reservation();
    return item ? recordDateLabel(item) : '';
  });
  readonly trip = computed(() => {
    const item = this.reservation();
    return item ? this.store.tripById(item.tripId) : undefined;
  });
  readonly cancellable = computed(() => {
    const status = this.reservation()?.status;
    return status === ReservationStatus.PENDING || status === ReservationStatus.CONFIRMED;
  });

  /** Booked → Confirmed → Completed, or Booked → Cancelled. */
  readonly timeline = computed<TimelineStep[]>(() => {
    const status = this.reservation()?.status;
    if (status === ReservationStatus.CANCELLED) {
      return [
        { label: 'Booked', state: 'done' },
        { label: 'Cancelled', state: 'cancelled' }
      ];
    }
    const order = [ReservationStatus.PENDING, ReservationStatus.CONFIRMED, ReservationStatus.COMPLETED];
    const reached = status ? order.indexOf(status) : 0;
    const labels = ['Booked (pending)', 'Confirmed', 'Completed'];
    return labels.map((label, index) => ({
      label,
      state: index < reached ? 'done' : index === reached ? (status === ReservationStatus.PENDING ? 'current' : 'done') : 'todo'
    }));
  });

  ngOnInit(): void {
    if (!isBackendId(this.id)) {
      // Demo reservation created by another page: it only lives in this browser
      this.reservation.set(this.store.reservationRecordById(this.id) ?? null);
      return;
    }
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.reservationService.getById(Number(this.id)).subscribe({
      next: (response) => {
        const record = fromApi(response);
        this.reservation.set(record);
        this.store.ensureTripLoaded(record.tripId);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err, 'This reservation could not be loaded.'));
        this.loading.set(false);
      }
    });
  }

  cancel(): void {
    const item = this.reservation();
    if (!item || this.cancelling()) return;
    this.cancelling.set(true);
    this.store.cancelReservation(item.id).subscribe({
      next: (record) => {
        this.reservation.set(record ?? { ...item, status: ReservationStatus.CANCELLED });
        this.cancelling.set(false);
        this.confirmOpen.set(false);
        this.toast.show('Cancelled', `${this.title()} is now cancelled.`);
      },
      error: (err: unknown) => {
        this.cancelling.set(false);
        this.confirmOpen.set(false);
        this.toast.show('Cancellation failed', errorMessage(err));
      }
    });
  }
}
