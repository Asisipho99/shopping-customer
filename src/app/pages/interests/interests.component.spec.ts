import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import type { Mock } from 'vitest';
import { InterestsComponent } from './interests.component';
import { environment } from '../../../environments/environment';

const CATEGORIES_URL = `${environment.productServiceUrl}/products/categories`;
const INTERESTS_URL = `${environment.userServiceUrl}/users/7/interests`;

describe('InterestsComponent', () => {
  let httpMock: HttpTestingController;
  let navigate: Mock;

  /**
   * Builds the component in one of its two modes. `onboarding` decides which
   * secondary button renders and where save() leaves the user, and it comes
   * from the query string, so the route has to be stubbed before creation.
   */
  async function create(onboarding: boolean): Promise<ComponentFixture<InterestsComponent>> {
    TestBed.configureTestingModule({
      imports: [InterestsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap(onboarding ? { onboarding: '1' } : {}),
            },
          },
        },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    navigate = vi.fn(() => Promise.resolve(true));
    TestBed.inject(Router).navigate = navigate as unknown as Router['navigate'];

    const fixture = TestBed.createComponent(InterestsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  /** Answers the two reads the page issues on init. */
  async function settleLoad(
    fixture: ComponentFixture<InterestsComponent>,
    stored: string[]
  ): Promise<void> {
    httpMock.expectOne(CATEGORIES_URL).flush(['Books', 'Electronics', 'Sports', 'Toys']);
    httpMock.expectOne(INTERESTS_URL).flush({ customerId: 7, categories: stored });
    fixture.detectChanges();
    await fixture.whenStable();
  }

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('customerId', '7');
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  it('is skippable: skipping saves nothing and leaves the page', async () => {
    const fixture = await create(true);
    await settleLoad(fixture, []);

    const skip = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '.btn-skip'
    );
    expect(skip).toBeTruthy();
    expect(skip!.textContent).toContain('Skip for now');

    skip!.click();
    await fixture.whenStable();

    expect(navigate).toHaveBeenCalledWith(['/']);
    httpMock.expectNone({ method: 'PUT', url: INTERESTS_URL });
  });

  it('persists the selection: saving PUTs exactly the toggled categories', async () => {
    const fixture = await create(true);
    await settleLoad(fixture, []);

    const component = fixture.componentInstance;
    component.toggle('Books');
    component.toggle('Toys');
    expect(component.isSelected('Books')).toBe(true);
    expect(component.isSelected('Toys')).toBe(true);
    expect(component.selectedCount).toBe(2);

    component.save();

    const req = httpMock.expectOne(INTERESTS_URL);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ categories: ['Books', 'Toys'] });
    req.flush({ customerId: 7, categories: ['Books', 'Toys'] });
    await fixture.whenStable();

    expect(navigate).toHaveBeenCalledWith(['/']);
  });

  it('stays skippable when the catalogue has no categories', async () => {
    const fixture = await create(true);

    // §0.2: an empty catalogue answers [] rather than failing, so there is nothing
    // to pick from and the page must still offer a way forward.
    httpMock.expectOne(CATEGORIES_URL).flush([]);
    httpMock.expectOne(INTERESTS_URL).flush({ customerId: 7, categories: [] });
    fixture.detectChanges();
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.interest-chip')).toBeNull();
    expect(host.querySelector('.btn-save')).toBeTruthy();
    expect(host.querySelector<HTMLButtonElement>('.btn-skip')!.textContent).toContain(
      'Skip for now'
    );
  });

  it('is editable later: pre-selects the stored list and saves a reduced one', async () => {
    const fixture = await create(false);
    await settleLoad(fixture, ['Books', 'Toys']);

    const component = fixture.componentInstance;
    expect(component.onboarding).toBe(false);
    expect(component.isSelected('Books')).toBe(true);
    expect(component.isSelected('Toys')).toBe(true);

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.btn-skip')).toBeNull();
    expect(host.querySelector('.btn-back')).toBeTruthy();

    component.toggle('Toys');
    component.save();

    const req = httpMock.expectOne(INTERESTS_URL);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ categories: ['Books'] });
    req.flush({ customerId: 7, categories: ['Books'] });
    await fixture.whenStable();

    // Editing mode stays on the page so further changes can be made.
    expect(navigate).not.toHaveBeenCalled();
  });
});
