import { z } from 'zod';
import { apiClient } from './client';

// ---------- Response schemas ----------

const ReviewSchema = z.object({
  id: z.string(),
  client: z.object({
    name: z.string(),
    profilePhotoUrl: z.string().nullable(),
  }),
  rating: z.number(),
  comment: z.string().nullable(),
  relativeTime: z.string(),
  createdAt: z.string(),
});

const ReviewsListResponseSchema = z.object({
  barber: z.object({
    id: z.string(),
    name: z.string(),
    averageRating: z.number().nullable(),
    totalReviews: z.number(),
  }),
  reviews: z.array(ReviewSchema),
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
});

const RatingBreakdownSchema = z.object({
  rating: z.number(),
  count: z.number(),
  percentage: z.number(),
});

const ReviewsAnalyticsSchema = z.object({
  totalReviews: z.number(),
  averageRating: z.number().nullable(),
  ratingsBreakdown: z.array(RatingBreakdownSchema),
});

// ---------- Public types ----------

export type Review = z.infer<typeof ReviewSchema>;
export type ReviewsListResponse = z.infer<typeof ReviewsListResponseSchema>;
export type ReviewsAnalytics = z.infer<typeof ReviewsAnalyticsSchema>;

export interface ListReviewsParams {
  cursor?: string;
  limit?: number;
  rating?: number;
}

interface RequestOptions {
  signal?: AbortSignal;
}

// ---------- Helpers ----------

function extractPayload<T>(res: unknown): T {
  if (res && typeof res === 'object' && 'data' in res) {
    return (res as { data: T }).data;
  }
  return res as T;
}

// ---------- Endpoints ----------

export async function listReviews(
  params: ListReviewsParams = {},
  opts: RequestOptions = {},
): Promise<ReviewsListResponse> {
  const { data: res } = await apiClient.get('/barber/reviews', {
    params,
    signal: opts.signal,
  });
  return ReviewsListResponseSchema.parse(extractPayload(res));
}

export async function getReviewsAnalytics(
  opts: RequestOptions = {},
): Promise<ReviewsAnalytics> {
  const { data: res } = await apiClient.get('/barber/reviews/analytics', {
    signal: opts.signal,
  });
  return ReviewsAnalyticsSchema.parse(extractPayload(res));
}
