import { apiRequest, buildQueryString } from "./client";

export interface Review {
  id: string;
  user: { id: string; name: string } | string;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

interface ReviewsResponse {
  success: true;
  reviews: Review[];
  total: number;
  page: number;
  pages: number;
}

export interface GetReviewsParams {
  page?: number;
  limit?: number;
}

export async function getProductReviews(
  productId: string,
  params: GetReviewsParams = {},
): Promise<ReviewsResponse> {
  return apiRequest<ReviewsResponse>(
    `/products/${productId}/reviews${buildQueryString(params)}`,
    { auth: false },
  );
}
