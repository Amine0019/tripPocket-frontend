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
  errorList = signal<string[]>([]);
  loading = signal(false);

  submit(): void {
    if (this.loading()) {
      return;
    }

    this.error.set('');
    this.errorList.set([]);
    this.loading.set(true);

    this.authService.register({
      firstName: this.firstName ? this.firstName.trim() : '',
      lastName: this.lastName ? this.lastName.trim() : '',
      email: this.email ? this.email.trim() : '',
      password: this.password ? this.password.trim() : ''
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.show('Account created', 'You can now log in to start planning trips.');
        void this.router.navigate(['/login']);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.parseBackendErrors(error);
      }
    });
  }

  private parseBackendErrors(error: HttpErrorResponse): void {
    const list: string[] = [];
    const validationErrors = error.error?.errors as Record<string, string> | undefined;

    if (validationErrors && typeof validationErrors === 'object') {
      Object.values(validationErrors).forEach((msg) => list.push(msg));
    }

    if (list.length === 0) {
      if (error.status === 409) {
        list.push('This email is already in use.');
      } else {
        const message = error.error?.message;
        if (typeof message === 'string' && message.trim().length > 0 && message !== 'Unauthorized') {
          if (
            message.toLowerCase().includes('already exist') ||
            message.toLowerCase().includes('already in use')
          ) {
            list.push('This email is already in use.');
          } else {
            list.push(message);
          }
        } else if (error.status === 400) {
          list.push('The registration data is invalid.');
        } else {
          list.push('An error occurred during registration. Please try again.');
        }
      }
    }

    this.errorList.set(list);
    this.error.set(list.join(' '));
  }
}
