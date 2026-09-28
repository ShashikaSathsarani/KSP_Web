// Product Routes (Public)
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const {
  escapeRegex,
  readNonNegativeNumber,
  readPositiveInteger,
  readQueryEnum,
  readQueryString,
} = require('../utils/queryValidation');

/**
 * GET /api/products
 * Get all products with filtering and pagination
 */
router.get('/', async (req, res) => {
  try {
    const page = readPositiveInteger(req.query.page, 1, 100000);
    const limit = readPositiveInteger(req.query.limit, 12, 100);
    const brand = readQueryString(req.query.brand, 100);
    const condition = readQueryEnum(req.query.condition, ['Brand New', 'Pre-Owned']);
    const productType = readQueryEnum(req.query.productType, ['Phones', 'Tablets', 'Earbuds', 'Smartwatches', 'Accessories']);
    const minPrice = readNonNegativeNumber(req.query.minPrice);
    const maxPrice = readNonNegativeNumber(req.query.maxPrice);
    const search = readQueryString(req.query.search, 100);
    const requestedSortBy = readQueryEnum(req.query.sortBy, ['createdAt', 'price', 'name']);
    const requestedSortOrder = readQueryEnum(req.query.sortOrder, ['ASC', 'DESC']);
    const sortBy = requestedSortBy === undefined || requestedSortBy === '' ? 'createdAt' : requestedSortBy;
    const sortOrder = requestedSortOrder === undefined || requestedSortOrder === '' ? 'DESC' : requestedSortOrder;
    const isNewArrival = readQueryEnum(req.query.isNewArrival, ['true', 'false']);
    const isPremiumDeal = readQueryEnum(req.query.isPremiumDeal, ['true', 'false']);

    if ([page, limit, brand, condition, productType, minPrice, maxPrice, search, sortBy, sortOrder, isNewArrival, isPremiumDeal].includes(null)
      || (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice)) {
      return res.status(400).json({ success: false, message: 'Invalid product query parameters' });
    }

    // Build filter object
    const filter = { isActive: true };

    if (brand) filter.brand = brand;
    if (condition) filter.condition = condition;
    if (productType) filter.productType = productType;

    if (isNewArrival !== undefined) filter.isNewArrival = isNewArrival === 'true';
    if (isPremiumDeal !== undefined) filter.isPremiumDeal = isPremiumDeal === 'true';

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = minPrice;
      if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: escapeRegex(search), $options: 'i' } },
        { brand: { $regex: escapeRegex(search), $options: 'i' } },
        { description: { $regex: escapeRegex(search), $options: 'i' } }
      ];
    }

    const offset = (page - 1) * limit;

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'DESC' ? -1 : 1;

    const products = await Product.find(filter)
      .sort(sortObj)
      .limit(limit)
      .skip(offset);

    const count = await Product.countDocuments(filter);

    res.json({
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
