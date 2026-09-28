const express = require('express');
const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Order = require('../models/Order');

const router = express.Router();

router.post('/', async (req, res) => {
  const { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } = process.env;
  const signature = req.get('stripe-signature');

  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    return res.status(503).json({ success: false, error: 'Stripe webhook is not configured' });
  }
  if (!signature || !Buffer.isBuffer(req.body)) {
    return res.status(400).json({ success: false, error: 'A signed raw Stripe request is required' });
  }

  let event;
  try {
    const stripe = require('stripe')(STRIPE_SECRET_KEY);
    event = stripe.webhooks.constructEvent(req.body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    return res.status(400).json({ success: false, error: 'Invalid Stripe webhook signature' });
  }

  if (!['payment_intent.succeeded', 'payment_intent.payment_failed'].includes(event.type)) {
    return res.json({ received: true });
  }

  try {
    const intent = event.data.object;
    const orderId = intent.metadata?.orderId;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, error: 'Stripe event is missing a valid order reference' });
    }

    const order = await Order.findById(orderId);
    if (!order || order.paymentMethod !== 'stripe') {
      return res.status(404).json({ success: false, error: 'Stripe order not found' });
    }

    const succeeded = event.type === 'payment_intent.succeeded';
    if (!succeeded && order.paymentStatus === 'paid') {
      return res.json({ received: true });
    }

    order.paymentStatus = succeeded ? 'paid' : 'failed';
    if (succeeded && order.status !== 'cancelled') order.status = 'confirmed';
    await order.save();

    await Payment.findOneAndUpdate(
      { orderId: order._id },
      {
        $set: {
          paymentMethod: 'stripe',
          amount: order.totalAmount,
          status: succeeded ? 'completed' : 'failed',
          transactionId: intent.id,
          paymentReference: intent.id,
          metadata: { stripeEventId: event.id, stripeEventType: event.type }
        },
        $setOnInsert: { orderId: order._id }
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return res.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook processing failed:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to process Stripe event' });
  }
});

module.exports = router;