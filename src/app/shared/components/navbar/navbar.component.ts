import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TravelStore } from '../../../core/services/travel.store';
import { TokenService } from '../../../core/services/token.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  private readonly store = inject(TravelStore);
  private readonly tokenService = inject(TokenService);
  private readonly router = inject(Router);

  readonly menuOpen = signal(false);
  readonly searchOpen = signal(false);
  readonly userMenu = signal(false);
  readonly user = this.store.user;
  readonly unread = computed(() => this.store.unreadCount());
  searchTerm = '';

  readonly links = [
    { path: '/', label: 'Home', exact: true },
    { path: '/trips', label: 'Explore trips', exact: false },
    { path: '/activities', label: 'Activities', exact: false },
    { path: '/my-trips', label: 'My trips', exact: false },
    { path: '/reservations', label: 'Reservations', exact: false },
    { path: '/expenses', label: 'Expenses', exact: false }
  ];

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  close(): void {
    this.menuOpen.set(false);
    this.searchOpen.set(false);
    this.userMenu.set(false);
  }

  logout(): void {
    this.close();
    this.tokenService.clearTokens();
    this.store.logout();
    void this.router.navigate(['/login']);
  }

  submitSearch(): void {
    this.store.lastSearch.update((query) => ({ ...query, destination: this.searchTerm }));
    this.searchOpen.set(false);
    this.router.navigate(['/trips'], { queryParams: { q: this.searchTerm || null } });
  }
}
