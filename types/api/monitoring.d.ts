/**
 * MONITORING API Contract Specification
 * Endpoints and payload interfaces for Vercel Serverless runtime
 */

export interface MonitoringRequestPayload {
  [key: string]: unknown;
}

export interface MonitoringResponsePayload {
  success: boolean;
  data?: unknown;
  error?: string;
  timestamp: string;
}
