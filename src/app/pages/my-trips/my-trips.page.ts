import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TripStatus } from '../../core/models/models';
import { TravelStore } from '../../core/services/travel.store';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { TripCardComponent } from '../../shared/components/trip-card/trip-card.component';

@Component({
  selector: 'app-my-trips-page',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent, TripCardComponent, EmptyStateComponent],
  templateUrl: './my-trips.page.html',
  styleUrl: './my-trips.page.scss'
})
export class MyTripsPage {
  private readonly store = inject(TravelStore);
  readonly tab = signal<'booked' | 'saved'>('booked');
  readonly status = signal<TripStatus | 'ALL'>('ALL');

  readonly booked = computed(() => {
    const status = this.status();
    return this.store.bookedTrips().filter((trip) => status === 'ALL' || trip.status === status);
  });
  readonly saved = computed(() => this.store.trips().filter((trip) => this.store.isFavorite(trip.id)));
  readonly upcoming = computed(() => this.store.bookedTrips().find((trip) => trip.countdownDays != null));
}
