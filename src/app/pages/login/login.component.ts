import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  email    = '';
  password = '';
  error    = '';
  loading  = false;

  constructor(private auth: AuthService, private router: Router) {}

  login() {
    this.loading = true;
    this.error   = '';
    this.auth.login(this.email, this.password).subscribe({
      next: () => this.router.navigate(['/']),
      error: () => {
        this.error   = 'Invalid email or password.';
        this.loading = false;
      }
    });
  }
}