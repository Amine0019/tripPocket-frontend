import { Directive, ElementRef, HostListener, Input, inject } from '@angular/core';

/**
 * <img [src]="tripCover" [appImgFallback]="typePhoto">
 * Swaps the image for the fallback photo when it cannot be loaded (for example a trip
 * without cover image: the backend answers 404). Used by the Reservation pages.
 */
@Directive({
  selector: 'img[appImgFallback]',
  standalone: true
})
export class ImgFallbackDirective {
  private readonly element = inject<ElementRef<HTMLImageElement>>(ElementRef);

  @Input({ required: true }) appImgFallback!: string;

  @HostListener('error')
  onError(): void {
    const img = this.element.nativeElement;
    // only once: if the fallback itself fails, the browser keeps its broken-image icon
    if (this.appImgFallback && img.src !== this.appImgFallback) {
      img.src = this.appImgFallback;
    }
  }
}
