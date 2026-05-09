import { Component, OnInit, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {

  cartItemCount = 0;
  mobileOpen = false;

  constructor(
    public auth: AuthService,
    private cartService: CartService
  ) {}

  ngOnInit() {
    this.cartService.cart$.subscribe(cart => {
      this.cartItemCount = cart.totalItems;
    });
  }

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