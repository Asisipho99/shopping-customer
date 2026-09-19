import { computed } from '@angular/core';
import { CartService } from './cart.service';
import { Product } from '../../models/product.model';

function product(id: number, price: number): Product {
  return {
    productId: id,
    name: `Product ${id}`,
    description: '',
    price,
    category: 'Test',
    imageUrl: '',
  } as Product;
}

describe('CartService', () => {
  beforeEach(() => localStorage.clear());

  it('starts empty', () => {
    const cart = new CartService();
    expect(cart.cart().items.length).toBe(0);
    expect(cart.totalItems()).toBe(0);
  });

  it('adds an item and computes the totals', () => {
    const cart = new CartService();
    cart.addToCart(product(1, 100), 2);
    expect(cart.totalItems()).toBe(2);
    expect(cart.totalPrice()).toBe(200);
  });

  it('increments the quantity when the same product is added again', () => {
    const cart = new CartService();
    cart.addToCart(product(1, 50), 1);
    cart.addToCart(product(1, 50), 2);
    expect(cart.cart().items.length).toBe(1);
    expect(cart.totalItems()).toBe(3);
  });

  it('removes an item when its quantity drops to zero', () => {
    const cart = new CartService();
    cart.addToCart(product(1, 50), 1);
    cart.updateQuantity(1, 0);
    expect(cart.cart().items.length).toBe(0);
  });

  it('persists across instances', () => {
    const first = new CartService();
    first.addToCart(product(7, 25), 4);

    const second = new CartService();
    expect(second.totalItems()).toBe(4);
    expect(second.totalPrice()).toBe(100);
  });

  it('recovers from corrupted stored data instead of throwing', () => {
    localStorage.setItem('shopping_cart', '{not valid json');
    const cart = new CartService();
    expect(cart.totalItems()).toBe(0);
  });

  /**
   * Guards the navbar badge. Under zoneless change detection the count has to
   * be derived from a signal, or it paints a stale value.
   */
  it('notifies derived state when the cart changes', () => {
    const cart = new CartService();
    const badge = computed(() => cart.totalItems());

    expect(badge()).toBe(0);
    cart.addToCart(product(1, 10), 1);
    expect(badge()).toBe(1);
    cart.clearCart();
    expect(badge()).toBe(0);
  });
});
