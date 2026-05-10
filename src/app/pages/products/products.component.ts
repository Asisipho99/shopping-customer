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
  loadingMore       = false;
  error             = '';
  searchTerm        = '';
  selectedCategory  = '';
  addedProductId:   number | null = null;

  // Pagination state
  currentPage  = 0;
  pageSize     = 20;
  totalPages   = 0;
  isLastPage   = false;

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
    this.route.queryParams.subscribe(params => {
      this.selectedCategory = params['category'] || '';
      this.resetAndLoad();
    });
  }

  resetAndLoad() {
    this.products     = [];
    this.currentPage  = 0;
    this.isLastPage   = false;
    this.loadProducts();
  }

  loadProducts() {
    this.loading = true;
    this.error   = '';

    // Use search/category endpoints (return full list) or paginated endpoint
    if (this.searchTerm) {
      this.productService.searchByName(this.searchTerm).subscribe({
        next: (data) => { this.products = data; this.filter(); this.loading = false; },
        error: () => { this.error = 'Failed to load products.'; this.loading = false; }
      });
    } else if (this.selectedCategory) {
      this.productService.getByCategory(this.selectedCategory).subscribe({
        next: (data) => { this.products = data; this.filter(); this.loading = false; },
        error: () => { this.error = 'Failed to load products.'; this.loading = false; }
      });
    } else {
      this.productService.getAll(this.currentPage, this.pageSize).subscribe({
        next: (page) => {
          this.products         = [...this.products, ...page.content];
          this.filteredProducts = this.products;
          this.totalPages       = page.totalPages;
          this.isLastPage       = page.last;
          this.loading          = false;
          this.loadingMore      = false;
        },
        error: () => { this.error = 'Failed to load products.'; this.loading = false; }
      });
    }
  }

  loadMore() {
    if (this.isLastPage || this.loadingMore) return;
    this.loadingMore = true;
    this.currentPage++;
    this.loadProducts();
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

  onSearch() {
    this.resetAndLoad();
  }

  onCategoryChange() {
    this.resetAndLoad();
  }

  addToCart(product: Product) {
    this.cartService.addToCart(product, 1);
    this.addedProductId = product.productId;
    setTimeout(() => this.addedProductId = null, 1500);
  }
}