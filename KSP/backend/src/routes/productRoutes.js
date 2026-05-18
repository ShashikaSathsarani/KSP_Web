// Product Routes (Public)
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

/**
 * GET /api/products
 * Get all products with filtering and pagination
 */
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      brand, 
      condition,
      productType,
      minPrice, 
      maxPrice,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      isNewArrival,
      isPremiumDeal
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    if (brand) filter.brand = brand;
    if (condition) filter.condition = condition;
    if (productType) filter.productType = productType;

    if (isNewArrival === 'true') filter.isNewArrival = true;
    if (isPremiumDeal === 'true') filter.isPremiumDeal = true;

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'DESC' ? -1 : 1;

    const products = await Product.find(filter)
      .sort(sortObj)
      .limit(parseInt(limit))
      .skip(offset);

    const count = await Product.countDocuments(filter);

    res.json({
      products,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
});

/**
 * GET /api/products/brands
 * Get all unique brands
 */
router.get('/brands', async (req, res) => {
  try {
    const brands = await Product.distinct('brand', { isActive: true });
    res.json(brands.sort());
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ message: 'Error fetching brands', error: error.message });
  }
});

/**
 * GET /api/products/:id
 * Get product by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
});

/**
 * DELETE /api/products/:id
 * Delete a product by ID
 */
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
});

module.exports = router;
