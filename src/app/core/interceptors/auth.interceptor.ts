import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { TokenService } from '../services/token.service';

const PUBLIC_AUTH_URLS = new Set([
  `${environment.apiUrl}/auth/login`,
  `${environment.apiUrl}/auth/register`,
  `${environment.apiUrl}/auth/refresh`
]);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (PUBLIC_AUTH_URLS.has(req.url)) {
    return next(req);
  }

  const token = inject(TokenService).getAccessToken();
  if (!token) {
    return next(req);
  }

  return next(req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  }));
};
