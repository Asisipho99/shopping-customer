import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Cart, CartItem } from '../../models/cart.model';
import { Product } from '../../models/product.model';

const CART_KEY = 'shopping_cart';

@Injectable({ providedIn: 'root' })
export class CartService {

  private cart: Cart = this.loadFromStorage();
  private cartSubject = new BehaviorSubject<Cart>(this.cart);
  cart$ = this.cartSubject.asObservable();

  addToCart(product: Product, quantity: number = 1) {
    const existing = this.cart.items
                         .find(i => i.product.productId === product.productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.cart.items.push({ product, quantity });
    }
    this.updateCart();
  }

  removeFromCart(productId: number) {
    this.cart.items = this.cart.items
                          .filter(i => i.product.productId !== productId);
    this.updateCart();
  }

  updateQuantity(productId: number, quantity: number) {
    const item = this.cart.items
                     .find(i => i.product.productId === productId);
    if (item) {
      if (quantity <= 0) {
        this.removeFromCart(productId);
      } else {
        item.quantity = quantity;
        this.updateCart();
      }
    }
  }

  clearCart() {
    this.cart = { items: [], totalItems: 0, totalPrice: 0 };
    localStorage.removeItem(CART_KEY);
    this.cartSubject.next(this.cart);
  }

  getCart(): Cart {
    return this.cart;
  }

  private updateCart() {
    this.cart.totalItems = this.cart.items
                               .reduce((sum, i) => sum + i.quantity, 0);
    this.cart.totalPrice = this.cart.items
                               .reduce((sum, i) =>
                                 sum + (i.product.price * i.quantity), 0);
    this.saveToStorage();
    this.cartSubject.next({ ...this.cart });
  }

  private saveToStorage() {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(this.cart));
    } catch {
      // localStorage may be unavailable in some environments
    }
  }

  private loadFromStorage(): Cart {
    try {
      const saved = localStorage.getItem(CART_KEY);
      if (saved) {
        return JSON.parse(saved) as Cart;
      }
    } catch {
      // Corrupted data — start fresh
    }
    return { items: [], totalItems: 0, totalPrice: 0 };
  }
}
