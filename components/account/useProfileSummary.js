export default function useProfileSummary({ reviews = [], completedCount, rating }) {
  const numericRating =
    rating != null && !isNaN(Number(rating)) && Number(rating) > 0
      ? Number(rating).toFixed(1)
      : null;

  return {
    completedSuyosCount:
      completedCount == null ? '\u2014' : String(completedCount),
    displayRating:
      numericRating == null ? 'No ratings yet' : numericRating,
    dynamicFeedbacks: (reviews || []).map((review) => ({
      id: review.id || `${review.reviewer_id || 'rev'}-${review.created_at || Math.random()}`,
      author: review.reviewerName || 'Community member',
      score: Number(review.score || 5),
      comment: (review.comment || '').trim(),
      tags: Array.isArray(review.tags) ? review.tags : [],
      created_at: review.created_at || new Date().toISOString(),
    })),
  };
}
