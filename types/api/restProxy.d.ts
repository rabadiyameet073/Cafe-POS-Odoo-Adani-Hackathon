/**
 * RESTPROXY API Contract Specification
 * Endpoints and payload interfaces for Vercel Serverless runtime
 */

export interface RestProxyRequestPayload {
  [key: string]: unknown;
}

export interface RestProxyResponsePayload {
  success: boolean;
  data?: unknown;
  error?: string;
  timestamp: string;
}
