import { TripStatus } from './enums/trip-status.enum';

export interface Trip {
  id: number;
  destination: string;
  description: string;
  startDate: string;
  endDate: string;
  coverImage?: string;
  status: TripStatus;
}
