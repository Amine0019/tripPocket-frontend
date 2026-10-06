import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  title: string;
  body: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toast = signal<ToastMessage | null>(null);
  private timer: ReturnType<typeof setTimeout> | null = null;

  show(title: string, body: string): void {
    this.toast.set({ title, body });
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => this.toast.set(null), 5200);
  }

  dismiss(): void {
    this.toast.set(null);
  }
}
