/**
 * AUTH API Contract Specification
 * Endpoints and payload interfaces for Vercel Serverless runtime
 */

export interface AuthRequestPayload {
  [key: string]: unknown;
}

export interface AuthResponsePayload {
  success: boolean;
  data?: unknown;
  error?: string;
  timestamp: string;
}
