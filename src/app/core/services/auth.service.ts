import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RegisterRequest } from '../../models/customer.model';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private url = environment.userServiceUrl;

  constructor(private http: HttpClient, private router: Router) {}

  register(data: RegisterRequest): Observable<any> {
    return this.http.post(`${this.url}/users/register`, data);
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.url}/users/login`, { email, password })
      .pipe(tap((res: any) => {
        localStorage.setItem('token',      res.token);
        localStorage.setItem('customerId', res.customerId);
        localStorage.setItem('email',      res.email);
        localStorage.setItem('firstName',  res.firstName || '');
        localStorage.setItem('role',       res.role);
      }));
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.url}/users/forgot-password`, { email },
      { responseType: 'text' });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.url}/users/reset-password`, { token, newPassword },
      { responseType: 'text' });
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getCustomerId(): number {
    return Number(localStorage.getItem('customerId'));
  }

  getEmail(): string {
    return localStorage.getItem('email') || '';
  }

  getFirstName(): string {
    return localStorage.getItem('firstName') || 'Customer';
  }
}