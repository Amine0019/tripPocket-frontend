import { BudgetExpense } from '../models/models';

export const MOCK_EXPENSES: BudgetExpense[] = [
  {
    id: 'ex-1',
    title: 'Kyoto Garden Hotel',
    category: 'ACCOMMODATION',
    amount: 640,
    paymentMethod: 'CARD',
    date: '2025-05-18',
    tripId: 'japan',
    tripTitle: 'Discover Japan',
    description: 'Three nights in Tokyo'
  },
  {
    id: 'ex-2',
    title: 'Sushi tasting',
    category: 'FOOD',
    amount: 128,
    paymentMethod: 'CARD',
    date: '2025-05-19',
    tripId: 'japan',
    tripTitle: 'Discover Japan',
    description: 'Tsukiji tasting menu'
  },
  {
    id: 'ex-3',
    title: 'Rail pass',
    category: 'TRANSPORT',
    amount: 284,
    paymentMethod: 'CARD',
    date: '2025-05-21',
    tripId: 'japan',
    tripTitle: 'Discover Japan',
    description: 'Shinkansen Tokyo–Kyoto–Osaka'
  },
  {
    id: 'ex-4',
    title: 'Tea ceremony',
    category: 'ACTIVITIES',
    amount: 96,
    paymentMethod: 'CARD',
    date: '2025-05-23',
    tripId: 'japan',
    tripTitle: 'Discover Japan',
    description: 'Private host in Gion'
  },
  {
    id: 'ex-5',
    title: 'Night market finds',
    category: 'SHOPPING',
    amount: 74,
    paymentMethod: 'CASH',
    date: '2025-05-20',
    tripId: 'japan',
    tripTitle: 'Discover Japan',
    description: 'Ceramics and snacks'
  },
  {
    id: 'ex-6',
    title: 'Airport transfer',
    category: 'TRANSPORT',
    amount: 48,
    paymentMethod: 'CARD',
    date: '2025-05-18',
    tripId: 'japan',
    tripTitle: 'Discover Japan',
    description: 'Narita to hotel'
  },
  {
    id: 'ex-7',
    title: 'Bosphorus hotel',
    category: 'ACCOMMODATION',
    amount: 520,
    paymentMethod: 'PAYPAL',
    date: '2025-04-12',
    tripId: 'istanbul',
    tripTitle: 'Istanbul Crossroads',
    description: 'Six-night stay'
  },
  {
    id: 'ex-8',
    title: 'Kadıköy lunch',
    category: 'FOOD',
    amount: 42,
    paymentMethod: 'CASH',
    date: '2025-04-14',
    tripId: 'istanbul',
    tripTitle: 'Istanbul Crossroads',
    description: 'Market tasting'
  },
  {
    id: 'ex-9',
    title: 'Cruise tickets',
    category: 'ACTIVITIES',
    amount: 136,
    paymentMethod: 'CARD',
    date: '2025-04-16',
    tripId: 'istanbul',
    tripTitle: 'Istanbul Crossroads',
    description: 'Sunset sailing'
  },
  {
    id: 'ex-10',
    title: 'Travel insurance',
    category: 'OTHER',
    amount: 89,
    paymentMethod: 'CARD',
    date: '2025-03-01',
    tripId: 'japan',
    tripTitle: 'Discover Japan',
    description: 'Two travelers'
  },
  {
    id: 'ex-11',
    title: 'Street snacks',
    category: 'FOOD',
    amount: 36,
    paymentMethod: 'CASH',
    date: '2025-05-22',
    tripId: 'japan',
    tripTitle: 'Discover Japan',
    description: 'Nishiki Market'
  },
  {
    id: 'ex-12',
    title: 'Souvenir linens',
    category: 'SHOPPING',
    amount: 152,
    paymentMethod: 'CARD',
    date: '2025-04-15',
    tripId: 'istanbul',
    tripTitle: 'Istanbul Crossroads',
    description: 'Grand Bazaar'
  }
];
