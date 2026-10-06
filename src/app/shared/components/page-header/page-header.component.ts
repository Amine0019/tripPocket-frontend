import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  template: `
    <header class="head">
      @if (eyebrow) { <p class="eyebrow">{{ eyebrow }}</p> }
      <div class="row">
        <div>
          <h1 class="display">{{ title }}</h1>
          @if (subtitle) { <p class="muted">{{ subtitle }}</p> }
        </div>
        <ng-content />
      </div>
    </header>
  `,
  styles: [`
    .head { margin-bottom: 28px; }
    .display { font-size: clamp(36px, 5vw, 52px); }
    .row { display: flex; justify-content: space-between; gap: 16px; align-items: flex-end; flex-wrap: wrap; }
    .muted { margin: 8px 0 0; }
  `]
})
export class PageHeaderComponent {
  @Input() eyebrow = '';
  @Input() title = '';
  @Input() subtitle = '';
}
