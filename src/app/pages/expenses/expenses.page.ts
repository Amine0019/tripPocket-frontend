import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BudgetExpense, ExpenseCategory, PaymentMethod } from '../../core/models/models';
import { ToastService } from '../../core/services/toast.service';
import { TravelStore } from '../../core/services/travel.store';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ExpenseCardComponent } from '../../shared/components/expense-card/expense-card.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-expenses-page',
  standalone: true,
  imports: [CurrencyPipe, FormsModule, PageHeaderComponent, ExpenseCardComponent, EmptyStateComponent, ModalComponent],
  templateUrl: './expenses.page.html',
  styleUrl: './expenses.page.scss'
})
export class ExpensesPage {
  private readonly store = inject(TravelStore);
  private readonly toast = inject(ToastService);

  readonly category = signal<ExpenseCategory | 'ALL'>('ALL');
  readonly tripId = signal('');
  readonly open = signal(false);
  readonly categories: Array<ExpenseCategory | 'ALL'> = ['ALL', 'FOOD', 'ACCOMMODATION', 'TRANSPORT', 'ACTIVITIES', 'SHOPPING', 'OTHER'];
  readonly methods: PaymentMethod[] = ['CARD', 'CASH', 'PAYPAL', 'BANK_TRANSFER'];
  readonly trips = this.store.trips;
  tripFilter = '';

  form = this.emptyForm();

  readonly items = computed(() =>
    this.store.expenses().filter((item) => {
      const cat = this.category() === 'ALL' || item.category === this.category();
      const trip = !this.tripId() || item.tripId === this.tripId();
      return cat && trip;
    })
  );
  readonly totals = computed(() => this.store.categoryTotals());
  readonly total = computed(() => this.items().reduce((sum, item) => sum + item.amount, 0));

  emptyForm(): Omit<BudgetExpense, 'id'> {
    const trip = this.store.trips()[0];
    return {
      title: '',
      category: 'FOOD',
      amount: 0,
      paymentMethod: 'CARD',
      date: new Date().toISOString().slice(0, 10),
      tripId: trip?.id ?? '',
      tripTitle: trip?.title ?? '',
      description: ''
    };
  }

  save(): void {
    const trip = this.store.tripById(this.form.tripId);
    this.store.addExpense({
      ...this.form,
      tripTitle: trip?.title ?? this.form.tripTitle,
      amount: Number(this.form.amount)
    });
    this.open.set(false);
    this.form = this.emptyForm();
    this.toast.show('Expense added', 'Your budget list was updated.');
  }

  remove(id: string): void {
    this.store.removeExpense(id);
    this.toast.show('Expense removed', 'That spend is no longer in your budget.');
  }
}
