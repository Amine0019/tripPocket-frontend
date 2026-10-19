import { AppNotification, User } from '../models/models';

export const MOCK_USER: User = {
  id: 'u-1',
  firstName: 'Alex',
  lastName: 'Morgan',
  email: 'alex.morgan@email.com',
  phone: '',
  country: '',
  language: 'English',
  avatarInitials: 'AM',
  memberSince: 'March 2023',
  role: 'TRAVELER'
};

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    title: 'Reservation confirmed',
    message: 'Your reservation has been confirmed. Confirmation #TVL-2840.',
    date: '2 hours ago',
    read: false,
    icon: 'check'
  },
  {
    id: 'n2',
    title: 'Trip countdown',
    message: 'Your trip starts in 5 days. Discover Japan is almost ready.',
    date: 'Yesterday',
    read: false,
    icon: 'calendar'
  },
  {
    id: 'n3',
    title: 'Payment successful',
    message: 'Your payment was successful. $2,580 charged to Visa •••• 2841.',
    date: 'May 12',
    read: true,
    icon: 'card'
  },
  {
    id: 'n4',
    title: 'Activity reminder',
    message: 'Kyoto Tea Ceremony is pending confirmation for May 23.',
    date: 'May 11',
    read: true,
    icon: 'bell'
  },
  {
    id: 'n5',
    title: 'Itinerary update',
    message: 'Your Shinkansen seats are assigned. Tickets are in My reservations.',
    date: 'May 9',
    read: true,
    icon: 'plane'
  }
];
