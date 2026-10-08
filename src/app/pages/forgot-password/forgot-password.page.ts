import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './forgot-password.page.html',
  styleUrl: './forgot-password.page.scss'
})
export class ForgotPasswordPage {
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);

  email = '';
  loading = signal(false);
  sent = signal(false);
  error = signal<string | null>(null);

  submit(): void {
    const trimmedEmail = this.email.trim();
    this.error.set(null);

    if (!trimmedEmail) {
      this.error.set('Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      this.error.set('Please enter a valid email address.');
      return;
    }

    this.loading.set(true);

    this.authService.forgotPassword({ email: trimmedEmail }).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.sent.set(true);
        this.toast.show('Request processed', response?.message || 'Check your inbox for instructions.');

        if (typeof Swal !== 'undefined') {
          Swal.fire({
            icon: 'success',
            title: 'Check your email',
            text: 'If an account exists with this email, a password reset link has been sent.',
            confirmButtonColor: '#1b7c6e',
            timer: 4000,
            timerProgressBar: true
          });
        }
      },
      error: (err) => {
        this.loading.set(false);
        const errorMsg =
          err?.error?.message ||
          'An error occurred while requesting password reset. Please try again.';
        this.error.set(errorMsg);
      }
    });
  }

  resetState(): void {
    this.sent.set(false);
    this.error.set(null);
  }
}
