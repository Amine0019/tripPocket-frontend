import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, of, shareReplay, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Trip as BackendTrip } from '../../shared/models/trip.model';
import { ReservationRecord, ReservationRequest } from '../../shared/models/reservation.model';
import { MOCK_ACTIVITIES } from '../data/mock-activities';
import { MOCK_DESTINATIONS } from '../data/mock-destinations';
import { MOCK_EXPENSES } from '../data/mock-expenses';
import { MOCK_RESERVATIONS } from '../data/mock-reservations';
import { MOCK_TRIPS } from '../data/mock-trips';
import { MOCK_NOTIFICATIONS, MOCK_USER } from '../data/mock-user';
import {
  Activity,
  AppNotification,
  BudgetExpense,
  ExpenseCategory,
  PaymentMethod,
  Reservation,
  ReservationStatus,
  SearchQuery,
  Trip,
  TripBadge,
  User
} from '../models/models';
import { TripService } from './trip.service';
import { ReservationService } from './reservation.service';
import { errorMessage, fromApi, fromViewModel, isBackendId, toViewModel } from './reservation.mapper';

@Injectable({ providedIn: 'root' })
export class TravelStore {
  private readonly tripService = inject(TripService);
  private readonly reservationService = inject(ReservationService);

  readonly trips = signal<Trip[]>(MOCK_TRIPS);
  readonly activities = signal<Activity[]>(MOCK_ACTIVITIES);
  readonly destinations = signal(MOCK_DESTINATIONS);
  // Reservations: filled from the backend (GET /reservations/me); mocks only if the API is unreachable
  readonly reservations = signal<Reservation[]>([]);
  readonly reservationRecords = signal<ReservationRecord[]>([]);
  readonly reservationsLoading = signal(false);
  readonly reservationsError = signal<string | null>(null);
  /** Saved reservations + demo ones that only live in this browser (added by other pages). */
  readonly reservationList = computed<ReservationRecord[]>(() => [
    ...this.reservationRecords(),
    ...this.reservations().filter((item) => !isBackendId(item.id)).map(fromViewModel)
  ]);
  readonly expenses = signal<BudgetExpense[]>(MOCK_EXPENSES);
  readonly notifications = signal<AppNotification[]>(MOCK_NOTIFICATIONS);
  readonly user = signal<User>(this.loadInitialUser());
  readonly favorites = signal<string[]>(this.loadInitialFavorites());
  readonly lastSearch = signal<SearchQuery>({
    destination: '',
    dates: 'May 18 – May 25',
    travelers: 2,
    budget: '$500 – $2,000'
  });
  readonly loggedIn = signal(localStorage.getItem('trippocket_access_token') !== null || localStorage.getItem('trippocket_user') !== null);

  constructor() {
    this.loadTripsFromBackend();
    // Deferred: an HTTP call made while the store is being built would re-enter it through the interceptor
    setTimeout(() => this.loadReservationsFromBackend());
  }

  private loadInitialUser(): User {
    const saved = localStorage.getItem('trippocket_user');
    if (saved) {
      try {
        return JSON.parse(saved) as User;
      } catch {
        // fallback
      }
    }
    return { ...MOCK_USER };
  }

  private loadInitialFavorites(): string[] {
    const saved = localStorage.getItem('trippocket_favorites');
    if (saved) {
      try {
        return JSON.parse(saved) as string[];
      } catch {
        // fallback
      }
    }
    return ['japan'];
  }

  /**
   * Fetches trips from the backend API (curated by admins) and merges them into the store.
   * Admin-created trips appear at the beginning of the list.
   */
  loadTripsFromBackend(): void {
    this.tripService.getAllTrips().subscribe({
      next: (backendTrips) => {
        if (backendTrips && backendTrips.length > 0) {
          const mapped = backendTrips.map((bt) => this.mapBackendTripToViewModel(bt));
          const backendIds = new Set(mapped.map((t) => t.id));
          const existingMocks = MOCK_TRIPS.filter((m) => !backendIds.has(m.id));
          this.trips.set([...mapped, ...existingMocks]);
        }
      },
      error: (err) => {
        console.warn('Could not load trips from backend, keeping defaults:', err);
      }
    });
  }

  /**
   * Ensures that a single trip ID is loaded into the store even if accessed directly via URL.
   */
  ensureTripLoaded(id: string): void {
    if (this.tripById(id)) return;
    const numId = Number(id);
    if (!isNaN(numId)) {
      this.tripService.getTripById(numId).subscribe({
        next: (bt) => {
          const mapped = this.mapBackendTripToViewModel(bt);
          this.trips.update((list) => [mapped, ...list.filter((t) => t.id !== mapped.id)]);
        },
        error: () => {}
      });
    }
  }

  /**
   * Removes a trip from the store when deleted by admin.
   */
  removeTrip(id: number | string): void {
    const idStr = String(id);
    this.trips.update((list) => list.filter((t) => t.id !== idStr));
  }

  tripById(id: string): Trip | undefined {
    return this.trips().find((trip) => trip.id === id);
  }

  activityById(id: string): Activity | undefined {
    return this.activities().find((activity) => activity.id === id);
  }

  reservationById(id: string): Reservation | undefined {
    return this.reservations().find((item) => item.id === id);
  }

  toggleFavorite(tripId: string): void {
    const current = this.favorites();
    const next = current.includes(tripId) ? current.filter((id) => id !== tripId) : [...current, tripId];
    this.favorites.set(next);
    localStorage.setItem('trippocket_favorites', JSON.stringify(next));
  }

  isFavorite(tripId: string): boolean {
    return this.favorites().includes(tripId);
  }

  markAllNotificationsRead(): void {
    this.notifications.update((items) => items.map((item) => ({ ...item, read: true })));
  }

  markNotificationRead(id: string): void {
    this.notifications.update((items) =>
      items.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
  }

  unreadCount(): number {
    return this.notifications().filter((item) => !item.read).length;
  }

  /**
   * Cancels a reservation: through the API for saved ones, locally for demo ones.
   * The call runs even if nobody subscribes; subscribe to get the result or the error.
   */
  cancelReservation(id: string): Observable<ReservationRecord | null> {
    if (!isBackendId(id)) {
      this.reservations.update((items) =>
        items.map((item) => (item.id === id ? { ...item, status: 'CANCELLED' as ReservationStatus } : item))
      );
      return of(null);
    }
    const result$ = this.reservationService.cancel(Number(id)).pipe(
      map(fromApi),
      tap((record) => this.upsertReservation(record)),
      shareReplay(1)
    );
    result$.subscribe({ error: () => undefined });
    return result$;
  }

  /** Books a trip (or a service of a trip) through the API and adds it to the lists. */
  createReservation(tripId: string, request: ReservationRequest): Observable<ReservationRecord> {
    return this.reservationService.create(Number(tripId), request).pipe(
      map(fromApi),
      tap((record) => this.upsertReservation(record))
    );
  }

  /** Loads the connected user's reservations. Falls back to demo data only if the API is unreachable. */
  loadReservationsFromBackend(): void {
    if (!localStorage.getItem('trippocket_access_token')) {
      return;
    }
    this.reservationsLoading.set(true);
    this.reservationsError.set(null);
    this.reservationService.getMine().subscribe({
      next: (items) => {
        const records = items.map(fromApi);
        const demo = this.reservations().filter((item) => !isBackendId(item.id));
        this.reservationRecords.set(records);
        this.reservations.set([...records.map(toViewModel), ...demo]);
        this.reservationsLoading.set(false);
      },
      error: (err: unknown) => {
        if (err instanceof HttpErrorResponse && err.status === 0 && this.reservations().length === 0) {
          this.reservations.set(MOCK_RESERVATIONS);
        }
        this.reservationsError.set(errorMessage(err, 'Could not load your reservations.'));
        this.reservationsLoading.set(false);
      }
    });
  }

  /** A reservation of the lists (saved or demo) by id. */
  reservationRecordById(id: string): ReservationRecord | undefined {
    return this.reservationList().find((item) => item.id === id);
  }

  /** Inserts or replaces a saved reservation in both lists. */
  upsertReservation(record: ReservationRecord): void {
    this.reservationRecords.update((items) =>
      items.some((item) => item.id === record.id)
        ? items.map((item) => (item.id === record.id ? record : item))
        : [record, ...items]
    );
    const view = toViewModel(record);
    this.reservations.update((items) =>
      items.some((item) => item.id === view.id)
        ? items.map((item) => (item.id === view.id ? view : item))
        : [view, ...items]
    );
  }

  addExpense(expense: Omit<BudgetExpense, 'id'>): void {
    const id = `ex-${Date.now()}`;
    this.expenses.update((items) => [{ ...expense, id }, ...items]);
  }

  addReservation(reservation: Reservation): void {
    this.reservations.update((items) => [reservation, ...items]);
  }

  removeExpense(id: string): void {
    this.expenses.update((items) => items.filter((item) => item.id !== id));
  }

  bookedTrips(): Trip[] {
    const ids = new Set(
      this.reservations()
        .filter((item) => item.status !== 'CANCELLED')
        .map((item) => item.tripId)
    );
    return this.trips().filter((trip) => ids.has(trip.id) || trip.progress != null);
  }

  totalSpent(tripId?: string): number {
    return this.expenses()
      .filter((item) => !tripId || item.tripId === tripId)
      .reduce((sum, item) => sum + item.amount, 0);
  }

  login(email: string, password: string): boolean {
    if (!email.includes('@') || password.length < 4) {
      return false;
    }
    this.updateUser({ email });
    this.loggedIn.set(true);
    this.loadTripsFromBackend();
    return true;
  }

  register(firstName: string, lastName: string, email: string, password: string): boolean {
    if (!firstName || !lastName || !email.includes('@') || password.length < 4) {
      return false;
    }
    this.updateUser({
      firstName,
      lastName,
      email,
      avatarInitials: `${firstName[0]}${lastName[0]}`.toUpperCase()
    });
    this.loggedIn.set(true);
    this.loadTripsFromBackend();
    return true;
  }

  logout(): void {
    this.loggedIn.set(false);
    localStorage.removeItem('trippocket_user');
    this.user.set({ ...MOCK_USER });
  }

  updateUser(patch: Partial<User>): void {
    this.user.update((current) => {
      const updated = { ...current, ...patch };
      localStorage.setItem('trippocket_user', JSON.stringify(updated));
      return updated;
    });
  }

  categoryTotals(): Record<ExpenseCategory, number> {
    const totals: Record<ExpenseCategory, number> = {
      FOOD: 0,
      ACCOMMODATION: 0,
      TRANSPORT: 0,
      ACTIVITIES: 0,
      SHOPPING: 0,
      OTHER: 0
    };
    for (const expense of this.expenses()) {
      totals[expense.category] += expense.amount;
    }
    return totals;
  }

  paymentLabel(method: PaymentMethod): string {
    switch (method) {
      case 'CARD':
        return 'Visa •••• 2841';
      case 'PAYPAL':
        return 'PayPal';
      case 'CASH':
        return 'Cash';
      case 'BANK_TRANSFER':
        return 'Bank transfer';
    }
  }

  /**
   * Helper to map backend entity Trip to traveler view model Trip.
   */
  private mapBackendTripToViewModel(bt: BackendTrip): Trip {
    const tripIdStr = String(bt.id);
    const coverUrl = `${environment.apiUrl}/trips/${bt.id}/cover-image`;

    let badge: TripBadge | undefined = undefined;
    if (bt.badge) {
      const norm = bt.badge.toUpperCase().replace(/\s+/g, '_');
      if (norm === 'BEST_SELLER' || norm === 'FEW_SPOTS_LEFT' || norm === 'TRENDING') {
        badge = norm as TripBadge;
      } else {
        badge = 'BEST_SELLER';
      }
    }

    const durationDays = bt.durationDays ?? (
      bt.startDate && bt.endDate
        ? Math.max(1, Math.ceil((new Date(bt.endDate).getTime() - new Date(bt.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1)
        : 7
    );

    return {
      id: tripIdStr,
      title: bt.title || bt.destination,
      destination: bt.subtitle ? `${bt.destination} · ${bt.subtitle}` : bt.destination,
      country: bt.destination,
      durationDays,
      pricePerPerson: bt.price ? Number(bt.price) : 1290,
      rating: bt.rating != null ? Number(bt.rating) : 4.9,
      reviewCount: bt.reviewCount != null ? Number(bt.reviewCount) : 1,
      status: (bt.status === 'ONGOING' ? 'ACTIVE' : bt.status as any) || 'PLANNED',
      badge,
      category: 'Culture',
      image: coverUrl,
      gallery: [coverUrl],
      description: bt.subtitle || bt.description || 'Thoughtfully planned days, local flavor, and unforgettable sights.',
      longDescription: bt.description || bt.subtitle || 'Immerse yourself in authentic experiences guided by top travel professionals.',
      groupSize: bt.groupSize ?? 12,
      activityLevel: bt.pace || 'Balanced',
      highlights: bt.highlights && bt.highlights.length > 0
        ? bt.highlights
        : ['Curated boutique stays', 'Expert local guidance', 'Iconic sightseeing pass'],
      itinerary: bt.itinerary && bt.itinerary.length > 0
        ? bt.itinerary.map((d, idx) => ({
            day: d.dayNumber ?? (idx + 1),
            title: d.title || `Day ${idx + 1}`,
            description: d.description || ''
          }))
        : [
            { day: 1, title: 'Arrival & Welcome', description: 'Arrive at destination, check into accommodation, and meet your group.' },
            { day: 2, title: 'Cultural Highlights', description: 'Explore iconic landmarks with an expert guide.' }
          ],
      activityIds: [],
      budgetEstimate: bt.price ? Number(bt.price) * 2 : 2580,
      availableMonths: bt.availability || 'Available Year-round',
      startDate: bt.startDate,
      endDate: bt.endDate,
      tripCode: `TVL-${bt.id}`
    };
  }
}
