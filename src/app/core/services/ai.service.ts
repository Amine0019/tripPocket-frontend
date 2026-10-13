import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ItineraryDay } from '../../shared/models/trip.model';

export interface AiTagline {
  headline: string;
  description: string;
}

export interface AiItineraryDay {
  dayNumber: number;
  title: string;
  description: string;
}

@Injectable({ providedIn: 'root' })
export class AiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/ai`;

  generateTagline(keywords: string): Observable<AiTagline> {
    return this.http.post<AiTagline>(`${this.apiUrl}/trip-tagline`, { keywords });
  }

  generateItinerary(destination: string, days: number, notes?: string): Observable<ItineraryDay[]> {
    return this.http.post<ItineraryDay[]>(`${this.apiUrl}/trip-itinerary`, { destination, days, notes });
  }
}
