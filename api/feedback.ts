import { handleFeedbackRequest } from '../src/utils/feedbackHandler.js';

export async function GET(request: Request): Promise<Response> {
  return handleFeedbackRequest(request);
}

export async function POST(request: Request): Promise<Response> {
  return handleFeedbackRequest(request);
}
