/**
 * TABLES API Contract Specification
 * Endpoints and payload interfaces for Vercel Serverless runtime
 */

export interface TablesRequestPayload {
  [key: string]: unknown;
}

export interface TablesResponsePayload {
  success: boolean;
  data?: unknown;
  error?: string;
  timestamp: string;
}
