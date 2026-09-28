// Review Routes (Protected)
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const authenticateToken = require('../middleware/authenticate');
const { readPositiveInteger, readQueryEnum } = require('../utils/queryValidation');

/**
 * GET /api/reviews/product/:productId
 * Get all reviews for a product
 */
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const page = readPositiveInteger(req.query.page, 1, 100000);
    const limit = readPositiveInteger(req.query.limit, 10, 100);
    const requestedSortBy = readQueryEnum(req.query.sortBy, ['createdAt', 'rating']);
    const requestedSortOrder = readQueryEnum(req.query.sortOrder, ['ASC', 'DESC']);
    const sortBy = requestedSortBy === undefined || requestedSortBy === '' ? 'createdAt' : requestedSortBy;
    const sortOrder = requestedSortOrder === undefined || requestedSortOrder === '' ? 'DESC' : requestedSortOrder;

    if ([page, limit, sortBy, sortOrder].includes(null)) {
      return res.status(400).json({ success: false, message: 'Invalid review query parameters' });
    }

    // Validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const offset = (page - 1) * limit;
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'DESC' ? -1 : 1;

    // Get reviews with user info
    const reviews = await Review.find({ productId })
      .populate('userId', 'firstName lastName')
      .sort(sortObj)
      .limit(limit)
      .skip(offset);

    const totalReviews = await Review.countDocuments({ productId });

    // Calculate average rating
    const ratingStats = await Review.aggregate([
      { $match: { productId: new mongoose.Types.ObjectId(productId) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratings: {
            $push: '$rating'
          }
        }
      }
    ]);

    const stats = ratingStats[0] || { averageRating: 0, totalReviews: 0 };

    // Calculate rating distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (ratingStats[0]?.ratings) {
      ratingStats[0].ratings.forEach(rating => {
        distribution[rating] = (distribution[rating] || 0) + 1;
      });
    }

    res.json({
      success: true,
      data: {
        reviews: reviews.map(review => ({
          _id: review._id,
          rating: review.rating,
          comment: review.comment,
          user: {
            name: review.userId ? `${review.userId.firstName} ${review.userId.lastName}` : 'Anonymous'
          },
          isVerifiedPurchase: review.isVerifiedPurchase,
          createdAt: review.createdAt
        })),
        averageRating: parseFloat(stats.averageRating.toFixed(1)),
        totalReviews: stats.totalReviews,
        distribution,
        pagination: {
          total: totalReviews,
          page,
          limit,
          totalPages: Math.ceil(totalReviews / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error.message
    });
  }
});

/**
 * POST /api/reviews
 * Submit a new review (Protected)
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!productId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Product ID, rating, and comment are required'
      });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({ productId, userId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product. You can update your existing review.'
      });
    }

    // Check if user purchased this product (verified purchase)
    const purchasedOrders = await Order.find({
      userId,
      status: { $in: ['delivered', 'confirmed', 'processing', 'shipped'] }
    }).select('_id');

    const orderIds = purchasedOrders.map(o => o._id);
    
    const hasPurchased = await OrderItem.exists({
      orderId: { $in: orderIds },
      productId
    });

    // Create review
    const review = await Review.create({
      productId,
      userId,
      rating: parseInt(rating),
      comment: comment.trim(),
      isVerifiedPurchase: !!hasPurchased
    });

    // Populate user info
    await review.populate('userId', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: {
        _id: review._id,
        rating: review.rating,
        comment: review.comment,
        userName: `${review.userId.firstName} ${review.userId.lastName}`,
        isVerifiedPurchase: review.isVerifiedPurchase,
        createdAt: review.createdAt
      }
    });
  } catch (error) {
    console.error('Submit review error:', error);
    
    // Handle duplicate review error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to submit review',
      error: error.message
    });
  }
});

/**
 * PUT /api/reviews/:reviewId
 * Update user's own review (Protected)
 */
router.put('/:reviewId', authenticateToken, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    // Validate reviewId
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID'
      });
    }

    // Find review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user owns this review
    if (review.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own reviews'
      });
    }

    // Validate rating
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Update review
    if (rating) review.rating = parseInt(rating);
    if (comment) review.comment = comment.trim();

    await review.save();
    await review.populate('userId', 'firstName lastName');

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: {
        _id: review._id,
        rating: review.rating,
        comment: review.comment,
        userName: `${review.userId.firstName} ${review.userId.lastName}`,
        isVerifiedPurchase: review.isVerifiedPurchase,
        createdAt: review.createdAt
      }
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review',
      error: error.message
    });
  }
});

/**
 * DELETE /api/reviews/:reviewId
 * Delete user's own review (Protected)
 */
router.delete('/:reviewId', authenticateToken, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    // Validate reviewId
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID'
      });
    }

    // Find and check ownership
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (review.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own reviews'
      });
    }

    await Review.findByIdAndDelete(reviewId);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review',
      error: error.message
    });
  }
});

/**
 * GET /api/reviews/latest
 * Get latest reviews across all products (Public)
 */
router.get('/latest', async (req, res) => {
  try {
    const limit = readPositiveInteger(req.query.limit, 5, 50);
    if (limit === null) {
      return res.status(400).json({ success: false, message: 'Invalid review query parameters' });
    }

    const reviews = await Review.find()
      .populate('userId', 'firstName lastName')
      .populate('productId', 'name brand imageUrl')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({
      success: true,
      data: {
        reviews: reviews.map(review => ({
          _id: review._id,
          rating: review.rating,
          comment: review.comment,
          user: {
            name: review.userId ? `${review.userId.firstName} ${review.userId.lastName}` : 'Anonymous'
          },
          product: {
            _id: review.productId?._id,
            name: review.productId?.name,
            brand: review.productId?.brand,
            imageUrl: review.productId?.imageUrl
          },
          isVerifiedPurchase: review.isVerifiedPurchase,
          createdAt: review.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Get latest reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch latest reviews',
      error: error.message
    });
  }
});

/**
 * GET /api/reviews/user/my-reviews
 * Get current user's reviews (Protected)
 */
router.get('/user/my-reviews', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = readPositiveInteger(req.query.page, 1, 100000);
    const limit = readPositiveInteger(req.query.limit, 10, 100);
    if (page === null || limit === null) {
      return res.status(400).json({ success: false, message: 'Invalid review query parameters' });
    }

    const offset = (page - 1) * limit;

    const reviews = await Review.find({ userId })
      .populate('productId', 'name brand imageUrl')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset);

    const totalReviews = await Review.countDocuments({ userId });

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          total: totalReviews,
          page,
          limit,
          totalPages: Math.ceil(totalReviews / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your reviews',
      error: error.message
    });
  }
});

module.exports = router;
