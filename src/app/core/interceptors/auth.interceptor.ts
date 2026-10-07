import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, finalize, map, shareReplay, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';

const PUBLIC_AUTH_URLS = new Set([
  `${environment.apiUrl}/auth/login`,
  `${environment.apiUrl}/auth/register`,
  `${environment.apiUrl}/auth/refresh`
]);

let refreshRequest$: Observable<string> | null = null;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (PUBLIC_AUTH_URLS.has(req.url)) {
    return next(req);
  }

  const tokenService = inject(TokenService);
  const token = tokenService.getAccessToken();
  const authService = inject(AuthService);

  return next(token ? withAccessToken(req, token) : req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      return refreshAccessToken(authService, tokenService).pipe(
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
    }
  });
}

function refreshAccessToken(authService: AuthService, tokenService: TokenService): Observable<string> {
  if (refreshRequest$) {
    return refreshRequest$;
  }

  const refreshToken = tokenService.getRefreshToken();
  if (!refreshToken) {
    tokenService.clearTokens();
    return throwError(() => new Error('No refresh token available'));
  }

  refreshRequest$ = authService.refresh({ refreshToken }).pipe(
    map((response) => {
      tokenService.saveAccessToken(response.accessToken);
      if (response.refreshToken) {
        tokenService.saveRefreshToken(response.refreshToken);
      }
      return response.accessToken;
    }),
    catchError((error: unknown) => {
      tokenService.clearTokens();
      return throwError(() => error);
    }),
    finalize(() => {
      refreshRequest$ = null;
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  return refreshRequest$;
}
