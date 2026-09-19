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
    this.clearSession();
    this.router.navigate(['/login']);
  }

  /**
   * Drop the stored session without navigating.
   *
   * The error interceptor needs this so it can redirect to /login itself and
   * attach a returnUrl, rather than having logout() navigate first.
   */
  clearSession(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('customerId');
    localStorage.removeItem('email');
    localStorage.removeItem('firstName');
    localStorage.removeItem('role');
  }

  /**
   * True only when a token is present *and* still valid.
   *
   * Checking presence alone used to let the route guard admit a user whose
   * 24-hour token had expired. Every request then failed with a 401 that
   * nothing handled, so the page rendered empty with no explanation.
   */
  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    const expiry = this.getTokenExpiry(token);
    if (expiry === null) return true; // opaque token - let the server decide
    return expiry > Date.now();
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /** Expiry of the JWT `exp` claim in epoch milliseconds, or null if unreadable. */
  getTokenExpiry(token: string | null = this.getToken()): number | null {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    try {
      const payload = JSON.parse(
        atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
      ) as { exp?: number };
      return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
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