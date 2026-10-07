import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Role } from '../../shared/models/enums/role.enum';
import { TokenService } from '../../core/services/token.service';
import { ToastService } from '../../core/services/toast.service';

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
  private readonly router = inject(Router);

  email = 'alex.morgan@email.com';
  password = 'travel';
  error = signal('');
  loading = signal(false);

  submit(): void {
    if (this.loading()) {
      return;
    }

    if (!this.email.includes('@') || this.password.length < 4) {
      this.error.set('Use a valid email and a password of at least 4 characters.');
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
        this.loading.set(false);
        this.toast.show('Welcome back', 'Your trips and reservations are ready.');
        void this.router.navigate(response.role === Role.ADMIN ? ['/admin'] : ['/my-trips']);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(
          error.status === 401
            ? 'Email ou mot de passe incorrect.'
            : 'Unable to sign in right now. Please try again.'
        );
      }
    });
  }
}
