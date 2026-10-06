import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import { TravelStore } from '../../core/services/travel.store';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

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

  readonly user = this.store.user;
  draft = { ...this.store.user() };

  save(): void {
    this.store.updateUser({
      ...this.draft,
      avatarInitials: `${this.draft.firstName[0] ?? ''}${this.draft.lastName[0] ?? ''}`.toUpperCase()
    });
    this.toast.show('Profile saved', 'Your traveler details were updated.');
  }

  logout(): void {
    this.store.logout();
    this.toast.show('Signed out', 'Come back when you are ready to travel.');
    void this.router.navigate(['/login']);
  }
}
