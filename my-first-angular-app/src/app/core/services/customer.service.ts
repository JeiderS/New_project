import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  Customer,
  CreateCustomerPayload,
  UpdateCustomerPayload,
} from '@core/interfaces/customer.interface';
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
export class CustomerService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/customers`;

  async listCustomers(): Promise<Customer[]> {
    const res = await firstValueFrom(this.http.get<ApiResponse<Customer[]>>(this.apiUrl));
    return res.data;
  }

  async getCustomerById(id: number): Promise<Customer> {
    const res = await firstValueFrom(
      this.http.get<ApiResponse<Customer>>(`${this.apiUrl}/${id}`),
    );
    return res.data;
  }

  async createCustomer(payload: CreateCustomerPayload): Promise<Customer> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<Customer>>(this.apiUrl, payload),
    );
    return res.data;
  }

  async updateCustomer(id: number, payload: UpdateCustomerPayload): Promise<Customer> {
    const res = await firstValueFrom(
      this.http.put<ApiResponse<Customer>>(`${this.apiUrl}/${id}`, payload),
    );
    return res.data;
  }

  async setCustomerStatus(id: number, isActive: boolean): Promise<Customer> {
    const res = await firstValueFrom(
      this.http.patch<ApiResponse<Customer>>(`${this.apiUrl}/${id}/status`, { isActive }),
    );
    return res.data;
  }
}
