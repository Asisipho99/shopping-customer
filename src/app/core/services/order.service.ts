import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order, PlaceOrderRequest } from '../../models/order.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class OrderService {

  private integrationUrl = environment.integrationUrl;
  private orderUrl       = environment.orderServiceUrl;

  constructor(private http: HttpClient) {}

  // Place order through Camel integration service
  placeOrder(request: PlaceOrderRequest): Observable<any> {
    return this.http.post(`${this.integrationUrl}/orders`, request);
  }

  // Get orders for a customer
  getMyOrders(customerId: number): Observable<Order[]> {
    return this.http.get<Order[]>(
      `${this.orderUrl}/orders/customer/${customerId}`);
  }

  getOrderById(orderId: number): Observable<Order> {
    return this.http.get<Order>(`${this.orderUrl}/orders/${orderId}`);
  }
}