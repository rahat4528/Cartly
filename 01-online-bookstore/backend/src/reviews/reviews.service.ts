import { BookstoreStore } from '../database/store.js';
import { v4 as uuidv4 } from 'uuid';

export class ReviewsService {
  private store = BookstoreStore.getInstance();

  createReview(params: {
    userId: string;
    bookId: string;
    rating: number;
    title: string;
    comment: string;
  }) {
    const { userId, bookId, rating, title, comment } = params;

    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be an integer between 1 and 5');
    }

    if (!title || !title.trim()) {
      throw new Error('Review title is required');
    }

    if (!comment || !comment.trim()) {
      throw new Error('Review comment is required');
    }

    // 1. Check Verified Purchaser Status
    const userPaidOrders = this.store.orders.filter(
      o => o.userId === userId && ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(o.status)
    );

    const hasPurchased = userPaidOrders.some(order => 
      order.items.some((item: any) => item.bookId === bookId)
    );

    if (!hasPurchased) {
      throw new Error('Verified Purchase Required: You can only submit a review for books you have purchased.');
    }

    // 2. Prevent duplicate reviews from the same user for the same book
    const existing = this.store.reviews.find(r => r.userId === userId && r.bookId === bookId);
    if (existing) {
      throw new Error('You have already submitted a review for this book.');
    }

    const user = this.store.findUser(userId);

    const review = {
      id: `rev_${uuidv4().substring(0, 8)}`,
      bookId,
      userId,
      authorName: user ? `${user.firstName} ${user.lastName.charAt(0)}.` : 'Reader',
      rating,
      title: title.trim(),
      comment: comment.trim(),
      isApproved: true, // auto-approved with admin moderation capability
      createdAt: new Date().toISOString()
    };

    this.store.reviews.push(review);
    return review;
  }

  getBookReviews(bookId: string) {
    return this.store.reviews
      .filter(r => r.bookId === bookId && r.isApproved)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getAllReviewsForAdmin() {
    return this.store.reviews.map(r => {
      const book = this.store.findBook(r.bookId);
      const user = this.store.findUser(r.userId);
      return {
        ...r,
        bookTitle: book ? book.title : 'Unknown Title',
        userEmail: user ? user.email : 'Unknown User'
      };
    });
  }

  moderateReview(reviewId: string, isApproved: boolean) {
    const review = this.store.reviews.find(r => r.id === reviewId);
    if (!review) {
      throw new Error(`Review ${reviewId} not found`);
    }
    review.isApproved = isApproved;
    return review;
  }
}
