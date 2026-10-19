export const API_BASE_URL = 'http://localhost:8089/tripPocketBackend/api';

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  role: string;
  username: string;
  firstName: string;
  lastName: string;
  id: number;
}

export interface ApiTrip {
  id: number;
  destination: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
}

export interface ApiExpense {
  id: number;
  title: string;
  amount: number;
  expenseDate: string;
  description: string | null;
  category: string;
  paymentMethod: string;
  trip?: { id: number } | null;
}
