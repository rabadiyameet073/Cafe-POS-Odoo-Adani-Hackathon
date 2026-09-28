/**
 * ProductVariant Entity TypeScript Definition
 * Production Schema for MongoDB Atlas
 */

export interface ProductVariant {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export type CreateProductVariantDTO = Omit<ProductVariant, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateProductVariantDTO = Partial<CreateProductVariantDTO>;
