import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { HomeComponent } from './home.component';
import { environment } from '../../../environments/environment';

const PRODUCTS_URL = `${environment.productServiceUrl}/products?page=0&size=8`;

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

  const text = () => (fixture.nativeElement as HTMLElement).textContent ?? '';

  beforeEach(() => localStorage.clear());

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  describe('hero stats', () => {
    it('shows the real catalogue size from the products response', async () => {
      await create();
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
      httpMock.expectOne(PRODUCTS_URL).flush('boom', { status: 500, statusText: 'Server Error' });
      await settle();

      const stats = (fixture.nativeElement as HTMLElement).querySelector('.hero-stats')!;
      expect(stats.textContent).not.toContain('Products');
      expect(text()).not.toContain('10K');
    });
  });
});
