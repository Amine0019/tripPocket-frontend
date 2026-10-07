import { ExpenseCategory } from './enums/expense-category.enum';
import { PaymentMethod } from './enums/payment-method.enum';

export interface BudgetExpense {
  id: number;
  amount: number;
  expenseDate: string;
  description: string;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
}
