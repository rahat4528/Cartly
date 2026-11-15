'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Star, ShoppingBag, ShieldCheck, CheckCircle2, AlertCircle, ArrowLeft, Heart } from 'lucide-react';

export default function BookDetailPage() {
  const params = useParams();
  const idOrSlug = params.id as string;
  const { user, token, refreshCartCount } = useAuth();

  const [book, setBook] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [selectedEdition, setSelectedEdition] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Review Form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchBookData();
  }, [idOrSlug]);

  const fetchBookData = async () => {
    setLoading(true);
    try {
      const data = await apiRequest(`/catalog/books/${idOrSlug}`);
      setBook(data);
      if (data.editions && data.editions.length > 0) {
        setSelectedEdition(data.editions[0]);
      }

      // Fetch related recommendations
      const recs = await apiRequest(`/catalog/books/${data.id}/recommendations`);
      setRecommendations(recs);
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'Book not found' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!token) {
      setActionMsg({ type: 'error', text: 'Please sign in to add this item to your cart.' });
      return;
    }
    if (!selectedEdition) return;

    setAddingToCart(true);
    try {
      await apiRequest('/cart/items', {
        method: 'POST',
        body: JSON.stringify({ editionId: selectedEdition.id, quantity })
      }, token);
      await refreshCartCount();
      setActionMsg({ type: 'success', text: `Added ${quantity} copy of ${selectedEdition.format} edition to cart.` });
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message });
    } finally {
      setAddingToCart(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setActionMsg({ type: 'error', text: 'Please sign in to submit a reader review.' });
      return;
    }

    setSubmittingReview(true);
    try {
      await apiRequest('/reviews', {
        method: 'POST',
        body: JSON.stringify({
          bookId: book.id,
          rating: reviewRating,
          title: reviewTitle,
          comment: reviewComment
        })
      }, token);
      setActionMsg({ type: 'success', text: 'Thank you! Your verified purchaser review has been published.' });
      setReviewTitle('');
      setReviewComment('');
      fetchBookData(); // reload reviews
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message });
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center font-sans text-gray-500">
        Loading volume particulars...
      </div>
    );
  }

  if (!book) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-serif">Volume Not Found</h2>
        <Link href="/" className="text-editorial-burgundy underline text-sm mt-4 inline-block">
          Return to Library Catalog
        </Link>
      </div>
    );
  }

  const isSelectedOutOfStock = !selectedEdition || selectedEdition.stock <= 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-serif">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-sans text-gray-500 hover:text-editorial-burgundy mb-8 transition">
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Catalog</span>
      </Link>

      {/* Alert banner */}
      {actionMsg && (
        <div className={`p-4 rounded mb-6 text-sm font-sans flex items-center gap-2 border ${
          actionMsg.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
            : 'bg-rose-50 text-rose-800 border-rose-300'
        }`}>
          {actionMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{actionMsg.text}</span>
        </div>
      )}

      {/* Main Book Detail Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
        {/* Cover Presentation Column */}
        <div className="md:col-span-5">
          <div className="border border-parchment-300 bg-white p-4 shadow-sm rounded-sm">
            <img
              src={book.coverImage}
              alt={book.title}
              className="w-full h-auto aspect-[2/3] object-cover rounded-sm shadow-md"
            />
          </div>

          {/* Book Physical Specifications */}
          <div className="mt-6 border-t border-parchment-200 pt-4 font-sans text-xs text-gray-600 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Publisher:</span>
              <span className="font-semibold text-gray-800">{book.publisher?.name} ({book.publisher?.country})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Publication Date:</span>
              <span>{new Date(book.publicationDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Language:</span>
              <span>{book.language}</span>
            </div>
            {selectedEdition && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-400">ISBN-13:</span>
                  <span className="font-mono">{selectedEdition.isbn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Length:</span>
                  <span>{selectedEdition.pages} pages</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Inventory SKU:</span>
                  <span className="font-mono">{selectedEdition.sku}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Content & Ordering Column */}
        <div className="md:col-span-7">
          <span className="text-xs uppercase tracking-widest font-sans font-bold text-editorial-burgundy">
            {book.category?.name}
          </span>
          <h1 className="text-3xl md:text-4xl font-bold font-serif text-parchment-900 mt-1 mb-2">
            {book.title}
          </h1>
          {book.subtitle && (
            <p className="text-lg italic font-serif text-gray-600 mb-4">{book.subtitle}</p>
          )}

          {/* Author Byline */}
          <div className="flex items-center gap-3 py-3 border-y border-parchment-200 my-4">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-parchment-200">
              {book.author?.photoUrl && (
                <img src={book.author.photoUrl} alt={book.author.name} className="w-full h-full object-cover" />
              )}
            </div>
            <div>
              <p className="text-xs font-sans text-gray-500 uppercase tracking-wider">Authored By</p>
              <p className="font-serif font-bold text-base text-parchment-900">{book.author?.name}</p>
            </div>
          </div>

          {/* Synopsis */}
          <div className="prose text-sm text-gray-700 leading-relaxed my-6 font-serif">
            <p>{book.synopsis}</p>
          </div>

          {/* Author Bio Box */}
          <div className="bg-parchment-100 border border-parchment-200 p-4 rounded text-xs font-sans text-gray-600 mb-8">
            <span className="font-bold text-gray-800 uppercase tracking-wider block mb-1">About the Author</span>
            <p className="leading-relaxed">{book.author?.bio}</p>
          </div>

          {/* Edition Selection Box */}
          <div className="border border-parchment-300 bg-white p-6 rounded-sm shadow-sm">
            <h3 className="text-xs font-sans font-bold uppercase tracking-widest text-gray-500 mb-4">
              Select Binding &amp; Format
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {book.editions?.map((edition: any) => {
                const isSelected = selectedEdition?.id === edition.id;
                const outOfStock = edition.stock <= 0;

                return (
                  <button
                    key={edition.id}
                    onClick={() => {
                      setSelectedEdition(edition);
                      setQuantity(1);
                    }}
                    className={`text-left p-3 rounded border transition ${
                      isSelected
                        ? 'border-editorial-burgundy bg-rose-50/40 ring-1 ring-editorial-burgundy'
                        : 'border-parchment-200 bg-parchment-50 hover:bg-parchment-100'
                    }`}
                  >
                    <div className="font-sans font-bold text-xs uppercase tracking-wider text-gray-900">
                      {edition.format}
                    </div>
                    <div className="text-base font-serif font-bold text-editorial-burgundy mt-1">
                      ${Number(edition.salePrice).toFixed(2)}
                    </div>
                    {edition.listPrice > edition.salePrice && (
                      <div className="text-[10px] text-gray-400 line-through font-sans">
                        ${Number(edition.listPrice).toFixed(2)}
                      </div>
                    )}
                    <div className="mt-2 text-[10px] font-sans">
                      {outOfStock ? (
                        <span className="text-red-600 font-bold">Sold Out</span>
                      ) : edition.stock <= 5 ? (
                        <span className="text-editorial-amber font-bold">Only {edition.stock} left</span>
                      ) : (
                        <span className="text-emerald-700">In Stock ({edition.stock})</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Price & Quantity Bar */}
            {selectedEdition && (
              <div className="pt-4 border-t border-parchment-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-sans text-gray-500">Qty:</label>
                  <select
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    disabled={isSelectedOutOfStock}
                    className="border border-parchment-300 rounded px-2.5 py-1.5 text-sm bg-white font-sans"
                  >
                    {[...Array(Math.min(selectedEdition.stock || 1, 10))].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                  </select>
                  <span className="text-xs text-gray-400 font-sans">
                    Subtotal: ${(Number(selectedEdition.salePrice) * quantity).toFixed(2)}
                  </span>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={isSelectedOutOfStock || addingToCart}
                  className={`w-full sm:w-auto px-6 py-3 rounded text-xs font-sans uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition ${
                    isSelectedOutOfStock
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-editorial-burgundy text-white hover:bg-red-900 shadow-sm'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{isSelectedOutOfStock ? 'Edition Sold Out' : addingToCart ? 'Reserving...' : 'Add to Shopping Bag'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reader Reviews & Verification Section */}
      <section className="mt-16 pt-12 border-t border-parchment-300">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-serif font-bold text-parchment-900">
                Verified Reader Reviews
              </h2>
              <p className="text-xs font-sans text-gray-500 mt-1">
                Feedback strictly verified from confirmed customers
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm font-sans bg-parchment-100 border border-parchment-200 px-3 py-1.5 rounded">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-gray-700">Verified Purchaser Gating</span>
            </div>
          </div>

          {/* Submit Review Form */}
          <div className="bg-white border border-parchment-300 p-6 rounded-sm mb-12 shadow-sm">
            <h3 className="font-serif font-bold text-base text-parchment-900 mb-2">
              Review this Literary Volume
            </h3>
            <p className="text-xs font-sans text-gray-500 mb-4">
              Note: Reviews are permitted only for accounts with a paid order containing this title.
            </p>

            <form onSubmit={handleReviewSubmit} className="space-y-4 font-sans text-sm">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1"
                    >
                      <Star
                        className={`w-5 h-5 ${star <= reviewRating ? 'text-amber-500 fill-current' : 'text-gray-300'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Review Headline
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Masterful synthesis of narrative and style"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  className="w-full border border-parchment-300 rounded px-3 py-2 text-sm bg-parchment-50 focus:outline-none focus:border-editorial-burgundy"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Written Feedback
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Share your critical thoughts on the text, edition binding, and prose..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full border border-parchment-300 rounded px-3 py-2 text-sm bg-parchment-50 focus:outline-none focus:border-editorial-burgundy font-serif"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="bg-parchment-900 text-parchment-100 hover:bg-editorial-burgundy px-5 py-2 rounded text-xs uppercase tracking-widest font-bold transition"
              >
                {submittingReview ? 'Submitting...' : 'Submit Reader Review'}
              </button>
            </form>
          </div>

          {/* Existing Reviews List */}
          <div className="space-y-6">
            {book.reviews && book.reviews.length > 0 ? (
              book.reviews.map((rev: any) => (
                <div key={rev.id} className="border-b border-parchment-200 pb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex text-amber-500">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-current' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                      <span className="font-bold font-serif text-sm text-parchment-900">{rev.title}</span>
                    </div>
                    <span className="text-[11px] font-sans text-gray-400">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="font-serif text-sm text-gray-700 mt-2 leading-relaxed">
                    {rev.comment}
                  </p>

                  <div className="mt-2 flex items-center gap-1.5 text-[11px] font-sans text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified Purchaser</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm font-sans text-gray-500 italic">
                No reader reviews published yet for this title. Be the first verified customer to share your thoughts.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Recommendations Carousel / Grid */}
      {recommendations.length > 0 && (
        <section className="mt-20 pt-12 border-t border-parchment-300">
          <h2 className="text-xl font-serif font-bold text-parchment-900 mb-6">
            Recommended Companion Readings
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {recommendations.map((rec) => (
              <Link
                key={rec.id}
                href={`/books/${rec.slug || rec.id}`}
                className="group border border-parchment-200 bg-white p-3 rounded hover:border-parchment-800 transition"
              >
                <img
                  src={rec.coverImage}
                  alt={rec.title}
                  className="w-full aspect-[2/3] object-cover rounded mb-2"
                />
                <h4 className="font-serif font-bold text-sm text-parchment-900 group-hover:text-editorial-burgundy line-clamp-1">
                  {rec.title}
                </h4>
                <p className="text-xs font-sans text-gray-500 mt-0.5">{rec.author?.name}</p>
                <p className="text-xs font-serif font-bold text-editorial-burgundy mt-1">
                  From ${rec.startingPrice.toFixed(2)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
