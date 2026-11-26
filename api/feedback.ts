import { handleFeedbackRequest } from '../src/utils/feedbackHandler';

export default {
  async fetch(request: Request): Promise<Response> {
    return handleFeedbackRequest(request);
  },
};
