// Admin Product Routes (Protected - Admin Only)
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const authorizeAdmin = require('../middleware/authorize');
const {
  escapeRegex,
  readPositiveInteger,
  readQueryEnum,
  readQueryString,
} = require('../utils/queryValidation');

// Apply admin authorization to all routes
router.use(authorizeAdmin);

/**
 * GET /api/admin/products
 * Get all products (including inactive) for admin
 */
router.get('/', async (req, res) => {
  try {
    const page = readPositiveInteger(req.query.page, 1, 100000);
    const limit = readPositiveInteger(req.query.limit, 20, 100);
    const search = readQueryString(req.query.search, 100);
    const brand = readQueryString(req.query.brand, 100);
    const condition = readQueryEnum(req.query.condition, ['Brand New', 'Pre-Owned']);

    if ([page, limit, search, brand, condition].includes(null)) {
      return res.status(400).json({ success: false, message: 'Invalid product query parameters' });
    }
    
    const filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: escapeRegex(search), $options: 'i' } },
        { sku: { $regex: escapeRegex(search), $options: 'i' } },
        { brand: { $regex: escapeRegex(search), $options: 'i' } }
      ];
    }
    
    if (brand) filter.brand = brand;
    if (condition) filter.condition = condition;

    const offset = (page - 1) * limit;

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset);

    const count = await Product.countDocuments(filter);

    res.json({
      success: true,
      products,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: 'Error fetching products', error: error.message });
  }
});

/**
 * GET /api/admin/products/:id
 * Get single product by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, product });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ success: false, message: 'Error fetching product', error: error.message });
  }
});

/**
 * POST /api/admin/products
 * Create new product
 */
router.post('/', async (req, res) => {
  try {
    console.log('👤 Admin POST /products by user:', req.user);
    const {
      name,
      description,
      brand,
      price,
      storage = '128GB',
      condition = 'Brand New',
      color,
      ram,
      quantity = 0,
      imageUrl,
      sku,
      isNewArrival = false,
      isPremiumDeal = false,
      productType = 'Phones'
    } = req.body;

    console.log('📝 Creating product with body:', req.body);

    // Validate required fields
    if (!name || !brand || !price || !sku) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, brand, price, sku'
      });
    }

    // Check if SKU already exists
    const existingProduct = await Product.findOne({ sku });
    if (existingProduct) {
      return res.status(400).json({ success: false, message: 'SKU already exists' });
    }

    const product = await Product.create({
      name,
      description,
      brand,
      price: parseFloat(price),
      storage,
      condition,
      color,
      ram,
      quantity: parseInt(quantity) || 0,
      imageUrl,
      sku,
      isActive: true,
      isNewArrival: Boolean(isNewArrival),
      isPremiumDeal: Boolean(isPremiumDeal),
      productType
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ 
        success: false, 
        message: `Validation error: ${validationErrors.join(', ')}`,
        errors: error.errors 
      });
    }
    
    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }
    
    res.status(500).json({ success: false, message: 'Error creating product', error: error.message });
  }
});

/**
 * PUT /api/admin/products/:id
 * Update product
 */
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const {
      name,
      description,
      brand,
      price,
      storage,
      condition,
      color,
      ram,
      quantity,
      imageUrl,
      sku,
      isActive,
      isNewArrival,
      isPremiumDeal,
      productType
    } = req.body;

    // Check if new SKU conflicts with another product
    if (sku && sku !== product.sku) {
      const existingProduct = await Product.findOne({ sku });
      if (existingProduct) {
        return res.status(400).json({ success: false, message: 'SKU already exists' });
      }
    }

    // Update fields
    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (brand !== undefined) product.brand = brand;
    if (price !== undefined) product.price = price;
    if (storage !== undefined) product.storage = storage;
    if (condition !== undefined) product.condition = condition;
    if (color !== undefined) product.color = color;
    if (ram !== undefined) product.ram = ram;
    if (quantity !== undefined) product.quantity = quantity;
    if (imageUrl !== undefined) product.imageUrl = imageUrl;
    if (sku !== undefined) product.sku = sku;
    if (isActive !== undefined) product.isActive = isActive;
    if (isNewArrival !== undefined) product.isNewArrival = Boolean(isNewArrival);
    if (isPremiumDeal !== undefined) product.isPremiumDeal = Boolean(isPremiumDeal);
    if (productType !== undefined) product.productType = productType;

    await product.save();

    res.json({
      success: true,
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ success: false, message: 'Error updating product', error: error.message });
  }
});

/**
 * DELETE /api/admin/products/:id
 * Delete product (soft delete - sets isActive to false)
 */
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Soft delete - just mark as inactive
    product.isActive = false;
    await product.save();

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ success: false, message: 'Error deleting product', error: error.message });
  }
});

/**
 * DELETE /api/admin/products/:id/permanent
 * Permanently delete product from database
 */
router.delete('/:id/permanent', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({
      success: true,
      message: 'Product permanently deleted'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ success: false, message: 'Error deleting product', error: error.message });
  }
});

/**
 * GET /api/admin/products/stats/inventory
 * Get inventory report
 */
router.get('/stats/inventory', async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ isActive: true });
    const lowStock = await Product.countDocuments({ quantity: { $lte: 5, $gt: 0 }, isActive: true });
    const outOfStock = await Product.countDocuments({ quantity: 0, isActive: true });

    // Get brand stats
    const brandStats = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$brand',
          count: { $sum: 1 },
          totalStock: { $sum: '$quantity' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      inventory: {
        totalProducts,
        activeProducts,
        lowStock,
        outOfStock,
        brandStats: brandStats.map(b => ({ brand: b._id, count: b.count, totalStock: b.totalStock }))
      }
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ success: false, message: 'Error fetching inventory', error: error.message });
  }
});

module.exports = router;
