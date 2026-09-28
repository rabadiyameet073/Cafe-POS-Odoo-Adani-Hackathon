/**
 * TableTimerLog Entity TypeScript Definition
 * Production Schema for MongoDB Atlas
 */

export interface TableTimerLog {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export type CreateTableTimerLogDTO = Omit<TableTimerLog, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateTableTimerLogDTO = Partial<CreateTableTimerLogDTO>;
