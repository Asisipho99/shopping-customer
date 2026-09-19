import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { AppError } from '../../core/models/app-error';

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
    this.error = '';

    // Client-side password validation
    if (this.form.password.length < 8) {
      this.error = 'Password must be at least 8 characters.';
      return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(this.form.password)) {
      this.error = 'Password must contain at least one uppercase letter, one lowercase letter, and one number.';
      return;
    }

    this.loading = true;
    this.auth.register(this.form).subscribe({
      next: () => {
        this.success = 'Account created! Redirecting to login...';
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err: AppError) => {
        // The user service returns useful text here, e.g. that the email is
        // already registered, and the mapper has already surfaced it.
        this.error = err.message;
        this.loading = false;
      },
    });
  }
}