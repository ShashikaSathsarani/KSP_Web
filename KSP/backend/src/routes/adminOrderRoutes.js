// Admin Order Routes (Protected - Admin Only)
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Payment = require('../models/Payment');
const Product = require('../models/Product');
const {
  escapeRegex,
  readPositiveInteger,
  readQueryDate,
  readQueryEnum,
  readQueryString,
} = require('../utils/queryValidation');

/**
 * GET /api/admin/orders
 * Get all orders with filtering and pagination
 */
router.get('/', async (req, res) => {
  try {
    const status = readQueryEnum(req.query.status, ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']);
    const paymentStatus = readQueryEnum(req.query.paymentStatus, ['unpaid', 'pending_verification', 'paid', 'failed', 'refunded']);
    const page = readPositiveInteger(req.query.page, 1, 100000);
    const limit = readPositiveInteger(req.query.limit, 10, 100);
    const search = readQueryString(req.query.search, 100);

    if ([status, paymentStatus, page, limit, search].includes(null)) {
      return res.status(400).json({ success: false, message: 'Invalid order query parameters' });
    }

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (search) {
      filter.$or = [
        { _id: mongoose.Types.ObjectId.isValid(search) ? new mongoose.Types.ObjectId(search) : null },
        { shippingAddress: { $regex: escapeRegex(search), $options: 'i' } },
        { city: { $regex: escapeRegex(search), $options: 'i' } }
      ].filter(clause => Object.values(clause)[0] !== null);
    }

    // Count total
    const total = await Order.countDocuments(filter);

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get orders
    const orders = await Order.find(filter)
      .populate('userId', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    // Get items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await OrderItem.find({ orderId: order._id })
          .populate('productId', 'name brand price imageUrl');
        return {
          ...order.toObject(),
          items,
          itemCount: items.length
        };
      })
    );

    res.json({
      success: true,
      data: ordersWithItems,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders'
    });
  }
});

/**
 * PUT /api/admin/orders/:orderId/status
 * Update order status
 */
router.put('/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    let { status } = req.body;

    // Validate orderId is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID'
      });
    }

    // Validate and normalize status (accept both lowercase and capitalized)
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    const normalizedStatus = status?.toLowerCase();
    
    if (!validStatuses.includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Find and update order
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status: normalizedStatus, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('userId', 'firstName lastName email');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    res.json({
      success: true,
      message: 'Order status updated',
      data: order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update order status'
    });
  }
});

/**
 * GET /api/admin/orders/pending-verification
 * Get all orders pending payment verification
 * NOTE: This route MUST be defined before /:orderId routes
 */
router.get('/pending-verification', async (req, res) => {
  try {
    const orders = await Order.find({ paymentStatus: 'pending_verification' })
      .populate('userId', 'firstName lastName email phone')
      .sort({ createdAt: -1 });

    // Get items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await OrderItem.find({ orderId: order._id })
          .populate('productId', 'name brand price imageUrl');
        return {
          ...order.toObject(),
          items,
          itemCount: items.length
        };
      })
    );

    res.json({
      success: true,
      data: ordersWithItems,
      count: ordersWithItems.length
    });
  } catch (error) {
    console.error('Get pending verification orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending verification orders'
    });
  }
});

/**
 * PUT /api/admin/orders/:orderId/tracking
 * Update tracking information
 */
router.put('/:orderId/tracking', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { trackingNumber, trackingUrl, carrier } = req.body;

    // Validate orderId is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID'
      });
    }

    // Find order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Update tracking info
    order.trackingNumber = trackingNumber || order.trackingNumber;
    order.trackingUrl = trackingUrl || order.trackingUrl;
    order.carrier = carrier || order.carrier;
    order.updatedAt = new Date();

    await order.save();

    res.json({
      success: true,
      message: 'Tracking information updated',
      data: order
    });
  } catch (error) {
    console.error('Update tracking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update tracking information'
    });
  }
});

/**
 * PUT /api/admin/orders/:orderId/verify-payment
 * Verify or reject payment (for bank slip and other methods)
 */
router.put('/:orderId/verify-payment', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { action, reason } = req.body; // action: 'approve' or 'reject'
    const adminId = req.user.id;

    // Validate orderId is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID'
      });
    }

    // Validate action
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action. Must be either "approve" or "reject"'
      });
    }

    // Find order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Update payment status based on action
    if (action === 'approve') {
      order.paymentStatus = 'paid';
      order.status = order.status === 'pending' ? 'confirmed' : order.status;
    } else {
      order.paymentStatus = 'failed';
      order.notes = order.notes 
        ? `${order.notes}\n\nPayment Rejected: ${reason || 'No reason provided'}` 
        : `Payment Rejected: ${reason || 'No reason provided'}`;
    }
    
    order.updatedAt = new Date();
    await order.save();

    res.json({
      success: true,
      message: action === 'approve' ? 'Payment verified successfully' : 'Payment rejected',
      data: order
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify payment'
    });
  }
});

/**
 * GET /api/admin/orders/reports/sales
 * Get sales report with stats
 */
router.get('/reports/sales', async (req, res) => {
  try {
    const startDate = readQueryDate(req.query.startDate);
    const endDate = readQueryDate(req.query.endDate);
    if (startDate === null || endDate === null) {
      return res.status(400).json({ success: false, error: 'Invalid report date range' });
    }

    // Build match stage for date filtering
    const matchStage = { status: { $ne: 'Cancelled' } };
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    // Get sales statistics
    const salesStats = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          averageOrderValue: { $avg: '$totalAmount' },
          minOrderValue: { $min: '$totalAmount' },
          maxOrderValue: { $max: '$totalAmount' }
        }
      }
    ]);

    // Get orders by status
    const ordersByStatus = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get orders by payment status
    const ordersByPaymentStatus = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Get top products ordered
    const topProducts = await OrderItem.aggregate([
      {
        $lookup: {
          from: 'orders',
          localField: 'orderId',
          foreignField: '_id',
          as: 'order'
        }
      },
      { $unwind: '$order' },
      { $match: { 'order.status': { $ne: 'Cancelled' } } },
      {
        $group: {
          _id: '$productId',
          totalQuantity: { $sum: '$quantity' },
          totalRevenue: { $sum: '$subtotal' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          productName: '$product.name',
          productBrand: '$product.brand',
          totalQuantity: 1,
          totalRevenue: 1,
          orderCount: 1
        }
      }
    ]);

    const stats = salesStats[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      minOrderValue: 0,
      maxOrderValue: 0
    };

    res.json({
      success: true,
      data: {
        summary: stats,
        ordersByStatus,
        ordersByPaymentStatus,
        topProducts
      }
    });
  } catch (error) {
    console.error('Get sales report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate sales report'
    });
  }
});

/**
 * DELETE /api/admin/orders/:orderId
 * Delete an order and its related records
 */
router.delete('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID'
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    const orderItems = await OrderItem.find({ orderId: order._id });
    const normalizedStatus = String(order.status || '').toLowerCase();
    const shouldRestock = !['delivered', 'cancelled'].includes(normalizedStatus);

    if (shouldRestock) {
      for (const item of orderItems) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { quantity: item.quantity }
        });
      }
    }

    await Payment.deleteOne({ orderId: order._id });
    await OrderItem.deleteMany({ orderId: order._id });
    await Order.findByIdAndDelete(orderId);

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete order'
    });
  }
});

module.exports = router;
