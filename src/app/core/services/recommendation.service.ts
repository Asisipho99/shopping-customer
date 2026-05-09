import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RecommendationService {

  private url = environment.integrationUrl;

  constructor(private http: HttpClient) {}

  getRecommendations(customerId: number): Observable<any> {
    return this.http.get(
      `${this.url}/recommendations/${customerId}`);
  }

  logInteraction(customerId: number,
                 productId: number,
                 type: 'view' | 'purchase'): Observable<any> {
    return this.http.post(
      `${environment.aiServiceUrl}/api/recommendations/interactions`,
      {
        customerId,
        productId,
        interactionType: type
      }
    );
  }
}