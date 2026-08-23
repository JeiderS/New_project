import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../services/auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  function seedAuthenticatedSession(): void {
    localStorage.setItem('auth_token', 'stale-token');
    localStorage.setItem(
      'auth_user',
      JSON.stringify({ token: 'stale-token', email: 'a@b.com', fullName: null }),
    );
    authService.loadUser();
  }

  it('clears the stored session and redirects to /login on a 401 response', () => {
    seedAuthenticatedSession();
    expect(authService.isAuthenticated()).toBe(true);

    const navigateSpy = vi.spyOn(router, 'navigate');

    http.get('/api/v1/modules').subscribe({
      error: () => {
        // handled by the interceptor; nothing to assert on the caller's error path here
      },
    });

    const req = httpMock.expectOne('/api/v1/modules');
    req.flush({ statusCode: 401, success: false, message: 'Unknown tenant.', data: null }, {
      status: 401,
      statusText: 'Unauthorized',
    });

    expect(authService.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('does not clear the session or navigate on a non-401 error response', () => {
    seedAuthenticatedSession();

    const navigateSpy = vi.spyOn(router, 'navigate');

    http.get('/api/v1/modules').subscribe({
      error: () => {
        // expected — the request itself still fails, only 401 handling differs
      },
    });

    const req = httpMock.expectOne('/api/v1/modules');
    req.flush(
      { statusCode: 500, success: false, message: 'Server error', data: null },
      { status: 500, statusText: 'Internal Server Error' },
    );

    expect(authService.isAuthenticated()).toBe(true);
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});
