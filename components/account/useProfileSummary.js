export default function useProfileSummary({ reviews, completedCount, rating }) {
  return {
    completedSuyosCount:
      completedCount == null ? '\u2014' : String(completedCount),
    displayRating:
      rating == null ? 'No ratings yet' : Number(rating).toFixed(1),
    dynamicFeedbacks: reviews.map((review) => ({
      id: review.id,
      author: review.reviewerName || 'Community member',
      score: Number(review.score),
      comment: (review.comment || '').trim(),
      created_at: review.created_at,
    })),
  };
}
