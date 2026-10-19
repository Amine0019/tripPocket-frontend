import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FilterPanelComponent, FilterState } from '../../shared/components/filter-panel/filter-panel.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SearchBarComponent } from '../../shared/components/search-bar/search-bar.component';
import { TripCardComponent } from '../../shared/components/trip-card/trip-card.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { TravelStore } from '../../core/services/travel.store';
import { SearchQuery, Trip } from '../../core/models/models';

@Component({
  selector: 'app-explore-trips-page',
  standalone: true,
  imports: [PageHeaderComponent, SearchBarComponent, FilterPanelComponent, TripCardComponent, EmptyStateComponent],
  templateUrl: './explore-trips.page.html',
  styleUrl: './explore-trips.page.scss'
})
export class ExploreTripsPage implements OnInit {
  private readonly store = inject(TravelStore);
  private readonly route = inject(ActivatedRoute);

  readonly query = this.store.lastSearch;
  readonly filtersOpen = signal(false);
  readonly filters = signal<FilterState>({
    destination: '',
    category: '',
    price: '',
    duration: '',
    status: '',
    sort: 'recommended'
  });

  readonly trips = computed(() => this.applyFilters(this.store.trips()));

  ngOnInit(): void {
    this.store.loadTripsFromBackend();
    this.route.queryParamMap.subscribe((params) => {
      const q = params.get('q') ?? '';
      const category = params.get('category') ?? '';
      if (q) {
        this.store.lastSearch.update((current) => ({ ...current, destination: q }));
      }
      if (category) {
        this.filters.update((current) => ({ ...current, category }));
      }
    });
  }

  search(query: SearchQuery): void {
    this.store.lastSearch.set({ ...query });
  }

  applyFilters(trips: Trip[]): Trip[] {
    const query = this.query().destination.trim().toLowerCase();
    const filters = this.filters();
    let list = trips.filter((trip) => {
      const haystack = `${trip.title} ${trip.destination} ${trip.country} ${trip.category}`.toLowerCase();
      const matchesQuery = !query || haystack.includes(query);
      const dest = filters.destination.trim().toLowerCase();
      const matchesDest = !dest || haystack.includes(dest);
      const matchesCategory = !filters.category || trip.category === filters.category;
      const maxPrice = Number(filters.price);
      const matchesPrice = !filters.price || trip.pricePerPerson <= maxPrice;
      const maxDays = Number(filters.duration);
      const matchesDuration = !filters.duration || trip.durationDays <= maxDays;
      const matchesStatus = !filters.status || trip.status === filters.status;
      return matchesQuery && matchesDest && matchesCategory && matchesPrice && matchesDuration && matchesStatus;
    });

    if (filters.sort === 'price-asc') {
      list = [...list].sort((a, b) => a.pricePerPerson - b.pricePerPerson);
    } else if (filters.sort === 'price-desc') {
      list = [...list].sort((a, b) => b.pricePerPerson - a.pricePerPerson);
    } else {
      list = [...list].sort((a, b) => b.rating - a.rating);
    }
    return list;
  }
}
