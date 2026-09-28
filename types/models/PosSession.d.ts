/**
 * PosSession Entity TypeScript Definition
 * Production Schema for MongoDB Atlas
 */

export interface PosSession {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export type CreatePosSessionDTO = Omit<PosSession, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdatePosSessionDTO = Partial<CreatePosSessionDTO>;
