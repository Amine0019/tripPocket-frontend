import { CanActivateFn } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { inject } from '@angular/core';
import { TokenService } from '../services/token.service';

interface JwtRolePayload {
  role?: string;
}

export const roleGuard: CanActivateFn = (route) => {
  const token = inject(TokenService).getAccessToken();
  const allowedRoles = route.data['roles'] as string[] | undefined;

  if (!token || !allowedRoles?.length) {
    return false;
  }

  try {
    const payload = jwtDecode<JwtRolePayload>(token);
    return typeof payload.role === 'string' && allowedRoles.includes(payload.role);
  } catch {
    return false;
  }
};
