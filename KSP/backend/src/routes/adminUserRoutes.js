// Admin User Routes (Protected - Admin Only)
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Order = require('../models/Order');
const { escapeRegex, readPositiveInteger, readQueryEnum, readQueryString } = require('../utils/queryValidation');

/**
 * GET /api/admin/users
 * Get all users with filtering and pagination
 */
router.get('/', async (req, res) => {
  try {
    const role = readQueryEnum(req.query.role, ['customer', 'admin']);
    const status = readQueryEnum(req.query.status, ['active', 'inactive']);
    const page = readPositiveInteger(req.query.page, 1, 100000);
    const limit = readPositiveInteger(req.query.limit, 10, 100);
    const search = readQueryString(req.query.search, 100);

    if ([role, status, page, limit, search].includes(null)) {
      return res.status(400).json({ success: false, message: 'Invalid user query parameters' });
    }

    // Build filter
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.isActive = status === 'active';
    if (search) {
      filter.$or = [
        { firstName: { $regex: escapeRegex(search), $options: 'i' } },
        { lastName: { $regex: escapeRegex(search), $options: 'i' } },
        { email: { $regex: escapeRegex(search), $options: 'i' } },
        { phone: { $regex: escapeRegex(search), $options: 'i' } }
      ];
    }

    // Count total
    const total = await User.countDocuments(filter);

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get users
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    // Get order counts for each user
    const userIds = users.map(u => u._id);
    const orderCounts = await Order.aggregate([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: '$userId', count: { $sum: 1 } } }
    ]);

    const orderCountMap = {};
    orderCounts.forEach(oc => {
      orderCountMap[oc._id.toString()] = oc.count;
    });

    const usersWithOrderCounts = users.map(u => ({
      ...u,
      orderCount: orderCountMap[u._id.toString()] || 0
    }));

    res.json({
      success: true,
      data: usersWithOrderCounts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

/**
 * PUT /api/admin/users/:userId/role
 * Update user role
 */
router.put('/:userId/role', async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Validate userId is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }

    // Validate role
    const validRoles = ['customer', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: `Invalid role. Must be one of: ${validRoles.join(', ')}`
      });
    }

    // Prevent changing own role
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot change your own role'
      });
    }

    // Find and update user
    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User role updated',
      data: user
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user role'
    });
  }
});

/**
 * PUT /api/admin/users/:userId/status
 * Activate/Deactivate user
 */
router.put('/:userId/status', async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    // Validate userId is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }

    // Validate isActive is boolean
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'isActive must be a boolean'
      });
    }

    // Prevent deactivating own account
    if (userId === req.user.id && !isActive) {
      return res.status(400).json({
        success: false,
        error: 'Cannot deactivate your own account'
      });
    }

    // Find and update user
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'}`,
      data: user
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user status'
    });
  }
});

/**
 * DELETE /api/admin/users/:userId
 * Permanently delete a user
 */
router.delete('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }

    // Prevent deleting own account (assuming req.user exists from authenticate midddleware)
    if (req.user && userId === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own admin account'
      });
    }

    // Check if user has any existing orders before deleting
    const orderCount = await Order.countDocuments({ userId: userId });
    if (orderCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete user because there are some orders'
      });
    }

    // Find and delete the user
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user'
    });
  }
});

module.exports = router;
