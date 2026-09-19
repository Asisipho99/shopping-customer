import { Component, Input } from '@angular/core';

/**
 * Placeholder cards shaped like the real product cards.
 *
 * Preferred over a bare spinner for grids: the layout does not jump when the
 * data arrives, and the user can see roughly what is coming. The wrapper
 * carries `aria-busy` and a hidden status line so assistive technology is told
 * something is loading rather than being read an empty grid.
 *
 * `colClass` defaults to the products grid; the home page passes its own.
 */
@Component({
  selector: 'app-skeleton-grid',
  standalone: true,
  template: `
    <div class="row g-3" aria-busy="true" role="status">
      <span class="visually-hidden">{{ message }}</span>
      @for (cell of cells; track cell) {
        <div [class]="colClass">
          <div class="sk-card">
            <div class="sk sk-img"></div>
            <div class="sk-body">
              <div class="sk sk-line w-75"></div>
              <div class="sk sk-line w-50"></div>
              <div class="sk sk-line sk-line-sm w-100"></div>
              <div class="sk sk-btn"></div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .sk-card {
        border: 1px solid #e5e7eb;
        border-radius: 14px;
        overflow: hidden;
        background: #fff;
      }
      .sk-body {
        padding: 0.85rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .sk {
        background: linear-gradient(90deg, #eef1f5 25%, #e2e7ee 37%, #eef1f5 63%);
        background-size: 400% 100%;
        animation: sk-shimmer 1.3s ease-in-out infinite;
        border-radius: 6px;
      }
      .sk-img {
        height: 150px;
        border-radius: 0;
      }
      .sk-line {
        height: 0.7rem;
      }
      .sk-line-sm {
        height: 0.55rem;
      }
      .sk-btn {
        height: 1.9rem;
        margin-top: 0.35rem;
        border-radius: 8px;
      }
      @keyframes sk-shimmer {
        0% {
          background-position: 100% 50%;
        }
        100% {
          background-position: 0 50%;
        }
      }
      /* Respect users who have asked for reduced motion. */
      @media (prefers-reduced-motion: reduce) {
        .sk {
          animation: none;
        }
      }
    `,
  ],
})
export class SkeletonGridComponent {
  @Input() count = 8;
  @Input() colClass = 'col-6 col-md-4 col-lg-3';
  @Input() message = 'Loading products...';

  get cells(): number[] {
    return Array.from({ length: this.count }, (_, i) => i);
  }
}
