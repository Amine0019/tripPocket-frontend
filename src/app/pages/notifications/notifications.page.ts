import { Component, computed, inject, signal } from '@angular/core';
import { TravelStore } from '../../core/services/travel.store';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { NotificationItemComponent } from '../../shared/components/notification-item/notification-item.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [PageHeaderComponent, NotificationItemComponent, EmptyStateComponent],
  templateUrl: './notifications.page.html',
  styleUrl: './notifications.page.scss'
})
export class NotificationsPage {
  private readonly store = inject(TravelStore);
  readonly onlyUnread = signal(false);
  readonly items = computed(() => {
    const list = this.store.notifications();
    return this.onlyUnread() ? list.filter((item) => !item.read) : list;
  });
  readonly unread = computed(() => this.store.unreadCount());

  mark(id: string): void {
    this.store.markNotificationRead(id);
  }

  markAll(): void {
    this.store.markAllNotificationsRead();
  }
}
