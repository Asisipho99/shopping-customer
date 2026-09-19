import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { RecommendationService } from '../../core/services/recommendation.service';
import { ToastService } from '../../core/services/toast.service';
import { Product } from '../../models/product.model';
import { RequestState } from '../../core/models/request-state';
import { LoadingStateComponent } from '../../shared/components/states/loading-state.component';
import { ErrorStateComponent } from '../../shared/components/states/error-state.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingStateComponent, ErrorStateComponent],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
})
export class ProductDetailComponent implements OnInit {
  /**
   * Previously the error handler only set `loading = false`, so a dropped
   * connection rendered the same "product not found" panel as a genuine 404.
   * Holding the mapped error lets the template tell the two apart.
   */
  readonly state = new RequestState<Product>();

  quantity = 1;
  added = false;

  private productId = 0;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService,
    private auth: AuthService,
    private recommendationService: RecommendationService,
    private toasts: ToastService
  ) {}

  ngOnInit(): void {
    // paramMap as a stream, so navigating between products reloads correctly.
    this.route.paramMap.subscribe((params) => {
      this.productId = Number(params.get('id'));
      this.quantity = 1;
      this.load();
    });
  }

  get product(): Product | null {
    return this.state.data;
  }

  load(): void {
    if (!this.productId) {
      this.state.fail({ status: 404 });
      return;
    }

    this.state.begin();
    this.productService.getById(this.productId).subscribe({
      next: (product) => {
        this.state.succeed(product);
        this.logView(product);
      },
      error: (err) => this.state.fail(err),
    });
  }

  addToCart(): void {
    const product = this.product;
    if (!product) return;

    this.cartService.addToCart(product, this.quantity);
    this.added = true;
    setTimeout(() => (this.added = false), 2000);
    this.toasts.success(
      `${this.quantity} x ${product.name} added to your cart.`,
      'Added to cart'
    );
  }

  increaseQty(): void {
    this.quantity++;
  }

  decreaseQty(): void {
    if (this.quantity > 1) this.quantity--;
  }

  /** Training signal for the recommender. Never surfaced to the user. */
  private logView(product: Product): void {
    if (!this.auth.isLoggedIn()) return;
    this.recommendationService
      .logInteraction(this.auth.getCustomerId(), product.productId, 'view')
      .subscribe({
        error: () => {
          /* a lost training event must not interrupt browsing */
        },
      });
  }
}
