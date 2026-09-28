/**
 * User Entity TypeScript Definition
 * Production Schema for MongoDB Atlas
 */

export interface User {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export type CreateUserDTO = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateUserDTO = Partial<CreateUserDTO>;
