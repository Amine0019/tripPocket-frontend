import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import { TravelStore } from '../../core/services/travel.store';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.page.html',
  styleUrl: './register.page.scss'
})
export class RegisterPage {
  private readonly store = inject(TravelStore);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  firstName = '';
  lastName = '';
  email = '';
  password = '';
  error = signal('');

  submit(): void {
    if (this.store.register(this.firstName, this.lastName, this.email, this.password)) {
      this.toast.show('Account created', 'You can start planning trips right away.');
      void this.router.navigate(['/trips']);
      return;
    }
    this.error.set('Fill in your name, a valid email, and a password of at least 4 characters.');
  }
}
