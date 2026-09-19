import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { Product } from '../../models/product.model';
import { RequestState } from '../../core/models/request-state';
import { ErrorStateComponent } from '../../shared/components/states/error-state.component';
import { EmptyStateComponent } from '../../shared/components/states/empty-state.component';
import { SkeletonGridComponent } from '../../shared/components/states/skeleton-grid.component';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ErrorStateComponent,
    EmptyStateComponent,
    SkeletonGridComponent,
  ],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
})
export class ProductsComponent implements OnInit {
  /**
   * Holds the accumulated list across pages.
   *
   * `isLoading` is true only for a cold load, so appending a further page no
   * longer blanks the grid - previously `loadProducts()` set `loading = true`
   * on every call, which hid the whole list behind a spinner while Load More
   * ran, then re-rendered it from scratch.
   */
  readonly state = new RequestState<Product[]>([]);

  searchTerm = '';
  selectedCategory = '';
  addedProductId: number | null = null;

  currentPage = 0;
  pageSize = 20;
  isLastPage = false;

  filtersOpen = false;

  categories = [
    'Electronics',
    'Clothing',
    'Books',
    'Home & Garden',
    'Sports',
    'Toys',
    'Food & Beverages',
    'Other',
  ];

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private route: ActivatedRoute,
    private toasts: ToastService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.selectedCategory = params['category'] || '';
      this.resetAndLoad();
    });
  }

  get products(): Product[] {
    return this.state.data ?? [];
  }

  /** True when a filter or search is narrowing the list. */
  get isFiltered(): boolean {
    return !!this.searchTerm || !!this.selectedCategory;
  }

  resetAndLoad(): void {
    this.state.reset([]);
    this.currentPage = 0;
    this.isLastPage = false;
    this.load();
  }

  /** Cold load or a full replacement of the list. */
  load(): void {
    this.state.begin();

    if (this.searchTerm) {
      this.productService.searchByName(this.searchTerm).subscribe({
        next: (items) => {
          this.isLastPage = true; // search returns the full result set
          this.state.succeed(items);
        },
        error: (err) => this.state.fail(err),
      });
      return;
    }

    if (this.selectedCategory) {
      this.productService.getByCategory(this.selectedCategory).subscribe({
        next: (items) => {
          this.isLastPage = true; // category returns the full result set
          this.state.succeed(items);
        },
        error: (err) => this.state.fail(err),
      });
      return;
    }

    this.productService.getAll(0, this.pageSize).subscribe({
      next: (page) => {
        this.currentPage = 0;
        this.isLastPage = page.last;
        this.state.succeed(page.content);
      },
      error: (err) => this.state.fail(err),
    });
  }

  /**
   * Append the next page.
   *
   * Uses `beginRefresh()` so the existing cards stay visible, and restores the
   * page counter if the request fails - the old version incremented the page
   * before loading and never reset `loadingMore`, so one failure left the
   * button permanently disabled and silently skipped a page.
   */
  loadMore(): void {
    if (this.isLastPage || this.state.isBusy) return;

    const nextPage = this.currentPage + 1;
    this.state.beginRefresh();

    this.productService.getAll(nextPage, this.pageSize).subscribe({
      next: (page) => {
        this.currentPage = nextPage;
        this.isLastPage = page.last;
        this.state.succeed([...this.products, ...page.content]);
      },
      error: (err) => {
        // Keep what is already on screen and report the failure inline.
        const mapped = this.state.fail(err);
        this.toasts.error(mapped.message, 'Could not load more products');
      },
    });
  }

  onSearch(): void {
    this.resetAndLoad();
  }

  onCategoryChange(): void {
    this.resetAndLoad();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.resetAndLoad();
  }

  addToCart(product: Product): void {
    this.cartService.addToCart(product, 1);
    this.addedProductId = product.productId;
    setTimeout(() => (this.addedProductId = null), 1500);
    this.toasts.success(`${product.name} added to your cart.`);
  }
}
