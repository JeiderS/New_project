import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environments';

export interface AuthData {
  token: string;
  email: string;
  fullName: string | null;
}

interface ApiResponse<T> {
  statusCode: number;
  success: boolean;
  message: string | null;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly tokenKey = 'auth_token';
  private readonly userKey = 'auth_user';

  user = signal<AuthData | null>(this.readUser());

  async login(email: string, password: string): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<AuthData>>(`${this.apiUrl}/login`, { email, password }),
    );
    this.setSession(res.data);
  }

  loadUser(): void {
    this.user.set(this.readUser());
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getUserName(): string | undefined {
    const data = this.user();
    return data?.fullName ?? data?.email;
  }

  signOut(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.user.set(null);
  }

  private setSession(data: AuthData): void {
    localStorage.setItem(this.tokenKey, data.token);
    localStorage.setItem(this.userKey, JSON.stringify(data));
    this.user.set(data);
  }

  private readUser(): AuthData | null {
    const raw = localStorage.getItem(this.userKey);
    return raw ? (JSON.parse(raw) as AuthData) : null;
  }
}
