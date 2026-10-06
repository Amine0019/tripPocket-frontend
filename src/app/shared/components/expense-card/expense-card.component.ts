import { CurrencyPipe } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { BudgetExpense } from '../../../core/models/models';
import { TravelStore } from '../../../core/services/travel.store';

@Component({
  selector: 'app-expense-card',
  standalone: true,
  imports: [CurrencyPipe],
  templateUrl: './expense-card.component.html',
  styleUrl: './expense-card.component.scss'
})
export class ExpenseCardComponent {
  private readonly store = inject(TravelStore);
  @Input({ required: true }) expense!: BudgetExpense;

  pay(): string {
    return this.store.paymentLabel(this.expense.paymentMethod);
  }
}
