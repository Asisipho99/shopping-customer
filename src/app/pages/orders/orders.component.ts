import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { Order } from '../../models/order.model';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit {

  orders:  Order[] = [];
  loading  = true;
  selectedOrder: Order | null = null;

  constructor(
    private orderService: OrderService,
    private auth:         AuthService
  ) {}

  ngOnInit() {
    this.orderService.getMyOrders(this.auth.getCustomerId()).subscribe({
      next: (data) => {
        this.orders  = data.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  getStatusClass(status: string): string {
    const map: any = {
      'PENDING':    'bg-warning text-dark',
      'PROCESSING': 'bg-info',
      'SHIPPED':    'bg-primary',
      'DELIVERED':  'bg-success',
      'CANCELLED':  'bg-danger'
    };
    return `badge ${map[status] || 'bg-secondary'}`;
  }

  getStatusIcon(status: string): string {
    const map: any = {
      'PENDING':    'bi-clock',
      'PROCESSING': 'bi-gear-fill',
      'SHIPPED':    'bi-truck',
      'DELIVERED':  'bi-check-circle-fill',
      'CANCELLED':  'bi-x-circle-fill'
    };
    return map[status] || 'bi-circle';
  }

  isStepActive(currentStatus: string, step: string): boolean {
  const steps = ['PENDING','PROCESSING','SHIPPED','DELIVERED'];
  const currentIndex = steps.indexOf(currentStatus);
  const stepIndex    = steps.indexOf(step);
  return currentIndex >= stepIndex;
}

  viewOrder(order: Order) {
    this.selectedOrder = this.selectedOrder?.orderId === order.orderId
                         ? null : order;
  }
}