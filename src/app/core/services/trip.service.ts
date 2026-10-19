import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Trip, TripFormData } from '../../shared/models/trip.model';

@Injectable({
  providedIn: 'root'
})
export class TripService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/trips`;

  /**
   * Get all trips
   */
  getAllTrips(): Observable<Trip[]> {
    return this.http.get<Trip[]>(this.apiUrl);
  }

  /**
   * Get a single trip by ID
   */
  getTripById(id: number): Observable<Trip> {
    return this.http.get<Trip>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get all trips belonging to a specific user ID
   */
  getTripsByUserId(userId: number): Observable<Trip[]> {
    return this.http.get<Trip[]>(`${this.apiUrl}/user/${userId}`);
  }

  /**
   * Create a trip (admin only, multipart/form-data)
   */
  createTrip(formData: FormData): Observable<Trip> {
    return this.http.post<Trip>(this.apiUrl, formData);
  }

  /**
   * Update an existing trip (admin only, multipart/form-data)
   */
  updateTrip(id: number, formData: FormData): Observable<Trip> {
    return this.http.put<Trip>(`${this.apiUrl}/${id}`, formData);
  }

  /**
   * Delete a trip by ID (admin only)
   */
  deleteTrip(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * URL endpoint for the trip's cover image
   */
  getCoverImageUrl(id: number): string {
    return `${this.apiUrl}/${id}/cover-image`;
  }

  /**
   * Fetch the cover image as a Blob with authorization header attached
   */
  getCoverImageBlob(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/cover-image`, { responseType: 'blob' });
  }

  /**
   * Utility helper to convert TripFormData to FormData matching the backend @RequestParam expectations
   */
  buildFormData(data: Partial<TripFormData>, file?: File | null): FormData {
    const formData = new FormData();

    if (data.userId !== undefined && data.userId !== null && !isNaN(Number(data.userId))) {
      formData.append('userId', String(data.userId));
    }

    if (data.destination) {
      formData.append('destination', data.destination.trim());
    }

    if (data.title !== undefined && data.title !== null) {
      formData.append('title', data.title.trim());
    }

    if (data.subtitle !== undefined && data.subtitle !== null) {
      formData.append('subtitle', data.subtitle.trim());
    }

    if (data.description !== undefined && data.description !== null) {
      formData.append('description', data.description.trim());
    }

    if (data.startDate) {
      formData.append('startDate', data.startDate);
    }

    if (data.endDate) {
      formData.append('endDate', data.endDate);
    }

    if (data.status) {
      formData.append('status', data.status);
    }

    if (data.durationDays !== undefined && data.durationDays !== null && !isNaN(Number(data.durationDays))) {
      formData.append('durationDays', String(data.durationDays));
    }

    if (data.rating !== undefined && data.rating !== null && !isNaN(Number(data.rating))) {
      formData.append('rating', String(data.rating));
    }

    if (data.reviewCount !== undefined && data.reviewCount !== null && !isNaN(Number(data.reviewCount))) {
      formData.append('reviewCount', String(data.reviewCount));
    }

    if (data.badge !== undefined && data.badge !== null) {
      formData.append('badge', data.badge.trim());
    }

    if (data.price !== undefined && data.price !== null && !isNaN(Number(data.price))) {
      formData.append('price', String(data.price));
    }

    if (data.currency !== undefined && data.currency !== null) {
      formData.append('currency', data.currency.trim());
    }

    if (data.availability !== undefined && data.availability !== null) {
      formData.append('availability', data.availability.trim());
    }

    if (data.groupSize !== undefined && data.groupSize !== null && !isNaN(Number(data.groupSize))) {
      formData.append('groupSize', String(data.groupSize));
    }

    if (data.pace !== undefined && data.pace !== null) {
      formData.append('pace', data.pace.trim());
    }

    if (data.highlights && Array.isArray(data.highlights)) {
      formData.append('highlights', JSON.stringify(data.highlights.filter(h => h && h.trim().length > 0)));
    }

    if (data.itinerary && Array.isArray(data.itinerary)) {
      formData.append('itinerary', JSON.stringify(data.itinerary));
    }

    if (file instanceof File) {
      formData.append('coverImage', file, file.name);
    }

    return formData;
  }
}
