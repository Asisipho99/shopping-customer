import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, CommonModule],
  template: `
    <app-navbar></app-navbar>
    <router-outlet></router-outlet>
    <footer class="app-footer">
      <div class="container">
        <span>© 2026 <a routerLink="/">ShopNow</a> · Integrated Online Shopping System · TUT</span>
      </div>
    </footer>
  `
})
export class AppComponent {}