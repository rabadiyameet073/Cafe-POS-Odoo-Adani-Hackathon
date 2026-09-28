/**
 * KitchenOrder Entity TypeScript Definition
 * Production Schema for MongoDB Atlas
 */

export interface KitchenOrder {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export type CreateKitchenOrderDTO = Omit<KitchenOrder, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateKitchenOrderDTO = Partial<CreateKitchenOrderDTO>;
