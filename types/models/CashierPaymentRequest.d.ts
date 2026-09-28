/**
 * CashierPaymentRequest Entity TypeScript Definition
 * Production Schema for MongoDB Atlas
 */

export interface CashierPaymentRequest {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export type CreateCashierPaymentRequestDTO = Omit<CashierPaymentRequest, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateCashierPaymentRequestDTO = Partial<CreateCashierPaymentRequestDTO>;
