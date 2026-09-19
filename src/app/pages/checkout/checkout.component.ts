import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { RecommendationService } from '../../core/services/recommendation.service';
import { ToastService } from '../../core/services/toast.service';
import { AppError, ErrorKind } from '../../core/models/app-error';
import { Cart } from '../../models/cart.model';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit {

  cart: Cart = { items: [], totalItems: 0, totalPrice: 0 };
  loading = false;
  success = false;
  error = '';
  errorKind: ErrorKind | null = null;
  retryable = false;
  orderId: number | null = null;

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    public auth: AuthService,
    private router: Router,
    private recommendationService: RecommendationService,
    private toasts: ToastService
  ) {}

  ngOnInit() {
    this.cartService.cart$.subscribe(cart => this.cart = cart);
    // Redirect if cart is empty
    if (this.cartService.getCart().items.length === 0) {
      this.router.navigate(['/cart']);
    }
  }

  placeOrder() {
    this.loading = true;
    this.error = '';
    this.errorKind = null;
    this.retryable = false;

    const request = {
      customerId:    this.auth.getCustomerId(),
      customerEmail: this.auth.getEmail(),
      customerName:  this.auth.getFirstName(),
      items: this.cart.items.map(i => ({
        productId:   i.product.productId,
        productName: i.product.name,
        quantity:    i.quantity,
        unitPrice:   i.product.price
      }))
    };

    // Snapshot the lines before the cart is cleared, so the interaction log
    // still has them if clearCart() runs first.
    const lines = [...this.cart.items];

    this.orderService.placeOrder(request).subscribe({
      next: () => {
        this.success = true;
        this.loading = false;
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
        this.error = err.message;
        this.errorKind = err.kind;
        this.retryable = err.retryable;
        this.loading = false;

        // The cart is deliberately left intact so the customer can retry
        // without rebuilding it.
        this.toasts.error(err.message, err.title);
      },
    });
  }
}