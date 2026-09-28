require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/mongodb');
const authenticateToken = require('./middleware/authenticate');
const authorizeAdmin = require('./middleware/authorize');
const errorHandler = require('./middleware/errorHandler');

const app = express();

const isProduction = process.env.NODE_ENV === 'production';
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be configured before the server can start.');
}
if (isProduction && !process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI must be configured in production.');
}
if (isProduction && process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters in production.');
}

const configuredOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
  .map((origin) => {
    try {
      const parsedOrigin = new URL(origin);
      if (!['http:', 'https:'].includes(parsedOrigin.protocol)) {
        throw new Error('Origin must use HTTP or HTTPS.');
      }
      return parsedOrigin.origin;
    } catch {
      throw new Error(`Invalid CORS_ORIGIN value: ${origin}`);
    }
  });

if (isProduction && configuredOrigins.length === 0) {
  throw new Error('CORS_ORIGIN must contain at least one allowed origin in production.');
}

const allowedOrigins = new Set([
  ...configuredOrigins,
  ...(isProduction ? [] : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'])
]);

// Connect to MongoDB
connectDB();

// Security Middleware - Allow images to load
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    callback(null, allowedOrigins.has(origin));
  },
  credentials: true,
  optionsSuccessStatus: 200
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit login/register attempts
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again later.'
});

app.use('/api/', limiter);
// Only apply strict rate limit to login and register endpoints, not profile
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

// Stripe requires the exact raw request body to verify webhook signatures.
app.use('/api/payments/stripe-webhook', express.raw({ type: 'application/json' }), require('./routes/stripeWebhookRoute'));

// Body Parsing Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health Check Endpoint
app.get('/health', (req, res) => {
  try {
    res.json({
      status: 'API is running',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Health check failed'
    });
  }
});

// Serve static files (uploaded images) with CORS headers
const path = require('path');
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, '../uploads')));

app.use('/images', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, '../public/images')));

// API Routes
// Authentication Routes (public)
app.use('/api/auth', require('./routes/authRoutes'));

// Upload Routes (protected)
app.use('/api/upload', authenticateToken, require('./routes/uploadRoutes'));

// Protected Routes
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/cart', authenticateToken, require('./routes/cartRoutes'));
app.use('/api/orders', authenticateToken, require('./routes/orderRoutes'));
app.use('/api/payments', authenticateToken, require('./routes/paymentRoutes'));
app.use('/api/subscriptions', authenticateToken, require('./routes/subscriptionRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));

// Admin Routes (protected)
app.use('/api/admin/products', authenticateToken, authorizeAdmin, require('./routes/adminProductRoutes'));
app.use('/api/admin/orders', authenticateToken, authorizeAdmin, require('./routes/adminOrderRoutes'));
app.use('/api/admin/users', authenticateToken, authorizeAdmin, require('./routes/adminUserRoutes'));
app.use('/api/admin/reports', authenticateToken, authorizeAdmin, require('./routes/adminReportRoutes'));
app.use('/api/admin/subscriptions', authenticateToken, authorizeAdmin, require('./routes/adminSubscriptionRoutes'));

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error Handler Middleware
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
