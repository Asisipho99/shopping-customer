import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../core/services/auth.service';

describe('LoginComponent returnUrl', () => {
  async function loginWith(query: Record<string, string>) {
    const auth = { login: vi.fn(() => of({ token: 't' })) };
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(query) } } },
      ],
    });
    const navigateByUrl = vi.fn(() => Promise.resolve(true));
    TestBed.inject(Router).navigateByUrl = navigateByUrl as unknown as Router['navigateByUrl'];

    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    fixture.componentInstance.email = 'ada@example.com';
    fixture.componentInstance.password = 'Passw0rdOK';
    fixture.componentInstance.login();
    return navigateByUrl;
  }

  afterEach(() => TestBed.resetTestingModule());

  it('sends the user to the returnUrl after a successful manual login', async () => {
    const navigateByUrl = await loginWith({ returnUrl: '/interests?onboarding=1' });

    expect(navigateByUrl).toHaveBeenCalledWith('/interests?onboarding=1');
  });

  it('goes home when there is no returnUrl', async () => {
    const navigateByUrl = await loginWith({});

    expect(navigateByUrl).toHaveBeenCalledWith('/');
  });
});
