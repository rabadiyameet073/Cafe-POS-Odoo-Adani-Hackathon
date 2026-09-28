/**
 * PaymentMethod Entity TypeScript Definition
 * Production Schema for MongoDB Atlas
 */

export interface PaymentMethod {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export type CreatePaymentMethodDTO = Omit<PaymentMethod, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdatePaymentMethodDTO = Partial<CreatePaymentMethodDTO>;
