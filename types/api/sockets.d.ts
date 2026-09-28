/**
 * SOCKETS API Contract Specification
 * Endpoints and payload interfaces for Vercel Serverless runtime
 */

export interface SocketsRequestPayload {
  [key: string]: unknown;
}

export interface SocketsResponsePayload {
  success: boolean;
  data?: unknown;
  error?: string;
  timestamp: string;
}
