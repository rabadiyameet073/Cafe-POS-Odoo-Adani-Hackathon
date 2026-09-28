/**
 * REPORTS API Contract Specification
 * Endpoints and payload interfaces for Vercel Serverless runtime
 */

export interface ReportsRequestPayload {
  [key: string]: unknown;
}

export interface ReportsResponsePayload {
  success: boolean;
  data?: unknown;
  error?: string;
  timestamp: string;
}
