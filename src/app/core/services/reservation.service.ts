import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ReservationStatus } from '../../shared/models/enums/reservation-status.enum';
import { ReservationType } from '../../shared/models/enums/reservation-type.enum';
import {
  AdminInsightsResponse,
  ParsedReservationRequest,
  ParseRequestBody,
  ReservationAvailability,
  ReservationPage,
  ReservationRequest,
  ReservationResponse,
  ReservationStats,
  TripCheckResponse
} from '../../shared/models/reservation.model';

export interface ReservationSearchFilters {
  status?: ReservationStatus | null;
  type?: ReservationType | null;
  tripId?: number | null;
  search?: string | null;
  page?: number;
  size?: number;
}

/** HTTP calls of the Reservation module (backend: /api/reservations). */
@Injectable({ providedIn: 'root' })
export class ReservationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/reservations`;

  // ── Traveler (connected user) ──────────────────────────────────────

  /** Book a trip (or a service of a trip) for the connected user. */
  create(tripId: number, request: ReservationRequest): Observable<ReservationResponse> {
    return this.http.post<ReservationResponse>(this.apiUrl, request, { params: { tripId } });
  }

  /** My reservations, optionally filtered by status. */
  getMine(status?: ReservationStatus | null): Observable<ReservationResponse[]> {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.http.get<ReservationResponse[]>(`${this.apiUrl}/me`, { params });
  }

  /** One reservation (owner or admin). */
  getById(id: number): Observable<ReservationResponse> {
    return this.http.get<ReservationResponse>(`${this.apiUrl}/${id}`);
  }

  /** Spots left and booking status of a trip. */
  getAvailability(tripId: number): Observable<ReservationAvailability> {
    return this.http.get<ReservationAvailability>(`${this.apiUrl}/availability`, { params: { tripId } });
  }

  /** Modify one of my reservations (only while PENDING). */
  update(id: number, request: ReservationRequest): Observable<ReservationResponse> {
    return this.http.put<ReservationResponse>(`${this.apiUrl}/${id}`, request);
  }

  /** Cancel a reservation (owner or admin). */
  cancel(id: number): Observable<ReservationResponse> {
    return this.http.patch<ReservationResponse>(`${this.apiUrl}/${id}/cancel`, {});
  }

  // ── Admin ──────────────────────────────────────────────────────────

  /** Paginated search over all reservations (admin only). */
  search(filters: ReservationSearchFilters = {}): Observable<ReservationPage<ReservationResponse>> {
    let params = new HttpParams()
      .set('page', String(filters.page ?? 0))
      .set('size', String(filters.size ?? 10));
    if (filters.status) params = params.set('status', filters.status);
    if (filters.type) params = params.set('type', filters.type);
    if (filters.tripId != null) params = params.set('tripId', String(filters.tripId));
    if (filters.search && filters.search.trim()) params = params.set('search', filters.search.trim());
    return this.http.get<ReservationPage<ReservationResponse>>(this.apiUrl, { params });
  }

  /** All reservations of a trip (admin only). */
  getByTrip(tripId: number): Observable<ReservationResponse[]> {
    return this.http.get<ReservationResponse[]>(`${this.apiUrl}/trip/${tripId}`);
  }

  /** Change a reservation status (admin only). */
  updateStatus(id: number, status: ReservationStatus): Observable<ReservationResponse> {
    return this.http.patch<ReservationResponse>(`${this.apiUrl}/${id}/status`, {}, { params: { status } });
  }

  /** Delete a reservation (admin only). */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /** Dashboard numbers (admin only). */
  getStats(): Observable<ReservationStats> {
    return this.http.get<ReservationStats>(`${this.apiUrl}/stats`);
  }

  // ── AI assistant ───────────────────────────────────────────────────

  /** Checks my bookings for a trip and suggests what is missing. */
  checkTrip(tripId: number): Observable<TripCheckResponse> {
    return this.http.post<TripCheckResponse>(`${this.apiUrl}/ai/trip-check`, {}, { params: { tripId } });
  }

  /** Turns one sentence ("2 nights hotel on the 18th for 2") into booking form values. */
  parseRequest(body: ParseRequestBody): Observable<ParsedReservationRequest> {
    return this.http.post<ParsedReservationRequest>(`${this.apiUrl}/ai/parse-request`, body);
  }

  /** Summary, alerts and advice for the admin dashboard (admin only). */
  getAdminInsights(): Observable<AdminInsightsResponse> {
    return this.http.post<AdminInsightsResponse>(`${this.apiUrl}/ai/admin-insights`, {});
  }
}
