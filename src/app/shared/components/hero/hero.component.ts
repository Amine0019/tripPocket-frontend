import { isPlatformBrowser } from '@angular/common';
import { Component, DestroyRef, EventEmitter, inject, Input, OnInit, Output, PLATFORM_ID, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { animationFrameScheduler, auditTime, fromEvent } from 'rxjs';
import { SearchQuery } from '../../../core/models/models';
import { SearchBarComponent } from '../search-bar/search-bar.component';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [SearchBarComponent],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss'
})
export class HeroComponent implements OnInit {
  @Input() image = '';
  @Input() query: SearchQuery = {
    destination: '',
    dates: 'May 18 – May 25',
    travelers: 2,
    budget: '$500 – $2,000'
  };
  @Output() search = new EventEmitter<SearchQuery>();

  readonly parallaxOffset = signal(0);

  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    this.parallaxOffset.set(window.scrollY);
    fromEvent(window, 'scroll', { passive: true })
      .pipe(auditTime(0, animationFrameScheduler), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.parallaxOffset.set(window.scrollY));
  }
}
