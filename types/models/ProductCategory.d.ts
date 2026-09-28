/**
 * ProductCategory Entity TypeScript Definition
 * Production Schema for MongoDB Atlas
 */

export interface ProductCategory {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export type CreateProductCategoryDTO = Omit<ProductCategory, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateProductCategoryDTO = Partial<CreateProductCategoryDTO>;
