import { Component, inject, signal } from '@angular/core';
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
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  form = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
  };

  // Signals so the HTTP outcome actually repaints under zoneless change detection.
  readonly error = signal('');
  readonly success = signal('');
  readonly loading = signal(false);

  /**
   * Email of the account this browser is already signed in as, or null when
   * nobody is. Registering signs the new account in and so replaces that
   * session; the page says so up front instead of doing it silently.
   */
  readonly signedInAs = signal<string | null>(
    this.auth.isLoggedIn() ? this.auth.getEmail() || 'another account' : null
  );

  /** Ends the existing session but stays on this page so registration can go on. */
  signOut() {
    this.auth.clearSession();
    this.signedInAs.set(null);
  }

  register() {
    this.error.set('');

    if (this.form.password.length < 8) {
      this.error.set('Password must be at least 8 characters.');
      return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(this.form.password)) {
      this.error.set(
        'Password must contain at least one uppercase letter, one lowercase letter, and one number.'
      );
      return;
    }

    this.loading.set(true);
    this.auth.register(this.form).subscribe({
      next: () => {
        // The auto-login is required, not cosmetic: POST /users/register answers
        // with a CustomerResponse and no token, while the interests endpoints
        // are authenticated. Without a session the interest step could not save
        // anything, so if the login fails we fall back to today's behaviour -
        // the message plus the redirect to /login.
        this.auth.login(this.form.email, this.form.password).subscribe({
          next: () => {
            this.success.set('Account created! Let us know what you like...');
            this.router.navigate(['/interests'], { queryParams: { onboarding: 1 } });
          },
          error: () => {
            this.success.set('Account created! Redirecting to login...');
            setTimeout(() => this.router.navigate(['/login']), 2000);
          },
        });
      },
      error: (err: AppError) => {
        // The user service returns useful text here, e.g. that the email is
        // already registered, and the mapper has already surfaced it.
        this.error.set(err.message);
        this.loading.set(false);
      },
    });
  }
}
