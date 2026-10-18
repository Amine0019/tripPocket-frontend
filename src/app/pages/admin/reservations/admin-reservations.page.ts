import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import {
  NEXT_STATUSES,
  RESERVATION_STATUSES,
  RESERVATION_TYPES,
  errorMessage,
  formatDay,
  statusLabel,
  typeIcon,
  typeLabel
} from '../../../core/services/reservation.mapper';
import { ReservationService } from '../../../core/services/reservation.service';
import { ToastService } from '../../../core/services/toast.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { ReservationStatus } from '../../../shared/models/enums/reservation-status.enum';
import { ReservationType } from '../../../shared/models/enums/reservation-type.enum';
import {
  AdminInsightsResponse,
  ReservationPage,
  ReservationResponse,
  ReservationStats
} from '../../../shared/models/reservation.model';

interface Bar {
  key: string;
  label: string;
  value: number;
  percent: number;
}

@Component({
  selector: 'app-admin-reservations-page',
  standalone: true,
  imports: [FormsModule, RouterLink, CurrencyPipe, DatePipe, StatusBadgeComponent],
  templateUrl: './admin-reservations.page.html',
  styleUrl: './admin-reservations.page.scss'
})
export class AdminReservationsPage implements OnInit {
  private readonly reservationService = inject(ReservationService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchInput$ = new Subject<string>();

  readonly statuses = RESERVATION_STATUSES;
  readonly types = RESERVATION_TYPES;
  readonly statusLabel = statusLabel;
  readonly typeLabel = typeLabel;
  readonly typeIcon = typeIcon;
  readonly formatDay = formatDay;
  readonly nextStatuses = (status: ReservationStatus) => NEXT_STATUSES[status] ?? [];

  // ── Statistics ─────────────────────────────────────────────────────
  readonly stats = signal<ReservationStats | null>(null);
  readonly statsError = signal<string | null>(null);

  readonly statusBars = computed<Bar[]>(() => {
    const stats = this.stats();
    if (!stats) return [];
    return this.statuses.map((status) => ({
      key: status,
      label: statusLabel(status),
      value: stats.countByStatus[status] ?? 0,
      percent: stats.total ? ((stats.countByStatus[status] ?? 0) * 100) / stats.total : 0
    }));
  });

  readonly typeBars = computed<Bar[]>(() => {
    const stats = this.stats();
    if (!stats) return [];
    const max = Math.max(1, ...this.types.map((type) => stats.countByType[type] ?? 0));
    return this.types
      .map((type) => ({ key: type, label: typeLabel(type), value: stats.countByType[type] ?? 0, percent: 0 }))
      .sort((a, b) => b.value - a.value)
      .map((bar) => ({ ...bar, percent: (bar.value * 100) / max }));
  });

  // ── AI insights ────────────────────────────────────────────────────
  readonly insights = signal<AdminInsightsResponse | null>(null);
  readonly insightsLoading = signal(false);
  readonly insightsError = signal<string | null>(null);

  // ── Table ──────────────────────────────────────────────────────────
  readonly page = signal<ReservationPage<ReservationResponse> | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly busyId = signal<number | null>(null);

  readonly statusFilter = signal<ReservationStatus | null>(null);
  readonly typeFilter = signal<ReservationType | null>(null);
  readonly search = signal('');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);

  readonly hasFilters = computed(() => !!(this.statusFilter() || this.typeFilter() || this.search().trim()));

  ngOnInit(): void {
    this.searchInput$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.search.set(value);
        this.pageIndex.set(0);
        this.loadPage();
      });
    this.refresh();
  }

  refresh(): void {
    this.loadStats();
    this.loadPage();
  }

  loadStats(): void {
    this.statsError.set(null);
    this.reservationService.getStats().subscribe({
      next: (stats) => this.stats.set(stats),
      error: (err: unknown) => this.statsError.set(errorMessage(err, 'Statistics could not be loaded.'))
    });
  }

  loadPage(): void {
    this.loading.set(true);
    this.error.set(null);
    this.reservationService
      .search({
        status: this.statusFilter(),
        type: this.typeFilter(),
        search: this.search(),
        page: this.pageIndex(),
        size: this.pageSize()
      })
      .subscribe({
        next: (page) => {
          this.page.set(page);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.error.set(errorMessage(err, 'Reservations could not be loaded. Is the backend running?'));
          this.loading.set(false);
        }
      });
  }

  generateInsights(): void {
    if (this.insightsLoading()) return;
    this.insightsLoading.set(true);
    this.insightsError.set(null);
    this.reservationService.getAdminInsights().subscribe({
      next: (insights) => {
        this.insights.set(insights);
        this.insightsLoading.set(false);
      },
      error: (err: unknown) => {
        this.insightsError.set(errorMessage(err, 'The AI insights could not be generated.'));
        this.insightsLoading.set(false);
      }
    });
  }

  // ── Filters & pagination ───────────────────────────────────────────
  onSearch(value: string): void {
    this.searchInput$.next(value);
  }

  setStatus(status: ReservationStatus | null): void {
    this.statusFilter.set(status);
    this.pageIndex.set(0);
    this.loadPage();
  }

  setType(type: ReservationType | null): void {
    this.typeFilter.set(type || null);
    this.pageIndex.set(0);
    this.loadPage();
  }

  setPageSize(size: number): void {
    this.pageSize.set(Number(size) || 10);
    this.pageIndex.set(0);
    this.loadPage();
  }

  goToPage(index: number): void {
    const total = this.page()?.totalPages ?? 1;
    if (index < 0 || index >= total) return;
    this.pageIndex.set(index);
    this.loadPage();
  }

  clearFilters(): void {
    this.statusFilter.set(null);
    this.typeFilter.set(null);
    this.search.set('');
    this.searchInput$.next('');
    this.pageIndex.set(0);
    this.loadPage();
  }

  // ── Row actions ────────────────────────────────────────────────────
  view(reservation: ReservationResponse): void {
    void this.router.navigate(['/admin/reservations', reservation.id]);
  }

  changeStatus(reservation: ReservationResponse, status: ReservationStatus | ''): void {
    if (!status || status === reservation.status) return;
    this.busyId.set(reservation.id);
    this.reservationService.updateStatus(reservation.id, status).subscribe({
      next: (updated) => {
        this.busyId.set(null);
        this.page.update((page) =>
          page ? { ...page, content: page.content.map((r) => (r.id === updated.id ? updated : r)) } : page
        );
        this.toast.show('Status updated', `${updated.confirmationNumber} is now ${statusLabel(updated.status).toLowerCase()}.`);
        this.loadStats();
      },
      error: (err: unknown) => {
        this.busyId.set(null);
        this.toast.show('Status not changed', errorMessage(err));
        this.loadPage();
      }
    });
  }

  async remove(reservation: ReservationResponse): Promise<void> {
    const result = await Swal.fire({
      title: 'Delete this reservation?',
      html: `<p style="margin:0;color:#64748b;font-size:14px">
               <b>${reservation.confirmationNumber ?? '#' + reservation.id}</b> · ${escapeHtml(reservation.tripTitle ?? '')}<br>
               ${escapeHtml(reservation.userFullName ?? '')} — this cannot be undone.</p>`,
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

    this.busyId.set(reservation.id);
    this.reservationService.delete(reservation.id).subscribe({
      next: () => {
        this.busyId.set(null);
        this.toast.show('Reservation deleted', `${reservation.confirmationNumber ?? 'The reservation'} was removed.`);
        this.refresh();
      },
      error: (err: unknown) => {
        this.busyId.set(null);
        this.toast.show('Delete failed', errorMessage(err));
      }
    });
  }

  dateOf(reservation: ReservationResponse): string {
    if (reservation.type === ReservationType.TRIP && reservation.tripStartDate && reservation.tripEndDate) {
      return `${formatDay(reservation.tripStartDate, false)} – ${formatDay(reservation.tripEndDate, false)}`;
    }
    return formatDay(reservation.reservationDate);
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);
}
