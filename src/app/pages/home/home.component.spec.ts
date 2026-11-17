import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { HomeComponent } from './home.component';
import { environment } from '../../../environments/environment';

const CATEGORIES_URL = `${environment.productServiceUrl}/products/categories`;
const PRODUCTS_URL = `${environment.productServiceUrl}/products?page=0&size=8`;

const ALL_CATEGORIES = [
  'Books', 'Clothing', 'Electronics', 'Food & Beverages', 'Home & Garden', 'Other', 'Sports', 'Toys',
];

describe('HomeComponent', () => {
  let httpMock: HttpTestingController;
  let fixture: ComponentFixture<HomeComponent>;

  async function create(): Promise<void> {
    TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    await fixture.whenStable();
  }

  async function settle(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
  }

  /** The category strip's tile names, in render order. */
  const tileNames = () =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.cat-name')).map(
      (el) => el.textContent!.trim()
    );

  const text = () => (fixture.nativeElement as HTMLElement).textContent ?? '';

  beforeEach(() => localStorage.clear());

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  describe('hero stats', () => {
    it('shows the real catalogue size from the products response', async () => {
      await create();
      httpMock.expectOne(CATEGORIES_URL).flush(ALL_CATEGORIES);
      httpMock.expectOne(PRODUCTS_URL).flush({
        content: [], page: 0, size: 8, totalElements: 250, totalPages: 32, last: false,
      });
      await settle();

      const stats = (fixture.nativeElement as HTMLElement).querySelector('.hero-stats')!;
      expect(stats.textContent).toContain('250');
      expect(stats.textContent).toContain('Products');
    });

    it('no longer claims customer or rating figures it cannot back up', async () => {
      await create();
      httpMock.expectOne(CATEGORIES_URL).flush(ALL_CATEGORIES);
      httpMock.expectOne(PRODUCTS_URL).flush({
        content: [], page: 0, size: 8, totalElements: 250, totalPages: 32, last: false,
      });
      await settle();

      const stats = (fixture.nativeElement as HTMLElement).querySelector('.hero-stats')!;
      expect(stats.textContent).not.toContain('10K');
      expect(stats.textContent).not.toContain('50K');
      expect(stats.textContent).not.toContain('4.9');
      expect(stats.textContent).not.toContain('Customers');
      expect(stats.textContent).not.toContain('Rating');
    });

    it('shows no product figure while the count is unknown', async () => {
      await create();
      httpMock.expectOne(CATEGORIES_URL).flush(ALL_CATEGORIES);
      httpMock.expectOne(PRODUCTS_URL).flush('boom', { status: 500, statusText: 'Server Error' });
      await settle();

      const stats = (fixture.nativeElement as HTMLElement).querySelector('.hero-stats')!;
      expect(stats.textContent).not.toContain('Products');
      expect(text()).not.toContain('10K');
    });
  });

  describe('category strip', () => {
    it('renders every category the endpoint returns, including the two the old strip dropped', async () => {
      await create();
      httpMock.expectOne(CATEGORIES_URL).flush(ALL_CATEGORIES);
      httpMock.expectOne(PRODUCTS_URL).flush('x', { status: 500, statusText: 'Server Error' });
      await settle();

      expect(tileNames()).toEqual(ALL_CATEGORIES);
      expect(tileNames()).toContain('Food & Beverages');
      expect(tileNames()).toContain('Other');
    });

    it('follows the catalogue when it holds a category the app has never heard of', async () => {
      await create();
      httpMock.expectOne(CATEGORIES_URL).flush(['Books', 'Garden Tools']);
      httpMock.expectOne(PRODUCTS_URL).flush('x', { status: 500, statusText: 'Server Error' });
      await settle();

      expect(tileNames()).toEqual(['Books', 'Garden Tools']);
    });

    it('falls back to the built-in eight when the endpoint is unavailable', async () => {
      await create();
      httpMock.expectOne(CATEGORIES_URL).flush('nope', { status: 404, statusText: 'Not Found' });
      httpMock.expectOne(PRODUCTS_URL).flush('x', { status: 500, statusText: 'Server Error' });
      await settle();

      expect(tileNames()).toHaveLength(8);
      expect([...tileNames()].sort()).toEqual([...ALL_CATEGORIES].sort());
    });

    it('links each tile to the products page filtered by that category', async () => {
      await create();
      httpMock.expectOne(CATEGORIES_URL).flush(['Food & Beverages']);
      httpMock.expectOne(PRODUCTS_URL).flush('x', { status: 500, statusText: 'Server Error' });
      await settle();

      const link = (fixture.nativeElement as HTMLElement).querySelector('.category-card')!
        .closest('a')!;
      expect(decodeURIComponent(link.getAttribute('href')!)).toBe('/products?category=Food & Beverages');
    });
  });
});