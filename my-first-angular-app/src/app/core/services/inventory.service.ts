import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { InventoryMovement, InventoryOverview } from '@core/interfaces/inventory.interface';
import { environment } from '../../../environments/environments';

interface ApiResponse<T> {
  statusCode: number;
  success: boolean;
  message: string | null;
  data: T;
}

interface RegisterMovementPayload {
  quantity: number;
  description?: string;
}

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/inventory`;

  async listInventory(): Promise<InventoryOverview[]> {
    const res = await firstValueFrom(this.http.get<ApiResponse<InventoryOverview[]>>(this.apiUrl));
    return res.data;
  }

  async listMovements(): Promise<InventoryMovement[]> {
    const res = await firstValueFrom(
      this.http.get<ApiResponse<InventoryMovement[]>>(`${this.apiUrl}/movements`),
    );
    return res.data;
  }

  async registerIn(inventoryId: number, quantity: number, description?: string): Promise<InventoryOverview> {
    const payload: RegisterMovementPayload = { quantity, description };
    const res = await firstValueFrom(
      this.http.post<ApiResponse<InventoryOverview>>(
        `${this.apiUrl}/${inventoryId}/movements/in`,
        payload,
      ),
    );
    return res.data;
  }

  async registerOut(inventoryId: number, quantity: number, description?: string): Promise<InventoryOverview> {
    const payload: RegisterMovementPayload = { quantity, description };
    const res = await firstValueFrom(
      this.http.post<ApiResponse<InventoryOverview>>(
        `${this.apiUrl}/${inventoryId}/movements/out`,
        payload,
      ),
    );
    return res.data;
  }
}
