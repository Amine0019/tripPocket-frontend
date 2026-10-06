import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="empty">
      <h3>{{ title }}</h3>
      <p>{{ message }}</p>
      <ng-content />
    </div>
  `,
  styles: [`
    .empty { text-align: center; padding: 48px 16px; color: var(--muted); }
    h3 { color: var(--ink); margin: 0 0 8px; }
  `]
})
export class EmptyStateComponent {
  @Input() title = 'Nothing here yet';
  @Input() message = 'When you add trips, they will appear in this view.';
}
