/**
 * Product Entity TypeScript Definition
 * Production Schema for MongoDB Atlas
 */

export interface Product {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export type CreateProductDTO = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateProductDTO = Partial<CreateProductDTO>;
