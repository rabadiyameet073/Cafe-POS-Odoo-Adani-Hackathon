/**
 * USERS API Contract Specification
 * Endpoints and payload interfaces for Vercel Serverless runtime
 */

export interface UsersRequestPayload {
  [key: string]: unknown;
}

export interface UsersResponsePayload {
  success: boolean;
  data?: unknown;
  error?: string;
  timestamp: string;
}
