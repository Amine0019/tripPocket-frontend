import { Injectable, signal } from '@angular/core';
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
  User
} from '../models/models';

@Injectable({ providedIn: 'root' })
export class TravelStore {
  readonly trips = signal<Trip[]>(MOCK_TRIPS);
  readonly activities = signal<Activity[]>(MOCK_ACTIVITIES);
  readonly destinations = signal(MOCK_DESTINATIONS);
  readonly reservations = signal<Reservation[]>(MOCK_RESERVATIONS);
  readonly expenses = signal<BudgetExpense[]>(MOCK_EXPENSES);
  readonly notifications = signal<AppNotification[]>(MOCK_NOTIFICATIONS);
  readonly user = signal<User>(this.loadInitialUser());
  readonly favorites = signal<string[]>(['japan']);
  readonly lastSearch = signal<SearchQuery>({
    destination: '',
    dates: 'May 18 – May 25',
    travelers: 2,
    budget: '$500 – $2,000'
  });
  readonly loggedIn = signal(localStorage.getItem('trippocket_access_token') !== null || localStorage.getItem('trippocket_user') !== null);

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
    this.favorites.set(
      current.includes(tripId) ? current.filter((id) => id !== tripId) : [...current, tripId]
    );
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

  cancelReservation(id: string): void {
    this.reservations.update((items) =>
      items.map((item) => (item.id === id ? { ...item, status: 'CANCELLED' as ReservationStatus } : item))
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
}
