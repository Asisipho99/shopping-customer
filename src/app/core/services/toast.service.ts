import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
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
  private readonly subject = new BehaviorSubject<Toast[]>([]);

  readonly toasts$ = this.subject.asObservable();

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
    this.subject.next(this.subject.value.filter((t) => t.id !== id));
  }

  clear(): void {
    this.subject.next([]);
  }

  private push(kind: ToastKind, message: string, title?: string): void {
    const current = this.subject.value;

    // Guard against the same message stacking up, which happened when several
    // parallel requests failed for one underlying cause (e.g. the API is down).
    if (current.some((t) => t.message === message && t.kind === kind)) return;

    const toast: Toast = { id: this.nextId++, kind, message, title };
    this.subject.next([...current, toast]);

    setTimeout(() => this.dismiss(toast.id), DURATION[kind]);
  }
}
