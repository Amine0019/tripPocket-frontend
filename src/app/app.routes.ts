import { Routes } from '@angular/router';
import { ExploreTripsPage } from './pages/explore-trips/explore-trips.page';
import { TripDetailsPage } from './pages/trip-details/trip-details.page';
import { ActivitiesPage } from './pages/activities/activities.page';
import { ActivityDetailsPage } from './pages/activity-details/activity-details.page';
import { MyTripsPage } from './pages/my-trips/my-trips.page';
import { ReservationsPage } from './pages/reservations/reservations.page';
import { ReservationDetailsPage } from './pages/reservation-details/reservation-details.page';
import { BookingPage } from './pages/booking/booking.page';
import { ExpensesPage } from './pages/expenses/expenses.page';
import { ProfilePage } from './pages/profile/profile.page';
import { NotificationsPage } from './pages/notifications/notifications.page';
import { LoginPage } from './pages/login/login.page';
import { RegisterPage } from './pages/register/register.page';
import { ForgotPasswordPage } from './pages/forgot-password/forgot-password.page';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { AdminLayoutComponent } from './pages/admin/layout/admin-layout.component';
import { AdminDashboardPage } from './pages/admin/dashboard/admin-dashboard.page';
import { AdminUsersPage } from './pages/admin/users/admin-users.page';
import { AdminUserFormPage } from './pages/admin/users/admin-user-form.page';
import { AdminUserViewPage } from './pages/admin/users/admin-user-view.page';

export const routes: Routes = [
  { path: '', redirectTo: 'trips', pathMatch: 'full' },
  { path: 'trips', component: ExploreTripsPage, canActivate: [authGuard] },
  { path: 'trips/:id', component: TripDetailsPage, canActivate: [authGuard] },
  { path: 'activities', component: ActivitiesPage, canActivate: [authGuard] },
  { path: 'activities/:id', component: ActivityDetailsPage, canActivate: [authGuard] },
  { path: 'my-trips', component: MyTripsPage, canActivate: [authGuard] },
  { path: 'reservations', component: ReservationsPage, canActivate: [authGuard] },
  { path: 'reservations/:id', component: ReservationDetailsPage, canActivate: [authGuard] },
  { path: 'booking/:tripId', component: BookingPage, canActivate: [authGuard] },
  { path: 'expenses', component: ExpensesPage, canActivate: [authGuard] },
  { path: 'profile', component: ProfilePage, canActivate: [authGuard] },
  { path: 'notifications', component: NotificationsPage, canActivate: [authGuard] },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ROLE_ADMIN'] },
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: AdminDashboardPage },
      { path: 'users', component: AdminUsersPage },
      { path: 'users/new', component: AdminUserFormPage },
      { path: 'users/:id', component: AdminUserViewPage },
      { path: 'users/:id/edit', component: AdminUserFormPage }
    ]
  },
  { path: 'login', component: LoginPage },
  { path: 'register', component: RegisterPage },
  { path: 'forgot-password', component: ForgotPasswordPage },
  { path: '**', redirectTo: '' }
];

