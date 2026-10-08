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
  allUsers         = signal<AdminUser[]>([]);
  searchResults    = signal<UserSearchResult[]>([]);
  loading          = signal(true);
  searching        = signal(false);
  isSearchMode     = signal(false);
  activeRoleFilter = signal<'TRAVELER' | 'ADMIN' | null>(null);
  error            = signal('');

  // ── Pagination State ─────────────────────────────────────────────
  currentPage      = signal<number>(0);
  pageSize         = signal<number>(10);
  totalPages       = signal<number>(0);
  totalElements    = signal<number>(0);
  isFirstPage      = signal<boolean>(true);
  isLastPage       = signal<boolean>(true);
  readonly pageSizeOptions = [5, 10, 20, 50];

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

  // ── Load users (paginated) ───────────────────────────────────────
  loadUsers(page: number = this.currentPage(), size: number = this.pageSize()): void {
    this.loading.set(true);
    this.error.set('');
    this.userService.getAllUsers(page, size).subscribe({
      next: (response) => {
        this.allUsers.set(response.content);
        this.currentPage.set(response.pageNumber);
        this.pageSize.set(response.pageSize);
        this.totalPages.set(response.totalPages);
        this.totalElements.set(response.totalElements);
        this.isFirstPage.set(response.first);
        this.isLastPage.set(response.last);
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

  // ── Role filter ──────────────────────────────────────────
  filterByRole(role: 'TRAVELER' | 'ADMIN'): void {
    // Toggle: clicking the active filter clears it
    if (this.activeRoleFilter() === role) {
      this.activeRoleFilter.set(null);
      this.isSearchMode.set(false);
      this.searchResults.set([]);
      return;
    }

    this.activeRoleFilter.set(role);
    this.isSearchMode.set(true);
    this.searching.set(true);
    // Reset email search when switching to role filter
    this.searchForm.reset({ email: '' }, { emitEvent: false });

    this.userService.getUsersByRole(role).subscribe({
      next: (results) => {
        this.searchResults.set(results);
        this.searching.set(false);
      },
      error: () => {
        this.toast.show('Filter error', 'Failed to filter users by role.');
        this.searching.set(false);
      }
    });
  }

  clearAllFilters(): void {
    this.activeRoleFilter.set(null);
    this.isSearchMode.set(false);
    this.searchResults.set([]);
    this.searchForm.reset({ email: '' }, { emitEvent: false });
  }

  // ── Pagination Navigation ──────────────────────────────────────
  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages() && page !== this.currentPage()) {
      this.loadUsers(page, this.pageSize());
    }
  }

  prevPage(): void {
    if (!this.isFirstPage()) {
      this.goToPage(this.currentPage() - 1);
    }
  }

  nextPage(): void {
    if (!this.isLastPage()) {
      this.goToPage(this.currentPage() + 1);
    }
  }

  changePageSize(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newSize = Number(target.value);
    if (!isNaN(newSize) && newSize > 0) {
      this.pageSize.set(newSize);
      this.loadUsers(0, newSize);
    }
  }

  get pageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    if (total <= 1) return [0];

    const delta = 2;
    const range: number[] = [];
    for (let i = Math.max(0, current - delta); i <= Math.min(total - 1, current + delta); i++) {
      range.push(i);
    }
    return range;
  }

  get showingRange(): { start: number; end: number } {
    const total = this.totalElements();
    if (total === 0) return { start: 0, end: 0 };
    const start = this.currentPage() * this.pageSize() + 1;
    const end = Math.min((this.currentPage() + 1) * this.pageSize(), total);
    return { start, end };
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
        this.toast.show('User deleted', `${user.firstName} ${user.lastName} has been removed.`);
        // Reload current page or previous page if last element was deleted
        const targetPage = this.allUsers().length === 1 && this.currentPage() > 0
          ? this.currentPage() - 1
          : this.currentPage();
        this.loadUsers(targetPage, this.pageSize());
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
