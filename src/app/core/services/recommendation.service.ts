import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Camel-cased view of a recommendation, matching the rest of the app's models. */
export interface Recommendation {
  productId: number;
  name: string;
  category: string;
  price: number;
  imageUrl: string;
  score: number;
  reason: string;
}

/** The Flask service answers with a success/data envelope and snake_case keys. */
interface RecommendationEnvelope {
  success: boolean;
  data?: {
    customer_id: number;
    count: number;
    type: 'hybrid' | 'fallback';
    recommendations: Array<{
      product_id: number;
      name: string;
      category: string;
      price: number;
      image_url: string;
      score: number;
      reason: string;
    }>;
  };
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class RecommendationService {
  private readonly aiUrl = environment.aiServiceUrl;

  constructor(private http: HttpClient) {}

  /**
   * Personalised recommendations for a customer.
   *
   * Calls the AI service directly. The Camel route at
   * `{integrationUrl}/recommendations/{id}` also exists but nothing in this app
   * used it, so it is not wired here; switching to it would only add a hop.
   *
   * The snake_case payload is mapped to camelCase at this boundary so the rest
   * of the app never has to know the Python service names things differently.
   */
  getForCustomer(customerId: number, count = 4): Observable<Recommendation[]> {
    return this.http
      .get<RecommendationEnvelope>(
        `${this.aiUrl}/api/recommendations/${customerId}?n=${count}`
      )
      .pipe(map((res) => (res.data?.recommendations ?? []).map(toRecommendation)));
  }

  /** Products similar to a given product, used on the product detail page. */
  getSimilar(productId: number, count = 4): Observable<Recommendation[]> {
    return this.http
      .get<{ success: boolean; data?: { similar: RawSimilar[] } }>(
        `${this.aiUrl}/api/recommendations/similar/${productId}?n=${count}`
      )
      .pipe(map((res) => (res.data?.similar ?? []).map(toRecommendation)));
  }

  /**
   * Record a view or purchase so the model has something to learn from.
   *
   * Callers treat failures as non-fatal - a lost training event must never
   * interrupt browsing or checkout.
   */
  logInteraction(
    customerId: number,
    productId: number,
    type: 'view' | 'purchase'
  ): Observable<unknown> {
    return this.http.post(`${this.aiUrl}/api/recommendations/interactions`, {
      customerId,
      productId,
      interactionType: type,
    });
  }
}

interface RawSimilar {
  product_id: number;
  name: string;
  category: string;
  price: number;
  image_url: string;
  score: number;
  reason: string;
}

function toRecommendation(raw: RawSimilar): Recommendation {
  return {
    productId: raw.product_id,
    name: raw.name ?? 'Unknown',
    category: raw.category ?? '',
    price: Number(raw.price ?? 0),
    imageUrl: raw.image_url ?? '',
    score: Number(raw.score ?? 0),
    reason: raw.reason ?? '',
  };
}
