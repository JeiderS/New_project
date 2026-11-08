export interface InventoryOverview {
  inventoryId: number;
  productId: number;
  productName: string;
  categoryName: string;
  quantity: number;
}

export interface InventoryMovement {
  id: number;
  productId: number;
  productName: string;
  movementType: 'IN' | 'OUT';
  quantity: number;
  /** Stock left right after this movement. */
  stockAfter: number;
  description: string | null;
  createdAt: string;
}
