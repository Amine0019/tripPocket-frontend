import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TravelStore } from '../../core/services/travel.store';
import { BookingDraftService } from '../../core/services/booking-draft.service';
import { ActivityCardComponent } from '../../shared/components/activity-card/activity-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-trip-details-page',
  standalone: true,
  imports: [CurrencyPipe, RouterLink, ActivityCardComponent, StatusBadgeComponent],
  templateUrl: './trip-details.page.html',
  styleUrl: './trip-details.page.scss'
})
export class TripDetailsPage {
  private readonly store = inject(TravelStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly booking = inject(BookingDraftService);
  private readonly toast = inject(ToastService);

  readonly trip = computed(() => this.store.tripById(this.route.snapshot.paramMap.get('id') ?? ''));
  readonly activities = computed(() => {
    const trip = this.trip();
    if (!trip) return [];
    return this.store.activities().filter((activity) => trip.activityIds.includes(activity.id));
  });

  liked(): boolean {
    const trip = this.trip();
    return !!trip && this.store.isFavorite(trip.id);
  }

  toggleFavorite(): void {
    const trip = this.trip();
    if (!trip) return;
    this.store.toggleFavorite(trip.id);
    this.toast.show(this.store.isFavorite(trip.id) ? 'Saved' : 'Removed', trip.title);
  }

  book(): void {
    const trip = this.trip();
    if (!trip) return;
    this.booking.start(trip.id, this.store.lastSearch().travelers, this.store.lastSearch().dates);
    this.router.navigate(['/booking', trip.id]);
  }
}
