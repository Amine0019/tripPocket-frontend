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
}
