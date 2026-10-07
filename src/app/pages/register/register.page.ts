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

    if (!this.firstName || !this.lastName || !this.email.includes('@') || this.password.length < 4) {
      this.error.set('Fill in your name, a valid email, and a password of at least 4 characters.');
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
    switch (error.status) {
      case 409:
        return 'This email is already in use.';
      case 400:
        return 'The registration data is invalid.';
      case 500:
        return 'A server error occurred. Please try again later.';
      default:
        return 'Unable to create your account right now. Please try again.';
    }
  }
}
