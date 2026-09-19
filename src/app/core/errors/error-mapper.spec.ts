import { HttpErrorResponse } from '@angular/common/http';
import { extractServerMessage, isTransient, toAppError } from './error-mapper';
import { AppError } from '../models/app-error';

function httpError(status: number, body: unknown = null): HttpErrorResponse {
  return new HttpErrorResponse({
    status,
    statusText: 'x',
    error: body,
    url: 'https://example.test/api/things',
  });
}

describe('extractServerMessage', () => {
  it('reads the Java services envelope', () => {
    expect(
      extractServerMessage({
        status: 409,
        error: 'Conflict',
        message: 'Email already registered',
        path: '/api/users/register',
      })
    ).toBe('Email already registered');
  });

  it('reads the Camel integration envelope', () => {
    expect(
      extractServerMessage({ error: 'Stock deduction failed', cause: 'RuntimeException' })
    ).toBe('Stock deduction failed');
  });

  it('reads the Flask AI service envelope', () => {
    expect(extractServerMessage({ success: false, error: 'Model not available' })).toBe(
      'Model not available'
    );
  });

  it('reads a bare text body', () => {
    expect(extractServerMessage('Reset token expired')).toBe('Reset token expired');
  });

  it('parses a JSON string body, as returned when responseType is text', () => {
    expect(extractServerMessage('{"message":"Invalid token"}')).toBe('Invalid token');
  });

  it('ignores an HTML error page', () => {
    expect(extractServerMessage('<html><body>502</body></html>')).toBeNull();
  });

  it('returns null for an empty body', () => {
    expect(extractServerMessage(null)).toBeNull();
    expect(extractServerMessage('   ')).toBeNull();
  });
});

describe('toAppError', () => {
  it('passes an already-mapped error straight through', () => {
    const existing: AppError = {
      kind: 'timeout',
      title: 't',
      message: 'm',
      status: null,
      retryable: true,
    };
    expect(toAppError(existing)).toBe(existing);
  });

  it('maps an rxjs timeout', () => {
    const mapped = toAppError({ name: 'TimeoutError' });
    expect(mapped.kind).toBe('timeout');
    expect(mapped.retryable).toBe(true);
  });

  it('treats status 0 while online as the service being unreachable', () => {
    expect(toAppError(httpError(0)).kind).toBe('unreachable');
  });

  it('maps 401 to an auth failure that is not retryable', () => {
    const mapped = toAppError(httpError(401));
    expect(mapped.kind).toBe('auth');
    expect(mapped.retryable).toBe(false);
  });

  it('maps 404 to notFound and does not offer a retry', () => {
    const mapped = toAppError(httpError(404));
    expect(mapped.kind).toBe('notFound');
    expect(mapped.retryable).toBe(false);
  });

  it('maps 5xx to a retryable server failure', () => {
    const mapped = toAppError(httpError(503));
    expect(mapped.kind).toBe('server');
    expect(mapped.retryable).toBe(true);
  });

  it('prefers the server text for a validation failure', () => {
    const mapped = toAppError(
      httpError(400, { message: 'Insufficient stock. Available: 3, Requested: 5' })
    );
    expect(mapped.kind).toBe('validation');
    expect(mapped.message).toBe('Insufficient stock. Available: 3, Requested: 5');
  });

  it('prefers the server text for a conflict', () => {
    const mapped = toAppError(httpError(409, { message: 'Cannot transition order' }));
    expect(mapped.message).toBe('Cannot transition order');
  });

  it('keeps generic wording for a 500 even when the server sent detail', () => {
    // Internal failure text is not useful to a shopper.
    const mapped = toAppError(httpError(500, { message: 'NullPointerException at line 42' }));
    expect(mapped.message).not.toContain('NullPointerException');
    expect(mapped.technical).toContain('NullPointerException');
  });

  it('always produces a message and a title', () => {
    for (const status of [0, 400, 401, 403, 404, 408, 409, 429, 500, 502]) {
      const mapped = toAppError(httpError(status));
      expect(mapped.message.length).toBeGreaterThan(0);
      expect(mapped.title.length).toBeGreaterThan(0);
    }
  });
});

describe('isTransient', () => {
  it('is true for failures worth retrying automatically', () => {
    expect(isTransient(toAppError(httpError(0)))).toBe(true);
    expect(isTransient(toAppError(httpError(503)))).toBe(true);
    expect(isTransient(toAppError({ name: 'TimeoutError' }))).toBe(true);
  });

  it('is false for failures a retry cannot fix', () => {
    expect(isTransient(toAppError(httpError(404)))).toBe(false);
    expect(isTransient(toAppError(httpError(401)))).toBe(false);
    expect(isTransient(toAppError(httpError(400)))).toBe(false);
  });
});
