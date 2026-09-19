import { Injectable, signal } from '@angular/core';
import { AppError } from '../models/app-error';

export type ToastKind = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  title?: string;
  message: string;
}

/** How long each kind stays on screen. Errors linger; confirmations do not. */
const DURATION: Record<ToastKind, number> = {
  success: 2600,
  info: 3200,
  warning: 5000,
  error: 6500,
};

/**
 * Transient, non-blocking feedback.
 *
 * Used for things that happen *as a result of an action* - "Added to cart",
 * "Order placed", "Your session expired". Failures that block a whole page
 * are not toasts; those render an inline error panel with a Retry button so
 * the user is not left staring at an empty screen.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;

  /**
   * A signal rather than a subject, because auto-dismiss fires from a timer.
   * Under zoneless change detection a timer callback notifies Angular of
   * nothing, so a subject-backed list would leave dismissed toasts painted on
   * screen until the user happened to click something.
   */
  private readonly _toasts = signal<Toast[]>([]);

  readonly toasts = this._toasts.asReadonly();

  success(message: string, title?: string): void {
    this.push('success', message, title);
  }

  error(message: string, title?: string): void {
    this.push('error', message, title);
  }

  warning(message: string, title?: string): void {
    this.push('warning', message, title);
  }

  info(message: string, title?: string): void {
    this.push('info', message, title);
  }

  /** Surface an already-mapped failure without re-wording it. */
  fromError(error: AppError): void {
    this.push('error', error.message, error.title);
  }

  dismiss(id: number): void {
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }

  clear(): void {
    this._toasts.set([]);
  }

  private push(kind: ToastKind, message: string, title?: string): void {
    // Guard against the same message stacking up, which happened when several
    // parallel requests failed for one underlying cause (e.g. the API is down).
    if (this._toasts().some((t) => t.message === message && t.kind === kind)) return;

    const toast: Toast = { id: this.nextId++, kind, message, title };
    this._toasts.update((list) => [...list, toast]);

    setTimeout(() => this.dismiss(toast.id), DURATION[kind]);
  }
}
