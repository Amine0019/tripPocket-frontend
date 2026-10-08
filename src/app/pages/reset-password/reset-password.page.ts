import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reset-password-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './reset-password.page.html',
  styleUrl: './reset-password.page.scss'
})
export class ResetPasswordPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);

  token = signal<string>('');
  newPassword = '';
  confirmPassword = '';

  showPassword = signal(false);
  showConfirmPassword = signal(false);

  loading = signal(false);
  success = signal(false);
  error = signal<string | null>(null);
  missingToken = signal(false);

  ngOnInit(): void {
    const queryToken = this.route.snapshot.queryParamMap.get('token');
    if (!queryToken || !queryToken.trim()) {
      this.missingToken.set(true);
    } else {
      this.token.set(queryToken.trim());
    }
  }

  toggleShowPassword(): void {
    this.showPassword.update((val) => !val);
  }

  toggleShowConfirmPassword(): void {
    this.showConfirmPassword.update((val) => !val);
  }

  submit(): void {
    this.error.set(null);

    const tokenVal = this.token();
    if (!tokenVal) {
      this.error.set('Reset token is missing. Please request a new password reset link.');
      return;
    }

    if (!this.newPassword) {
      this.error.set('New password is required.');
      return;
    }

    if (this.newPassword.length < 8) {
      this.error.set('Password must contain at least 8 characters.');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.error.set('Passwords do not match.');
      return;
    }

    this.loading.set(true);

    this.authService
      .resetPassword({
        token: tokenVal,
        newPassword: this.newPassword,
        confirmPassword: this.confirmPassword
      })
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          this.success.set(true);
          this.toast.show('Password Reset', res?.message || 'Your password has been successfully updated.');

          if (typeof Swal !== 'undefined') {
            Swal.fire({
              icon: 'success',
              title: 'Password Updated!',
              text: 'Your password has been changed successfully. You can now sign in with your new password.',
              confirmButtonText: 'Sign In Now',
              confirmButtonColor: '#1b7c6e'
            }).then(() => {
              void this.router.navigate(['/login']);
            });
          }
        },
        error: (err) => {
          this.loading.set(false);
          const serverMessage =
            err?.error?.message ||
            err?.error?.errors?.newPassword ||
            'Unable to reset password. The link may have expired or is invalid.';
          this.error.set(serverMessage);
        }
      });
  }
}
