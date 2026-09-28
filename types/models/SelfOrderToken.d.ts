/**
 * SelfOrderToken Entity TypeScript Definition
 * Production Schema for MongoDB Atlas
 */

export interface SelfOrderToken {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export type CreateSelfOrderTokenDTO = Omit<SelfOrderToken, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateSelfOrderTokenDTO = Partial<CreateSelfOrderTokenDTO>;
