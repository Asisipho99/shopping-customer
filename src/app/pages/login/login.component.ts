import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { AppError } from '../../core/models/app-error';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';

  // Signals: both are set from the login response, and a plain field would not
  // repaint under zoneless change detection.
  readonly error = signal('');
  readonly loading = signal(false);

  /** Where to go after signing in, set by the interceptor on session expiry. */
  private returnUrl = '/';

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
  }

  login() {
    this.loading.set(true);
    this.error.set('');

    this.auth.login(this.email, this.password).subscribe({
      next: () => this.router.navigateByUrl(this.returnUrl),
      error: (err: AppError) => {
        // A 401 here means the credentials were wrong, not that a session
        // lapsed, so keep the specific wording rather than the mapped default.
        this.error.set(
          err.kind === 'auth' ? 'Invalid email or password.' : err.message
        );
        this.loading.set(false);
      },
    });
  }
}