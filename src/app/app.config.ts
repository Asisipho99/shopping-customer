import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    // Order matters: jwtInterceptor attaches the token on the way out, then
    // errorInterceptor wraps the response so it sees the outcome of the
    // authenticated request and can act on a 401.
    provideHttpClient(withInterceptors([jwtInterceptor, errorInterceptor])),
  ],
};
