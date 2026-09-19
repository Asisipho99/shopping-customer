import { AppError } from './app-error';
import { toAppError } from '../errors/error-mapper';

export type RequestStatus = 'idle' | 'loading' | 'refreshing' | 'ready' | 'failed';

/**
 * Holds the state of a single asynchronous read.
 *
 * This replaces the `loading` / `loadingMore` / `error` boolean trios that were
 * scattered through the page components. Those were easy to get out of step -
 * the products page, for example, never reset `loadingMore` when a page failed
 * to load, which left the Load More button disabled for good. Because status
 * here is a single value, it cannot be in two states at once.
 *
 * `loading` means "first load, nothing on screen yet" and should show a
 * skeleton. `refreshing` means "we already have data and are fetching more or
 * re-fetching" and should leave the existing data visible.
 */
export class RequestState<T> {
  status: RequestStatus = 'idle';
  data: T | null = null;
  error: AppError | null = null;

  constructor(initial: T | null = null) {
    this.data = initial;
  }

  /** First load: nothing to show yet. */
  begin(): void {
    this.status = 'loading';
    this.error = null;
  }

  /** Subsequent load: keep showing what we already have. */
  beginRefresh(): void {
    this.status = 'refreshing';
    this.error = null;
  }

  succeed(data: T): void {
    this.data = data;
    this.error = null;
    this.status = 'ready';
  }

  fail(err: unknown): AppError {
    this.error = toAppError(err);
    this.status = 'failed';
    return this.error;
  }

  reset(): void {
    this.status = 'idle';
    this.data = null;
    this.error = null;
  }

  // Template helpers ------------------------------------------------------

  get isLoading(): boolean {
    return this.status === 'loading';
  }

  get isRefreshing(): boolean {
    return this.status === 'refreshing';
  }

  /** True while any request is in flight. Use to disable buttons. */
  get isBusy(): boolean {
    return this.status === 'loading' || this.status === 'refreshing';
  }

  get isFailed(): boolean {
    return this.status === 'failed';
  }

  get isReady(): boolean {
    return this.status === 'ready';
  }

  /** A failure with nothing already on screen - show a full error panel. */
  get isBlockingFailure(): boolean {
    return this.status === 'failed' && !this.hasData;
  }

  /** A failure while data was already visible - show an inline notice instead. */
  get isPartialFailure(): boolean {
    return this.status === 'failed' && this.hasData;
  }

  get hasData(): boolean {
    if (this.data === null || this.data === undefined) return false;
    if (Array.isArray(this.data)) return this.data.length > 0;
    return true;
  }

  /** Loaded successfully but there is genuinely nothing to show. */
  get isEmpty(): boolean {
    return this.status === 'ready' && !this.hasData;
  }
}
