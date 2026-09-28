/**
 * Feedback Entity TypeScript Definition
 * Production Schema for MongoDB Atlas
 */

export interface Feedback {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export type CreateFeedbackDTO = Omit<Feedback, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateFeedbackDTO = Partial<CreateFeedbackDTO>;
