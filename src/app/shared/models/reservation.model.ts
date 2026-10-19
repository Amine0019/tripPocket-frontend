import { PaymentMethod } from './enums/payment-method.enum';
import { ReservationStatus } from './enums/reservation-status.enum';
import { ReservationType } from './enums/reservation-type.enum';

/** Body of POST /reservations?tripId= and PUT /reservations/{id}. */
export interface ReservationRequest {
  type: ReservationType;
  /** yyyy-MM-dd. Optional for TRIP (the server uses the trip start date). */
  reservationDate?: string | null;
  travelers: number;
  paymentMethod: PaymentMethod;
  /** Ignored by the server for TRIP (trip price x travelers). */
  price?: number | null;
  notes?: string | null;
}

/** A reservation as returned by the API. */
export interface ReservationResponse {
  id: number;
  confirmationNumber: string | null;
  type: ReservationType;
  status: ReservationStatus;
  reservationDate: string | null;
  travelers: number;
  price: number;
  paymentMethod: PaymentMethod | null;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  tripId: number | null;
  tripTitle: string | null;
  tripDestination: string | null;
  tripStartDate: string | null;
  tripEndDate: string | null;
  userId: number | null;
  userFullName: string | null;
  userEmail: string | null;
}

/** Former name of the API model, kept so existing imports keep working. */
export type Reservation = ReservationResponse;

/** GET /reservations/availability?tripId= */
export interface ReservationAvailability {
  tripId: number;
  groupSize: number | null;
  booked: number;
  spotsLeft: number | null;
  bookable: boolean;
  reason: string | null;
}

export interface TopTripStat {
  tripId: number | null;
  tripTitle: string | null;
  tripDestination: string | null;
  reservations: number;
  travelers: number;
  revenue: number;
}

/** GET /reservations/stats (admin) */
export interface ReservationStats {
  total: number;
  countByStatus: Record<ReservationStatus, number>;
  countByType: Record<ReservationType, number>;
  revenue: number;
  /** Percentage, 0 to 100. */
  cancellationRate: number;
  topTrips: TopTripStat[];
}

export interface ReservationPage<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

/**
 * One reservation as displayed by the reservation pages: either saved in the backend
 * (demo = false) or a demo item that only lives in the browser (demo = true).
 */
export interface ReservationRecord {
  id: string;
  demo: boolean;
  confirmationNumber: string | null;
  type: ReservationType;
  status: ReservationStatus;
  reservationDate: string | null;
  travelers: number;
  price: number;
  paymentMethod: PaymentMethod | null;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  tripId: string;
  tripTitle: string;
  tripDestination: string | null;
  tripStartDate: string | null;
  tripEndDate: string | null;
  userFullName: string | null;
  userEmail: string | null;
}

// ── AI (Reservation assistant) ───────────────────────────────────────────

export type AiPriority = 'HIGH' | 'MEDIUM' | 'LOW';

/** Something the AI thinks is missing in the traveler's bookings. */
export interface TripCheckSuggestion {
  dayNumber: number | null;
  type: ReservationType;
  title: string;
  reason: string;
  suggestedDate: string | null;
  estimatedPriceMin: number | null;
  estimatedPriceMax: number | null;
  priority: AiPriority;
}

/** A rule checked in Java (works even without AI). */
export interface TripCheckFinding {
  code: string;
  severity: AiPriority;
  message: string;
}

/** POST /reservations/ai/trip-check?tripId= */
export interface TripCheckResponse {
  tripId: number;
  tripTitle: string;
  aiAvailable: boolean;
  readinessScore: number;
  summary: string;
  missing: TripCheckSuggestion[];
  checklist: string[];
  warnings: string[];
  findings: TripCheckFinding[];
  generatedAt: string;
}

/** POST /reservations/ai/parse-request */
export interface ParseRequestBody {
  tripId: number;
  text: string;
}

export interface ParsedReservationRequest {
  aiAvailable: boolean;
  type: ReservationType | null;
  travelers: number | null;
  reservationDate: string | null;
  paymentMethod: PaymentMethod | null;
  price: number | null;
  notes: string | null;
  confidence: number;
  message: string | null;
}

/** POST /reservations/ai/chat — booking assistant (nothing is saved). */
export interface BookingChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** Booking fields collected by the assistant (null = not known yet). */
export interface BookingChatState {
  type: ReservationType | null;
  travelers: number | null;
  reservationDate: string | null;
  paymentMethod: PaymentMethod | null;
  price: number | null;
  notes: string | null;
}

export interface BookingChatRequest {
  tripId: number;
  messages: BookingChatMessage[];
  booking: BookingChatState;
}

export type BookingChatField = 'type' | 'travelers' | 'reservationDate' | 'paymentMethod';

export interface BookingChatResponse {
  aiAvailable: boolean;
  reply: string;
  booking: BookingChatState;
  missing: BookingChatField[];
  ready: boolean;
  suggestions: string[];
  spotsLeft: number | null;
  warning: string | null;
}

/** POST /reservations/ai/admin-insights (admin) */
export interface AdminInsightAlert {
  severity: AiPriority;
  title: string;
  detail: string;
  tripId: number | null;
}

export interface AdminInsightsResponse {
  aiAvailable: boolean;
  summary: string;
  highlights: string[];
  alerts: AdminInsightAlert[];
  recommendations: string[];
  generatedAt: string;
}
