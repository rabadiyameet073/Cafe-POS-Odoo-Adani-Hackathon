/**
 * PAYMENTS API Contract Specification
 * Endpoints and payload interfaces for Vercel Serverless runtime
 */

export interface PaymentsRequestPayload {
  [key: string]: unknown;
}

export interface PaymentsResponsePayload {
  success: boolean;
  data?: unknown;
  error?: string;
  timestamp: string;
}
