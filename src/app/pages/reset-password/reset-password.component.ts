import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AppError } from '../../core/models/app-error';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetPasswordComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  token = '';
  newPassword = '';
  confirmPassword = '';

  readonly loading = signal(false);
  readonly success = signal('');
  readonly error = signal('');

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.error.set(
        'Invalid or missing reset token. Please request a new reset link.'
      );
    }
  }

  submit() {
    this.error.set('');

    if (!this.newPassword || this.newPassword.length < 8) {
      this.error.set('Password must be at least 8 characters.');
      return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(this.newPassword)) {
      this.error.set('Password must contain uppercase, lowercase, and a number.');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.error.set('Passwords do not match.');
      return;
    }

    this.loading.set(true);
    this.auth.resetPassword(this.token, this.newPassword).subscribe({
      next: () => {
        this.success.set(
          'Password reset successfully! You can now log in with your new password.'
        );
        this.loading.set(false);
      },
      error: (err: AppError) => {
        // A rejected or expired token comes back as a 400 with server text;
        // fall back to explicit wording when the server said nothing useful.
        this.error.set(
          err.kind === 'validation' || err.kind === 'conflict'
            ? err.message
            : 'Invalid or expired reset token. Please request a new link.'
        );
        this.loading.set(false);
      },
    });
  }
}
