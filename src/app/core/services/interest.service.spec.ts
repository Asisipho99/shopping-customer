import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { InterestService } from './interest.service';
import { environment } from '../../../environments/environment';

describe('InterestService', () => {
  let service: InterestService;
  let httpMock: HttpTestingController;

  const url = `${environment.userServiceUrl}/users/7/interests`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(InterestService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('maps the response envelope to a plain category array', () => {
    let result: string[] | undefined;
    service.getInterests(7).subscribe((list) => (result = list));

    const req = httpMock.expectOne(url);
    expect(req.request.method).toBe('GET');
    req.flush({ customerId: 7, categories: ['Books', 'Electronics'] });

    expect(result).toEqual(['Books', 'Electronics']);
  });

  it('maps a missing categories field to an empty array', () => {
    let result: string[] | undefined;
    service.getInterests(7).subscribe((list) => (result = list));

    httpMock.expectOne(url).flush({ customerId: 7 });

    expect(result).toEqual([]);
  });

  it('PUTs the selection as { categories }', () => {
    let result: string[] | undefined;
    service.saveInterests(7, ['Toys', 'Sports']).subscribe((list) => (result = list));

    const req = httpMock.expectOne(url);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ categories: ['Toys', 'Sports'] });
    req.flush({ customerId: 7, categories: ['Sports', 'Toys'] });

    expect(result).toEqual(['Sports', 'Toys']);
  });

  it('sends an empty array when the selection is cleared', () => {
    service.saveInterests(7, []).subscribe();

    const req = httpMock.expectOne(url);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ categories: [] });
    req.flush({ customerId: 7, categories: [] });
  });
});
