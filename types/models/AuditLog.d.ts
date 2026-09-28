/**
 * AuditLog Entity TypeScript Definition
 * Production Schema for MongoDB Atlas
 */

export interface AuditLog {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export type CreateAuditLogDTO = Omit<AuditLog, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateAuditLogDTO = Partial<CreateAuditLogDTO>;
