import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Action, CreateActionPayload, UpdateActionPayload } from '@core/interfaces/action.interface';
import { environment } from '../../../environments/environments';

interface ApiResponse<T> {
  statusCode: number;
  success: boolean;
  message: string | null;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class ActionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/actions`;

  async listActions(): Promise<Action[]> {
    const res = await firstValueFrom(this.http.get<ApiResponse<Action[]>>(this.apiUrl));
    return res.data;
  }

  async createAction(code: string, name: string): Promise<Action> {
    const payload: CreateActionPayload = { code, name };
    const res = await firstValueFrom(
      this.http.post<ApiResponse<Action>>(this.apiUrl, payload),
    );
    return res.data;
  }

  async updateAction(id: number, payload: UpdateActionPayload): Promise<Action> {
    const res = await firstValueFrom(
      this.http.put<ApiResponse<Action>>(`${this.apiUrl}/${id}`, payload),
    );
    return res.data;
  }

  async deleteAction(id: number): Promise<void> {
    await firstValueFrom(this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`));
  }
}
