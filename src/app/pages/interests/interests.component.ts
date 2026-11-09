import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { InterestService } from '../../core/services/interest.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { AppError } from '../../core/models/app-error';
import { RequestState } from '../../core/models/request-state';
import { LoadingStateComponent } from '../../shared/components/states/loading-state.component';
import { ErrorStateComponent } from '../../shared/components/states/error-state.component';

/**
 * The interest picker.
 *
 * One component serves two entry points: the step shown immediately after
 * registration (`/interests?onboarding=1`) and the editable page reached later
 * from the logged-in navbar. The only difference is the secondary button -
 * "Skip for now" during onboarding, "Back" afterwards - and where save()
 * leaves the user.
 *
 * The step is always skippable. Skipping makes no HTTP call at all, so a
 * customer who skips stores no interests and the recommendation chain behaves
 * exactly as it does today.
 */
@Component({
  selector: 'app-interests',
  standalone: true,
  imports: [CommonModule, LoadingStateComponent, ErrorStateComponent],
  templateUrl: './interests.component.html',
  styleUrls: ['./interests.component.scss'],
})
export class InterestsComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly interestService = inject(InterestService);
  private readonly auth = inject(AuthService);
  private readonly toasts = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /** The category list to choose from. Never fails hard: the service falls back. */
  readonly state = new RequestState<string[]>([]);

  readonly selected = signal<Set<string>>(new Set<string>());
  readonly saving = signal(false);

  /** True only for the post-registration visit. */
  readonly onboarding = this.route.snapshot.queryParamMap.get('onboarding') === '1';

  ngOnInit(): void {
    this.load();
  }

  get categories(): string[] {
    return this.state.data ?? [];
  }

  get selectedCount(): number {
    return this.selected().size;
  }

  load(): void {
    this.state.begin();
    this.productService.getCategories().subscribe({
      next: (list) => this.state.succeed(list),
      error: (err) => this.state.fail(err),
    });

    // Loaded in onboarding mode as well, so the same component can be reached
    // twice without silently wiping a selection the customer already made.
    this.interestService.getInterests(this.auth.getCustomerId()).subscribe({
      next: (list) => this.selected.set(new Set(list)),
      // A customer with nothing stored yet is the normal case on this page, so
      // a failed read must not block the picker.
      error: () => this.selected.set(new Set<string>()),
    });
  }

  isSelected(category: string): boolean {
    return this.selected().has(category);
  }

  toggle(category: string): void {
    this.selected.update((current) => {
      const next = new Set(current);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }

  save(): void {
    if (this.saving()) return;
    this.saving.set(true);

    this.interestService
      .saveInterests(this.auth.getCustomerId(), [...this.selected()])
      .subscribe({
        next: (stored) => {
          // Show the normalised list the server actually kept.
          this.selected.set(new Set(stored));
          this.saving.set(false);
          this.toasts.success(
            stored.length
              ? 'We will use these to pick what we show you.'
              : 'Your interests have been cleared.',
            'Interests saved'
          );
          if (this.onboarding) this.router.navigate(['/']);
        },
        error: (err: AppError) => {
          this.saving.set(false);
          this.toasts.error(err.message, 'Could not save your interests');
        },
      });
  }

  /** Onboarding only. Leaves without storing anything - no request is sent. */
  skip(): void {
    this.router.navigate(['/']);
  }

  back(): void {
    this.router.navigate(['/']);
  }
}
