import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import { TravelStore } from '../../core/services/travel.store';
import { AuthService } from '../../core/services/auth.service';
import { TokenService } from '../../core/services/token.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.page.html',
  styleUrl: './register.page.scss'
})
export class RegisterPage {
  private readonly tokenService = inject(TokenService);
  private readonly store = inject(TravelStore);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  firstName = '';
  lastName = '';
  email = '';
  password = '';
  error = signal('');
  errorList = signal<string[]>([]);
  loading = signal(false);

  submit(): void {
    this.error.set('');
    this.auth.register({ firstName: this.firstName, lastName: this.lastName, email: this.email, password: this.password }).subscribe({
      next: (session) => {
        this.tokenService.saveAccessToken(session.accessToken);
        this.tokenService.saveRefreshToken(session.refreshToken);
        this.store.register(session.firstName, session.lastName, session.username, this.password);
        this.store.updateUser({ id: session.id, firstName: session.firstName, lastName: session.lastName, email: session.username });
        this.toast.show('Account created', 'You can start planning trips right away.');
        void this.router.navigate(['/trips']);
      },
      error: (error: { error?: { message?: string } }) => this.error.set(error.error?.message ?? 'Unable to create your account. Check the details and try again.')
    });
  }
}
