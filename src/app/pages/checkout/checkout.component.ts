import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { RecommendationService } from '../../core/services/recommendation.service';
import { Cart } from '../../models/cart.model';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit {

  cart:          Cart = { items: [], totalItems: 0, totalPrice: 0 };
  loading        = false;
  success        = false;
  error          = '';
  orderId:       number | null = null;

  constructor(
    private cartService:            CartService,
    private orderService:           OrderService,
    public  auth:                   AuthService,
    private router:                 Router,
    private recommendationService:  RecommendationService
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
    this.error   = '';

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

    this.orderService.placeOrder(request).subscribe({
      next: (res) => {
        this.success = true;
        this.loading = false;

        // Log purchase interactions for every item to train the AI model
        const customerId = this.auth.getCustomerId();
        this.cart.items.forEach(i => {
          this.recommendationService
              .logInteraction(customerId, i.product.productId, 'purchase')
              .subscribe({ error: () => {} }); // fail silently
        });

        this.cartService.clearCart();
        setTimeout(() => this.router.navigate(['/orders']), 3000);
      },
      error: (err) => {
        this.error   = err.error?.error || 'Order failed. Please try again.';
        this.loading = false;
      }
    });
  }
}