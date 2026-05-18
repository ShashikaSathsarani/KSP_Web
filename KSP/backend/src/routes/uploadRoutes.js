const express = require('express');
const router = express.Router();
const multer = require('multer');
const { Readable } = require('stream');
const cloudinary = require('../config/cloudinary');

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  try {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, JPG, PNG and WebP are allowed.'), false);
    }
  } catch (error) {
    console.error('File filter error:', error);
    cb(error, false);
  }
};

// Configure multer
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

const uploadBufferToCloudinary = (buffer, options = {}) => new Promise((resolve, reject) => {
  const opts = Object.assign({ folder: 'ksp_uploads/products', resource_type: 'image' }, options);
  const uploadStream = cloudinary.uploader.upload_stream(
    opts,
    (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(result);
    }
  );

  Readable.from(buffer).pipe(uploadStream);
});

/**
 * POST /api/upload/product-image
 * Upload a product image to Cloudinary
 */
router.post('/product-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded or unable to read image data'
      });
    }

    const uploadResult = await uploadBufferToCloudinary(req.file.buffer, {
      folder: 'ksp_uploads/products'
    });

    console.log('✅ Image uploaded to Cloudinary:', {
      originalName: req.file.originalname,
      size: req.file.size,
      publicId: uploadResult.public_id,
      url: uploadResult.secure_url
    });

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl: uploadResult.secure_url,
      secure_url: uploadResult.secure_url,
      public_id: uploadResult.public_id
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading image',
      error: error.message
    });
  }
});

// Configure multer for bank slips
const bankSlipFileFilter = (req, file, cb) => {
  try {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, JPG, PNG, WebP and PDF are allowed.'), false);
    }
  } catch (error) {
    console.error('Bank slip file filter error:', error);
    cb(error, false);
  }
};

const bankSlipUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: bankSlipFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max for bank slips
  }
});

/**
 * POST /api/upload/bank-slip
 * Upload a bank slip image for payment verification
 */
router.post('/bank-slip', bankSlipUpload.single('slip'), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: 'No bank slip file provided'
      });
    }

    const uploadResult = await uploadBufferToCloudinary(req.file.buffer, {
      folder: 'ksp_uploads/bank-slips',
      resource_type: 'auto'
    });

    console.log('✅ Bank slip uploaded to Cloudinary:', {
      originalName: req.file.originalname,
      size: req.file.size,
      publicId: uploadResult.public_id,
      url: uploadResult.secure_url
    });

    res.json({
      success: true,
      message: 'Bank slip uploaded successfully',
      bankSlipUrl: uploadResult.secure_url,
      filename: uploadResult.public_id
    });
  } catch (error) {
    console.error('Bank slip upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading bank slip',
      error: error.message
    });
  }
});

// Error handling for multer
router.use((error, req, res, next) => {
  console.error('Upload middleware error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB for products and 10MB for bank slips.'
      });
    }
    if (error.code === 'LIMIT_PART_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many parts'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files'
      });
    }
  }
  
  // Handle file filter errors (invalid file type)
  if (error.message && error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  res.status(500).json({
    success: false,
    message: error.message || 'File upload error',
    error: error.message
  });
});

module.exports = router;