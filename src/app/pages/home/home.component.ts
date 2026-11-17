import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe, SlicePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { RecommendationService, Recommendation } from '../../core/services/recommendation.service';
import { ToastService } from '../../core/services/toast.service';
import { FALLBACK_CATEGORIES } from '../../core/constants/categories';
import { Product } from '../../models/product.model';
import { RequestState } from '../../core/models/request-state';
import { LoadingStateComponent } from '../../shared/components/states/loading-state.component';
import { ErrorStateComponent } from '../../shared/components/states/error-state.component';
import { EmptyStateComponent } from '../../shared/components/states/empty-state.component';
import { SkeletonGridComponent } from '../../shared/components/states/skeleton-grid.component';

interface CategoryTile {
  name: string;
  icon: string;
  color: string;
}

/** Look and feel per known category; a category added later gets the default. */
const CATEGORY_STYLES: Record<string, { icon: string; color: string }> = {
  'Electronics': { icon: 'bi-cpu', color: '#4472C4' },
  'Clothing': { icon: 'bi-bag', color: '#70AD47' },
  'Books': { icon: 'bi-book', color: '#ED7D31' },
  'Sports': { icon: 'bi-trophy', color: '#9B59B6' },
  'Home & Garden': { icon: 'bi-house-heart', color: '#C0392B' },
  'Toys': { icon: 'bi-controller', color: '#16A085' },
  'Food & Beverages': { icon: 'bi-cup-hot', color: '#E67E22' },
  'Other': { icon: 'bi-three-dots', color: '#7F8C8D' },
};
const DEFAULT_CATEGORY_STYLE = { icon: 'bi-tag', color: '#6366f1' };

function toTiles(names: readonly string[]): CategoryTile[] {
  return names.map((name) => ({ name, ...(CATEGORY_STYLES[name] ?? DEFAULT_CATEGORY_STYLE) }));
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    DecimalPipe,
    SlicePipe,
    LoadingStateComponent,
    ErrorStateComponent,
    EmptyStateComponent,
    SkeletonGridComponent,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  /** Featured products are the main content: a failure here blocks the section. */
  readonly featured = new RequestState<Product[]>([]);

  /**
   * Recommendations are supplementary. They get their own state so a failure
   * shows a small inline notice in that section instead of either breaking the
   * page or - as before - disappearing with no explanation at all.
   */
  readonly recommendations = new RequestState<Recommendation[]>([]);

  /** Catalogue size from the first products page; null until it has loaded. */
  readonly totalProducts = signal<number | null>(null);

  /**
   * The category strip. Starts from the built-in list so the strip is never
   * empty, then is replaced by what the catalogue actually holds. The service
   * itself falls back to that same list if the endpoint is unreachable.
   */
  readonly categories = signal<CategoryTile[]>(toTiles(FALLBACK_CATEGORIES));

  features = [
    {
      icon: 'bi-truck',
      color: '#4472C4',
      title: 'Fast Delivery',
      desc: 'Get your orders delivered quickly and safely',
    },
    {
      icon: 'bi-shield-check',
      color: '#70AD47',
      title: 'Secure Payment',
      desc: 'Your payment information is always protected',
    },
    {
      icon: 'bi-arrow-counterclockwise',
      color: '#ED7D31',
      title: 'Easy Returns',
      desc: 'Hassle-free returns within 30 days',
    },
    {
      icon: 'bi-headset',
      color: '#9B59B6',
      title: '24/7 Support',
      desc: 'Our team is always here to help you',
    },
  ];

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    public auth: AuthService,
    private recommendationService: RecommendationService,
    private toasts: ToastService
  ) {}

  ngOnInit(): void {
    this.loadFeatured();
    this.loadCategories();
    this.loadRecommendations();
  }

  loadCategories(): void {
    this.productService.getCategories().subscribe((names) => {
      if (names.length > 0) this.categories.set(toTiles(names));
    });
  }

  loadFeatured(): void {
    // Keep existing cards on screen when this is a retry rather than a cold load.
    this.featured.hasData ? this.featured.beginRefresh() : this.featured.begin();

    this.productService.getAll(0, 8).subscribe({
      next: (page) => {
        this.featured.succeed(page.content);
        this.totalProducts.set(page.totalElements);
      },
      error: (err) => this.featured.fail(err),
    });
  }

  loadRecommendations(): void {
    if (!this.auth.isLoggedIn()) {
      this.recommendations.reset();
      return;
    }

    this.recommendations.hasData
      ? this.recommendations.beginRefresh()
      : this.recommendations.begin();

    this.recommendationService.getForCustomer(this.auth.getCustomerId(), 4).subscribe({
      next: (items) => this.recommendations.succeed(items),
      error: (err) => this.recommendations.fail(err),
    });
  }

  addToCart(product: Product): void {
    this.cartService.addToCart(product, 1);
    this.toasts.success(`${product.name} added to your cart.`);
  }
}
