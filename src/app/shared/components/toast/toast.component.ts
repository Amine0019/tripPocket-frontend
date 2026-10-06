import { Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    @if (toast.toast(); as t) {
      <aside>
        <span>✓</span>
        <div>
          <strong>{{ t.title }}</strong>
          <p>{{ t.body }}</p>
        </div>
        <button type="button" (click)="toast.dismiss()">×</button>
      </aside>
    }
  `,
  styles: [`
    aside {
      position: fixed; right: 24px; bottom: 24px; z-index: 80;
      display: grid; grid-template-columns: 36px 1fr auto; gap: 10px; align-items: center;
      background: #12333b; color: #fff; border-radius: 16px; padding: 14px 16px; min-width: 280px;
      box-shadow: var(--shadow); animation: up .25s ease;
    }
    span { width: 28px; height: 28px; border-radius: 50%; background: var(--teal); display: grid; place-items: center; }
    p { margin: 2px 0 0; color: #c5d4d8; font-size: 13px; }
    button { background: none; border: 0; color: #fff; font-size: 20px; }
    @keyframes up { from { transform: translateY(12px); opacity: 0; } to { transform: none; opacity: 1; } }
  `]
})
export class ToastComponent {
  readonly toast = inject(ToastService);
}
