import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  // RouterLink is imported because the footer links home; without it the
  // routerLink attribute was inert and the link did nothing.
  imports: [RouterOutlet, RouterLink, NavbarComponent, CommonModule, ToastContainerComponent],
  template: `
    <app-navbar></app-navbar>
    <router-outlet></router-outlet>
    <footer class="app-footer">
      <div class="container">
        <span
          >&copy; 2026 <a routerLink="/">ShopNow</a> &middot; Integrated Online Shopping System
          &middot; TUT</span
        >
      </div>
    </footer>
    <app-toast-container></app-toast-container>
  `,
})
export class AppComponent {}
