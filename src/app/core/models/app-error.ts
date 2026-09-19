/**
 * A normalised, user-presentable failure.
 *
 * Every HTTP failure in the app is converted into one of these by
 * `toAppError()` so that components never have to poke at
 * `HttpErrorResponse` shapes or invent their own wording.
 */
export type ErrorKind =
  | 'offline'     // the browser reports no network
  | 'unreachable' // network is up but the service did not answer (status 0 / CORS)
  | 'timeout'     // request exceeded the client timeout, or 408 / 429
  | 'auth'        // 401 - not signed in, or the token expired
  | 'forbidden'   // 403 - signed in but not allowed
  | 'notFound'    // 404
  | 'conflict'    // 409 - e.g. email already registered, illegal status change
  | 'validation'  // 400 / 422 - the request itself was rejected
  | 'server'      // 5xx
  | 'unknown';

export interface AppError {
  kind: ErrorKind;
  /** Short heading, suitable for an error panel. */
  title: string;
  /** One sentence the user can act on. */
  message: string;
  /** HTTP status where there was one. */
  status: number | null;
  /** Whether offering a Retry button makes sense. */
  retryable: boolean;
  /** Raw detail for the console - never rendered to the user. */
  technical?: string;
}

/** Type guard so the interceptor and components can detect an already-mapped error. */
export function isAppError(value: unknown): value is AppError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'kind' in value &&
    'message' in value &&
    'retryable' in value
  );
}
