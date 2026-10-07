import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { FooterComponent } from './shared/components/footer/footer.component';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { ToastComponent } from './shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private readonly router = inject(Router);

  readonly showNavbar = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => !this.isAuthRoute((event as NavigationEnd).urlAfterRedirects)),
      startWith(!this.isAuthRoute(this.router.url))
    ),
    { initialValue: !this.isAuthRoute(this.router.url) }
  );

  private isAuthRoute(url: string): boolean {
    const path = url.split('?')[0];
    return path === '/login' || path === '/register';
  }
}
