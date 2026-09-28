/**
 * ALERTS API Contract Specification
 * Endpoints and payload interfaces for Vercel Serverless runtime
 */

export interface AlertsRequestPayload {
  [key: string]: unknown;
}

export interface AlertsResponsePayload {
  success: boolean;
  data?: unknown;
  error?: string;
  timestamp: string;
}
