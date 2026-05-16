export enum Unit {
  KG = 'kg',
  GRAM = 'gram',
  PACKET = 'pkt',
  PIECE = 'pc',
  BOTTLE = 'bottle',
  BOX = 'box',
  DABBA = 'डब्बा',
}

export interface Product {
  id: string;
  nameHi: string;
  nameEn: string;
  category: string;
  price: number; // Price per unit
  unit: Unit | string;
  variants?: string[];
  weightInGrams?: number; // For Gram to KG conversion
}

export interface BillItem {
  productId: string;
  name: string; // Hindi Name as primary
  nameEn?: string; // English Name
  quantity: number;
  unit: string;
  price: number;
  total: number;
  variant?: string;
  availableVariants?: string[];
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  pendingBalance: number;
  updatedAt: string;
}

export interface Bill {
  id: string;
  customerId?: string;
  customerName: string;
  items: BillItem[];
  subtotal: number;
  previousBalance: number;
  finalTotal: number;
  status?: string;
  timestamp: any; // Firestore timestamp
}
