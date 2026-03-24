export interface StockResponse {
  productId: string;
  quantity: number;
}

export interface EntryRequest {
  productId: string;
  quantity: number;
  notes?: string;
}

export interface ExitRequest {
  productId: string;
  quantity: number;
  notes?: string;
}
