import { CurrencyPipe, KeyValuePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BudgetExpense, ExpenseCategory, PaymentMethod } from '../../core/models/models';
import { ToastService } from '../../core/services/toast.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ExpenseCardComponent } from '../../shared/components/expense-card/expense-card.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { environment } from '../../../environments/environment';
import { TripService } from '../../core/services/trip.service';
import { Trip } from '../../shared/models/trip.model';

interface SpendingInsights {
  totalExpenses: number;
  spendingByCategory: Record<string, number>;
  totalBudget: number;
  budgetRemaining: number;
  percentageUsed: number | null;
  overBudget: boolean;
  currency: string;
  aiAnalysis: string | null;
  aiAvailable: boolean;
}

interface BackendExpense {
  id: number;
  amount: number;
  expenseDate: string;
  description: string;
  category: string | null;
  paymentMethod: string | null;
}

@Component({
  selector: 'app-expenses-page',
  standalone: true,
  imports: [CurrencyPipe, KeyValuePipe, FormsModule, PageHeaderComponent, ExpenseCardComponent, EmptyStateComponent, ModalComponent],
  templateUrl: './expenses.page.html',
  styleUrl: './expenses.page.scss'
})
export class ExpensesPage {
  private readonly toast = inject(ToastService);
  private readonly http = inject(HttpClient);
  private readonly tripService = inject(TripService);

  readonly category = signal<ExpenseCategory | 'ALL'>('ALL');
  readonly tripId = signal('');
  readonly open = signal(false);
  readonly categories: Array<ExpenseCategory | 'ALL'> = ['ALL', 'FOOD', 'ACCOMMODATION', 'TRANSPORT', 'ACTIVITIES', 'SHOPPING', 'OTHER'];
  readonly methods: PaymentMethod[] = ['CARD', 'CASH', 'PAYPAL', 'BANK_TRANSFER'];
  readonly trips = signal<Trip[]>([]);
  readonly tripsLoading = signal(false);
  readonly tripsError = signal('');
  tripFilter = '';
  budgetInput = '';
  readonly insight = signal<SpendingInsights | null>(null);
  readonly insightLoading = signal(false);
  readonly insightError = signal('');
  readonly budgetSaving = signal(false);
  readonly expenseItems = signal<BudgetExpense[]>([]);
  readonly expensesLoading = signal(false);
  readonly expensesError = signal('');
  readonly expenseSaving = signal(false);
  readonly expenseFormError = signal('');

  form = this.emptyForm();

  readonly items = computed(() =>
    this.expenseItems().filter((item) => {
      const cat = this.category() === 'ALL' || item.category === this.category();
      const trip = !this.tripId() || item.tripId === this.tripId();
      return cat && trip;
    })
  );
  readonly totals = computed(() => {
    const totals: Record<ExpenseCategory, number> = {
      FOOD: 0, ACCOMMODATION: 0, TRANSPORT: 0, ACTIVITIES: 0, SHOPPING: 0, OTHER: 0
    };
    for (const item of this.items()) totals[item.category] += item.amount;
    return totals;
  });
  readonly total = computed(() => this.items().reduce((sum, item) => sum + item.amount, 0));

  constructor() {
    this.loadBackendTrips();
    this.loadExpenses();
  }

  loadBackendTrips(): void {
    this.tripsLoading.set(true);
    this.tripsError.set('');
    this.tripService.getAllTrips().subscribe({
      next: (trips) => {
        this.trips.set((trips ?? []).filter((trip) => Number.isSafeInteger(Number(trip.id)) && Number(trip.id) > 0));
        const currentTripExists = this.trips().some((trip) => String(trip.id) === this.form.tripId);
        if (!currentTripExists && this.trips().length) {
          const firstTrip = this.trips()[0];
          this.form = { ...this.form, tripId: String(firstTrip.id), tripTitle: firstTrip.title || firstTrip.destination };
        }
        this.tripsLoading.set(false);
      },
      error: () => {
        this.tripsError.set('Could not load backend trips. Check your connection and retry.');
        this.tripsLoading.set(false);
      }
    });
  }

  emptyForm(): Omit<BudgetExpense, 'id'> {
    const trip = this.trips()[0];
    return {
      title: '',
      category: 'FOOD',
      amount: 0,
      paymentMethod: 'CARD',
      date: new Date().toISOString().slice(0, 10),
      tripId: trip ? String(trip.id) : '',
      tripTitle: trip?.title || trip?.destination || '',
      description: ''
    };
  }

  save(): void {
    const tripId = Number(this.form.tripId);
    this.expenseFormError.set('');
    if (!this.form.title.trim()) {
      this.expenseFormError.set('Enter an expense title.');
      return;
    }
    if (!Number.isFinite(Number(this.form.amount)) || Number(this.form.amount) <= 0) {
      this.expenseFormError.set('Enter an amount greater than zero.');
      return;
    }
    if (!Number.isSafeInteger(tripId) || tripId <= 0) {
      this.expenseFormError.set('Choose a trip saved in the backend before adding an expense.');
      return;
    }
    this.expenseSaving.set(true);
    const description = [this.form.title.trim(), this.form.description.trim()].filter(Boolean).join(' — ');
    this.http.post<BackendExpense>(`${environment.apiUrl}/expenses?tripId=${tripId}`, {
      amount: Number(this.form.amount),
      expenseDate: this.form.date,
      description,
      category: this.toBackendCategory(this.form.category),
      paymentMethod: this.toBackendPayment(this.form.paymentMethod)
    }).subscribe({
      next: () => {
        this.expenseSaving.set(false);
        this.open.set(false);
        this.form = this.emptyForm();
        this.loadExpenses();
        if (this.backendTripId === tripId) this.loadInsights();
        this.toast.show('Expense added', 'Your saved trip expenses were updated.');
      },
      error: () => {
        this.expenseSaving.set(false);
        this.expenseFormError.set('Could not save this expense. Check that the backend is running and the selected trip exists.');
      }
    });
  }

  openExpenseForm(): void {
    this.expenseFormError.set('');
    const trip = this.trips().find((item) => String(item.id) === this.form.tripId) ?? this.trips()[0];
    if (trip) {
      this.form = { ...this.form, tripId: String(trip.id), tripTitle: trip.title || trip.destination };
    } else {
      this.expenseFormError.set('No backend trips are available. Create a trip in the backend before adding expenses.');
    }
    this.open.set(true);
  }

  remove(id: string): void {
    if (!/^\d+$/.test(id)) return;
    this.http.delete<void>(`${environment.apiUrl}/expenses/${id}`).subscribe({
      next: () => {
        this.expenseItems.update((items) => items.filter((item) => item.id !== id));
        if (this.backendTripId) this.loadInsights();
        this.toast.show('Expense removed', 'That saved expense was removed.');
      },
      error: () => this.expensesError.set('Could not remove this expense. Please retry.')
    });
  }

  loadExpenses(): void {
    this.expensesLoading.set(true);
    this.expensesError.set('');
    const tripId = this.backendTripId;
    const url = tripId
      ? `${environment.apiUrl}/expenses/trip/${tripId}`
      : `${environment.apiUrl}/expenses`;
    this.http.get<BackendExpense[]>(url).subscribe({
      next: (expenses) => {
        const trip = tripId ? this.trips().find((item) => item.id === tripId) : undefined;
        this.expenseItems.set(expenses.map((expense) => this.toViewExpense(expense, tripId, trip?.title || trip?.destination || '')));
        this.expensesLoading.set(false);
      },
      error: () => {
        this.expensesError.set('Could not load saved expenses. Check your connection and retry.');
        this.expensesLoading.set(false);
      }
    });
  }

  private toViewExpense(expense: BackendExpense, tripId: number | null, tripTitle: string): BudgetExpense {
    const [title, ...notes] = (expense.description ?? '').split(' — ');
    return {
      id: String(expense.id),
      title: title || 'Expense',
      category: this.fromBackendCategory(expense.category),
      amount: Number(expense.amount ?? 0),
      paymentMethod: this.fromBackendPayment(expense.paymentMethod),
      date: expense.expenseDate ?? '',
      tripId: tripId == null ? '' : String(tripId),
      tripTitle,
      description: notes.join(' — ')
    };
  }

  private toBackendCategory(category: ExpenseCategory): string {
    return category === 'SHOPPING' ? 'OTHER' : category;
  }

  private fromBackendCategory(category: string | null): ExpenseCategory {
    return category === 'FOOD' || category === 'ACCOMMODATION' || category === 'TRANSPORT' || category === 'ACTIVITIES'
      ? category : 'OTHER';
  }

  private toBackendPayment(method: PaymentMethod): string {
    switch (method) {
      case 'CASH': return 'CASH';
      case 'CARD': return 'CREDIT_CARD';
      case 'PAYPAL':
      case 'BANK_TRANSFER': return 'ONLINE_PAYMENT';
    }
  }

  private fromBackendPayment(method: string | null): PaymentMethod {
    switch (method) {
      case 'CASH': return 'CASH';
      case 'ONLINE_PAYMENT': return 'PAYPAL';
      case 'DEBIT_CARD': return 'BANK_TRANSFER';
      default: return 'CARD';
    }
  }

  selectTrip(id: string): void {
    this.tripFilter = id;
    this.tripId.set(id);
    this.insight.set(null);
    this.insightError.set('');
    this.loadExpenses();
    if (this.backendTripId) this.loadInsights();
  }

  get backendTripId(): number | null {
    if (!/^\d+$/.test(this.tripFilter)) return null;
    const id = Number(this.tripFilter);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
  }

  isBackendTripId(value: string): boolean {
    return /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) > 0;
  }

  loadInsights(): void {
    const tripId = this.backendTripId;
    if (!tripId) {
      this.insightError.set('Select a trip saved in the backend to analyze its expenses.');
      return;
    }
    this.insightLoading.set(true);
    this.insightError.set('');
    this.http.get<SpendingInsights>(`${environment.apiUrl}/expenses/trip/${tripId}/insights`).subscribe({
      next: (result) => {
        this.insight.set(result);
        this.budgetInput = String(result.totalBudget ?? 0);
        this.insightLoading.set(false);
      },
      error: () => {
        this.insightError.set('Could not load spending insights. Check your connection and try again.');
        this.insightLoading.set(false);
      }
    });
  }

  saveBudget(): void {
    const tripId = this.backendTripId;
    const amount = Number(this.budgetInput);
    if (!tripId || !Number.isFinite(amount) || amount < 0) return;
    this.budgetSaving.set(true);
    this.http.put<void>(`${environment.apiUrl}/expenses/trip/${tripId}/budget`, { amount }).subscribe({
      next: () => {
        this.budgetSaving.set(false);
        this.loadInsights();
        this.toast.show('Budget saved', 'Your trip spending budget was updated.');
      },
      error: () => {
        this.budgetSaving.set(false);
        this.insightError.set('Could not save this budget. Please retry.');
      }
    });
  }
}
