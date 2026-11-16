import { AirbnbStore, Review } from '../database/store.js';

export class ReviewsService {
  private store = AirbnbStore.getInstance();

  public getReviewsForListing(listingId: string): Review[] {
    return this.store.reviews.filter(r => r.listingId === listingId);
  }

  public addReview(listingId: string, guestId: string, guestName: string, rating: number, comment: string): Review {
    // Gate: guest must have a completed booking on this listing
    const hasCompletedStay = this.store.bookings.some(
      b => b.listingId === listingId && b.guestId === guestId && b.status === 'COMPLETED'
    );

    if (!hasCompletedStay) {
      const err = new Error('Review prohibited: verified reviews are permitted only following a completed stay');
      (err as any).statusCode = 403;
      throw err;
    }

    // Gate: single review per stay
    const existing = this.store.reviews.find(r => r.listingId === listingId && r.guestId === guestId);
    if (existing) {
      const err = new Error('A review has already been submitted for this stay');
      (err as any).statusCode = 409;
      throw err;
    }

    const review: Review = {
      id: `rev_${Date.now()}`,
      listingId,
      guestId,
      guestName,
      rating,
      comment,
      createdAt: new Date().toISOString()
    };

    this.store.reviews.push(review);
    return review;
  }
}
