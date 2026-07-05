import { apiRequest } from "./client";

interface ReviewSummaryResponse {
  success: true;
  summary: string;
  cached: boolean;
}

export async function getReviewSummary(
  productId: string,
): Promise<ReviewSummaryResponse> {
  return apiRequest<ReviewSummaryResponse>(
    `/ai/review-summary/${productId}`,
    { auth: false },
  );
}
