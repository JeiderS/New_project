import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Role, RoleGrant } from '@core/interfaces/role.interface';
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
export class RoleService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/roles`;

  async listRoles(): Promise<Role[]> {
    const res = await firstValueFrom(this.http.get<ApiResponse<Role[]>>(this.apiUrl));
    return res.data;
  }

  async createRole(name: string): Promise<Role> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<Role>>(this.apiUrl, { name }),
    );
    return res.data;
  }

  async updateRole(id: number, name: string): Promise<Role> {
    const res = await firstValueFrom(
      this.http.put<ApiResponse<Role>>(`${this.apiUrl}/${id}`, { name }),
    );
    return res.data;
  }

  async assignActions(roleId: number, grants: RoleGrant[]): Promise<Role> {
    const res = await firstValueFrom(
      this.http.put<ApiResponse<Role>>(`${this.apiUrl}/${roleId}/actions`, { grants }),
    );
    return res.data;
  }
}
