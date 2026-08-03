export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  gstRate?: number; // Item-specific GST percentage (0%, 5%, 12%, 18%, 28%)
  image?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type DiscountType = 'percentage' | 'fixed';

export interface Discount {
  type: DiscountType;
  value: number;
}

export interface AppSettings {
  storeName: string;
  address: string;
  phone: string;
  gstEnabled: boolean;
  gstPercentage: number; // Fallback global GST rate
  currencySymbol: string;
  footerMessage: string;
  autoPrint: boolean;
  exportFolderUri?: string;
  exportFolderName?: string;
}

export interface InvoiceItemTaxBreakdown {
  productId: string;
  productName: string;
  gstRate: number;
  taxableAmount: number;
  taxAmount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  time: string;
  timestamp: number;
  items: CartItem[];
  subtotal: number;
  discount: Discount;
  discountAmount: number;
  taxableAmount: number;
  gstPercentage: number;
  gstAmount: number; // Total GST accumulated
  itemTaxes?: InvoiceItemTaxBreakdown[]; // Item-wise GST breakdown
  grandTotal: number;
  storeName: string;
  address: string;
  phone: string;
  footerMessage: string;
  currencySymbol: string;
  excelSavedPath?: string;
}

export interface BillingState {
  cart: CartItem[];
  products: Product[];
  discount: Discount;
  selectedCategory: string;
  searchQuery: string;
}

export interface SettingsState {
  settings: AppSettings;
  loading: boolean;
  error: string | null;
}

export interface InvoiceState {
  invoices: Invoice[];
  currentInvoice: Invoice | null;
  loading: boolean;
  error: string | null;
}

export interface ExcelExportReport {
  folderName: string;
  fileName: string;
  filePath: string;
  exportTime: string;
  recordCount: number;
}
