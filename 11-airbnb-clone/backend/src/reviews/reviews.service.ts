import { store, Review } from '../database/store';
import { v4 as uuidv4 } from 'uuid';

export class ReviewsService {
  static createReview(
    guestId: string,
    listingId: string,
    rating: number,
    comment: string
  ): Review {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5 stars');
    }

    if (!comment || comment.trim().length < 5) {
      throw new Error('Review comment must be at least 5 characters');
    }

    // Review Verification Gate: Guest MUST have a COMPLETED booking on this listing
    const completedStay = store.bookings.find(
      b => b.listingId === listingId && b.guestId === guestId && b.status === 'COMPLETED'
    );

    if (!completedStay) {
      const err = new Error('Forbidden: verified reviews are permitted only following a completed stay');
      (err as any).statusCode = 403;
      throw err;
    }

    const guest = store.users.find(u => u.id === guestId);

    const review: Review = {
      id: `rev_${uuidv4().substring(0, 8)}`,
      listingId,
      guestId,
      guestName: guest?.name || 'Verified Traveler',
      rating,
      comment,
      createdAt: new Date().toISOString()
    };

    store.reviews.push(review);
    return review;
  }

  static getListingReviews(listingId: string): Review[] {
    return store.reviews.filter(r => r.listingId === listingId);
  }
}
