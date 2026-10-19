import { HttpErrorResponse } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  NgZone,
  OnDestroy,
  inject,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AuthResponse } from '../../core/models/auth.models';
import { environment } from '../../../environments/environment';
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
export class LoginPage implements AfterViewInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly tokenService = inject(TokenService);
  private readonly toast = inject(ToastService);
  private readonly store = inject(TravelStore);
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);

  email = '';
  password = '';
  error = signal('');
  loading = signal(false);
  googleLoading = signal(false);

  private googleInitTimer?: any;

  private handleGoogleCredential(response: { credential: string }): void {
    this.authService.loginWithGoogle(response.credential).subscribe({
      next: (session) => this.finishLogin(session),
      error: () => this.error.set('Unable to sign in with Google. Please try again.')
    });
  }

  private finishLogin(session: AuthResponse): void {
    this.tokenService.saveAccessToken(session.accessToken);
    this.tokenService.saveRefreshToken(session.refreshToken);
    this.store.login(session.username, this.password || 'google');
    this.store.updateUser({ id: session.id, firstName: session.firstName, lastName: session.lastName, email: session.username });
    this.toast.show('Welcome back', 'Your trips and reservations are ready.');
    void this.router.navigate(['/my-trips']);
  }

  ngAfterViewInit(): void {
    this.initGoogleSignIn();
  }

  ngOnDestroy(): void {
    if (this.googleInitTimer) {
      clearTimeout(this.googleInitTimer);
    }
  }

  private initGoogleSignIn(retryCount = 0): void {
    const googleApi = (window as Window & { google?: { accounts?: { id?: { initialize: (config: object) => void; renderButton: (target: HTMLElement, options: object) => void } } } }).google;
    if (googleApi?.accounts?.id) {
      try {
        googleApi.accounts.id.initialize({
          client_id: environment.googleClientId,
          callback: (response: { credential: string }) => {
            this.ngZone.run(() => this.handleGoogleCredential(response));
          },
          auto_select: false,
          cancel_on_tap_outside: true
        });

        const container = document.getElementById('google-btn-container');
        if (container) {
          container.innerHTML = '';
          googleApi.accounts.id.renderButton(container, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'pill',
            logo_alignment: 'left',
            width: 320
          });
        }
      } catch (err) {
        console.warn('Could not initialize Google Identity Services button', err);
      }
    } else if (retryCount < 25) {
      this.googleInitTimer = setTimeout(() => this.initGoogleSignIn(retryCount + 1), 200);
    }
  }

  submit(): void {
    this.error.set('');
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (session) => {
        this.finishLogin(session);
      },
      error: (error: { error?: { message?: string } }) => this.error.set(error.error?.message ?? 'Unable to sign in. Check your email and password.')
    });
  }
}
