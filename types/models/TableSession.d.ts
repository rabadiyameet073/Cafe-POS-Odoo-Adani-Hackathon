/**
 * TableSession Entity TypeScript Definition
 * Production Schema for MongoDB Atlas
 */

export interface TableSession {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export type CreateTableSessionDTO = Omit<TableSession, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateTableSessionDTO = Partial<CreateTableSessionDTO>;
