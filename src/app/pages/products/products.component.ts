import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit {

  products:         Product[] = [];
  filteredProducts: Product[] = [];
  loading           = true;
  searchTerm        = '';
  selectedCategory  = '';
  addedProductId:   number | null = null;

  categories = [
    'Electronics','Clothing','Books','Home & Garden',
    'Sports','Toys','Food & Beverages','Other'
  ];

  constructor(
    private productService: ProductService,
    private cartService:    CartService,
    private route:          ActivatedRoute
  ) {}

  ngOnInit() {
    // Check if category passed from home page
    this.route.queryParams.subscribe(params => {
      this.selectedCategory = params['category'] || '';
      this.loadProducts();
    });
  }

  loadProducts() {
    this.loading = true;
    this.productService.getAll().subscribe({
      next: (data) => {
        this.products = data;
        this.filter();
        this.loading  = false;
      },
      error: () => this.loading = false
    });
  }

  filter() {
    this.filteredProducts = this.products.filter(p => {
      const matchName = p.name.toLowerCase()
                          .includes(this.searchTerm.toLowerCase());
      const matchCat  = this.selectedCategory
                        ? p.category === this.selectedCategory : true;
      return matchName && matchCat;
    });
  }

  addToCart(product: Product) {
    this.cartService.addToCart(product, 1);
    this.addedProductId = product.productId;
    setTimeout(() => this.addedProductId = null, 1500);
  }
}