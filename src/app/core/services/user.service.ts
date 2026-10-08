import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/view-models';

export interface AdminUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: 'TRAVELER' | 'ADMIN';
  enabled: boolean;
}

export interface AdminUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role?: 'TRAVELER' | 'ADMIN';
  enabled?: boolean;
}

/** DTO returned by the backend search endpoint — no id field */
export interface UserSearchResult {
  firstName: string;
  lastName: string;
  email: string;
  role: 'TRAVELER' | 'ADMIN';
  enabled: boolean;
}

export interface UserSearchCriteria {
  email?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/users`;

  /** Used by public profile page */
  updateUser(id: string | number, user: Partial<User> | AdminUserPayload): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, user);
  }

  // ── Admin CRUD ──────────────────────────────────────────────────
  getAllUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(this.apiUrl);
  }

  getUserById(id: number): Observable<AdminUser> {
    return this.http.get<AdminUser>(`${this.apiUrl}/${id}`);
  }

  createUser(payload: AdminUserPayload): Observable<AdminUser> {
    return this.http.post<AdminUser>(this.apiUrl, payload);
  }

  adminUpdateUser(id: number, payload: AdminUserPayload): Observable<AdminUser> {
    return this.http.put<AdminUser>(`${this.apiUrl}/${id}`, payload);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ── Email search (backend) ─────────────────────────────────────
  searchUsers(criteria: UserSearchCriteria): Observable<UserSearchResult[]> {
    const params = new HttpParams()
      .set('email', criteria.email?.trim() ?? '');
    return this.http.get<UserSearchResult[]>(`${this.apiUrl}/search`, { params });
  }
}
