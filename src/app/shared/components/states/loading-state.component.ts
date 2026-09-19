import { Component, Input } from '@angular/core';

/**
 * Spinner plus message for a first load.
 *
 * `role="status"` with `aria-live="polite"` means a screen reader announces
 * that loading started and, later, that it finished - the previous inline
 * spinners were invisible to assistive technology.
 */
@Component({
  selector: 'app-loading-state',
  standalone: true,
  template: `
    <div class="loading-state text-center py-5" role="status" aria-live="polite">
      <div class="spinner-border text-primary" [style.width.rem]="size" [style.height.rem]="size">
        <span class="visually-hidden">Loading</span>
      </div>
      <p class="text-muted mt-3 mb-0">{{ message }}</p>
      @if (hint) {
        <p class="text-muted small mt-1 mb-0">{{ hint }}</p>
      }
    </div>
  `,
  styles: [
    `
      .loading-state {
        min-height: 180px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
    `,
  ],
})
export class LoadingStateComponent {
  @Input() message = 'Loading...';
  /** Shown under the message, e.g. to explain a slow cold start. */
  @Input() hint = '';
  @Input() size = 2.5;
}
