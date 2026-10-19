import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ActivityService } from '../../../core/services/activity.service';
import { Activity } from '../../../shared/models/activity.model';

@Component({
  selector: 'app-admin-activities-page',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './admin-activities.page.html',
  styleUrl: './admin-activities.page.scss'
})
export class AdminActivitiesPage implements OnInit {
  private readonly activityService = inject(ActivityService);
  readonly activities = signal<Activity[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly total = computed(() => this.activities().length);

  ngOnInit(): void { this.loadActivities(); }

  loadActivities(): void {
    this.loading.set(true);
    this.error.set('');
    this.activityService.getAll().subscribe({
      next: (activities) => { this.activities.set(activities); this.loading.set(false); },
      error: () => {
        this.error.set('Could not load activities. Check the backend connection and try again.');
        this.loading.set(false);
      }
    });
  }
}
