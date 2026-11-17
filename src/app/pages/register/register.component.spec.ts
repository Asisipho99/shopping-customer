import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import type { Mock } from 'vitest';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../core/services/auth.service';

describe('RegisterComponent', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let component: RegisterComponent;
  let navigate: Mock;
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
    TestBed.inject(Router).navigate = navigate as unknown as Router['navigate'];

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

  describe('when nobody is signed in', () => {
    it('shows no signed-in notice', async () => {
      await create(null);

      expect(notice()).toBeNull();
    });
  });
});
