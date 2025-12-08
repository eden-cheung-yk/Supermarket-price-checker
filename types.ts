
export interface ProductItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
}

export interface Receipt {
  id: string;
  storeName: string;
  date: string;
  totalAmount: number;
  items: ProductItem[];
  rawText?: string; // For debugging OCR
  createdAt: number;
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  SCANNER = 'SCANNER',
  HISTORY = 'HISTORY',
  PRICE_CHECK = 'PRICE_CHECK',
  SETTINGS = 'SETTINGS'
}

export interface PriceHistoryPoint {
  date: string;
  price: number;
  store: string;
}

export interface OnlinePrice {
  store: string;
  price: string; // Using string to handle currency symbols or ranges easily
  productName: string;
  url?: string;
}

export interface WeeklyDeal {
  store: string;
  item: string;
  price: string;
  description: string;
}
