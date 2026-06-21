import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environments';
import { MenuItem } from '@shared/models/menu-item.model';

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
}
