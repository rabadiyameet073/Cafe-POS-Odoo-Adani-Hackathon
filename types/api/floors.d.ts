/**
 * FLOORS API Contract Specification
 * Endpoints and payload interfaces for Vercel Serverless runtime
 */

export interface FloorsRequestPayload {
  [key: string]: unknown;
}

export interface FloorsResponsePayload {
  success: boolean;
  data?: unknown;
  error?: string;
  timestamp: string;
}
