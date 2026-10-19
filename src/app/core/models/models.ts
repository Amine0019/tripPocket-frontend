export type TripStatus = 'PLANNED' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
export type ReservationType = 'TRIP' | 'ACTIVITY' | 'ACCOMMODATION' | 'TRANSPORT';
export type PaymentMethod = 'CARD' | 'CASH' | 'PAYPAL' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'ONLINE_PAYMENT';
export type ExpenseCategory = 'FOOD' | 'ACCOMMODATION' | 'TRANSPORT' | 'ACTIVITIES' | 'SHOPPING' | 'OTHER';
export type ActivityCategory = 'ADVENTURE' | 'CULTURE' | 'FOOD' | 'NATURE' | 'SPORT' | 'RELAXATION';
export type TripBadge = 'BEST_SELLER' | 'FEW_SPOTS_LEFT' | 'TRENDING';
export type TripCategory = 'Adventure' | 'Culture' | 'Food & wine' | 'Nature' | 'Relaxation';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  language: string;
  avatarInitials: string;
  memberSince: string;
  role: 'TRAVELER' | 'ADMIN';
}

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
}

export interface Trip {
  id: string;
  title: string;
  destination: string;
  country: string;
  durationDays: number;
  pricePerPerson: number;
  rating: number;
  reviewCount: number;
  status: TripStatus;
  badge?: TripBadge;
  category: TripCategory;
  image: string;
  gallery: string[];
  description: string;
  longDescription: string;
  groupSize: number;
  activityLevel: string;
  highlights: string[];
  itinerary: ItineraryDay[];
  activityIds: string[];
  budgetEstimate: number;
  availableMonths: string;
  startDate?: string;
  endDate?: string;
  progress?: number;
  countdownDays?: number;
  tripCode?: string;
}

export interface Activity {
  id: string;
  name: string;
  category: ActivityCategory;
  durationHours: number;
  price: number;
  description: string;
  location: string;
  image: string;
  rating: number;
}

export interface Destination {
  id: string;
  name: string;
  country: string;
  image: string;
  tripsCount: number;
}

export interface Reservation {
  id: string;
  tripId: string;
  tripTitle: string;
  title: string;
  type: ReservationType;
  dateLabel: string;
  date: string;
  paymentMethod: PaymentMethod;
  amount: number;
  status: ReservationStatus;
  travelers: number;
}

export interface BudgetExpense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  paymentMethod: PaymentMethod;
  date: string;
  tripId: string;
  tripTitle: string;
  description: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  icon: 'check' | 'calendar' | 'card' | 'bell' | 'plane';
}

export interface SearchQuery {
  destination: string;
  dates: string;
  travelers: number;
  budget: string;
}
