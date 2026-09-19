import { Injectable, computed, signal } from '@angular/core';
import { Cart, CartItem } from '../../models/cart.model';
import { Product } from '../../models/product.model';

const CART_KEY = 'shopping_cart';

const EMPTY: Cart = { items: [], totalItems: 0, totalPrice: 0 };

/**
 * The shopping cart, held entirely client-side and mirrored to localStorage.
 *
 * Signal-backed, and updated immutably. The app is zoneless, so a mutation that
 * did not produce a new object reference would not reliably notify Angular and
 * consumers such as the navbar badge could paint a stale count.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly _cart = signal<Cart>(this.loadFromStorage());

  readonly cart = this._cart.asReadonly();
  readonly totalItems = computed(() => this._cart().totalItems);
  readonly totalPrice = computed(() => this._cart().totalPrice);

  addToCart(product: Product, quantity: number = 1): void {
    const items = [...this._cart().items];
    const index = items.findIndex((i) => i.product.productId === product.productId);

    if (index >= 0) {
      items[index] = { ...items[index], quantity: items[index].quantity + quantity };
    } else {
      items.push({ product, quantity });
    }

    this.commit(items);
  }

  removeFromCart(productId: number): void {
    this.commit(this._cart().items.filter((i) => i.product.productId !== productId));
  }

  updateQuantity(productId: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }

    this.commit(
      this._cart().items.map((i) =>
        i.product.productId === productId ? { ...i, quantity } : i
      )
    );
  }

  clearCart(): void {
    try {
      localStorage.removeItem(CART_KEY);
    } catch {
      // localStorage may be unavailable in some environments
    }
    this._cart.set(EMPTY);
  }

  /** Current value, for callers that are not reading it in a template. */
  getCart(): Cart {
    return this._cart();
  }

  private commit(items: CartItem[]): void {
    const cart: Cart = {
      items,
      totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
      totalPrice: items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    };

    this.saveToStorage(cart);
    this._cart.set(cart);
  }

  private saveToStorage(cart: Cart): void {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      // localStorage may be unavailable in some environments
    }
  }

  private loadFromStorage(): Cart {
    try {
      const saved = localStorage.getItem(CART_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Cart;
        // Recompute the totals rather than trusting what was stored, in case
        // the shape changed between releases.
        const items = Array.isArray(parsed.items) ? parsed.items : [];
        return {
          items,
          totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
          totalPrice: items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
        };
      }
    } catch {
      // Corrupted data - start fresh
    }
    return EMPTY;
  }
}
