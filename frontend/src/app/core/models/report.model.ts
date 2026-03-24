export interface StockSnapshot {
  productId: string;
  currentQuantity: number;
  lastUpdated: string;
}

export interface MovementLog {
  id: string;
  productId: string;
  quantity: number;
  type: 'ENTRY' | 'EXIT';
  performedBy: string;
  timestamp: string;
}
