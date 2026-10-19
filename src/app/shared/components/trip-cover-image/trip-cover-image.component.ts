import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, SimpleChanges, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { TripService } from '../../../core/services/trip.service';

@Component({
  selector: 'app-trip-cover-image',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="cover-container" [ngClass]="cssClass">
      @if (imageUrl()) {
        <img [src]="imageUrl()" [alt]="alt" class="cover-img" (error)="onImageError()" />
      } @else if (loading()) {
        <div class="cover-placeholder loading">
          <div class="spinner-sm"></div>
        </div>
      } @else {
        <div class="cover-placeholder fallback">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <span class="placeholder-label">{{ placeholderText || 'No image' }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    .cover-container {
      width: 100%;
      height: 100%;
      position: relative;
      overflow: hidden;
      border-radius: inherit;
      background: #edf3f1;
    }
    .cover-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.3s ease;
    }
    .cover-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      color: var(--muted, #6d7c83);
      background: linear-gradient(135deg, #e8f4f1 0%, #dce8e5 100%);
    }
    .cover-placeholder.fallback svg {
      opacity: 0.6;
      stroke: var(--teal, #1b7c6e);
    }
    .placeholder-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      opacity: 0.7;
    }
    .spinner-sm {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(27, 124, 110, 0.2);
      border-top-color: var(--teal, #1b7c6e);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class TripCoverImageComponent implements OnChanges, OnDestroy {
  private readonly tripService = inject(TripService);

  @Input() tripId?: number | null;
  @Input() previewUrl?: string | null;
  @Input() alt = 'Trip image';
  @Input() placeholderText?: string;
  @Input() cssClass = '';

  imageUrl = signal<string | null>(null);
  loading = signal<boolean>(false);

  private sub?: Subscription;
  private createdBlobUrl?: string;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['previewUrl'] && this.previewUrl) {
      this.cleanupBlob();
      this.imageUrl.set(this.previewUrl);
      this.loading.set(false);
      return;
    }

    if (changes['tripId']) {
      this.loadTripImage();
    }
  }

  private loadTripImage(): void {
    this.cleanupBlob();
    if (!this.tripId) {
      this.imageUrl.set(null);
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.sub?.unsubscribe();
    this.sub = this.tripService.getCoverImageBlob(this.tripId).subscribe({
      next: (blob: Blob) => {
        if (blob && blob.size > 0) {
          this.createdBlobUrl = URL.createObjectURL(blob);
          this.imageUrl.set(this.createdBlobUrl);
        } else {
          this.imageUrl.set(null);
        }
        this.loading.set(false);
      },
      error: () => {
        this.imageUrl.set(null);
        this.loading.set(false);
      }
    });
  }

  onImageError(): void {
    this.imageUrl.set(null);
  }

  private cleanupBlob(): void {
    if (this.createdBlobUrl) {
      URL.revokeObjectURL(this.createdBlobUrl);
      this.createdBlobUrl = undefined;
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.cleanupBlob();
  }
}
