import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit {

  product:  Product | null = null;
  loading   = true;
  quantity  = 1;
  added     = false;

  constructor(
    private route:          ActivatedRoute,
    private productService: ProductService,
    private cartService:    CartService
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.productService.getById(id).subscribe({
      next: (p) => { this.product = p; this.loading = false; },
      error: ()  => this.loading = false
    });
  }

  addToCart() {
    if (!this.product) return;
    this.cartService.addToCart(this.product, this.quantity);
    this.added = true;
    setTimeout(() => this.added = false, 2000);
  }

  increaseQty() { this.quantity++; }
  decreaseQty() { if (this.quantity > 1) this.quantity--; }
}