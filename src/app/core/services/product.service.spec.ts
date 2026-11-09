import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ProductService } from './product.service';
import { FALLBACK_CATEGORIES } from '../constants/categories';
import { environment } from '../../../environments/environment';

describe('ProductService.getCategories', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;

  const url = `${environment.productServiceUrl}/products/categories`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('returns the categories the server sent', () => {
    let result: string[] | undefined;
    service.getCategories().subscribe((list) => (result = list));

    const req = httpMock.expectOne(url);
    expect(req.request.method).toBe('GET');
    req.flush(['Books', 'Electronics']);

    expect(result).toEqual(['Books', 'Electronics']);
  });

  /**
   * product-service deploys separately and may not have the endpoint yet, so a
   * failure must leave the picker with a usable list rather than nothing.
   */
  it('falls back to the hardcoded eight when the request fails', () => {
    let result: string[] | undefined;
    service.getCategories().subscribe((list) => (result = list));

    httpMock
      .expectOne(url)
      .flush('boom', { status: 500, statusText: 'Server Error' });

    expect(result).toEqual([...FALLBACK_CATEGORIES]);
    expect(result!.length).toBe(8);
  });
});
