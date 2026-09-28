import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { FaStar, FaShoppingCart, FaBox, FaShieldAlt, FaCheckCircle } from 'react-icons/fa';
import { productService, reviewService, authService } from '../services/apiService';
import { resolveMediaUrl } from '../services/api';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    let isMounted = true;
    async function fetchProduct() {
      setLoading(true);
      setError('');
      try {
        const res = await productService.getProductById(id);
        const data = res.data?.product || res.data;
        if (!data) {
          throw new Error('Product not found');
        }
        if (isMounted) setProduct(data);
      } catch (err) {
        if (isMounted) setError(err.response?.data?.message || 'Failed to load product');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    if (id) fetchProduct();
    return () => { isMounted = false; };
  }, [id]);

  // Fetch reviews
  useEffect(() => {
    let isMounted = true;
    async function fetchReviews() {
      if (!id) return;
      setReviewsLoading(true);
      try {
        const res = await reviewService.getProductReviews(id);
        if (res.data.success && isMounted) {
          setReviews(res.data.data.reviews);
          setAverageRating(res.data.data.averageRating);
          setTotalReviews(res.data.data.totalReviews);
        }
      } catch (err) {
        console.error('Failed to load reviews:', err);
      } finally {
        if (isMounted) setReviewsLoading(false);
      }
    }
    fetchReviews();
    return () => { isMounted = false; };
  }, [id]);

  const imageSrc = useMemo(() => {
    const url = product?.imageUrl?.trim();
    if (!url) return 'https://via.placeholder.com/500x500?text=No+Image';
    return resolveMediaUrl(url);
  }, [product]);

  const inStock = (product?.quantity ?? 0) > 0;
  const rating = averageRating || 0;
  const reviewCount = totalReviews || 0;

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      navigate('/login', { state: { from: `/products/${id}` } });
      return;
    }

    setSubmittingReview(true);
    setReviewError('');
    setReviewSuccess('');

    try {
      const res = await reviewService.submitReview({
        productId: id,
        rating: reviewForm.rating,
        comment: reviewForm.comment
      });

      if (res.data.success) {
        setReviewSuccess('Review submitted successfully!');
        setReviewForm({ rating: 5, comment: '' });
        // Refresh reviews
        const reviewsRes = await reviewService.getProductReviews(id);
        if (reviewsRes.data.success) {
          setReviews(reviewsRes.data.data.reviews);
          setAverageRating(reviewsRes.data.data.averageRating);
          setTotalReviews(reviewsRes.data.data.totalReviews);
        }
        setTimeout(() => setReviewSuccess(''), 4000);
      }
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderStarRating = (rating, interactive = false, onRate = null) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          type={interactive ? "button" : undefined}
          onClick={() => interactive && onRate && onRate(i)}
          onMouseEnter={() => interactive && setHoveredRating(i)}
          onMouseLeave={() => interactive && setHoveredRating(0)}
          disabled={!interactive}
          className={interactive ? "cursor-pointer transition-transform hover:scale-110" : "cursor-default"}
        >
          <FaStar 
            className={
              i <= (interactive ? (hoveredRating || reviewForm.rating) : rating)
                ? 'text-yellow-400' 
                : 'text-gray-300'
            } 
          />
        </button>
      );
    }
    return <div className="flex gap-1">{stars}</div>;
  };

  if (loading) {
    return (
      <div className="bg-ksp-gray min-h-screen py-12">
        <div className="container mx-auto px-4">
          <div className="card p-8 text-center">Loading product…</div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="bg-ksp-gray min-h-screen py-12">
        <div className="container mx-auto px-4">
          <div className="card p-8 text-center">
            <p className="text-red-600 font-semibold mb-4">{error || 'Product not found'}</p>
            <Link to="/products" className="btn-primary">Back to Products</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-ksp-gray min-h-screen py-12">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <div className="mb-8 text-sm text-gray-600">
          <Link to="/" className="hover:text-ksp-red">Home</Link>
          <span className="mx-2">›</span>
          <Link to="/products" className="hover:text-ksp-red">Products</Link>
          <span className="mx-2">›</span>
          <Link to={`/products?brand=${encodeURIComponent(product.brand || '')}`} className="hover:text-ksp-red">{product.brand}</Link>
          <span className="mx-2">›</span>
          <span className="text-ksp-black font-semibold">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="card sticky top-20">
            <img
              src={imageSrc}
              alt={product.name}
              className="w-full h-full rounded block mx-auto object-contain"
              onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/500x500?text=No+Image'; }}
            />
            {!inStock && (
              <div className="mt-4 bg-red-100 border border-red-600 text-red-600 px-4 py-2 rounded text-center font-semibold">
                Out of Stock
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <div className="mb-4">
              <p className="text-gray-600 text-sm mb-2">{product.brand}</p>
              <h1 className="text-4xl font-bold text-ksp-black mb-3">{product.name}</h1>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-6">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <FaStar key={i} className={i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'} />
                  ))}
                </div>
                <span className="text-gray-600">({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})</span>
              </div>
            </div>

            {/* Price */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <p className="price-tag text-4xl">LKR {parseFloat(product.price).toLocaleString('en-LK')}</p>
            </div>

            {/* Description */}
            {product.description && (
              <div className="card mb-6">
                <h3 className="text-xl font-bold text-ksp-black mb-3">Description</h3>
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Specifications */}
            <div className="card mb-6">
              <h3 className="text-xl font-bold text-ksp-black mb-4">Specifications</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Storage:</span>
                  <span className="font-semibold text-ksp-black">{product.storage || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">RAM:</span>
                  <span className="font-semibold text-ksp-black">{product.ram || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Color:</span>
                  <span className="font-semibold text-ksp-black">{product.color || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Condition:</span>
                  <span className="badge-green">{product.condition || 'Brand New'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span className="font-semibold text-ksp-black">{product.productType || 'Phones'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Availability:</span>
                  <span className={`font-semibold ${inStock ? 'text-green-700' : 'text-red-700'}`}>{inStock ? 'In Stock' : 'Out of Stock'}</span>
                </div>
              </div>
            </div>

            {/* Add to Cart */}
            <div className="card mb-6">
              <h3 className="text-lg font-bold text-ksp-black mb-4">Quantity</h3>
              <div className="flex items-center gap-4 mb-6">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="btn-secondary px-4"
                >
                  −
                </button>
                <input
                  type="number"
                  value={quantity}
                  readOnly
                  className="w-16 text-center form-input"
                />
                <button
                  onClick={() => setQuantity(Math.min(product?.quantity || 1, quantity + 1))}
                  className="btn-secondary px-4"
                >
                  +
                </button>
              </div>
              <button
                className="btn-primary w-full mb-3 disabled:opacity-50"
                disabled={!inStock}
                onClick={() => navigate('/place-order', { state: { product, quantity } })}
              >
                <FaShoppingCart className="inline mr-2" />
                Place order
              </button>
              <button className="btn-secondary w-full">
                Save for Later
              </button>
            </div>

            {/* Features */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <FaBox className="text-ksp-red text-xl flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-ksp-black">Free Shipping</p>
                  <p className="text-sm text-gray-600">On orders over LKR 5,000</p>
                </div>
              </div>
              <div className="flex gap-3">
                <FaShieldAlt className="text-ksp-red text-xl flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-ksp-black">2 Year Warranty</p>
                  <p className="text-sm text-gray-600">Official manufacturer warranty included</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-ksp-black mb-8">Customer Reviews</h2>
          
          {/* Review Summary */}
          <div className="card mb-6">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-5xl font-bold text-ksp-black">{averageRating.toFixed(1)}</div>
                <div className="flex justify-center my-2">
                  {renderStarRating(averageRating)}
                </div>
                <div className="text-sm text-gray-600">{totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}</div>
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-4 mb-6">
            {reviewsLoading ? (
              <div className="card">
                <p className="text-center text-gray-600 py-12">Loading reviews...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="card">
                <p className="text-center text-gray-600 py-12">No reviews yet. Be the first to review this product!</p>
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review._id} className="card">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-bold text-ksp-black">{review.user?.name || 'Anonymous'}</h4>
                        {review.isVerifiedPurchase && (
                          <span className="badge-green text-xs">
                            <FaCheckCircle className="inline mr-1" />
                            Verified Purchase
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {renderStarRating(review.rating)}
                        <span className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                </div>
              ))
            )}
          </div>

          {/* Submit Review Form */}
          <div className="card mb-6">
            <h3 className="text-xl font-bold text-ksp-black mb-4">Write a Review</h3>
            {!currentUser ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">Please log in to write a review</p>
                <button 
                  onClick={() => navigate('/login', { state: { from: `/products/${id}` } })}
                  className="btn-primary"
                >
                  Log In
                </button>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-700 font-semibold mb-2">Your Rating</label>
                  {renderStarRating(reviewForm.rating, true, (rating) => setReviewForm({...reviewForm, rating}))}
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 font-semibold mb-2">Your Review</label>
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})}
                    rows="4"
                    className="form-input w-full"
                    placeholder="Share your thoughts about this product..."
                    maxLength="1000"
                    required
                  />
                  <div className="text-sm text-gray-500 text-right mt-1">
                    {reviewForm.comment.length}/1000 characters
                  </div>
                </div>
                {reviewSuccess && (
                  <div className="bg-green-100 border border-green-500 text-green-700 px-4 py-3 rounded mb-4">
                    <FaCheckCircle className="inline mr-2" />
                    {reviewSuccess}
                  </div>
                )}
                {reviewError && (
                  <div className="bg-red-100 border border-red-500 text-red-700 px-4 py-3 rounded mb-4">
                    {reviewError}
                  </div>
                )}
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={submittingReview || !reviewForm.comment.trim()}
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
