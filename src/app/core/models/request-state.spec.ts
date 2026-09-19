import { computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RequestState } from './request-state';

function serverError(): HttpErrorResponse {
  return new HttpErrorResponse({ status: 503, statusText: 'Service Unavailable' });
}

describe('RequestState', () => {
  it('starts idle with no data and no error', () => {
    const state = new RequestState<string[]>();
    expect(state.status).toBe('idle');
    expect(state.hasData).toBe(false);
    expect(state.isEmpty).toBe(false); // idle is not the same as empty
  });

  it('reports a cold load as loading', () => {
    const state = new RequestState<string[]>([]);
    state.begin();
    expect(state.isLoading).toBe(true);
    expect(state.isBusy).toBe(true);
  });

  it('exposes data once it succeeds', () => {
    const state = new RequestState<string[]>([]);
    state.begin();
    state.succeed(['a', 'b']);
    expect(state.isReady).toBe(true);
    expect(state.hasData).toBe(true);
    expect(state.data).toEqual(['a', 'b']);
  });

  it('treats a successful empty array as empty rather than missing', () => {
    const state = new RequestState<string[]>([]);
    state.begin();
    state.succeed([]);
    expect(state.isEmpty).toBe(true);
    expect(state.hasData).toBe(false);
  });

  it('keeps existing data visible while refreshing', () => {
    const state = new RequestState<string[]>([]);
    state.succeed(['a']);
    state.beginRefresh();
    expect(state.isRefreshing).toBe(true);
    expect(state.isLoading).toBe(false); // must not blank the view
    expect(state.hasData).toBe(true);
  });

  it('classifies a failure with nothing on screen as blocking', () => {
    const state = new RequestState<string[]>([]);
    state.begin();
    state.fail(serverError());
    expect(state.isBlockingFailure).toBe(true);
    expect(state.isPartialFailure).toBe(false);
    expect(state.error?.kind).toBe('server');
  });

  it('classifies a failure with data already shown as partial', () => {
    const state = new RequestState<string[]>([]);
    state.succeed(['a']);
    state.beginRefresh();
    state.fail(serverError());
    expect(state.isPartialFailure).toBe(true);
    expect(state.isBlockingFailure).toBe(false);
    expect(state.data).toEqual(['a']); // the list survived the failed refresh
  });

  it('clears the error on the next attempt', () => {
    const state = new RequestState<string[]>([]);
    state.fail(serverError());
    state.begin();
    expect(state.error).toBeNull();
  });

  /**
   * Regression guard for the products page: a failed Load More used to leave
   * `loadingMore` true for good, which disabled the button permanently.
   */
  it('is not busy after a failed refresh, so a retry is still possible', () => {
    const state = new RequestState<string[]>([]);
    state.succeed(['a']);
    state.beginRefresh();
    state.fail(serverError());
    expect(state.isBusy).toBe(false);
    expect(state.error?.retryable).toBe(true);
  });

  /**
   * Regression guard for the "click twice to see products" bug.
   *
   * The app is zoneless, so state read by a template has to be signal-backed.
   * With plain fields the data arrived but nothing repainted until an unrelated
   * event forced a check. Deriving through `computed` proves the reads are
   * tracked: if these getters ever stop reading signals, the computed will not
   * recompute and this test fails.
   */
  it('is reactive, so a view reading it updates when the request settles', () => {
    const state = new RequestState<string[]>([]);
    const view = computed(() => {
      if (state.isLoading) return 'skeleton';
      if (state.isBlockingFailure) return 'error';
      if (state.isEmpty) return 'empty';
      return state.hasData ? 'list' : 'idle';
    });

    expect(view()).toBe('idle');

    state.begin();
    expect(view()).toBe('skeleton');

    state.succeed(['a']);
    expect(view()).toBe('list');

    // A failure with data already loaded is partial by design, so the list
    // stays on screen rather than being replaced by an error panel.
    state.beginRefresh();
    state.fail(serverError());
    expect(view()).toBe('list');

    // A failure with nothing loaded blocks, and must recompute to the panel.
    const cold = new RequestState<string[]>([]);
    const coldView = computed(() => (cold.isBlockingFailure ? 'error' : 'other'));
    expect(coldView()).toBe('other');
    cold.begin();
    cold.fail(serverError());
    expect(coldView()).toBe('error');
  });

  it('reset returns it to a pristine state', () => {
    const state = new RequestState<string[]>(['a']);
    state.fail(serverError());
    state.reset();
    expect(state.status).toBe('idle');
    expect(state.data).toBeNull();
    expect(state.error).toBeNull();
  });
});
