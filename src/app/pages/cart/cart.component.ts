import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss'],
})
export class CartComponent {
  private readonly cartService = inject(CartService);
  private readonly toasts = inject(ToastService);

  /** Signal from the service, so the view tracks changes without subscribing. */
  readonly cart = this.cartService.cart;

  updateQuantity(productId: number, quantity: number) {
    this.cartService.updateQuantity(productId, quantity);
  }

  remove(productId: number) {
    this.cartService.removeFromCart(productId);
    this.toasts.info('Item removed from your cart.');
  }

  clearCart() {
    this.cartService.clearCart();
    this.toasts.info('Your cart has been cleared.');
  }
}
