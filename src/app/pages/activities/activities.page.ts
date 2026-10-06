import { Component, computed, inject, signal } from '@angular/core';
import { ActivityCategory } from '../../core/models/models';
import { TravelStore } from '../../core/services/travel.store';
import { ActivityCardComponent } from '../../shared/components/activity-card/activity-card.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-activities-page',
  standalone: true,
  imports: [PageHeaderComponent, ActivityCardComponent, EmptyStateComponent],
  templateUrl: './activities.page.html',
  styleUrl: './activities.page.scss'
})
export class ActivitiesPage {
  private readonly store = inject(TravelStore);
  readonly category = signal<ActivityCategory | 'ALL'>('ALL');
  readonly categories: Array<ActivityCategory | 'ALL'> = ['ALL', 'ADVENTURE', 'CULTURE', 'FOOD', 'NATURE', 'SPORT', 'RELAXATION'];
  readonly activities = computed(() => {
    const selected = this.category();
    const list = this.store.activities();
    return selected === 'ALL' ? list : list.filter((item) => item.category === selected);
  });
}
