import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TravelStore } from '../../core/services/travel.store';
import { ToastService } from '../../core/services/toast.service';
import { Reservation } from '../../core/models/models';

@Component({
  selector: 'app-activity-details-page',
  standalone: true,
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './activity-details.page.html',
  styleUrl: './activity-details.page.scss'
})
export class ActivityDetailsPage {
  private readonly store = inject(TravelStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly activity = computed(() => this.store.activityById(this.route.snapshot.paramMap.get('id') ?? ''));
  readonly relatedTrips = computed(() => {
    const activity = this.activity();
    if (!activity) return [];
    return this.store.trips().filter((trip) => trip.activityIds.includes(activity.id));
  });

  addToTrip(): void {
    const activity = this.activity();
    if (!activity) return;
    const trip = this.relatedTrips()[0] ?? this.store.bookedTrips()[0] ?? this.store.trips()[0];
    const reservation: Reservation = {
      id: `res-${Date.now()}`,
      tripId: trip.id,
      tripTitle: trip.title,
      title: activity.name,
      type: 'ACTIVITY',
      dateLabel: this.store.lastSearch().dates,
      date: new Date().toISOString().slice(0, 10),
      paymentMethod: 'CARD',
      amount: activity.price,
      status: 'PENDING',
      travelers: this.store.lastSearch().travelers
    };
    this.store.addReservation(reservation);
    this.toast.show('Activity reserved', `${activity.name} is now in your reservations.`);
    void this.router.navigate(['/reservations', reservation.id]);
  }
}
