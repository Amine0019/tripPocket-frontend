import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import { TripService } from '../../../core/services/trip.service';
import { TripCoverImageComponent } from '../../../shared/components/trip-cover-image/trip-cover-image.component';
import { TripStatus } from '../../../shared/models/enums/trip-status.enum';
import { ItineraryDay, Trip, TripFormData } from '../../../shared/models/trip.model';

@Component({
  selector: 'app-admin-trip-form-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TripCoverImageComponent],
  templateUrl: './admin-trip-form.page.html',
  styleUrl: './admin-trip-form.page.scss'
})
export class AdminTripFormPage implements OnInit {
  private readonly tripService = inject(TripService);
  private readonly toast       = inject(ToastService);
  private readonly router      = inject(Router);
  private readonly route       = inject(ActivatedRoute);

  isEdit     = signal<boolean>(false);
  loading    = signal<boolean>(false);
  saving     = signal<boolean>(false);
  errorList  = signal<string[]>([]);
  tripId: number | null = null;

  // Cover image management
  selectedFile: File | null = null;
  filePreviewUrl: string | null = null;

  // New highlight input model
  newHighlight = '';

  // Form Model
  draft: TripFormData = {
    userId: null,
    destination: '',
    title: '',
    subtitle: '',
    description: '',
    startDate: '',
    endDate: '',
    status: TripStatus.PLANNED,
    durationDays: null,
    rating: null,
    reviewCount: null,
    badge: '',
    price: null,
    currency: 'USD',
    availability: '',
    groupSize: null,
    pace: 'Balanced',
    highlights: [],
    itinerary: []
  };

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam && idParam !== 'new') {
      this.isEdit.set(true);
      this.tripId = Number(idParam);
      this.loadTrip(this.tripId);
    }
  }

  private loadTrip(id: number): void {
    this.loading.set(true);
    this.tripService.getTripById(id).subscribe({
      next: (trip: Trip) => {
        this.draft = {
          destination: trip.destination || '',
          title: trip.title || '',
          subtitle: trip.subtitle || '',
          description: trip.description || '',
          startDate: trip.startDate ? trip.startDate.substring(0, 10) : '',
          endDate: trip.endDate ? trip.endDate.substring(0, 10) : '',
          status: trip.status || TripStatus.PLANNED,
          durationDays: trip.durationDays ?? null,
          rating: trip.rating ?? null,
          reviewCount: trip.reviewCount ?? null,
          badge: trip.badge || '',
          price: trip.price ?? null,
          currency: trip.currency || 'USD',
          availability: trip.availability || '',
          groupSize: trip.groupSize ?? null,
          pace: trip.pace || 'Balanced',
          highlights: trip.highlights ? [...trip.highlights] : [],
          itinerary: trip.itinerary ? trip.itinerary.map(item => ({ ...item })) : []
        };
        this.loading.set(false);
      },
      error: () => {
        this.toast.show('Error', 'Trip not found.');
        void this.router.navigate(['/admin/trips']);
      }
    });
  }

  // ── Highlights Management ─────────────────────────────────────────
  addHighlight(): void {
    const val = this.newHighlight.trim();
    if (!val) return;
    if (!this.draft.highlights) {
      this.draft.highlights = [];
    }
    this.draft.highlights.push(val);
    this.newHighlight = '';
  }

  removeHighlight(index: number): void {
    if (this.draft.highlights) {
      this.draft.highlights.splice(index, 1);
    }
  }

  // ── Itinerary Management ──────────────────────────────────────────
  addItineraryDay(): void {
    if (!this.draft.itinerary) {
      this.draft.itinerary = [];
    }
    const nextDayNum = this.draft.itinerary.length + 1;
    this.draft.itinerary.push({
      dayNumber: nextDayNum,
      title: `Day ${nextDayNum}`,
      description: ''
    });
  }

  removeItineraryDay(index: number): void {
    if (this.draft.itinerary) {
      this.draft.itinerary.splice(index, 1);
      // Auto-reassign day numbers
      this.draft.itinerary.forEach((d, idx) => {
        d.dayNumber = idx + 1;
      });
    }
  }

  // ── Cover Image File Handling ────────────────────────────────────
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (!file.type.startsWith('image/')) {
        this.toast.show('Invalid file', 'Please select a valid image file');
        return;
      }
      this.selectedFile = file;

      // Create preview
      if (this.filePreviewUrl) {
        URL.revokeObjectURL(this.filePreviewUrl);
      }
      this.filePreviewUrl = URL.createObjectURL(file);
    }
  }

  clearSelectedFile(): void {
    if (this.filePreviewUrl) {
      URL.revokeObjectURL(this.filePreviewUrl);
      this.filePreviewUrl = null;
    }
    this.selectedFile = null;
  }

  // ── Dates Auto Duration ──────────────────────────────────────────
  onDatesChange(): void {
    if (this.draft.startDate && this.draft.endDate) {
      const start = new Date(this.draft.startDate);
      const end = new Date(this.draft.endDate);
      if (end >= start) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        this.draft.durationDays = diffDays;
      }
    }
  }

  // ── Save / Submit ────────────────────────────────────────────────
  save(): void {
    if (this.saving()) return;
    this.errorList.set([]);

    // Client-side validations
    if (!this.draft.destination || this.draft.destination.trim().length === 0) {
      this.errorList.set(['Destination is required.']);
      return;
    }
    if (!this.draft.startDate) {
      this.errorList.set(['Start date is required.']);
      return;
    }
    if (!this.draft.endDate) {
      this.errorList.set(['End date is required.']);
      return;
    }
    if (new Date(this.draft.endDate) < new Date(this.draft.startDate)) {
      this.errorList.set(['End date cannot be earlier than start date.']);
      return;
    }

    this.saving.set(true);

    const formData = this.tripService.buildFormData(this.draft, this.selectedFile);

    const request$ = this.isEdit()
      ? this.tripService.updateTrip(this.tripId!, formData)
      : this.tripService.createTrip(formData);

    request$.subscribe({
      next: (savedTrip) => {
        this.saving.set(false);
        this.toast.show(
          this.isEdit() ? 'Trip updated' : 'Trip created',
          `"${savedTrip.title || savedTrip.destination}" was successfully ${this.isEdit() ? 'updated' : 'created'}.`
        );
        void this.router.navigate(['/admin/trips']);
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.parseBackendErrors(err);
      }
    });
  }

  private parseBackendErrors(error: HttpErrorResponse): void {
    const list: string[] = [];
    const validationErrors = error.error?.errors as Record<string, string> | undefined;

    if (validationErrors && typeof validationErrors === 'object') {
      Object.values(validationErrors).forEach((msg) => list.push(msg));
    }

    if (list.length === 0) {
      const message = error.error?.message;
      if (typeof message === 'string' && message.trim().length > 0) {
        list.push(message);
      } else if (error.status === 400) {
        list.push('Bad request: Please verify your dates and input format.');
      } else if (error.status === 403) {
        list.push('Forbidden: Admin privileges required.');
      } else {
        list.push('Failed to save trip. Please check backend logs.');
      }
    }

    this.errorList.set(list);
    this.toast.show('Validation Error', list[0]);
  }
}
