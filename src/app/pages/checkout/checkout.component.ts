import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { RecommendationService } from '../../core/services/recommendation.service';
import { ToastService } from '../../core/services/toast.service';
import { AppError, ErrorKind } from '../../core/models/app-error';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
})
export class CheckoutComponent implements OnInit {
  private readonly cartService = inject(CartService);
  private readonly orderService = inject(OrderService);
  private readonly router = inject(Router);
  private readonly recommendationService = inject(RecommendationService);
  private readonly toasts = inject(ToastService);
  readonly auth = inject(AuthService);

  readonly cart = this.cartService.cart;

  // Signals, because these are all set from an HTTP callback. Plain fields
  // would never repaint under zoneless change detection.
  readonly loading = signal(false);
  readonly success = signal(false);
  readonly error = signal('');
  readonly errorKind = signal<ErrorKind | null>(null);
  readonly retryable = signal(false);

  ngOnInit() {
    // Nothing to check out: send them back rather than showing an empty form.
    if (this.cart().items.length === 0) {
      this.router.navigate(['/cart']);
    }
  }

  placeOrder() {
    this.loading.set(true);
    this.error.set('');
    this.errorKind.set(null);
    this.retryable.set(false);

    const current = this.cart();

    const request = {
      customerId: this.auth.getCustomerId(),
      customerEmail: this.auth.getEmail(),
      customerName: this.auth.getFirstName(),
      items: current.items.map((i) => ({
        productId: i.product.productId,
        productName: i.product.name,
        quantity: i.quantity,
        unitPrice: i.product.price,
      })),
    };

    // Snapshot the lines before the cart is cleared, so the interaction log
    // still has them if clearCart() runs first.
    const lines = [...current.items];

    this.orderService.placeOrder(request).subscribe({
      next: () => {
        this.success.set(true);
        this.loading.set(false);
        this.toasts.success('Your order has been placed.', 'Order confirmed');

        const customerId = this.auth.getCustomerId();
        lines.forEach((line) => {
          this.recommendationService
            .logInteraction(customerId, line.product.productId, 'purchase')
            .subscribe({
              error: () => {
                /* training signal only - never shown to the user */
              },
            });
        });

        this.cartService.clearCart();
        setTimeout(() => this.router.navigate(['/orders']), 3000);
      },
      error: (err: AppError) => {
        this.error.set(err.message);
        this.errorKind.set(err.kind);
        this.retryable.set(err.retryable);
        this.loading.set(false);

        // The cart is deliberately left intact so the customer can retry
        // without rebuilding it.
        this.toasts.error(err.message, err.title);
      },
    });
  }
}
