import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import { TravelStore } from '../../core/services/travel.store';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { UserService } from '../../core/services/user.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss'
})
export class ProfilePage {
  private readonly store = inject(TravelStore);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);

  readonly user = this.store.user;
  draft = { ...this.store.user(), password: '' };
  loading = signal(false);
  errorList = signal<string[]>([]);

  save(): void {
    if (this.loading()) return;
    this.errorList.set([]);
    this.loading.set(true);
    
    const payload: any = {
      firstName: this.draft.firstName ? this.draft.firstName.trim() : '',
      lastName: this.draft.lastName ? this.draft.lastName.trim() : '',
      email: this.draft.email ? this.draft.email.trim() : ''
    };
    if (this.draft.password && this.draft.password.trim().length > 0) {
      payload.password = this.draft.password.trim();
    }

    this.userService.updateUser(this.draft.id, payload).subscribe({
      next: (updatedUser) => {
        this.store.updateUser({
          ...updatedUser,
          avatarInitials: `${updatedUser.firstName?.[0] ?? ''}${updatedUser.lastName?.[0] ?? ''}`.toUpperCase()
        });
        this.draft = { ...this.store.user(), password: '' };
        this.loading.set(false);
        this.errorList.set([]);
        this.toast.show('Profile saved', 'Your traveler details were updated.');
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
      const message = error.error?.message;
      if (typeof message === 'string' && message.trim().length > 0) {
        list.push(message);
      } else if (error.status === 409) {
        list.push('This email is already in use.');
      } else if (error.status === 400) {
        list.push('Validation failed. Please check your inputs.');
      } else {
        list.push('Unable to save profile. Please try again.');
      }
    }

    this.errorList.set(list);
    this.toast.show('Validation Error', list[0]);
  }
}
