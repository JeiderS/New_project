export interface SaleListItem {
  saleId: number;
  number: string;
  saleDate: string;
  origin: 'MANUAL' | 'WEB';
  total: number;
}

export interface SaleLine {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface SaleDetail {
  saleId: number;
  number: string;
  saleDate: string;
  origin: 'MANUAL' | 'WEB';
  total: number;
  lines: SaleLine[];
}
