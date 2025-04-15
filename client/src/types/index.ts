export type UserRole = 'supplier' | 'buyer';

export interface User {
  id: string;
  email: string;
  role: UserRole;
}

export interface Invoice {
  id: number;
  invoiceId: string;
  invoiceAmount: number;
  invoiceDate: string;
  dueDate: string;
  buyerName: string;
  status: 'pending' | 'completed';
  supplierId: string;
  createdAt: string;
}

export interface DiscountOffer {
  id: number;
  invoiceId: string;
  invoice: Invoice;
  originalAmount: number;
  discountRate: number;
  discountedAmount: number;
  discountValue: number;
  earlyPaymentDate: string;
  dcfValue: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  supplierId: string;
  supplierName: string;
}

export interface InvoiceCSV {
  InvoiceID: string;
  InvoiceAmount: string;
  InvoiceDate: string;
  DueDate: string;
  BuyerName: string;
  Status: string;
}

export interface AutoApprovalSettings {
  enabled: boolean;
  maxDiscountRate: number;
  maxAmount: number;
}

export interface KPISummary {
  invoiceCount: number;
  discountValue: number;
  avgDiscountRate: number;
}
