import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * Loaded successfully, but there is nothing to show.
 *
 * Kept separate from the error state on purpose: an empty catalogue is not a
 * failure, and telling the user "something went wrong" when the real answer is
 * "no results matched your filter" sends them looking for a problem that does
 * not exist.
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="empty-state text-center py-5">
      <i class="bi {{ icon }} empty-icon" aria-hidden="true"></i>
      <h5 class="fw-bold mt-3 mb-2">{{ title }}</h5>
      @if (message) {
        <p class="text-muted mb-4 mx-auto empty-message">{{ message }}</p>
      }
      @if (actionLabel) {
        <button type="button" class="btn btn-outline-primary px-4" (click)="action.emit()">
          {{ actionLabel }}
        </button>
      }
    </div>
  `,
  styles: [
    `
      .empty-icon {
        font-size: 2.75rem;
        color: #cbd5e1;
      }
      .empty-message {
        max-width: 26rem;
      }
    `,
  ],
})
export class EmptyStateComponent {
  @Input() icon = 'bi-inbox';
  @Input() title = 'Nothing here yet';
  @Input() message = '';
  /** Omit to render no button. */
  @Input() actionLabel = '';
  @Output() action = new EventEmitter<void>();
}
