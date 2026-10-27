import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Product } from '@core/interfaces/product.interface';
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
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/products`;

  async listProducts(): Promise<Product[]> {
    const res = await firstValueFrom(this.http.get<ApiResponse<Product[]>>(this.apiUrl));
    return res.data;
  }

  /** `form` carries name/description/price/categoryId and, optionally, the new image file. */
  async createProduct(form: FormData): Promise<Product> {
    const res = await firstValueFrom(this.http.post<ApiResponse<Product>>(this.apiUrl, form));
    return res.data;
  }

  /** Omitting the image field in `form` keeps the product's current image. */
  async updateProduct(id: number, form: FormData): Promise<Product> {
    const res = await firstValueFrom(
      this.http.put<ApiResponse<Product>>(`${this.apiUrl}/${id}`, form),
    );
    return res.data;
  }

  async setProductStatus(id: number, isActive: boolean): Promise<Product> {
    const res = await firstValueFrom(
      this.http.patch<ApiResponse<Product>>(`${this.apiUrl}/${id}/status`, { isActive }),
    );
    return res.data;
  }
}
