/**
 * KITCHEN API Contract Specification
 * Endpoints and payload interfaces for Vercel Serverless runtime
 */

export interface KitchenRequestPayload {
  [key: string]: unknown;
}

export interface KitchenResponsePayload {
  success: boolean;
  data?: unknown;
  error?: string;
  timestamp: string;
}
