import { HttpErrorResponse } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AuthResponse } from '../../core/models/auth.models';
import { Role } from '../../shared/models/enums/role.enum';
import { TokenService } from '../../core/services/token.service';
import { ToastService } from '../../core/services/toast.service';
import { TravelStore } from '../../core/services/travel.store';
import { environment } from '../../../environments/environment';

declare const google: any;

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

  @ViewChild('googleBtnContainer') googleBtnContainer?: ElementRef<HTMLDivElement>;

  email = '';
  password = '';
  error = signal('');
  loading = signal(false);
  googleLoading = signal(false);

  private googleInitTimer?: any;

  ngAfterViewInit(): void {
    this.initGoogleSignIn();
  }

  ngOnDestroy(): void {
    if (this.googleInitTimer) {
      clearTimeout(this.googleInitTimer);
    }
  }

  private initGoogleSignIn(retryCount = 0): void {
    if (typeof google !== 'undefined' && google?.accounts?.id) {
      try {
        google.accounts.id.initialize({
          client_id: environment.googleClientId,
          callback: (response: { credential: string }) => {
            this.ngZone.run(() => this.handleGoogleCredential(response));
          },
          auto_select: false,
          cancel_on_tap_outside: true
        });

        const container = this.googleBtnContainer?.nativeElement || document.getElementById('google-btn-container');
        if (container) {
          container.innerHTML = '';
          google.accounts.id.renderButton(container, {
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
    if (this.loading() || this.googleLoading()) {
      return;
    }

    this.error.set('');
    this.loading.set(true);

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.handleAuthSuccess(response, 'Welcome back');
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(this.getErrorMessage(error));
      }
    });
  }

  handleGoogleCredential(response: { credential?: string }): void {
    if (!response || !response.credential) {
      this.error.set('Google sign-in was canceled or failed. Please try again.');
      return;
    }

    this.error.set('');
    this.googleLoading.set(true);

    this.authService.loginWithGoogle(response.credential).subscribe({
      next: (authResponse) => {
        this.googleLoading.set(false);
        this.handleAuthSuccess(authResponse, 'Signed in with Google');
      },
      error: (error: HttpErrorResponse) => {
        this.googleLoading.set(false);
        this.error.set(this.getErrorMessage(error));
      }
    });
  }

  private handleAuthSuccess(response: AuthResponse, toastTitle: string): void {
    this.tokenService.saveAccessToken(response.accessToken);
    if (response.refreshToken) {
      this.tokenService.saveRefreshToken(response.refreshToken);
    }

    const firstChar = response.firstName ? response.firstName[0] : 'U';
    const lastChar = response.lastName ? response.lastName[0] : '';

    this.store.updateUser({
      id: response.id,
      firstName: response.firstName || 'Traveler',
      lastName: response.lastName || '',
      email: response.username,
      avatarInitials: `${firstChar}${lastChar}`.toUpperCase(),
      role: response.role === Role.ADMIN ? 'ADMIN' : 'TRAVELER'
    });

    this.store.loggedIn.set(true);
    this.toast.show(toastTitle, 'Your trips and reservations are ready.');
    void this.router.navigate(response.role === Role.ADMIN ? ['/admin'] : ['/my-trips']);
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
