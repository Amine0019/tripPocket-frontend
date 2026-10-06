import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import { TravelStore } from '../../core/services/travel.store';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss'
})
export class LoginPage {
  private readonly store = inject(TravelStore);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  email = 'alex.morgan@email.com';
  password = 'travel';
  error = signal('');

  submit(): void {
    if (this.store.login(this.email, this.password)) {
      this.toast.show('Welcome back', 'Your trips and reservations are ready.');
      void this.router.navigate(['/my-trips']);
      return;
    }
    this.error.set('Use a valid email and a password of at least 4 characters.');
  }
}
