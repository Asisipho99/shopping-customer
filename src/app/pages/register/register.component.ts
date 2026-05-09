import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  form = {
    firstName: '',
    lastName:  '',
    email:     '',
    password:  '',
    phone:     ''
  };
  error    = '';
  success  = '';
  loading  = false;

  constructor(private auth: AuthService, private router: Router) {}

  register() {
    this.loading = true;
    this.error   = '';
    this.auth.register(this.form).subscribe({
      next: () => {
        this.success = 'Account created! Redirecting to login...';
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.error   = err.error?.message || 'Registration failed. Try again.';
        this.loading = false;
      }
    });
  }
}