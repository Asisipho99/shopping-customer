import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Both interests endpoints answer with this shape. */
interface InterestsResponse {
  customerId: number;
  categories: string[];
}

/**
 * The categories a customer said they are interested in.
 *
 * Owned by user-service, which is also what the AI service reads to seed
 * recommendations for a customer with no purchase history. Both calls are
 * authenticated; the JWT is attached by the existing jwtInterceptor.
 */
@Injectable({ providedIn: 'root' })
export class InterestService {

  private url = environment.userServiceUrl;

  constructor(private http: HttpClient) {}

  getInterests(customerId: number): Observable<string[]> {
    return this.http
      .get<InterestsResponse>(`${this.url}/users/${customerId}/interests`)
      .pipe(map((res) => res.categories ?? []));
  }

  /** Full replace: an empty array clears every stored interest. */
  saveInterests(customerId: number, categories: string[]): Observable<string[]> {
    return this.http
      .put<InterestsResponse>(`${this.url}/users/${customerId}/interests`, { categories })
      .pipe(map((res) => res.categories ?? []));
  }
}
