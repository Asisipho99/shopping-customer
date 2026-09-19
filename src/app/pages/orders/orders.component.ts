import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { Order } from '../../models/order.model';
import { RequestState } from '../../core/models/request-state';
import { LoadingStateComponent } from '../../shared/components/states/loading-state.component';
import { ErrorStateComponent } from '../../shared/components/states/error-state.component';
import { EmptyStateComponent } from '../../shared/components/states/empty-state.component';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LoadingStateComponent,
    ErrorStateComponent,
    EmptyStateComponent,
  ],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss'],
})
export class OrdersComponent implements OnInit {
  readonly state = new RequestState<Order[]>([]);
  selectedOrder: Order | null = null;

  constructor(
    private orderService: OrderService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  get orders(): Order[] {
    return this.state.data ?? [];
  }

  load(): void {
    this.state.hasData ? this.state.beginRefresh() : this.state.begin();

    this.orderService.getMyOrders(this.auth.getCustomerId()).subscribe({
      next: (data) => {
        const sorted = [...data].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.state.succeed(sorted);
      },
      error: (err) => this.state.fail(err),
    });
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'bg-warning text-dark',
      PROCESSING: 'bg-info',
      SHIPPED: 'bg-primary',
      DELIVERED: 'bg-success',
      CANCELLED: 'bg-danger',
    };
    return `badge ${map[status] || 'bg-secondary'}`;
  }

  getStatusIcon(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'bi-clock',
      PROCESSING: 'bi-gear-fill',
      SHIPPED: 'bi-truck',
      DELIVERED: 'bi-check-circle-fill',
      CANCELLED: 'bi-x-circle-fill',
    };
    return map[status] || 'bi-circle';
  }

  isStepActive(currentStatus: string, step: string): boolean {
    const steps = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
    return steps.indexOf(currentStatus) >= steps.indexOf(step);
  }

  viewOrder(order: Order): void {
    this.selectedOrder =
      this.selectedOrder?.orderId === order.orderId ? null : order;
  }
}
