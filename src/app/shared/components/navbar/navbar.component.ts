import { Component, HostListener, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent {
  readonly auth = inject(AuthService);
  private readonly cartService = inject(CartService);

  /**
   * Reads the cart signal directly, so the badge tracks any change to the cart
   * rather than relying on a subscription that, under zoneless change
   * detection, would not have repainted on its own.
   */
  readonly cartItemCount = this.cartService.totalItems;

  mobileOpen = false;

  toggleMobile() {
    this.mobileOpen = !this.mobileOpen;
  }

  closeMobile() {
    this.mobileOpen = false;
  }

  // Close mobile menu on resize to desktop
  @HostListener('window:resize', [])
  onResize() {
    if (window.innerWidth >= 992) {
      this.mobileOpen = false;
    }
  }
}
