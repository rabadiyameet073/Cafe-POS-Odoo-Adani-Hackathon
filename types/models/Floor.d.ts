/**
 * Floor Entity TypeScript Definition
 * Production Schema for MongoDB Atlas
 */

export interface Floor {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export type CreateFloorDTO = Omit<Floor, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateFloorDTO = Partial<CreateFloorDTO>;
