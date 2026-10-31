import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SaleDetail, SaleListItem } from '@core/interfaces/sale.interface';
import { environment } from '../../../environments/environments';

interface ApiResponse<T> {
  statusCode: number;
  success: boolean;
  message: string | null;
  data: T;
}

interface RegisterSalePayload {
  lines: { productId: number; quantity: number }[];
}

@Injectable({
  providedIn: 'root',
})
export class SaleService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/sales`;

  async listSales(): Promise<SaleListItem[]> {
    const res = await firstValueFrom(this.http.get<ApiResponse<SaleListItem[]>>(this.apiUrl));
    return res.data;
  }

  async getSaleDetail(saleId: number): Promise<SaleDetail> {
    const res = await firstValueFrom(
      this.http.get<ApiResponse<SaleDetail>>(`${this.apiUrl}/${saleId}`),
    );
    return res.data;
  }

  async registerSale(lines: { productId: number; quantity: number }[]): Promise<SaleDetail> {
    const payload: RegisterSalePayload = { lines };
    const res = await firstValueFrom(
      this.http.post<ApiResponse<SaleDetail>>(this.apiUrl, payload),
    );
    return res.data;
  }
}
