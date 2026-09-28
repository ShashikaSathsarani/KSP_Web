// Order Routes (Protected)
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

/**
 * GET /api/orders
 * Get user's orders
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all orders for user with populated data
    const orders = await Order.find({ userId })
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    // Get order items for each order and format for frontend
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await OrderItem.find({ orderId: order._id })
          .populate('productId', 'name brand price imageUrl');
        
        // Format items for frontend display
        const formattedItems = items.map(item => ({
          _id: item._id,
          product: item.productId ? {
            name: item.productId.name,
            brand: item.productId.brand,
            image: item.productId.imageUrl
          } : { name: 'Product Unavailable', image: null },
          quantity: item.quantity,
          price: parseFloat(item.pricePerUnit?.toString() || item.subtotal?.toString() || 0)
        }));

        // Format full shipping address
        const fullAddress = [order.shippingAddress, order.shippingCity, order.shippingProvince, order.shippingPostalCode]
          .filter(Boolean)
          .join(', ');

        return {
          _id: order._id,
          orderId: order.orderId,
          status: order.status,
          createdAt: order.createdAt,
          totalAmount: parseFloat(order.totalAmount?.toString() || 0),
          paymentMethod: order.paymentMethod === 'cash_on_delivery' ? 'cod' : 'card',
          paymentStatus: order.paymentStatus,
          shippingAddress: fullAddress,
          trackingNumber: order.trackingNumber,
          notes: order.notes,
          items: formattedItems
        };
      })
    );

    res.json({
      success: true,
      data: ordersWithItems
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
 * GET /api/orders/:orderId
 * Get order details
 */
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    // Validate orderId is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID'
      });
    }

    // Get order
    const order = await Order.findOne({ _id: orderId, userId })
      .populate('userId', 'firstName lastName email phone address city province');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Get order items
    const items = await OrderItem.find({ orderId: order._id })
      .populate('productId', 'name brand price imageUrl storage condition');

    // Format response for frontend
    const formattedItems = items.map(item => ({
      _id: item._id,
      productId: item.productId,
      product: item.productId ? {
        name: item.productId.name,
        brand: item.productId.brand,
        image: item.productId.imageUrl
      } : null,
      quantity: item.quantity,
      pricePerUnit: parseFloat(item.pricePerUnit?.toString() || 0),
      price: parseFloat(item.pricePerUnit?.toString() || 0),
      subtotal: parseFloat(item.subtotal?.toString() || 0)
    }));

    res.json({
      success: true,
      data: {
        _id: order._id,
        orderId: order.orderId,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        totalAmount: parseFloat(order.totalAmount?.toString() || 0),
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        shippingAddress: order.shippingAddress,
        shippingCity: order.shippingCity,
        shippingProvince: order.shippingProvince,
        shippingPostalCode: order.shippingPostalCode,
        trackingNumber: order.trackingNumber,
        notes: order.notes,
        user: order.userId,
        items: formattedItems
      }
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order'
    });
  }
});

/**
 * POST /api/orders/checkout
 * Create new order from cart
 */
router.post('/checkout', async (req, res) => {
  try {
    const userId = req.user.id;
    const { shippingAddress, city, province, postalCode, paymentMethod } = req.body;

    // Validate required fields
    if (!shippingAddress || !city || !province || !postalCode || !paymentMethod) {
      return res.status(400).json({
        success: false,
        error: 'All shipping and payment details are required'
      });
    }
    if (paymentMethod !== 'cash_on_delivery') {
      return res.status(400).json({
        success: false,
        error: 'Cart checkout currently supports cash on delivery only'
      });
    }

    // Get user's cart
    const cartItems = await Cart.find({ userId }).populate('productId');

    if (cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Cart is empty'
      });
    }

    // Calculate total and check stock
    let totalAmount = 0;
    for (const cartItem of cartItems) {
      if (cartItem.productId.quantity < cartItem.quantity) {
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for ${cartItem.productId.name}`
        });
      }
      totalAmount += parseFloat(cartItem.priceAtAdd) * cartItem.quantity;
    }

    // Create order
    const order = await Order.create({
      userId,
      shippingAddress,
      city,
      province,
      postalCode,
      paymentMethod,
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      status: 'Pending',
      paymentStatus: 'Pending'
    });

    // Create order items
    for (const cartItem of cartItems) {
      await OrderItem.create({
        orderId: order._id,
        productId: cartItem.productId._id,
        quantity: cartItem.quantity,
        pricePerUnit: cartItem.priceAtAdd,
        subtotal: parseFloat((cartItem.priceAtAdd * cartItem.quantity).toFixed(2))
      });

      // Reduce product stock
      await Product.findByIdAndUpdate(
        cartItem.productId._id,
        { $inc: { quantity: -cartItem.quantity } }
      );
    }

    // Clear user's cart
    await Cart.deleteMany({ userId });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order'
    });
  }
});

/**
 * POST /api/orders/direct
 * Create order directly from product page (without cart)
 */
router.post('/direct', async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      productId, 
      quantity, 
      shippingAddress, 
      shippingCity, 
      shippingProvince, 
      shippingPostalCode, 
      paymentMethod,
      notes,
      bankSlipUrl
    } = req.body;

    // Validate required fields
    if (!productId || !quantity || !shippingAddress || !shippingCity || !shippingProvince || !shippingPostalCode || !paymentMethod) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required: productId, quantity, shippingAddress, shippingCity, shippingProvince, shippingPostalCode, paymentMethod'
      });
    }
    if (!['cash_on_delivery', 'bank_slip'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported payment method'
      });
    }
    if (paymentMethod === 'bank_slip') {
      let bankSlipUrlIsValid = false;
      try {
        const url = new URL(bankSlipUrl);
        bankSlipUrlIsValid = url.protocol === 'https:'
          && url.hostname === 'res.cloudinary.com'
          && url.pathname.includes('/ksp_uploads/bank-slips/');
      } catch {}
      if (!bankSlipUrlIsValid) {
        return res.status(400).json({
          success: false,
          error: 'A valid Cloudinary bank slip URL is required'
        });
      }
    }

    // Get product details
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Check stock availability
    if (product.quantity < quantity) {
      return res.status(400).json({
        success: false,
        error: `Insufficient stock. Only ${product.quantity} items available.`
      });
    }

    // Calculate total
    const pricePerUnit = parseFloat(product.price);
    const subtotal = pricePerUnit * quantity;
    const totalAmount = parseFloat(subtotal.toFixed(2));

    // Generate order ID
    const { generateOrderId } = require('../utils/generators');
    const orderId = generateOrderId();

    // Create order
    const order = await Order.create({
      orderId,
      userId,
      totalAmount,
      status: 'pending',
      paymentMethod,
      paymentStatus: paymentMethod === 'bank_slip' ? 'pending_verification' : 'unpaid',
      bankSlipUrl: paymentMethod === 'bank_slip' ? bankSlipUrl : null,
      shippingAddress,
      shippingCity,
      shippingProvince,
      shippingPostalCode,
      notes: notes || null
    });

    // Create order item
    await OrderItem.create({
      orderId: order._id,
      productId: product._id,
      quantity,
      pricePerUnit,
      subtotal: totalAmount
    });

    // Reduce product stock
    await Product.findByIdAndUpdate(
      productId,
      { $inc: { quantity: -quantity } }
    );

    // Get the created order with items
    const orderItems = await OrderItem.find({ orderId: order._id })
      .populate('productId', 'name brand price imageUrl');

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: {
        ...order.toObject(),
        items: orderItems
      }
    });
  } catch (error) {
    console.error('Direct order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order'
    });
  }
});

/**
 * PUT /api/orders/:orderId/cancel
 * Cancel order
 */
router.put('/:orderId/cancel', async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    // Validate orderId is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID'
      });
    }

    // Find order
    const order = await Order.findOne({ _id: orderId, userId });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Check if order can be cancelled
    if (order.status === 'Completed' || order.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        error: `Cannot cancel order with status: ${order.status}`
      });
    }

    // Get order items to return stock
    const orderItems = await OrderItem.find({ orderId: order._id });

    // Return stock to products
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { quantity: item.quantity } }
      );
    }

    // Update order status
    order.status = 'Cancelled';
    order.paymentStatus = 'Refunded';
    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel order'
    });
  }
});

module.exports = router;
