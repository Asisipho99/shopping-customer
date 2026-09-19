import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AppError } from '../../core/models/app-error';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  email   = '';
  loading = false;
  success = '';
  error   = '';

  constructor(private auth: AuthService) {}

  submit() {
    if (!this.email) { this.error = 'Please enter your email address.'; return; }
    this.loading = true;
    this.error   = '';
    this.auth.forgotPassword(this.email).subscribe({
      next: () => {
        this.success = 'If that email is registered, a reset link has been sent. Check your inbox.';
        this.loading = false;
      },
      error: (err: AppError) => {
        this.error = err.message;
        this.loading = false;
      },
    });
  }
}
