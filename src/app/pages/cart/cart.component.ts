import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { Cart } from '../../models/cart.model';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {

  cart: Cart = { items: [], totalItems: 0, totalPrice: 0 };

  constructor(private cartService: CartService) {}

  ngOnInit() {
    this.cartService.cart$.subscribe(cart => this.cart = cart);
  }

  updateQuantity(productId: number, quantity: number) {
    this.cartService.updateQuantity(productId, quantity);
  }

  remove(productId: number) {
    this.cartService.removeFromCart(productId);
  }

  clearCart() {
    this.cartService.clearCart();
  }
}