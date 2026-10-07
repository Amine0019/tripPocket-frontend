import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminUser, UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';

declare const Swal: any;

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

    const swalAvailable = typeof Swal !== 'undefined';
    let confirmed = false;

    if (swalAvailable) {
      const result = await Swal.fire({
        title: 'Delete user?',
        html: `Are you sure you want to delete <strong>${u.firstName} ${u.lastName}</strong>?<br>This action cannot be undone.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#ef7d62',
        cancelButtonColor: '#1b7c6e'
      });
      confirmed = result.isConfirmed;
    } else {
      confirmed = window.confirm(`Delete ${u.firstName} ${u.lastName}? This cannot be undone.`);
    }

    if (!confirmed) return;

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
