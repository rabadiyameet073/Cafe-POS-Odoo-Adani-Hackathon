/**
 * SESSIONS API Contract Specification
 * Endpoints and payload interfaces for Vercel Serverless runtime
 */

export interface SessionsRequestPayload {
  [key: string]: unknown;
}

export interface SessionsResponsePayload {
  success: boolean;
  data?: unknown;
  error?: string;
  timestamp: string;
}
