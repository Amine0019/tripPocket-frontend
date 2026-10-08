import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, shareReplay, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';
import { TravelStore } from '../services/travel.store';

const PUBLIC_AUTH_URLS = new Set([
  `${environment.apiUrl}/auth/login`,
  `${environment.apiUrl}/auth/register`,
  `${environment.apiUrl}/auth/refresh`,
  `${environment.apiUrl}/auth/logout`,
  `${environment.apiUrl}/auth/google`,
  `${environment.apiUrl}/auth/forgot-password`,
  `${environment.apiUrl}/auth/reset-password`
]);

let refreshRequest$: Observable<string> | null = null;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (PUBLIC_AUTH_URLS.has(req.url)) {
    return next(req.clone({ withCredentials: true }));
  }

  const tokenService = inject(TokenService);
  const authService = inject(AuthService);
  const store = inject(TravelStore);
  const router = inject(Router);
  const token = tokenService.getAccessToken();

  return next(token ? withAccessToken(req, token) : req.clone({ withCredentials: true })).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      return refreshAccessToken(authService, tokenService, store, router).pipe(
        switchMap((newAccessToken) => next(withAccessToken(req, newAccessToken))),
        catchError((refreshError: unknown) => throwError(() => refreshError))
      );
    })
  );
};

function withAccessToken<T>(request: HttpRequest<T>, token: string): HttpRequest<T> {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    },
    withCredentials: true
  });
}

function refreshAccessToken(
  authService: AuthService,
  tokenService: TokenService,
  store: TravelStore,
  router: Router
): Observable<string> {
  if (refreshRequest$) {
    return refreshRequest$;
  }

  const refreshToken = tokenService.getRefreshToken();
  // If no refresh token in localStorage, we still try calling /refresh because HttpOnly cookie might be present!
  refreshRequest$ = authService.refresh(refreshToken ? { refreshToken } : undefined).pipe(
    map((response) => {
      tokenService.saveAccessToken(response.accessToken);
      if (response.refreshToken) {
        tokenService.saveRefreshToken(response.refreshToken);
      }
      return response.accessToken;
    }),
    catchError((error: unknown) => {
      tokenService.clearTokens();
      store.logout();
      void router.navigate(['/login']);
      return throwError(() => error);
    }),
    finalize(() => {
      refreshRequest$ = null;
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  return refreshRequest$;
}
