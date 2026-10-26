import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  Category,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from '@core/interfaces/category.interface';
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
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/categories`;

  async listCategories(): Promise<Category[]> {
    const res = await firstValueFrom(this.http.get<ApiResponse<Category[]>>(this.apiUrl));
    return res.data;
  }

  async createCategory(payload: CreateCategoryPayload): Promise<Category> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<Category>>(this.apiUrl, payload),
    );
    return res.data;
  }

  async updateCategory(id: number, payload: UpdateCategoryPayload): Promise<Category> {
    const res = await firstValueFrom(
      this.http.put<ApiResponse<Category>>(`${this.apiUrl}/${id}`, payload),
    );
    return res.data;
  }

  async setCategoryStatus(id: number, isActive: boolean): Promise<Category> {
    const res = await firstValueFrom(
      this.http.patch<ApiResponse<Category>>(`${this.apiUrl}/${id}/status`, { isActive }),
    );
    return res.data;
  }
}
