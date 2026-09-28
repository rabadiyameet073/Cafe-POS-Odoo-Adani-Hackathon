/**
 * Order Entity TypeScript Definition
 * Production Schema for MongoDB Atlas
 */

export interface Order {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export type CreateOrderDTO = Omit<Order, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateOrderDTO = Partial<CreateOrderDTO>;
