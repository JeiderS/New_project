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

/** Wire shape returned by the backend's UserDto — note `isActive`, not `active`. */
interface UserApiModel extends Omit<User, 'active'> {
  isActive: boolean;
}

function toUser(raw: UserApiModel): User {
  const { isActive, ...rest } = raw;
  return { ...rest, active: isActive };
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
    const res = await firstValueFrom(this.http.get<ApiResponse<UserApiModel[]>>(this.apiUrl));
    return res.data.map(toUser);
  }

  async createUser(payload: CreateUserPayload): Promise<User> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<UserApiModel>>(this.apiUrl, payload),
    );
    return toUser(res.data);
  }

  async updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
    const res = await firstValueFrom(
      this.http.put<ApiResponse<UserApiModel>>(`${this.apiUrl}/${id}`, payload),
    );
    return toUser(res.data);
  }

  async deactivateUser(id: string): Promise<void> {
    await firstValueFrom(
      this.http.patch<ApiResponse<null>>(`${this.apiUrl}/${id}/deactivate`, {}),
    );
  }
}
