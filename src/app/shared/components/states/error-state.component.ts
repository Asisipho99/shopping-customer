import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AppError, ErrorKind } from '../../../core/models/app-error';

const ICONS: Record<ErrorKind, string> = {
  offline: 'bi-wifi-off',
  unreachable: 'bi-plug',
  timeout: 'bi-hourglass-split',
  auth: 'bi-person-lock',
  forbidden: 'bi-shield-lock',
  notFound: 'bi-search',
  conflict: 'bi-exclamation-diamond',
  validation: 'bi-exclamation-circle',
  server: 'bi-cloud-slash',
  unknown: 'bi-exclamation-triangle',
};

/**
 * Full-panel failure state for when a page has nothing to show.
 *
 * Offers Retry only when the underlying failure is actually retryable - there
 * is no point inviting the user to retry a 404.
 */
@Component({
  selector: 'app-error-state',
  standalone: true,
  template: `
    <div class="error-state text-center py-5" role="alert">
      <i class="bi {{ icon }} error-icon" aria-hidden="true"></i>
      <h5 class="fw-bold mt-3 mb-2">{{ error.title }}</h5>
      <p class="text-muted mb-4 mx-auto error-message">{{ error.message }}</p>

      @if (error.retryable && showRetry) {
        <button type="button" class="btn btn-primary px-4" (click)="retry.emit()" [disabled]="busy">
          @if (busy) {
            <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
            Retrying...
          } @else {
            <i class="bi bi-arrow-clockwise me-2" aria-hidden="true"></i>
            Try again
          }
        </button>
      }
    </div>
  `,
  styles: [
    `
      .error-icon {
        font-size: 2.75rem;
        color: #9ca3af;
      }
      .error-message {
        max-width: 26rem;
      }
    `,
  ],
})
export class ErrorStateComponent {
  @Input({ required: true }) error!: AppError;
  @Input() showRetry = true;
  /** Disables the button and shows a spinner while the retry is in flight. */
  @Input() busy = false;
  @Output() retry = new EventEmitter<void>();

  get icon(): string {
    return ICONS[this.error?.kind] ?? ICONS.unknown;
  }
}
