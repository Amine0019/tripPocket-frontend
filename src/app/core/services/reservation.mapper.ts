import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { IMG } from '../data/images';
import {
  PaymentMethod as ViewPaymentMethod,
  Reservation as ViewReservation,
  ReservationType as ViewReservationType
} from '../models/models';
import { PaymentMethod } from '../../shared/models/enums/payment-method.enum';
import { ReservationStatus } from '../../shared/models/enums/reservation-status.enum';
import { ReservationType } from '../../shared/models/enums/reservation-type.enum';
import { ReservationRecord, ReservationResponse } from '../../shared/models/reservation.model';

/**
 * Conversions between the backend reservation model and the view model used by the rest
 * of the app (TravelStore, My trips...). The view model has fewer types and payment methods,
 * so the precise type is kept in the title ("Flight · Discover Japan").
 */

export const RESERVATION_TYPES: ReservationType[] = [
  ReservationType.TRIP,
  ReservationType.HOTEL,
  ReservationType.FLIGHT,
  ReservationType.TRAIN,
  ReservationType.RESTAURANT,
  ReservationType.ACTIVITY
];

export const RESERVATION_STATUSES: ReservationStatus[] = [
  ReservationStatus.PENDING,
  ReservationStatus.CONFIRMED,
  ReservationStatus.COMPLETED,
  ReservationStatus.CANCELLED
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  PaymentMethod.CREDIT_CARD,
  PaymentMethod.DEBIT_CARD,
  PaymentMethod.ONLINE_PAYMENT,
  PaymentMethod.CASH
];

/** Status changes an admin may apply (same rules as the backend). */
export const NEXT_STATUSES: Record<ReservationStatus, ReservationStatus[]> = {
  [ReservationStatus.PENDING]: [ReservationStatus.CONFIRMED, ReservationStatus.CANCELLED],
  [ReservationStatus.CONFIRMED]: [ReservationStatus.COMPLETED, ReservationStatus.CANCELLED],
  [ReservationStatus.COMPLETED]: [],
  [ReservationStatus.CANCELLED]: []
};

const TYPE_LABELS: Record<ReservationType, string> = {
  [ReservationType.TRIP]: 'Trip package',
  [ReservationType.HOTEL]: 'Hotel',
  [ReservationType.FLIGHT]: 'Flight',
  [ReservationType.TRAIN]: 'Train',
  [ReservationType.RESTAURANT]: 'Restaurant',
  [ReservationType.ACTIVITY]: 'Activity'
};

const TYPE_ICONS: Record<ReservationType, string> = {
  [ReservationType.TRIP]: '✈',
  [ReservationType.HOTEL]: '⌂',
  [ReservationType.FLIGHT]: '↗',
  [ReservationType.TRAIN]: '⌁',
  [ReservationType.RESTAURANT]: '☕\uFE0E',
  [ReservationType.ACTIVITY]: '◇'
};

/** Photo shown when a trip has no cover image yet (one per kind of booking). */
const TYPE_IMAGES: Record<ReservationType, string> = {
  [ReservationType.TRIP]: IMG.nature,
  [ReservationType.HOTEL]: IMG.hotel,
  [ReservationType.FLIGHT]: IMG.hero,
  [ReservationType.TRAIN]: IMG.train,
  [ReservationType.RESTAURANT]: IMG.food,
  [ReservationType.ACTIVITY]: IMG.adventure
};

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.CREDIT_CARD]: 'Credit card',
  [PaymentMethod.DEBIT_CARD]: 'Debit card',
  [PaymentMethod.ONLINE_PAYMENT]: 'Online payment',
  [PaymentMethod.CASH]: 'Cash'
};

export function typeLabel(type: ReservationType | string | null | undefined): string {
  return type ? TYPE_LABELS[type as ReservationType] ?? capitalize(type) : '';
}

export function typeIcon(type: ReservationType | string | null | undefined): string {
  return type ? TYPE_ICONS[type as ReservationType] ?? '◇' : '◇';
}

export function typeImage(type: ReservationType | string | null | undefined): string {
  return (type && TYPE_IMAGES[type as ReservationType]) || IMG.nature;
}

/**
 * Cover photo of a trip saved in the backend (GET /trips/{id}/cover-image, public).
 * The endpoint answers 404 when the admin did not upload a photo: pair it with appImgFallback.
 */
export function tripCoverUrl(tripId: string | number | null | undefined): string | null {
  return isBackendId(tripId) ? `${environment.apiUrl}/trips/${tripId}/cover-image` : null;
}

/** Photo of a reservation: the trip cover for a trip package, a photo of the service otherwise. */
export function reservationPhoto(
  type: ReservationType | string | null | undefined,
  tripId: string | number | null | undefined,
  tripImage?: string | null
): string {
  if (type === ReservationType.TRIP) {
    return tripCoverUrl(tripId) ?? tripImage ?? typeImage(type);
  }
  return typeImage(type);
}

export function paymentLabel(method: PaymentMethod | string | null | undefined): string {
  return method ? PAYMENT_LABELS[method as PaymentMethod] ?? capitalize(method) : '—';
}

export function statusLabel(status: ReservationStatus | string | null | undefined): string {
  return status ? capitalize(status) : '';
}

/** True for ids coming from the backend (numbers), false for local demo ids like "res-123". */
export function isBackendId(id: string | number | null | undefined): boolean {
  return id != null && /^\d+$/.test(String(id));
}

/** "2026-11-17" -> "Nov 17, 2026" (dates are read as local days, never shifted by time zones). */
export function formatDay(iso: string | null | undefined, withYear = true): string {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', withYear
    ? { month: 'short', day: 'numeric', year: 'numeric' }
    : { month: 'short', day: 'numeric' });
}

export function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Title shown for a reservation: the precise type stays visible. */
export function recordTitle(record: Pick<ReservationRecord, 'type' | 'tripTitle'>): string {
  return record.type === ReservationType.TRIP
    ? `${record.tripTitle} — trip package`
    : `${typeLabel(record.type)} · ${record.tripTitle}`;
}

/** "Nov 17 – Nov 24" for a trip package, "Nov 18, 2026" for a single service. */
export function recordDateLabel(record: Pick<ReservationRecord, 'type' | 'reservationDate' | 'tripStartDate' | 'tripEndDate'>): string {
  if (record.type === ReservationType.TRIP && record.tripStartDate && record.tripEndDate) {
    return `${formatDay(record.tripStartDate, false)} – ${formatDay(record.tripEndDate, false)}`;
  }
  return formatDay(record.reservationDate);
}

// ── backend <-> page record ─────────────────────────────────────────────

export function fromApi(r: ReservationResponse): ReservationRecord {
  return {
    id: String(r.id),
    demo: false,
    confirmationNumber: r.confirmationNumber,
    type: r.type,
    status: r.status ?? ReservationStatus.PENDING,
    reservationDate: r.reservationDate,
    travelers: r.travelers ?? 1,
    price: r.price ?? 0,
    paymentMethod: r.paymentMethod,
    notes: r.notes,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    tripId: r.tripId != null ? String(r.tripId) : '',
    tripTitle: r.tripTitle || r.tripDestination || 'Trip',
    tripDestination: r.tripDestination,
    tripStartDate: r.tripStartDate,
    tripEndDate: r.tripEndDate,
    userFullName: r.userFullName,
    userEmail: r.userEmail
  };
}

// ── page record <-> view model (TravelStore.reservations) ─────────────────

const VIEW_TYPE: Record<ReservationType, ViewReservationType> = {
  [ReservationType.TRIP]: 'TRIP',
  [ReservationType.HOTEL]: 'ACCOMMODATION',
  [ReservationType.FLIGHT]: 'TRANSPORT',
  [ReservationType.TRAIN]: 'TRANSPORT',
  [ReservationType.RESTAURANT]: 'ACTIVITY',
  [ReservationType.ACTIVITY]: 'ACTIVITY'
};

const BACKEND_TYPE: Record<ViewReservationType, ReservationType> = {
  TRIP: ReservationType.TRIP,
  ACCOMMODATION: ReservationType.HOTEL,
  TRANSPORT: ReservationType.FLIGHT,
  ACTIVITY: ReservationType.ACTIVITY
};

const VIEW_PAYMENT: Record<PaymentMethod, ViewPaymentMethod> = {
  [PaymentMethod.CREDIT_CARD]: 'CARD',
  [PaymentMethod.DEBIT_CARD]: 'CARD',
  [PaymentMethod.ONLINE_PAYMENT]: 'PAYPAL',
  [PaymentMethod.CASH]: 'CASH'
};

const BACKEND_PAYMENT: Record<ViewPaymentMethod, PaymentMethod> = {
  CARD: PaymentMethod.CREDIT_CARD,
  PAYPAL: PaymentMethod.ONLINE_PAYMENT,
  BANK_TRANSFER: PaymentMethod.ONLINE_PAYMENT,
  CASH: PaymentMethod.CASH
};

/** Record -> view model used by My trips and the other pages of the app. */
export function toViewModel(record: ReservationRecord): ViewReservation {
  return {
    id: record.id,
    tripId: record.tripId,
    tripTitle: record.tripTitle,
    title: recordTitle(record),
    type: VIEW_TYPE[record.type] ?? 'ACTIVITY',
    dateLabel: recordDateLabel(record),
    date: record.reservationDate ?? '',
    paymentMethod: record.paymentMethod ? VIEW_PAYMENT[record.paymentMethod] : 'CARD',
    amount: record.price,
    status: record.status,
    travelers: record.travelers
  };
}

/** Local demo reservation (view model) -> record, so it can be listed with the real ones. */
export function fromViewModel(vm: ViewReservation): ReservationRecord {
  return {
    id: vm.id,
    demo: true,
    confirmationNumber: null,
    type: BACKEND_TYPE[vm.type] ?? ReservationType.ACTIVITY,
    status: vm.status as ReservationStatus,
    reservationDate: vm.date || null,
    travelers: vm.travelers,
    price: vm.amount,
    paymentMethod: BACKEND_PAYMENT[vm.paymentMethod] ?? null,
    notes: null,
    createdAt: null,
    updatedAt: null,
    tripId: vm.tripId,
    tripTitle: vm.tripTitle,
    tripDestination: null,
    tripStartDate: null,
    tripEndDate: null,
    userFullName: null,
    userEmail: null
  };
}

/** Readable message for an HTTP error coming from the backend. */
export function errorMessage(error: unknown, fallback = 'Something went wrong, please try again.'): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'The server cannot be reached. Is the backend running?';
    const body = error.error;
    if (body && typeof body === 'object') {
      if (body.errors && typeof body.errors === 'object') {
        const details = Object.values(body.errors as Record<string, string>).filter(Boolean);
        if (details.length) return details.join(' · ');
      }
      if (typeof body.message === 'string' && body.message && body.message !== 'Forbidden') return body.message;
    }
    if (error.status === 401) return 'Your session has expired, please log in again.';
    if (error.status === 403) return 'You are not allowed to do this.';
    if (error.status === 404) return 'Not found.';
  }
  return fallback;
}

function capitalize(value: string): string {
  const v = value.replace(/_/g, ' ').toLowerCase();
  return v.charAt(0).toUpperCase() + v.slice(1);
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}
