import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../../models/product.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProductService {

  private url = environment.productServiceUrl;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.url}/products`);
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
}