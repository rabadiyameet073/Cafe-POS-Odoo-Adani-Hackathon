/**
 * CART API Contract Specification
 * Endpoints and payload interfaces for Vercel Serverless runtime
 */

export interface CartRequestPayload {
  [key: string]: unknown;
}

export interface CartResponsePayload {
  success: boolean;
  data?: unknown;
  error?: string;
  timestamp: string;
}
