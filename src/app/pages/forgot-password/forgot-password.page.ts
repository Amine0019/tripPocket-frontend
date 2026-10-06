import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './forgot-password.page.html',
  styleUrl: './forgot-password.page.scss'
})
export class ForgotPasswordPage {
  private readonly toast = inject(ToastService);
  email = '';
  sent = signal(false);

  submit(): void {
    if (!this.email.includes('@')) {
      return;
    }
    this.sent.set(true);
    this.toast.show('Reset link sent', 'Check your inbox for the tripPocket recovery email.');
  }
}
