import { Component, inject, signal } from '@angular/core';
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
  styleUrls: ['./forgot-password.component.scss'],
})
export class ForgotPasswordComponent {
  private readonly auth = inject(AuthService);

  email = '';

  readonly loading = signal(false);
  readonly success = signal('');
  readonly error = signal('');

  submit() {
    if (!this.email) {
      this.error.set('Please enter your email address.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.auth.forgotPassword(this.email).subscribe({
      next: () => {
        this.success.set(
          'If that email is registered, a reset link has been sent. Check your inbox.'
        );
        this.loading.set(false);
      },
      error: (err: AppError) => {
        this.error.set(err.message);
        this.loading.set(false);
      },
    });
  }
}
