import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminUser, AdminUserPayload, UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-admin-user-form-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './admin-user-form.page.html',
  styleUrl: './admin-user-form.page.scss'
})
export class AdminUserFormPage implements OnInit {
  private readonly userService = inject(UserService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  isEdit = signal(false);
  loading = signal(false);
  saving = signal(false);
  errorList = signal<string[]>([]);

  userId: number | null = null;

  // Form model — mirrors real backend User fields
  draft: AdminUserPayload & { id?: number } = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'TRAVELER',
    enabled: true
  };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit.set(true);
      this.userId = Number(id);
      this.loadUser(this.userId);
    }
  }

  private loadUser(id: number): void {
    this.loading.set(true);
    this.userService.getUserById(id).subscribe({
      next: (user: AdminUser) => {
        this.draft = {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          enabled: user.enabled,
          password: ''
        };
        this.loading.set(false);
      },
      error: () => {
        this.toast.show('Error', 'User not found.');
        void this.router.navigate(['/admin/users']);
      }
    });
  }

  save(): void {
    if (this.saving()) return;
    this.errorList.set([]);
    this.saving.set(true);

    const payload: AdminUserPayload = {
      firstName: this.draft.firstName?.trim() ?? '',
      lastName: this.draft.lastName?.trim() ?? '',
      email: this.draft.email?.trim() ?? '',
      role: this.draft.role,
      enabled: this.draft.enabled
    };

    if (this.draft.password && this.draft.password.trim().length > 0) {
      payload.password = this.draft.password.trim();
    }

    const request$ = this.isEdit()
      ? this.userService.adminUpdateUser(this.userId!, payload)
      : this.userService.createUser(payload);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.show(
          this.isEdit() ? 'User updated' : 'User created',
          this.isEdit() ? 'Changes saved successfully.' : 'New user has been created.'
        );
        void this.router.navigate(['/admin/users']);
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.parseBackendErrors(err);
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
      } else if (error.status === 404) {
        list.push('User not found.');
      } else {
        list.push('An unexpected error occurred. Please try again.');
      }
    }

    this.errorList.set(list);
    this.toast.show('Validation Error', list[0]);
  }
}
