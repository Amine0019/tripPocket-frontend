import { Component } from '@angular/core';

@Component({
  selector: 'app-loading',
  standalone: true,
  template: `<div class="spin" aria-label="Loading"></div>`,
  styles: [`
    .spin { width: 36px; height: 36px; border-radius: 50%; border: 3px solid #e6eeec; border-top-color: var(--teal); animation: r .8s linear infinite; margin: 40px auto; }
    @keyframes r { to { transform: rotate(360deg); } }
  `]
})
export class LoadingComponent {}
