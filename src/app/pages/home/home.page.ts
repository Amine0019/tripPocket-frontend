import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, DestroyRef, ElementRef, OnInit, PLATFORM_ID, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IMG } from '../../core/data/images';
import { SearchQuery, TripCategory } from '../../core/models/models';
import { TravelStore } from '../../core/services/travel.store';
import { ActivityCardComponent } from '../../shared/components/activity-card/activity-card.component';
import { DestinationCardComponent } from '../../shared/components/destination-card/destination-card.component';
import { HeroComponent } from '../../shared/components/hero/hero.component';
import { TripCardComponent } from '../../shared/components/trip-card/trip-card.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [HeroComponent, TripCardComponent, DestinationCardComponent, ActivityCardComponent, RouterLink],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss'
})
export class HomePage implements OnInit, AfterViewInit {
  private readonly store = inject(TravelStore);
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  readonly heroImage = IMG.hero;
  readonly query = this.store.lastSearch;
  readonly featured = computed(() => this.store.trips().slice(0, 3));
  readonly destinations = this.store.destinations;
  readonly activities = computed(() => this.store.activities().slice(0, 3));
  readonly categories: TripCategory[] = ['Adventure', 'Culture', 'Food & wine', 'Nature', 'Relaxation'];

  ngOnInit(): void {
    this.store.loadTripsFromBackend();
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -32px 0px' }
    );

    const targets = this.host.nativeElement.querySelectorAll('.scroll-reveal') as NodeListOf<HTMLElement>;
    targets.forEach(element => {
      observer.observe(element);
    });
    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  search(query: SearchQuery): void {
    this.store.lastSearch.set({ ...query });
    this.router.navigate(['/trips'], { queryParams: { q: query.destination || null } });
  }

  openCategory(category: TripCategory): void {
    this.router.navigate(['/trips'], { queryParams: { category } });
  }
}
