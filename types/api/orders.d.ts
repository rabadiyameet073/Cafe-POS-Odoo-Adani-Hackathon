/**
 * ORDERS API Contract Specification
 * Endpoints and payload interfaces for Vercel Serverless runtime
 */

export interface OrdersRequestPayload {
  [key: string]: unknown;
}

export interface OrdersResponsePayload {
  success: boolean;
  data?: unknown;
  error?: string;
  timestamp: string;
}
