/**
 * ReportCache Entity TypeScript Definition
 * Production Schema for MongoDB Atlas
 */

export interface ReportCache {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export type CreateReportCacheDTO = Omit<ReportCache, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateReportCacheDTO = Partial<CreateReportCacheDTO>;
