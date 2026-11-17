import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import type { Mock } from 'vitest';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../core/services/auth.service';

/** A password that passes the component's own client-side rules. */
const GOOD_PASSWORD = 'Passw0rdOK';

describe('RegisterComponent', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let component: RegisterComponent;
  let navigate: Mock;
  let navigateByUrl: Mock;
  let auth: {
    register: Mock;
    login: Mock;
    isLoggedIn: Mock;
    getEmail: Mock;
    clearSession: Mock;
  };

  /**
   * Builds the component against a mocked AuthService, so nothing here can
   * reach a real user-service. `signedInAs` is the email of an existing
   * session, or null for a visitor who is not signed in.
   */
  async function create(signedInAs: string | null = null): Promise<void> {
    auth = {
      register: vi.fn(() => of({ customerId: 1 })),
      login: vi.fn(() => of({ token: 't' })),
      isLoggedIn: vi.fn(() => signedInAs !== null),
      getEmail: vi.fn(() => signedInAs ?? ''),
      clearSession: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    });

    navigate = vi.fn(() => Promise.resolve(true));
    navigateByUrl = vi.fn(() => Promise.resolve(true));
    TestBed.inject(Router).navigate = navigate as unknown as Router['navigate'];
    TestBed.inject(Router).navigateByUrl = navigateByUrl as unknown as Router['navigateByUrl'];

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  }

  const el = () => fixture.nativeElement as HTMLElement;
  const notice = () => el().querySelector('[data-testid="signed-in-notice"]');

  async function repaint(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('when already signed in', () => {
    it('tells the user which account they are signed in as and that registering replaces it', async () => {
      await create('existing@example.com');

      expect(notice()).not.toBeNull();
      expect(notice()!.textContent).toContain('existing@example.com');
      expect(notice()!.textContent).toContain('replace');
    });

    it('offers a sign-out button that ends the session and hides the notice', async () => {
      await create('existing@example.com');

      const button = notice()!.querySelector('button') as HTMLButtonElement;
      expect(button.textContent).toContain('Sign out');
      button.click();
      await repaint();

      expect(auth.clearSession).toHaveBeenCalledTimes(1);
      expect(notice()).toBeNull();
      // Stays on the page so the visitor can carry on registering.
      expect(navigate).not.toHaveBeenCalled();
    });

    it('does not sign anyone out merely by showing the notice', async () => {
      await create('existing@example.com');

      expect(auth.clearSession).not.toHaveBeenCalled();
      expect(auth.register).not.toHaveBeenCalled();
    });
  });

  describe('when the automatic login after registering fails', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    async function registerWithFailingLogin(): Promise<void> {
      await create(null);
      auth.login = vi.fn(() => throwError(() => new Error('login failed')));
      component.form = {
        firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com',
        password: GOOD_PASSWORD, phone: '0821234567',
      };
      component.register();
    }

    it('keeps the onboarding step as a returnUrl on the redirect to /login', async () => {
      await registerWithFailingLogin();

      expect(navigate).not.toHaveBeenCalled(); // not until the 2 second delay
      vi.advanceTimersByTime(2000);

      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith(['/login'], {
        queryParams: { returnUrl: '/interests?onboarding=1' },
      });
    });

    it('produces a returnUrl that resolves to /interests with onboarding=1', async () => {
      await registerWithFailingLogin();
      vi.advanceTimersByTime(2000);

      const { queryParams } = navigate.mock.calls[0][1] as { queryParams: { returnUrl: string } };
      const target = TestBed.inject(Router).parseUrl(queryParams.returnUrl);

      expect(target.root.children['primary'].segments.map((s) => s.path)).toEqual(['interests']);
      expect(target.queryParams['onboarding']).toBe('1');
    });
  });

  describe('client-side validation', () => {
    async function submitWith(password: string): Promise<void> {
      await create(null);
      component.form = {
        firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com', password, phone: '0821234567',
      };
      component.register();
      await repaint();
    }

    it('rejects a password shorter than 8 characters without calling the API', async () => {
      await submitWith('Ab1');

      expect(component.error()).toBe('Password must be at least 8 characters.');
      expect(auth.register).not.toHaveBeenCalled();
      expect(auth.login).not.toHaveBeenCalled();
    });

    it('rejects a password with no uppercase letter, lowercase letter or digit', async () => {
      for (const weak of ['alllowercase1', 'ALLUPPERCASE1', 'NoDigitsHere']) {
        TestBed.resetTestingModule();
        await submitWith(weak);

        expect(component.error()).toContain('uppercase letter, one lowercase letter, and one number');
        expect(auth.register).not.toHaveBeenCalled();
      }
    });
  });

  describe('registration chain', () => {
    const FORM = {
      firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com',
      password: GOOD_PASSWORD, phone: '0821234567',
    };

    async function submit(): Promise<void> {
      component.form = { ...FORM };
      component.register();
      await repaint();
    }

    it('registers, then logs in with the same credentials, then opens the interests step', async () => {
      await create(null);
      await submit();

      expect(auth.register).toHaveBeenCalledTimes(1);
      expect(auth.register).toHaveBeenCalledWith(FORM);
      expect(auth.login).toHaveBeenCalledTimes(1);
      expect(auth.login).toHaveBeenCalledWith('ada@example.com', GOOD_PASSWORD);
      expect(navigateByUrl).toHaveBeenCalledTimes(1);
      expect(navigateByUrl).toHaveBeenCalledWith('/interests?onboarding=1');
      expect(navigate).not.toHaveBeenCalled();
      expect(component.success()).toBe('Account created! Let us know what you like...');
      expect(component.error()).toBe('');
    });

    it('does not attempt the login until registration has succeeded', async () => {
      await create(null);
      const registered = new Subject<unknown>();
      auth.register = vi.fn(() => registered);
      await submit();

      expect(auth.login).not.toHaveBeenCalled();
      expect(component.loading()).toBe(true);

      registered.next({ customerId: 1 });
      registered.complete();
      expect(auth.login).toHaveBeenCalledTimes(1);
    });

    it('shows the server message and stops when registration is refused', async () => {
      await create(null);
      auth.register = vi.fn(() =>
        throwError(() => ({ kind: 'conflict', message: 'Email already registered' }))
      );
      await submit();

      expect(component.error()).toBe('Email already registered');
      expect(component.loading()).toBe(false);
      expect(el().textContent).toContain('Email already registered');
      expect(auth.login).not.toHaveBeenCalled();
      expect(navigateByUrl).not.toHaveBeenCalled();
      expect(navigate).not.toHaveBeenCalled();
    });

    describe('half-failure: the account is created but the automatic login fails', () => {
      beforeEach(() => vi.useFakeTimers());
      afterEach(() => vi.useRealTimers());

      it('tells the user the account exists and is redirecting to login, with no error', async () => {
        await create(null);
        auth.login = vi.fn(() => throwError(() => new Error('login failed')));
        await submit();

        expect(component.success()).toBe('Account created! Redirecting to login...');
        expect(component.error()).toBe('');
        expect(el().textContent).toContain('Account created! Redirecting to login...');
      });

      it('does not enter onboarding without a session and does not register twice', async () => {
        await create(null);
        auth.login = vi.fn(() => throwError(() => new Error('login failed')));
        await submit();
        vi.advanceTimersByTime(2000);

        expect(auth.register).toHaveBeenCalledTimes(1);
        expect(auth.login).toHaveBeenCalledTimes(1);
        expect(navigateByUrl).not.toHaveBeenCalled();
        expect(navigate).toHaveBeenCalledTimes(1);
        expect(navigate.mock.calls[0][0]).toEqual(['/login']);
      });

      it('waits 2 seconds before redirecting so the message can be read', async () => {
        await create(null);
        auth.login = vi.fn(() => throwError(() => new Error('login failed')));
        await submit();

        vi.advanceTimersByTime(1999);
        expect(navigate).not.toHaveBeenCalled();
        vi.advanceTimersByTime(1);
        expect(navigate).toHaveBeenCalledTimes(1);
      });

      it('leaves an existing session alone because no new session was created', async () => {
        await create('existing@example.com');
        auth.login = vi.fn(() => throwError(() => new Error('login failed')));
        await submit();

        expect(auth.clearSession).not.toHaveBeenCalled();
      });
    });
  });
  describe('when nobody is signed in', () => {
    it('shows no signed-in notice', async () => {
      await create(null);

      expect(notice()).toBeNull();
    });
  });
});
