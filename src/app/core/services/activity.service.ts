import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Activity as BackendActivity } from '../../shared/models/activity.model';

/** HTTP access to the backend activity endpoints at /api/activities. */
@Injectable({ providedIn: 'root' })
export class ActivityService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/activities`;

  getAll(): Observable<BackendActivity[]> {
    return this.http.get<BackendActivity[]>(this.apiUrl);
  }

  getByTrip(tripId: number): Observable<BackendActivity[]> {
    return this.http.get<BackendActivity[]>(`${this.apiUrl}/trip/${tripId}`);
  }

  getById(id: number): Observable<BackendActivity> {
    return this.http.get<BackendActivity>(`${this.apiUrl}/${id}`);
  }

  create(tripId: number, activity: Omit<BackendActivity, 'id'>): Observable<BackendActivity> {
    const params = new HttpParams().set('tripId', tripId);
    return this.http.post<BackendActivity>(this.apiUrl, activity, { params });
  }

  update(id: number, activity: Omit<BackendActivity, 'id'>): Observable<BackendActivity> {
    return this.http.put<BackendActivity>(`${this.apiUrl}/${id}`, activity);
  }

  updateCompleted(id: number, completed: boolean): Observable<BackendActivity> {
    const params = new HttpParams().set('completed', completed);
    return this.http.patch<BackendActivity>(`${this.apiUrl}/${id}/completed`, null, { params });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
