import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.page.html',
  styleUrl: './register.page.scss'
})
export class RegisterPage {
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  firstName = '';
  lastName = '';
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

    this.authService.register({
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      password: this.password
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.show('Account created', 'You can now log in to start planning trips.');
        void this.router.navigate(['/login']);
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

    if (error.status === 409) {
      return 'This email is already in use.';
    }

    const message = error.error?.message;
    if (typeof message === 'string' && message.trim().length > 0) {
      if (
        message.toLowerCase().includes('already exist') ||
        message.toLowerCase().includes('already in use')
      ) {
        return 'This email is already in use.';
      }
      if (message !== 'Unauthorized') {
        return message;
      }
    }

    switch (error.status) {
      case 400:
        return 'The registration data is invalid.';
      case 409:
        return 'This email is already in use.';
      case 500:
        return 'A server error occurred. Please try again later.';
      default:
        return 'This email is already in use.';
    }
  }
}
