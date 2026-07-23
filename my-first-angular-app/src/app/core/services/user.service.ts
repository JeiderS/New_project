import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CreateUserPayload, UpdateUserPayload, User } from '@core/interfaces/user.interface';
import { environment } from '../../../environments/environments';

interface ApiResponse<T> {
  statusCode: number;
  success: boolean;
  message: string | null;
  data: T;
}

/**
 * Endpoints assumed to mirror the existing `/auth` contract (see auth.service.ts):
 * same `ApiResponse<T>` envelope, REST routes under `/users`. Not yet confirmed
 * against the real backend — adjust paths here if they differ.
 */
@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/users`;

  async listUsers(): Promise<User[]> {
    const res = await firstValueFrom(this.http.get<ApiResponse<User[]>>(this.apiUrl));
    return res.data;
  }

  async createUser(payload: CreateUserPayload): Promise<User> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<User>>(this.apiUrl, payload),
    );
    return res.data;
  }

  async updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
    const res = await firstValueFrom(
      this.http.put<ApiResponse<User>>(`${this.apiUrl}/${id}`, payload),
    );
    return res.data;
  }

  async deactivateUser(id: string): Promise<void> {
    await firstValueFrom(
      this.http.patch<ApiResponse<null>>(`${this.apiUrl}/${id}/deactivate`, {}),
    );
  }
}
