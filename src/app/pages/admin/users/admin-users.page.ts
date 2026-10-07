import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AdminUser, UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';

declare const Swal: any;

@Component({
  selector: 'app-admin-users-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-users.page.html',
  styleUrl: './admin-users.page.scss'
})
export class AdminUsersPage implements OnInit {
  private readonly userService = inject(UserService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  users = signal<AdminUser[]>([]);
  loading = signal(true);
  error = signal('');

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.error.set('');
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        this.users.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load users. Please try again.');
        this.loading.set(false);
      }
    });
  }

  viewUser(id: number): void {
    void this.router.navigate(['/admin/users', id]);
  }

  editUser(id: number): void {
    void this.router.navigate(['/admin/users', id, 'edit']);
  }

  async deleteUser(user: AdminUser): Promise<void> {
    const swalAvailable = typeof Swal !== 'undefined';

    let confirmed = false;
    if (swalAvailable) {
      const result = await Swal.fire({
        title: 'Delete user?',
        html: `Are you sure you want to delete <strong>${user.firstName} ${user.lastName}</strong>?<br>This action cannot be undone.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#ef7d62',
        cancelButtonColor: '#1b7c6e'
      });
      confirmed = result.isConfirmed;
    } else {
      confirmed = window.confirm(`Delete ${user.firstName} ${user.lastName}? This action cannot be undone.`);
    }

    if (!confirmed) return;

    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.users.update((list) => list.filter((u) => u.id !== user.id));
        this.toast.show('User deleted', `${user.firstName} ${user.lastName} has been removed.`);
      },
      error: (err) => {
        const msg = err.error?.message || 'Failed to delete user.';
        this.toast.show('Error', msg);
      }
    });
  }
}
