/**
 * OrderItem Entity TypeScript Definition
 * Production Schema for MongoDB Atlas
 */

export interface OrderItem {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export type CreateOrderItemDTO = Omit<OrderItem, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateOrderItemDTO = Partial<CreateOrderItemDTO>;
