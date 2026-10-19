import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TripService } from '../../../core/services/trip.service';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.page.html',
  styleUrl: './admin-dashboard.page.scss'
})
export class AdminDashboardPage implements OnInit {
  private readonly tripService = inject(TripService);
  private readonly userService = inject(UserService);

  tripsCount = signal<number | null>(null);
  usersCount = signal<number | null>(null);
  loading = signal<boolean>(true);

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading.set(true);

    this.tripService.getAllTrips().subscribe({
      next: (trips) => {
        this.tripsCount.set(trips.length);
      },
      error: () => {
        this.tripsCount.set(0);
      }
    });

    this.userService.getAllUsers(0, 1).subscribe({
      next: (res) => {
        this.usersCount.set(res.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.usersCount.set(0);
        this.loading.set(false);
      }
    });
  }
}
