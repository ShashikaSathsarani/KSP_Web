import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { orderService, authService } from '../services/apiService';
import api, { resolveMediaUrl } from '../services/api';
import { Upload, CheckCircle, FileText, X } from 'lucide-react';

const PlaceOrder = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { product, quantity } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [uploadingBankSlip, setUploadingBankSlip] = useState(false);
  const [bankSlipPreview, setBankSlipPreview] = useState(null);
  const [bankSlipUrl, setBankSlipUrl] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    shippingAddress: '',
    shippingCity: '',
    shippingProvince: '',
    shippingPostalCode: '',
    paymentMethod: 'cash_on_delivery',
    notes: ''
  });

  // Check if user is logged in
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }
    // Pre-fill user data if available
    if (user) {
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        shippingAddress: user.address || '',
        shippingCity: user.city || '',
        shippingProvince: user.province || ''
      }));
    }
  }, [navigate, location]);

  // Redirect if no product data
  useEffect(() => {
    if (!product) {
      navigate('/products');
    }
  }, [product, navigate]);

  const imageSrc = useMemo(() => {
    const url = product?.imageUrl?.trim();
    if (!url) return 'https://via.placeholder.com/150x150?text=No+Image';
    return resolveMediaUrl(url);
  }, [product]);

  const subtotal = product ? parseFloat(product.price) * quantity : 0;
  const shipping = subtotal > 5000 ? 0 : 350;
  const total = subtotal + shipping;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear bank slip when switching payment method
    if (name === 'paymentMethod' && value !== 'bank_slip') {
      setBankSlipUrl('');
      setBankSlipPreview(null);
    }
  };

  // Handle bank slip upload
  const handleBankSlipUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Only JPEG, PNG, WebP and PDF are allowed.');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum size is 10MB.');
      return;
    }

    // Show preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setBankSlipPreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setBankSlipPreview('pdf');
    }

    // Upload file
    setUploadingBankSlip(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('slip', file);
      
      const response = await api.post('/upload/bank-slip', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.success) {
        setBankSlipUrl(response.data.bankSlipUrl);
      } else {
        setError('Failed to upload bank slip');
        setBankSlipPreview(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error uploading bank slip');
      setBankSlipPreview(null);
    } finally {
      setUploadingBankSlip(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate bank slip for bank_slip payment
    if (formData.paymentMethod === 'bank_slip' && !bankSlipUrl) {
      setError('Please upload your bank slip before placing the order');
      setLoading(false);
      return;
    }

    try {
      const orderData = {
        productId: product._id,
        quantity,
        shippingAddress: formData.shippingAddress,
        shippingCity: formData.shippingCity,
        shippingProvince: formData.shippingProvince,
        shippingPostalCode: formData.shippingPostalCode,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        bankSlipUrl: formData.paymentMethod === 'bank_slip' ? bankSlipUrl : null
      };

      const response = await orderService.createDirectOrder(orderData);
      
      if (response.data.success) {
        setSuccess(true);
        setOrderId(response.data.data.orderId);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!product) {
    return null;
  }

  if (success) {
    return (
      <div className="bg-ksp-gray min-h-screen py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto card text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-ksp-black mb-2">Order Placed Successfully!</h1>
              <p className="text-gray-600">Thank you for your order.</p>
            </div>
            
            <div className="bg-ksp-gray rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">Order ID</p>
              <p className="text-xl font-bold text-ksp-black">{orderId}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/profile" state={{ activeTab: 'orders' }} className="btn-primary">
                View My Orders
              </Link>
              <Link to="/products" className="btn-secondary">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-ksp-gray min-h-screen py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8 text-ksp-black">Place Order</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit}>
              {/* Personal Information */}
              <div className="card mb-6">
                <h2 className="text-2xl font-bold text-ksp-black mb-6">Personal Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="form-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="form-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="form-input"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="card mb-6">
                <h2 className="text-2xl font-bold text-ksp-black mb-6">Shipping Address</h2>
                
                <div className="mb-4">
                  <label className="form-label">Street Address</label>
                  <input
                    type="text"
                    name="shippingAddress"
                    value={formData.shippingAddress}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter your full address"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="form-label">City</label>
                    <input
                      type="text"
                      name="shippingCity"
                      value={formData.shippingCity}
                      onChange={handleChange}
                      className="form-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Province</label>
                    <select
                      name="shippingProvince"
                      value={formData.shippingProvince}
                      onChange={handleChange}
                      className="form-input"
                      required
                    >
                      <option value="">Select Province</option>
                      <option value="Western">Western</option>
                      <option value="Central">Central</option>
                      <option value="Southern">Southern</option>
                      <option value="Northern">Northern</option>
                      <option value="Eastern">Eastern</option>
                      <option value="North Western">North Western</option>
                      <option value="North Central">North Central</option>
                      <option value="Uva">Uva</option>
                      <option value="Sabaragamuwa">Sabaragamuwa</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Postal Code</label>
                    <input
                      type="text"
                      name="shippingPostalCode"
                      value={formData.shippingPostalCode}
                      onChange={handleChange}
                      className="form-input"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="card mb-6">
                <h2 className="text-2xl font-bold text-ksp-black mb-6">Payment Method</h2>
                <div className="space-y-3">
                  <label className="flex items-center p-4 border border-gray-200 rounded cursor-pointer hover:bg-ksp-gray transition">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash_on_delivery"
                      checked={formData.paymentMethod === 'cash_on_delivery'}
                      onChange={handleChange}
                      className="mr-3"
                    />
                    <div>
                      <p className="font-semibold text-ksp-black">Cash on Delivery</p>
                      <p className="text-sm text-gray-600">Pay when you receive your order</p>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border border-gray-200 rounded cursor-pointer hover:bg-ksp-gray transition">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank_slip"
                      checked={formData.paymentMethod === 'bank_slip'}
                      onChange={handleChange}
                      className="mr-3"
                    />
                    <div>
                      <p className="font-semibold text-ksp-black">Bank Transfer</p>
                      <p className="text-sm text-gray-600">Upload bank slip for verification</p>
                    </div>
                  </label>

                  {/* Bank Slip Upload Section */}
                  {formData.paymentMethod === 'bank_slip' && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-ksp-black mb-3">Bank Details</h3>
                      <div className="text-sm text-gray-600 space-y-1 mb-4 p-3 bg-white rounded border">
                        <p><span className="font-medium">Bank:</span> Bank of Ceylon</p>
                        <p><span className="font-medium">Account Name:</span> Kandy Super Phone</p>
                        <p><span className="font-medium">Account Number:</span> 1234567890</p>
                        <p><span className="font-medium">Branch:</span> Kandy</p>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">
                        Transfer <span className="font-bold text-ksp-red">LKR {total.toLocaleString('en-LK')}</span> and upload your bank slip below:
                      </p>
                      
                      {!bankSlipUrl ? (
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={handleBankSlipUpload}
                            className="hidden"
                            id="bankSlipInput"
                            disabled={uploadingBankSlip}
                          />
                          <label
                            htmlFor="bankSlipInput"
                            className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                              uploadingBankSlip 
                                ? 'border-gray-300 bg-gray-100' 
                                : 'border-ksp-red/30 hover:border-ksp-red hover:bg-ksp-red/5'
                            }`}
                          >
                            {uploadingBankSlip ? (
                              <div className="text-center">
                                <div className="animate-spin w-8 h-8 border-4 border-ksp-red border-t-transparent rounded-full mx-auto mb-2"></div>
                                <p className="text-gray-600">Uploading...</p>
                              </div>
                            ) : (
                              <>
                                <Upload className="w-10 h-10 text-ksp-red/50 mb-2" />
                                <p className="text-sm text-gray-600 mb-1">Click to upload bank slip</p>
                                <p className="text-xs text-gray-400">JPEG, PNG, WebP or PDF (max 10MB)</p>
                              </>
                            )}
                          </label>
                        </div>
                      ) : (
                        <div className="relative p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            {bankSlipPreview === 'pdf' ? (
                              <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-8 h-8 text-red-600" />
                              </div>
                            ) : (
                              <img 
                                src={bankSlipPreview} 
                                alt="Bank Slip" 
                                className="w-16 h-16 object-cover rounded-lg border"
                              />
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-green-700 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" /> Bank slip uploaded
                              </p>
                              <p className="text-sm text-gray-600">Your payment will be verified by our team</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => { setBankSlipUrl(''); setBankSlipPreview(null); }}
                              className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                            >
                              <X className="w-5 h-5 text-gray-500" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Order Notes */}
              <div className="card mb-6">
                <h2 className="text-2xl font-bold text-ksp-black mb-6">Order Notes (Optional)</h2>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="form-input"
                  rows={3}
                  placeholder="Any special instructions for delivery..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full lg:hidden disabled:opacity-50"
              >
                {loading ? 'Placing Order...' : 'Place Order'}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card sticky top-20">
              <h2 className="text-2xl font-bold text-ksp-black mb-6">Order Summary</h2>

              {/* Product Details */}
              <div className="flex gap-4 mb-6 pb-6 border-b border-gray-200">
                <img
                  src={imageSrc}
                  alt={product.name}
                  className="w-20 h-20 object-cover rounded"
                  onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/150x150?text=No+Image'; }}
                />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">{product.brand}</p>
                  <h3 className="font-semibold text-ksp-black">{product.name}</h3>
                  <p className="text-sm text-gray-600">Qty: {quantity}</p>
                  <p className="font-semibold text-ksp-red">
                    LKR {parseFloat(product.price).toLocaleString('en-LK')}
                  </p>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">LKR {subtotal.toLocaleString('en-LK')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className={`font-semibold ${shipping === 0 ? 'text-green-600' : ''}`}>
                    {shipping === 0 ? 'Free' : `LKR ${shipping.toLocaleString('en-LK')}`}
                  </span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-gray-500">
                    Free shipping on orders over LKR 5,000
                  </p>
                )}
              </div>

              {/* Total */}
              <div className="flex justify-between mb-6">
                <span className="text-xl font-bold text-ksp-black">Total</span>
                <span className="text-xl font-bold text-ksp-red">
                  LKR {total.toLocaleString('en-LK')}
                </span>
              </div>

              <button
                type="submit"
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary w-full hidden lg:block disabled:opacity-50"
              >
                {loading ? 'Placing Order...' : 'Place Order'}
              </button>

              <p className="text-xs text-gray-600 text-center mt-4">
                By placing an order, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceOrder;
