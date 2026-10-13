import { CurrencyPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Trip } from '../../../core/models/models';
import { TravelStore } from '../../../core/services/travel.store';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';

@Component({
  selector: 'app-trip-card',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, StatusBadgeComponent],
  templateUrl: './trip-card.component.html',
  styleUrl: './trip-card.component.scss'
})
export class TripCardComponent {
  private readonly store = inject(TravelStore);
  @Input({ required: true }) trip!: Trip;
  @Output() favorite = new EventEmitter<string>();

  liked(): boolean {
    return this.store.isFavorite(this.trip.id);
  }

  toggle(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.store.toggleFavorite(this.trip.id);
    this.favorite.emit(this.trip.id);
  }

  onImgError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80';
    }
  }
}
