/**
 * Table Entity TypeScript Definition
 * Production Schema for MongoDB Atlas
 */

export interface Table {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export type CreateTableDTO = Omit<Table, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateTableDTO = Partial<CreateTableDTO>;
