import React, { useState } from 'react';

const Checkout = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    paymentMethod: 'cash_on_delivery'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Checkout:', formData);
  };

  return (
    <div className="bg-ksp-gray min-h-screen py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8 text-ksp-black">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <div className="card mb-6">
              <h2 className="text-2xl font-bold text-ksp-black mb-6">Shipping Address</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div>
                  <label className="form-label">Street Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="form-label">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="form-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Province</label>
                    <input
                      type="text"
                      name="province"
                      value={formData.province}
                      onChange={handleChange}
                      className="form-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Postal Code</label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleChange}
                      className="form-input"
                      required
                    />
                  </div>
                </div>
              </form>
            </div>

            {/* Payment Method */}
            <div className="card">
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

              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="card h-fit sticky top-20">
            <h2 className="text-2xl font-bold text-ksp-black mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
              <p className="text-gray-600 text-center">No items in cart</p>
            </div>

            <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">LKR 0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-semibold text-ksp-green">Free</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span className="font-semibold">LKR 0</span>
              </div>
            </div>

            <div className="flex justify-between mb-6">
              <span className="text-xl font-bold text-ksp-black">Total</span>
              <span className="price-tag">LKR 0</span>
            </div>

            <button className="btn-primary w-full disabled:opacity-50">
              Place Order
            </button>

            <p className="text-xs text-gray-600 text-center mt-4">
              By placing an order, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
