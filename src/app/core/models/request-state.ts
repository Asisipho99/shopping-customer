import { signal } from '@angular/core';
import { AppError } from './app-error';
import { toAppError } from '../errors/error-mapper';

export type RequestStatus = 'idle' | 'loading' | 'refreshing' | 'ready' | 'failed';

/**
 * Holds the state of a single asynchronous read.
 *
 * Backed by signals, which is what makes it work at all in this app: Angular 21
 * is zoneless, so assigning a plain class field from an HTTP callback notifies
 * the framework of nothing and the view never repaints. Writing a signal does
 * notify it. The getters below read those signals, so simply reading
 * `state.isLoading` in a template registers the dependency and the view updates
 * when the request settles.
 *
 * It also replaces the `loading` / `loadingMore` / `error` boolean trios that
 * were scattered through the page components and easy to get out of step - the
 * products page never reset `loadingMore` when a page failed, which left the
 * Load More button disabled for good. Status is a single value here, so it
 * cannot be in two states at once.
 *
 * `loading` means "first load, nothing on screen yet" and should show a
 * skeleton. `refreshing` means "we already have data and are fetching more or
 * re-fetching" and should leave the existing data visible.
 */
export class RequestState<T> {
  private readonly _status = signal<RequestStatus>('idle');
  private readonly _data = signal<T | null>(null);
  private readonly _error = signal<AppError | null>(null);

  constructor(initial: T | null = null) {
    this._data.set(initial);
  }

  // Reading state ---------------------------------------------------------

  get status(): RequestStatus {
    return this._status();
  }

  get data(): T | null {
    return this._data();
  }

  get error(): AppError | null {
    return this._error();
  }

  // Transitions -----------------------------------------------------------

  /** First load: nothing to show yet. */
  begin(): void {
    this._error.set(null);
    this._status.set('loading');
  }

  /** Subsequent load: keep showing what we already have. */
  beginRefresh(): void {
    this._error.set(null);
    this._status.set('refreshing');
  }

  succeed(data: T): void {
    this._data.set(data);
    this._error.set(null);
    this._status.set('ready');
  }

  fail(err: unknown): AppError {
    const mapped = toAppError(err);
    this._error.set(mapped);
    this._status.set('failed');
    return mapped;
  }

  reset(initial: T | null = null): void {
    this._data.set(initial);
    this._error.set(null);
    this._status.set('idle');
  }

  // Template helpers ------------------------------------------------------

  get isLoading(): boolean {
    return this._status() === 'loading';
  }

  get isRefreshing(): boolean {
    return this._status() === 'refreshing';
  }

  /** True while any request is in flight. Use to disable buttons. */
  get isBusy(): boolean {
    const s = this._status();
    return s === 'loading' || s === 'refreshing';
  }

  get isFailed(): boolean {
    return this._status() === 'failed';
  }

  get isReady(): boolean {
    return this._status() === 'ready';
  }

  /** A failure with nothing already on screen - show a full error panel. */
  get isBlockingFailure(): boolean {
    return this._status() === 'failed' && !this.hasData;
  }

  /** A failure while data was already visible - show an inline notice instead. */
  get isPartialFailure(): boolean {
    return this._status() === 'failed' && this.hasData;
  }

  get hasData(): boolean {
    const value = this._data();
    if (value === null || value === undefined) return false;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  }

  /** Loaded successfully but there is genuinely nothing to show. */
  get isEmpty(): boolean {
    return this._status() === 'ready' && !this.hasData;
  }
}
