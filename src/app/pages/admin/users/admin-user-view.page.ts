import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminUser, UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-user-view-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-user-view.page.html',
  styleUrl: './admin-user-view.page.scss'
})
export class AdminUserViewPage implements OnInit {
  private readonly userService = inject(UserService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  user = signal<AdminUser | null>(null);
  loading = signal(true);
  userId!: number;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      void this.router.navigate(['/admin/users']);
      return;
    }
    this.userId = Number(id);
    this.userService.getUserById(this.userId).subscribe({
      next: (u) => {
        this.user.set(u);
        this.loading.set(false);
      },
      error: () => {
        this.toast.show('Error', 'User not found.');
        void this.router.navigate(['/admin/users']);
      }
    });
  }

  async deleteUser(): Promise<void> {
    const u = this.user();
    if (!u) return;

    const result = await Swal.fire({
      title: 'Delete user?',
      html: `
        <div style="text-align: left; margin-top: 10px; font-family: inherit;">
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; margin-bottom: 12px;">
            <div style="font-size: 11px; font-weight: 700; color: #1b7c6e; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">
              ${u.role || 'User'}
            </div>
            <div style="font-size: 15px; font-weight: 600; color: #1c2c34;">
              ${u.firstName} ${u.lastName}
            </div>
            <div style="font-size: 13px; color: #64748b; margin-top: 2px;">
              ${u.email}
            </div>
          </div>
          <p style="margin: 0; color: #64748b; font-size: 13.5px; line-height: 1.5;">
            Are you sure you want to delete this user? <strong>This action cannot be undone.</strong>
          </p>
        </div>
      `,
      icon: 'warning',
      iconColor: '#ef4444',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      reverseButtons: true,
      focusCancel: true,
      customClass: {
        popup: 'tp-swal-popup',
        title: 'tp-swal-title',
        confirmButton: 'tp-swal-confirm-btn',
        cancelButton: 'tp-swal-cancel-btn'
      }
    });

    if (!result.isConfirmed) return;

    this.userService.deleteUser(u.id).subscribe({
      next: () => {
        this.toast.show('User deleted', `${u.firstName} ${u.lastName} has been removed.`);
        void this.router.navigate(['/admin/users']);
      },
      error: (err) => {
        const msg = err.error?.message || 'Failed to delete user.';
        this.toast.show('Error', msg);
      }
    });
  }
}
