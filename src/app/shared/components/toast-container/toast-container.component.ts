import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Toast, ToastKind, ToastService } from '../../../core/services/toast.service';

const ICONS: Record<ToastKind, string> = {
  success: 'bi-check-circle-fill',
  error: 'bi-exclamation-octagon-fill',
  warning: 'bi-exclamation-triangle-fill',
  info: 'bi-info-circle-fill',
};

/**
 * Renders the toast stack. Mounted once in the app shell.
 *
 * `aria-live="assertive"` on the region means messages are announced as they
 * appear, which matters because a toast disappears on its own.
 */
@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-region" aria-live="assertive" aria-atomic="true">
      @for (toast of toasts$ | async; track toast.id) {
        <div class="toast-item" [class]="'toast-' + toast.kind" role="alert">
          <i class="bi {{ icon(toast) }} toast-icon" aria-hidden="true"></i>
          <div class="toast-text">
            @if (toast.title) {
              <strong class="d-block">{{ toast.title }}</strong>
            }
            <span>{{ toast.message }}</span>
          </div>
          <button
            type="button"
            class="toast-close"
            aria-label="Dismiss notification"
            (click)="toasts.dismiss(toast.id)"
          >
            <i class="bi bi-x-lg" aria-hidden="true"></i>
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .toast-region {
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 1080;
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
        max-width: min(24rem, calc(100vw - 2rem));
        pointer-events: none;
      }
      .toast-item {
        pointer-events: auto;
        display: flex;
        align-items: flex-start;
        gap: 0.65rem;
        padding: 0.8rem 0.9rem;
        border-radius: 12px;
        background: #fff;
        border: 1px solid #e5e7eb;
        border-left-width: 4px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        font-size: 0.875rem;
        animation: toast-in 0.18s ease-out;
      }
      .toast-icon {
        font-size: 1.05rem;
        line-height: 1.35;
      }
      .toast-text {
        flex: 1 1 auto;
        line-height: 1.35;
      }
      .toast-close {
        border: 0;
        background: transparent;
        color: #9ca3af;
        padding: 0;
        font-size: 0.75rem;
        line-height: 1;
        cursor: pointer;
      }
      .toast-close:hover {
        color: #4b5563;
      }
      .toast-success {
        border-left-color: #10b981;
      }
      .toast-success .toast-icon {
        color: #10b981;
      }
      .toast-error {
        border-left-color: #ef4444;
      }
      .toast-error .toast-icon {
        color: #ef4444;
      }
      .toast-warning {
        border-left-color: #f59e0b;
      }
      .toast-warning .toast-icon {
        color: #f59e0b;
      }
      .toast-info {
        border-left-color: #6366f1;
      }
      .toast-info .toast-icon {
        color: #6366f1;
      }
      @keyframes toast-in {
        from {
          opacity: 0;
          transform: translateY(-6px);
        }
        to {
          opacity: 1;
          transform: none;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .toast-item {
          animation: none;
        }
      }
    `,
  ],
})
export class ToastContainerComponent {
  readonly toasts = inject(ToastService);
  readonly toasts$ = this.toasts.toasts$;

  icon(toast: Toast): string {
    return ICONS[toast.kind];
  }
}
