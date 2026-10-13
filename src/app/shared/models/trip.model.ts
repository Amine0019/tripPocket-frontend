import { TripStatus } from './enums/trip-status.enum';

export interface ItineraryDay {
  dayNumber?: number;
  title?: string;
  description?: string;
}

export interface Trip {
  id: number;
  title?: string;
  subtitle?: string;
  destination: string;
  durationDays?: number;
  rating?: number;
  reviewCount?: number;
  badge?: string;
  description?: string;
  startDate: string;
  endDate: string;
  price?: number;
  currency?: string;
  availability?: string;
  groupSize?: number;
  pace?: string;
  highlights?: string[];
  itinerary?: ItineraryDay[];
  status?: TripStatus;
}

export interface TripFormData {
  userId?: number | null;
  destination: string;
  title?: string;
  subtitle?: string;
  description?: string;
  startDate: string;
  endDate: string;
  status?: TripStatus;
  durationDays?: number | null;
  rating?: number | null;
  reviewCount?: number | null;
  badge?: string;
  price?: number | null;
  currency?: string;
  availability?: string;
  groupSize?: number | null;
  pace?: string;
  highlights?: string[];
  itinerary?: ItineraryDay[];
  coverImage?: File | null;
}
