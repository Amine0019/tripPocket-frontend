import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject, switchMap, takeUntil } from 'rxjs';
import { AdminUser, UserSearchResult, UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';

declare const Swal: any;

@Component({
  selector: 'app-admin-users-page',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './admin-users.page.html',
  styleUrl: './admin-users.page.scss'
})
export class AdminUsersPage implements OnInit, OnDestroy {
  private readonly userService = inject(UserService);
  private readonly toast        = inject(ToastService);
  private readonly router       = inject(Router);
  private readonly destroy$     = new Subject<void>();

  // ── State ────────────────────────────────────────────────────────
  allUsers      = signal<AdminUser[]>([]);
  searchResults = signal<UserSearchResult[]>([]);
  loading       = signal(true);
  searching     = signal(false);
  isSearchMode  = signal(false);
  error         = signal('');

  // ── Search form (email only) ─────────────────────────────────────
  searchForm = new FormGroup({
    email: new FormControl(''),
  });


  ngOnInit(): void {
    this.loadUsers();
    this.listenToSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Load all users (initial load) ───────────────────────────────
  loadUsers(): void {
    this.loading.set(true);
    this.error.set('');
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        this.allUsers.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load users. Please try again.');
        this.loading.set(false);
      }
    });
  }

  // ── Reactive search ──────────────────────────────────────────────
  private listenToSearch(): void {
    this.searchForm.valueChanges.pipe(
      debounceTime(350),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      switchMap((values) => {
        const email = values.email?.trim() ?? '';

        if (email === '') {
          this.isSearchMode.set(false);
          this.searching.set(false);
          this.searchResults.set([]);
          return [];
        }

        this.isSearchMode.set(true);
        this.searching.set(true);
        return this.userService.searchUsers({ email });
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (results) => {
        if (Array.isArray(results)) {
          this.searchResults.set(results);
        }
        this.searching.set(false);
      },
      error: () => {
        this.toast.show('Search error', 'Failed to search users. Please try again.');
        this.searching.set(false);
      }
    });
  }

  // ── Reset search ─────────────────────────────────────────────────
  resetSearch(): void {
    this.searchForm.reset({ email: '' });
    this.isSearchMode.set(false);
    this.searchResults.set([]);
  }

  get displayedUsers(): AdminUser[] | UserSearchResult[] {
    return this.isSearchMode() ? this.searchResults() : this.allUsers();
  }

  // ── Navigation ───────────────────────────────────────────────────
  viewUser(id: number): void {
    void this.router.navigate(['/admin/users', id]);
  }

  editUser(id: number): void {
    void this.router.navigate(['/admin/users', id, 'edit']);
  }

  // ── Delete (only in full list mode, admin users have id) ─────────
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
        this.allUsers.update((list) => list.filter((u) => u.id !== user.id));
        this.toast.show('User deleted', `${user.firstName} ${user.lastName} has been removed.`);
      },
      error: (err) => {
        const msg = err.error?.message || 'Failed to delete user.';
        this.toast.show('Error', msg);
      }
    });
  }

  isAdminUser(user: AdminUser | UserSearchResult): user is AdminUser {
    return 'id' in user;
  }
}
