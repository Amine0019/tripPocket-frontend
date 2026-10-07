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
  draft = { ...this.store.user() };
  loading = signal(false);

  save(form: NgForm): void {
    if (form.invalid || this.loading()) return;
    this.loading.set(true);
    
    const payload: any = {
      firstName: this.draft.firstName,
      lastName: this.draft.lastName,
      email: this.draft.email
    };
    if (this.draft.password) {
      payload.password = this.draft.password;
    }

    this.userService.updateUser(this.draft.id, payload).subscribe({
      next: (updatedUser) => {
        this.store.updateUser({
          ...updatedUser,
          avatarInitials: `${updatedUser.firstName[0] ?? ''}${updatedUser.lastName[0] ?? ''}`.toUpperCase()
        });
        this.draft = { ...this.store.user() };
        this.loading.set(false);
        this.toast.show('Profile saved', 'Your traveler details were updated.');
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.toast.show('Error', error.error?.message || 'Unable to save profile');
      }
    });
  }
}
