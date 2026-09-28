/**
 * Payment Entity TypeScript Definition
 * Production Schema for MongoDB Atlas
 */

export interface Payment {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export type CreatePaymentDTO = Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdatePaymentDTO = Partial<CreatePaymentDTO>;
