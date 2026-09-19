import { HttpErrorResponse } from '@angular/common/http';
import { AppError, ErrorKind, isAppError } from '../models/app-error';

/**
 * The backend services do not agree on an error envelope, so we probe the
 * three shapes actually in use:
 *
 *   Java services      { status, error, message, path, timestamp }
 *   Camel integration  { error, cause }
 *   Flask AI service   { success: false, error }
 *
 * Some endpoints (forgot-password, reset-password) are requested with
 * responseType 'text', so the body can also be a bare string.
 */
export function extractServerMessage(body: unknown): string | null {
  if (!body) return null;

  if (typeof body === 'string') {
    const trimmed = body.trim();
    if (!trimmed) return null;
    // A stray HTML error page is not worth showing to a user.
    if (trimmed.startsWith('<')) return null;
    // It may be a JSON string that Angular did not parse (responseType: 'text').
    try {
      return extractServerMessage(JSON.parse(trimmed));
    } catch {
      return trimmed;
    }
  }

  if (typeof body === 'object') {
    const b = body as Record<string, unknown>;
    if (typeof b['message'] === 'string' && b['message'].trim()) {
      return b['message'].trim();
    }
    if (typeof b['error'] === 'string' && b['error'].trim()) {
      return b['error'].trim();
    }
  }

  return null;
}

function isTimeoutError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as { name?: string }).name === 'TimeoutError'
  );
}

const DEFAULTS: Record<ErrorKind, { title: string; message: string; retryable: boolean }> = {
  offline: {
    title: 'You appear to be offline',
    message: 'Check your internet connection and try again.',
    retryable: true,
  },
  unreachable: {
    title: "Can't reach the server",
    message:
      'The service did not respond. It may be starting up or temporarily unavailable.',
    retryable: true,
  },
  timeout: {
    title: 'This is taking too long',
    message: 'The server did not respond in time. Please try again.',
    retryable: true,
  },
  auth: {
    title: 'Your session has expired',
    message: 'Please sign in again to continue.',
    retryable: false,
  },
  forbidden: {
    title: 'Not allowed',
    message: "You don't have permission to do that.",
    retryable: false,
  },
  notFound: {
    title: 'Not found',
    message: 'We could not find what you were looking for.',
    retryable: false,
  },
  conflict: {
    title: "That didn't work",
    message: 'The request conflicts with the current state of your data.',
    retryable: false,
  },
  validation: {
    title: 'Please check your details',
    message: 'Some of the information supplied was not accepted.',
    retryable: false,
  },
  server: {
    title: 'Something went wrong on our side',
    message: 'The server hit an error. Please try again in a moment.',
    retryable: true,
  },
  unknown: {
    title: 'Something went wrong',
    message: 'An unexpected error occurred. Please try again.',
    retryable: true,
  },
};

function kindForStatus(status: number): ErrorKind {
  if (status === 0) return navigator.onLine ? 'unreachable' : 'offline';
  if (status === 400 || status === 422) return 'validation';
  if (status === 401) return 'auth';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'notFound';
  if (status === 408 || status === 429) return 'timeout';
  if (status === 409) return 'conflict';
  if (status >= 500) return 'server';
  return 'unknown';
}

/**
 * Convert anything thrown by an HTTP call into an `AppError`.
 *
 * `preferServerMessage` is on by default because the Java services return
 * genuinely useful text ("Insufficient stock. Available: 3, Requested: 5")
 * that is better than any generic wording we could invent.
 */
export function toAppError(err: unknown, preferServerMessage = true): AppError {
  if (isAppError(err)) return err;

  if (isTimeoutError(err)) {
    return { ...DEFAULTS.timeout, kind: 'timeout', status: null, technical: 'client timeout' };
  }

  if (err instanceof HttpErrorResponse) {
    // A browser-level failure (DNS, CORS, connection refused) surfaces as an
    // ErrorEvent with status 0 rather than a real HTTP response.
    const kind = kindForStatus(err.status);
    const base = DEFAULTS[kind];
    const serverMessage = extractServerMessage(err.error);

    const useServer =
      preferServerMessage &&
      serverMessage !== null &&
      // For these kinds the server text is the whole point.
      ['validation', 'conflict', 'notFound', 'forbidden'].includes(kind);

    return {
      kind,
      status: err.status || null,
      title: base.title,
      message: useServer ? serverMessage! : base.message,
      retryable: base.retryable,
      technical: `${err.status} ${err.statusText} ${err.url ?? ''} ${serverMessage ?? ''}`.trim(),
    };
  }

  if (err instanceof Error) {
    return { ...DEFAULTS.unknown, kind: 'unknown', status: null, technical: err.message };
  }

  return { ...DEFAULTS.unknown, kind: 'unknown', status: null };
}

/** Transient failures are worth retrying automatically before bothering the user. */
export function isTransient(error: AppError): boolean {
  return ['offline', 'unreachable', 'timeout', 'server'].includes(error.kind);
}
