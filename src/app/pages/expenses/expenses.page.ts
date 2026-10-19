import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BudgetExpense, ExpenseCategory, PaymentMethod } from '../../core/models/models';
import { ApiTrip } from '../../core/services/api';
import { TravelStore } from '../../core/services/travel.store';
import { BudgetExpenseService } from '../../core/services/budget-expense.service';
import { ToastService } from '../../core/services/toast.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ExpenseCardComponent } from '../../shared/components/expense-card/expense-card.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-expenses-page',
  standalone: true,
  imports: [CurrencyPipe, FormsModule, RouterLink, PageHeaderComponent, ExpenseCardComponent, EmptyStateComponent, ModalComponent],
  templateUrl: './expenses.page.html',
  styleUrl: './expenses.page.scss'
})
export class ExpensesPage {
  private readonly api = inject(BudgetExpenseService);
  private readonly store = inject(TravelStore);
  private readonly toast = inject(ToastService);

  readonly category = signal<ExpenseCategory | 'ALL'>('ALL');
  readonly tripId = signal('');
  readonly open = signal(false);
  readonly saving = signal(false);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly categories: Array<ExpenseCategory | 'ALL'> = ['ALL', 'FOOD', 'ACCOMMODATION', 'TRANSPORT', 'ACTIVITIES', 'OTHER'];
  readonly methods: PaymentMethod[] = ['CREDIT_CARD', 'DEBIT_CARD', 'CASH', 'ONLINE_PAYMENT'];
  readonly trips = signal<ApiTrip[]>([]);
  readonly expenses = signal<BudgetExpense[]>([]);
  readonly editingId = signal<string | null>(null);

  form = this.emptyForm();

  readonly items = computed(() => this.expenses().filter((item) =>
    (this.category() === 'ALL' || item.category === this.category()) &&
    (!this.tripId() || item.tripId === this.tripId())
  ));
  readonly totals = computed(() => {
    const result: Record<string, number> = { FOOD: 0, ACCOMMODATION: 0, TRANSPORT: 0, ACTIVITIES: 0, OTHER: 0 };
    for (const expense of this.expenses()) result[expense.category] = (result[expense.category] ?? 0) + expense.amount;
    return result;
  });
  readonly total = computed(() => this.items().reduce((sum, item) => sum + item.amount, 0));

  constructor() {
    this.load();
  }

  private emptyForm(): Omit<BudgetExpense, 'id'> {
    const trip = this.trips()[0];
    return {
      title: '', category: 'FOOD', amount: 0, paymentMethod: 'CREDIT_CARD',
      date: new Date().toISOString().slice(0, 10), tripId: trip ? String(trip.id) : '',
      tripTitle: trip?.destination ?? '', description: ''
    };
  }

  load(): void {
    const userId = Number(this.store.user().id);
    if (!Number.isFinite(userId) || userId <= 0) {
      this.error.set('Sign in to view and manage expenses.');
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.api.getTrips(userId).subscribe({
      next: (trips) => {
        this.trips.set(trips);
        this.api.getExpenses(trips).subscribe({
          next: (expenses) => {
            this.expenses.set(expenses.map((expense) => ({
              ...expense,
              tripTitle: trips.find((trip) => String(trip.id) === expense.tripId)?.destination ?? ''
            })).sort((a, b) => b.date.localeCompare(a.date)));
            this.loading.set(false);
            if (!this.form.tripId && trips.length) this.form = this.emptyForm();
          },
          error: () => this.failLoad('Could not load expenses from the server.')
        });
      },
      error: () => this.failLoad('Could not load your trips from the server.')
    });
  }

  startNew(): void {
    this.editingId.set(null);
    this.form = this.emptyForm();
    this.open.set(true);
  }

  edit(expense: BudgetExpense): void {
    this.editingId.set(expense.id);
    this.form = { ...expense };
    this.open.set(true);
  }

  save(): void {
    const trip = this.trips().find((item) => String(item.id) === this.form.tripId);
    if (!this.form.title.trim() || !Number.isFinite(Number(this.form.amount)) || Number(this.form.amount) <= 0 || !this.form.date || !trip) return;
    const payload = { ...this.form, title: this.form.title.trim(), amount: Number(this.form.amount), tripTitle: trip.destination };
    this.saving.set(true);
    const editingId = this.editingId();
    const request = editingId ? this.api.update(editingId, payload) : this.api.create(payload);
    request.subscribe({
      next: (saved) => {
        const result = { ...saved, tripId: editingId ? this.form.tripId : String(trip.id), tripTitle: trip.destination };
        this.expenses.update((items) => editingId
          ? items.map((item) => item.id === editingId ? result : item)
          : [result, ...items]);
        this.saving.set(false);
        this.open.set(false);
        this.form = this.emptyForm();
        this.editingId.set(null);
        this.toast.show(editingId ? 'Expense updated' : 'Expense added', 'Your budget list was updated.');
      },
      error: () => {
        this.saving.set(false);
        this.toast.show('Unable to save expense', 'Check your connection and try again.');
      }
    });
  }

  remove(id: string): void {
    this.api.delete(id).subscribe({
      next: () => {
        this.expenses.update((items) => items.filter((item) => item.id !== id));
        this.toast.show('Expense removed', 'That spend is no longer in your budget.');
      },
      error: () => this.toast.show('Unable to remove expense', 'Check your connection and try again.')
    });
  }

  close(): void {
    this.open.set(false);
    this.editingId.set(null);
  }

  private failLoad(message: string): void {
    this.error.set(message);
    this.loading.set(false);
  }
}
