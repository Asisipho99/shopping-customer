import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe, SlicePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, DecimalPipe, SlicePipe],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  featuredProducts: Product[] = [];
  loading = true;

  categories = [
    { name: 'Electronics', icon: 'bi-cpu',         color: '#4472C4' },
    { name: 'Clothing',    icon: 'bi-bag',          color: '#70AD47' },
    { name: 'Books',       icon: 'bi-book',         color: '#ED7D31' },
    { name: 'Sports',      icon: 'bi-trophy',       color: '#9B59B6' },
    { name: 'Home & Garden',icon: 'bi-house-heart', color: '#C0392B' },
    { name: 'Toys',        icon: 'bi-controller',   color: '#16A085' },
  ];

  features = [
  { icon: 'bi-truck',         color: '#4472C4', title: 'Fast Delivery',
    desc: 'Get your orders delivered quickly and safely' },
  { icon: 'bi-shield-check',  color: '#70AD47', title: 'Secure Payment',
    desc: 'Your payment information is always protected' },
  { icon: 'bi-arrow-counterclockwise', color: '#ED7D31', title: 'Easy Returns',
    desc: 'Hassle-free returns within 30 days' },
  { icon: 'bi-headset',       color: '#9B59B6', title: '24/7 Support',
    desc: 'Our team is always here to help you' },
];

  constructor(
    private productService: ProductService,
    private cartService:    CartService
  ) {}

  ngOnInit() {
    this.productService.getAll().subscribe({
      next: (products) => {
        // Show first 8 as featured
        this.featuredProducts = products.slice(0, 8);
        this.loading          = false;
      },
      error: () => this.loading = false
    });
  }

  addToCart(product: Product) {
    this.cartService.addToCart(product, 1);
  }
}