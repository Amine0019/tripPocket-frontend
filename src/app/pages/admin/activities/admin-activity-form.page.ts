import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ActivityService } from '../../../core/services/activity.service';
import { TripService } from '../../../core/services/trip.service';
import { ActivityCategory as BackendActivityCategory } from '../../../shared/models/enums/activity-category.enum';
import { Trip } from '../../../shared/models/trip.model';

type ActivityType = 'ADVENTURE' | 'CULTURE' | 'FOOD' | 'NATURE' | 'SPORT' | 'RELAXATION';

@Component({
  selector: 'app-admin-activity-form-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './admin-activity-form.page.html',
  styleUrl: './admin-activity-form.page.scss'
})
export class AdminActivityFormPage {
  private readonly activityService = inject(ActivityService);
  private readonly tripService = inject(TripService);
  private readonly router = inject(Router);

  readonly trips = signal<Trip[]>([]);
  readonly loadingTrips = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly categories: ActivityType[] = ['ADVENTURE', 'CULTURE', 'FOOD', 'NATURE', 'SPORT', 'RELAXATION'];
  private readonly backendCategory: Record<ActivityType, BackendActivityCategory> = {
    ADVENTURE: BackendActivityCategory.TRANSPORT,
    CULTURE: BackendActivityCategory.SIGHTSEEING,
    FOOD: BackendActivityCategory.RESTAURANT,
    NATURE: BackendActivityCategory.SIGHTSEEING,
    SPORT: BackendActivityCategory.LEISURE,
    RELAXATION: BackendActivityCategory.LEISURE
  };
  readonly form = new FormGroup({
    tripId: new FormControl<number | null>(null, Validators.required),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(120)] }),
    category: new FormControl<ActivityType>('CULTURE', { nonNullable: true, validators: Validators.required }),
    activityDate: new FormControl('', { nonNullable: true, validators: Validators.required }),
    location: new FormControl('', { nonNullable: true, validators: Validators.maxLength(160) }),
    description: new FormControl('', { nonNullable: true, validators: Validators.maxLength(2000) }),
    estimatedCost: new FormControl(0, { nonNullable: true, validators: [Validators.min(0)] })
  });

  constructor() {
    this.tripService.getAllTrips().subscribe({
      next: (trips) => { this.trips.set(trips); this.loadingTrips.set(false); },
      error: () => {
        this.error.set('Could not load trips. Activities must be attached to a trip.');
        this.loadingTrips.set(false);
      }
    });
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) return;
    const value = this.form.getRawValue();
    if (value.tripId === null) return;

    this.saving.set(true);
    this.error.set('');
    this.activityService.create(value.tripId, {
      name: value.name.trim(),
      category: this.backendCategory[value.category],
      activityDate: value.activityDate,
      location: value.location.trim(),
      description: value.description.trim(),
      estimatedCost: value.estimatedCost,
      completed: false
    }).subscribe({
      next: () => { void this.router.navigate(['/admin/activities']); },
      error: (err: { error?: { message?: string } }) => {
        this.error.set(err.error?.message || 'Could not create activity. Please try again.');
        this.saving.set(false);
      }
    });
  }
}
