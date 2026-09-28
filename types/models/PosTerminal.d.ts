/**
 * PosTerminal Entity TypeScript Definition
 * Production Schema for MongoDB Atlas
 */

export interface PosTerminal {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export type CreatePosTerminalDTO = Omit<PosTerminal, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdatePosTerminalDTO = Partial<CreatePosTerminalDTO>;
