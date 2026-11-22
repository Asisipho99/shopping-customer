import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { Product } from '../../models/product.model';
import { environment } from '../../../environments/environment';
import { FALLBACK_CATEGORIES } from '../constants/categories';

export interface PageResponse<T> {
  content:       T[];
  page:          number;
  size:          number;
  totalElements: number;
  totalPages:    number;
  last:          boolean;
}

@Injectable({ providedIn: 'root' })
export class ProductService {

  private url = environment.productServiceUrl;

  constructor(private http: HttpClient) {}

  getAll(page = 0, size = 20): Observable<PageResponse<Product>> {
    return this.http.get<PageResponse<Product>>(
      `${this.url}/products?page=${page}&size=${size}`);
  }

  getById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.url}/products/${id}`);
  }

  searchByName(name: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.url}/products?name=${name}`);
  }

  getByCategory(category: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.url}/products?category=${category}`);
  }

  /**
   * The distinct categories currently in the catalogue, as a bare string array.
   *
   * Falls back to FALLBACK_CATEGORIES on any failure because the services
   * deploy independently: product-service may still be an older build without
   * this endpoint, and a category picker with no categories is useless.
   */
  getCategories(): Observable<string[]> {
    return this.http
      .get<string[]>(`${this.url}/products/categories`)
      .pipe(catchError(() => of([...FALLBACK_CATEGORIES])));
  }
}