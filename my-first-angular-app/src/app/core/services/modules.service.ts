import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environments';
import { MenuItem } from '@shared/models/menu-item.model';
import { AppModule, CreateModulePayload, UpdateModulePayload } from '@core/interfaces/module.interface';

interface ApiResponse<T> {
  statusCode: number;
  success: boolean;
  message: string | null;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class ModulesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/modules`;

  async getMenu(): Promise<MenuItem[]> {
    const res = await firstValueFrom(
      this.http.get<ApiResponse<MenuItem[]>>(`${this.apiUrl}/menu`),
    );
    return res.data;
  }

  async listModules(): Promise<AppModule[]> {
    const res = await firstValueFrom(this.http.get<ApiResponse<AppModule[]>>(this.apiUrl));
    return res.data;
  }

  async createModule(payload: CreateModulePayload): Promise<AppModule> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<AppModule>>(this.apiUrl, payload),
    );
    return res.data;
  }

  async updateModule(id: number, payload: UpdateModulePayload): Promise<AppModule> {
    const res = await firstValueFrom(
      this.http.put<ApiResponse<AppModule>>(`${this.apiUrl}/${id}`, payload),
    );
    return res.data;
  }

  async deactivateModule(id: number): Promise<AppModule> {
    const res = await firstValueFrom(
      this.http.patch<ApiResponse<AppModule>>(`${this.apiUrl}/${id}/deactivate`, {}),
    );
    return res.data;
  }

  async syncModuleActions(moduleId: number, actionIds: number[]): Promise<AppModule> {
    const res = await firstValueFrom(
      this.http.put<ApiResponse<AppModule>>(`${this.apiUrl}/${moduleId}/actions`, { actionIds }),
    );
    return res.data;
  }
}
