import { Component, OnInit } from '@angular/core';
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
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  token           = '';
  newPassword     = '';
  confirmPassword = '';
  loading         = false;
  success         = '';
  error           = '';

  constructor(private auth: AuthService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.error = 'Invalid or missing reset token. Please request a new reset link.';
    }
  }

  submit() {
    this.error = '';

    if (!this.newPassword || this.newPassword.length < 8) {
      this.error = 'Password must be at least 8 characters.'; return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(this.newPassword)) {
      this.error = 'Password must contain uppercase, lowercase, and a number.'; return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.error = 'Passwords do not match.'; return;
    }

    this.loading = true;
    this.auth.resetPassword(this.token, this.newPassword).subscribe({
      next: () => {
        this.success = 'Password reset successfully! You can now log in with your new password.';
        this.loading = false;
      },
      error: (err: AppError) => {
        // A rejected or expired token comes back as a 400 with server text;
        // fall back to explicit wording when the server said nothing useful.
        this.error =
          err.kind === 'validation' || err.kind === 'conflict'
            ? err.message
            : 'Invalid or expired reset token. Please request a new link.';
        this.loading = false;
      },
    });
  }
}
