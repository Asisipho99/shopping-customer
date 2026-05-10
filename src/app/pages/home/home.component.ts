import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe, SlicePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { Product } from '../../models/product.model';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, DecimalPipe, SlicePipe],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  featuredProducts: Product[] = [];
  loading           = true;
  error             = '';
  recommendations:  any[]     = [];

  categories = [
    { name: 'Electronics',  icon: 'bi-cpu',          color: '#4472C4' },
    { name: 'Clothing',     icon: 'bi-bag',           color: '#70AD47' },
    { name: 'Books',        icon: 'bi-book',          color: '#ED7D31' },
    { name: 'Sports',       icon: 'bi-trophy',        color: '#9B59B6' },
    { name: 'Home & Garden',icon: 'bi-house-heart',   color: '#C0392B' },
    { name: 'Toys',         icon: 'bi-controller',    color: '#16A085' },
  ];

  features = [
    { icon: 'bi-truck',                  color: '#4472C4', title: 'Fast Delivery',
      desc: 'Get your orders delivered quickly and safely' },
    { icon: 'bi-shield-check',           color: '#70AD47', title: 'Secure Payment',
      desc: 'Your payment information is always protected' },
    { icon: 'bi-arrow-counterclockwise', color: '#ED7D31', title: 'Easy Returns',
      desc: 'Hassle-free returns within 30 days' },
    { icon: 'bi-headset',                color: '#9B59B6', title: '24/7 Support',
      desc: 'Our team is always here to help you' },
  ];

  constructor(
    private productService: ProductService,
    private cartService:    CartService,
    public  auth:           AuthService,
    private http:           HttpClient
  ) {}

  ngOnInit() {
    this.productService.getAll(0, 8).subscribe({
      next: (page) => {
        this.featuredProducts = page.content;
        this.loading          = false;
      },
      error: () => {
        this.error   = 'Failed to load products. Please refresh the page.';
        this.loading = false;
      }
    });

    // Load personalised recommendations if logged in
    if (this.auth.isLoggedIn()) {
      const customerId = this.auth.getCustomerId();
      this.http.get<any>(
        `${environment.aiServiceUrl}/api/recommendations/${customerId}?n=4`
      ).subscribe({
        next:  (res) => this.recommendations = res.data?.recommendations || [],
        error: ()    => {} // Fail silently — recommendations are non-critical
      });
    }
  }

  addToCart(product: Product) {
    this.cartService.addToCart(product, 1);
  }
}
