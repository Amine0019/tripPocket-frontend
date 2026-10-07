import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Role } from '../../shared/models/enums/role.enum';
import { TokenService } from '../../core/services/token.service';
import { ToastService } from '../../core/services/toast.service';
import { TravelStore } from '../../core/services/travel.store';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss'
})
export class LoginPage {
  private readonly authService = inject(AuthService);
  private readonly tokenService = inject(TokenService);
  private readonly toast = inject(ToastService);
  private readonly store = inject(TravelStore);
  private readonly router = inject(Router);

  email = '';
  password = '';
  error = signal('');
  loading = signal(false);

  submit(): void {
    if (this.loading()) {
      return;
    }

    this.error.set('');
    this.loading.set(true);

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (response) => {
        this.tokenService.saveAccessToken(response.accessToken);
        if (response.refreshToken) {
          this.tokenService.saveRefreshToken(response.refreshToken);
        }
        this.store.updateUser({
          id: response.id,
          firstName: response.firstName,
          lastName: response.lastName,
          email: response.username,
          avatarInitials: `${response.firstName[0]}${response.lastName[0]}`.toUpperCase(),
          role: response.role === Role.ADMIN ? 'ADMIN' : 'TRAVELER'
        });
        this.store.loggedIn.set(true);
        this.loading.set(false);
        this.toast.show('Welcome back', 'Your trips and reservations are ready.');
        void this.router.navigate(response.role === Role.ADMIN ? ['/admin'] : ['/my-trips']);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(this.getErrorMessage(error));
      }
    });
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    const validationErrors = error.error?.errors as Record<string, string> | undefined;
    if (validationErrors) {
      return Object.values(validationErrors).join(' ');
    }

    if (typeof error.error?.message === 'string') {
      return error.error.message;
    }

    return error.status === 401
      ? 'Invalid credentials.'
      : 'Unable to sign in right now. Please try again.';
  }
}
