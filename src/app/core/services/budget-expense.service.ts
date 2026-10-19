import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of } from 'rxjs';
import { BudgetExpense } from '../models/models';
import { ApiExpense, ApiTrip, API_BASE_URL } from './api';

@Injectable({ providedIn: 'root' })
export class BudgetExpenseService {
  private readonly http = inject(HttpClient);

  getTrips(userId: number): Observable<ApiTrip[]> {
    return this.http.get<ApiTrip[]>(`${API_BASE_URL}/trips/user/${userId}`);
  }

  getExpenses(trips: ApiTrip[]): Observable<BudgetExpense[]> {
    if (!trips.length) return of([]);
    return forkJoin(trips.map((trip) => this.http.get<ApiExpense[]>(`${API_BASE_URL}/expenses/trip/${trip.id}`).pipe(
      map((items) => items.map((item) => toExpense(item, trip.id)))
    ))).pipe(map((groups) => groups.flat()));
  }

  create(expense: Omit<BudgetExpense, 'id'>): Observable<BudgetExpense> {
    const tripId = Number(expense.tripId);
    const params = new HttpParams().set('tripId', tripId);
    return this.http.post<ApiExpense>(`${API_BASE_URL}/expenses`, toPayload(expense), { params }).pipe(map(toExpense));
  }

  update(id: string, expense: Omit<BudgetExpense, 'id'>): Observable<BudgetExpense> {
    return this.http.put<ApiExpense>(`${API_BASE_URL}/expenses/${id}`, toPayload(expense)).pipe(map(toExpense));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/expenses/${id}`);
  }
}

function toExpense(value: ApiExpense, tripId?: number): BudgetExpense {
  return {
    id: String(value.id),
    title: value.title || value.description || 'Expense',
    category: value.category as BudgetExpense['category'],
    amount: Number(value.amount),
    paymentMethod: value.paymentMethod as BudgetExpense['paymentMethod'],
    date: value.expenseDate,
    tripId: String(value.trip?.id ?? tripId ?? ''),
    tripTitle: '',
    description: value.description ?? ''
  };
}

function toPayload(expense: Omit<BudgetExpense, 'id'>): Omit<ApiExpense, 'id' | 'trip'> {
  return {
    title: expense.title.trim(),
    amount: Number(expense.amount),
    expenseDate: expense.date,
    description: expense.description.trim(),
    category: expense.category,
    paymentMethod: expense.paymentMethod
  };
}
