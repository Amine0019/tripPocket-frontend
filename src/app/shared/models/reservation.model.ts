import { ReservationStatus } from './enums/reservation-status.enum';
import { ReservationType } from './enums/reservation-type.enum';

export interface Reservation {
  id: number;
  type: ReservationType;
  reservationDate: string;
  confirmationNumber: string;
  price: number;
  notes: string;
  status: ReservationStatus;
}
