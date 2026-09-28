// Admin Report Routes (Protected - Admin Only)
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const User = require('../models/User');
const Product = require('../models/Product');
const { readQueryDate } = require('../utils/queryValidation');

/**
 * GET /api/admin/reports/sales
 * Get sales report (already implemented in adminOrderRoutes)
 * This is an alias to the main sales report
 */
router.get('/sales', async (req, res) => {
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
          averageOrderValue: { $avg: '$totalAmount' }
        }
      }
    ]);

    // Get daily sales
    const dailySales = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orderCount: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const stats = salesStats[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0
    };

    res.json({
      success: true,
      data: {
        summary: stats,
        dailySales
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
 * GET /api/admin/reports/revenue
 * Get revenue report with breakdown by product
 */
router.get('/revenue', async (req, res) => {
  try {
    const startDate = readQueryDate(req.query.startDate);
    const endDate = readQueryDate(req.query.endDate);
    if (startDate === null || endDate === null) {
      return res.status(400).json({ success: false, error: 'Invalid report date range' });
    }

    // Build match stage for date filtering
    const matchStage = { 'order.status': { $ne: 'Cancelled' } };
    const orderMatchStage = { status: { $ne: 'Cancelled' } };

    if (startDate || endDate) {
      orderMatchStage.createdAt = {};
      if (startDate) orderMatchStage.createdAt.$gte = new Date(startDate);
      if (endDate) orderMatchStage.createdAt.$lte = new Date(endDate);
    }

    // Get revenue by product
    const revenueByProduct = await OrderItem.aggregate([
      {
        $lookup: {
          from: 'orders',
          localField: 'orderId',
          foreignField: '_id',
          as: 'order'
        }
      },
      { $unwind: '$order' },
      { $match: orderMatchStage },
      {
        $group: {
          _id: '$productId',
          totalRevenue: { $sum: '$subtotal' },
          totalQuantitySold: { $sum: '$quantity' }
        }
      },
      { $sort: { totalRevenue: -1 } },
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
          totalRevenue: 1,
          totalQuantitySold: 1,
          averagePrice: {
            $divide: ['$totalRevenue', '$totalQuantitySold']
          }
        }
      }
    ]);

    // Get total revenue summary
    const revenueSummary = await Order.aggregate([
      { $match: orderMatchStage },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 },
          avgRevenuePerOrder: { $avg: '$totalAmount' }
        }
      }
    ]);

    const summary = revenueSummary[0] || {
      totalRevenue: 0,
      totalOrders: 0,
      avgRevenuePerOrder: 0
    };

    res.json({
      success: true,
      data: {
        summary,
        byProduct: revenueByProduct
      }
    });
  } catch (error) {
    console.error('Get revenue report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate revenue report'
    });
  }
});

/**
 * GET /api/admin/reports/customers
 * Get customer report
 */
router.get('/customers', async (req, res) => {
  try {
    // Total customers
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const activeCustomers = await User.countDocuments({ role: 'customer', isActive: true });

    // New customers this month
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    const newCustomersThisMonth = await User.countDocuments({
      role: 'customer',
      createdAt: { $gte: thisMonthStart }
    });

    // Top customers by orders
    const topCustomers = await Order.aggregate([
      {
        $group: {
          _id: '$userId',
          orderCount: { $sum: 1 },
          totalSpent: { $sum: '$totalAmount' }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          customerName: {
            $concat: ['$user.firstName', ' ', '$user.lastName']
          },
          email: '$user.email',
          orderCount: 1,
          totalSpent: 1,
          averageOrderValue: {
            $divide: ['$totalSpent', '$orderCount']
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalCustomers,
          activeCustomers,
          inactiveCustomers: totalCustomers - activeCustomers,
          newThisMonth: newCustomersThisMonth
        },
        topCustomers
      }
    });
  } catch (error) {
    console.error('Get customer report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate customer report'
    });
  }
});

/**
 * GET /api/admin/reports/inventory
 * Get inventory report
 */
router.get('/inventory', async (req, res) => {
  try {
    // Total products and total stock
    const inventory = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalStock: { $sum: '$quantity' },
          lowStockProducts: {
            $sum: {
              $cond: [{ $lt: ['$quantity', 5] }, 1, 0]
            }
          },
          outOfStockProducts: {
            $sum: {
              $cond: [{ $eq: ['$quantity', 0] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Low stock products (less than 5)
    const lowStockItems = await Product.find({ quantity: { $lt: 5, $gt: 0 } })
      .select('name brand sku quantity price')
      .sort({ quantity: 1 });

    // Out of stock products
    const outOfStockItems = await Product.find({ quantity: 0 })
      .select('name brand sku price')
      .sort({ name: 1 });

    // Products by stock level
    const stockLevels = await Product.aggregate([
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$quantity', 0] },
              'Out of Stock',
              {
                $cond: [
                  { $lt: ['$quantity', 5] },
                  'Low Stock (1-4)',
                  {
                    $cond: [
                      { $lt: ['$quantity', 20] },
                      'Medium (5-19)',
                      'Good (20+)'
                    ]
                  }
                ]
              }
            ]
          },
          count: { $sum: 1 },
          totalStock: { $sum: '$quantity' }
        }
      }
    ]);

    const summary = inventory[0] || {
      totalProducts: 0,
      totalStock: 0,
      lowStockProducts: 0,
      outOfStockProducts: 0
    };

    res.json({
      success: true,
      data: {
        summary,
        stockLevels,
        lowStockItems,
        outOfStockItems,
        itemCount: {
          lowStock: lowStockItems.length,
          outOfStock: outOfStockItems.length
        }
      }
    });
  } catch (error) {
    console.error('Get inventory report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate inventory report'
    });
  }
});

module.exports = router;
