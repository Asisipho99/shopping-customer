import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { throwError, timer } from 'rxjs';
import { catchError, retry, timeout } from 'rxjs/operators';

import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { isTransient, toAppError } from '../errors/error-mapper';

/** Reads are safe to retry. Writes are not, so they only get a timeout. */
const READ_TIMEOUT_MS = 20_000;

/**
 * Placing an order runs a three-step Camel saga that also waits on the email
 * provider (which retries with backoff), so writes need a longer ceiling.
 */
const WRITE_TIMEOUT_MS = 40_000;

const MAX_RETRIES = 2;
const RETRY_BASE_MS = 400;

/**
 * These endpoints answer 401 as a normal business outcome - a wrong password
 * is not an expired session. Treating them alike would sign the user out
 * every time they mistyped their password, and replace the useful
 * "Invalid email or password" with a misleading "Your session has expired".
 */
const AUTH_ENDPOINTS = [
  '/users/login',
  '/users/register',
  '/users/forgot-password',
  '/users/reset-password',
];

/** Set while a session-expiry redirect is in flight, so parallel 401s only act once. */
let expiringSession = false;

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  const isAuthEndpoint = isAuthEndpointUrl(req.url);
  const isRead = req.method === 'GET';

  return next(req).pipe(
    timeout(isRead ? READ_TIMEOUT_MS : WRITE_TIMEOUT_MS),
    retry({
      count: isRead ? MAX_RETRIES : 0,
      delay: (err, attempt) => {
        const mapped = toAppError(err);
        // Only transient failures are worth another attempt; anything else
        // should surface immediately rather than be retried pointlessly.
        if (!isTransient(mapped)) throw mapped;
        return timer(RETRY_BASE_MS * Math.pow(2, attempt - 1));
      },
    }),
    catchError((err) => {
      const mapped = toAppError(err);

      if (mapped.technical) {
        console.error(`[http] ${req.method} ${req.url} -> ${mapped.technical}`);
      }

      if (mapped.kind === 'auth' && !isAuthEndpoint) {
        expireSession(auth, router, toast);
      }

      return throwError(() => mapped);
    })
  );
};

function isAuthEndpointUrl(url: string): boolean {
  return AUTH_ENDPOINTS.some((path) => url.includes(path));
}

function expireSession(auth: AuthService, router: Router, toast: ToastService): void {
  if (expiringSession) return;
  expiringSession = true;

  toast.warning('Please sign in again to continue.', 'Your session has expired');

  // Remember where the user was so they can be returned there after signing in.
  const returnUrl = router.url;
  auth.clearSession();
  router
    .navigate(['/login'], {
      queryParams: returnUrl && !returnUrl.startsWith('/login') ? { returnUrl } : {},
    })
    .finally(() => {
      expiringSession = false;
    });
}
