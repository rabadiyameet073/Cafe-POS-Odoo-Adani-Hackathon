/**
 * FEEDBACK API Contract Specification
 * Endpoints and payload interfaces for Vercel Serverless runtime
 */

export interface FeedbackRequestPayload {
  [key: string]: unknown;
}

export interface FeedbackResponsePayload {
  success: boolean;
  data?: unknown;
  error?: string;
  timestamp: string;
}
