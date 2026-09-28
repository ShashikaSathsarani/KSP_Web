import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, Mail, Lock, Phone, Eye, EyeOff, ArrowRight, Smartphone, 
  Shield, Gift, CheckCircle, AlertCircle, Loader2, Check, X, Sparkles, Star
} from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../context/store';

const Register = () => {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    password: '', confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    if (token && user) {
      navigate('/');
    }
  }, [navigate]);

  // Password strength checker
  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: '', color: 'bg-gray-200' };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    const levels = [
      { label: 'Very Weak', color: 'bg-red-500' },
      { label: 'Weak', color: 'bg-orange-500' },
      { label: 'Fair', color: 'bg-yellow-500' },
      { label: 'Good', color: 'bg-blue-500' },
      { label: 'Strong', color: 'bg-green-500' }
    ];
    return { score, ...levels[Math.min(score, 4)] };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';

    // validate the email with @ sign and end with gmail.com
    } else if (!formData.email.includes('@') || !formData.email.toLowerCase().trim().endsWith('gmail.com')) {
      newErrors.email = 'Please enter a valid Gmail address (must contain @ and end with gmail.com)';
    }
    if (formData.phone && !/^[+]?[\d\s-]{10,}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!agreeTerms) {
      newErrors.terms = 'You must agree to the terms and conditions';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validateForm();
    
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setLoading(true);
    setErrors({});
    
    try {
      const response = await api.post('/auth/register', {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.toLowerCase().trim(),
        phone: formData.phone.trim() || null,
        password: formData.password
      });

      if (response.data.success) {
        setUser(response.data.user, response.data.token);
        setSuccess('Account created successfully! Redirecting...');
        
        setTimeout(() => navigate('/'), 1000);
      }
    } catch (err) {
      console.error('Register error:', err);
      setErrors({ 
        general: err.response?.data?.message || 'Registration failed. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const PasswordRequirement = ({ met, text }) => (
    <div className={`flex items-center gap-2 text-xs transition-all duration-300 ${met ? 'text-green-600' : 'text-gray-400'}`}>
      <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300 ${met ? 'bg-green-100' : 'bg-gray-100'}`}>
        {met ? <Check size={10} /> : <X size={10} />}
      </div>
      <span className="font-medium">{text}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-ksp-gray via-white to-red-50/30 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-ksp-red via-red-500 to-rose-600 p-12 flex-col justify-between relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-yellow-300/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        
        {/* Decorative Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-2xl shadow-black/20 group-hover:scale-105 transition-transform duration-300">
              <Smartphone className="text-ksp-red" size={32} />
            </div>
            <div>
              <span className="text-2xl font-black text-white tracking-tight">Kandy Super Phone</span>
              <span className="block text-sm text-white/70 font-medium">Premium Mobile Store</span>
            </div>
          </Link>
        </div>

        <div className="relative z-10 space-y-10">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6">
              <Sparkles size={16} className="text-yellow-300" />
              <span className="text-white/90 text-sm font-medium">Join Our Family!</span>
            </div>
            <h1 className="text-5xl font-black text-white mb-6 leading-tight">
              Create Your<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-100">Account</span>
            </h1>
            <p className="text-white/80 text-lg max-w-md leading-relaxed">
              Join thousands of happy customers and get access to exclusive deals on the latest smartphones.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: Gift, text: 'Get LKR 500 off your first order', color: 'from-yellow-400 to-orange-500' },
              { icon: Shield, text: 'Secure checkout & data protection', color: 'from-green-400 to-emerald-500' },
              { icon: Star, text: 'Track orders & save favorites', color: 'from-blue-400 to-cyan-500' }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 text-white/90 group">
                <div className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <item.icon size={22} className="text-white" />
                </div>
                <span className="font-medium text-lg">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-white/60 text-sm">© 2026 Kandy Super Phone. All rights reserved.</p>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-10">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-ksp-red to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <Smartphone className="text-white" size={26} />
              </div>
              <span className="text-xl font-black text-ksp-black">Kandy Super Phone</span>
            </Link>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/60 p-8 md:p-10 border border-gray-100/50">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-ksp-black mb-2">Create Account</h2>
              <p className="text-gray-500 font-medium">Fill in your details to get started</p>
            </div>

            {errors.general && (
              <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertCircle size={20} />
                </div>
                <span className="text-sm font-medium">{errors.general}</span>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-2xl flex items-center gap-3 text-green-700">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={20} />
                </div>
                <span className="text-sm font-medium">{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">First Name</label>
                  <div className={`relative transition-all duration-300 ${focusedField === 'firstName' ? 'transform scale-[1.02]' : ''}`}>
                    <div className={`absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${focusedField === 'firstName' ? 'bg-ksp-red' : 'bg-gray-100'}`}>
                      <User className={`transition-colors duration-300 ${focusedField === 'firstName' ? 'text-white' : 'text-gray-400'}`} size={16} />
                    </div>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('firstName')}
                      onBlur={() => setFocusedField(null)}
                      className={`w-full pl-14 pr-4 py-3.5 bg-ksp-gray border-2 border-transparent rounded-xl focus:bg-white focus:border-ksp-red/30 focus:ring-4 focus:ring-ksp-red/10 transition-all duration-300 outline-none font-medium ${errors.firstName ? 'border-red-300 bg-red-50' : ''}`}
                      placeholder="John"
                      disabled={loading}
                    />
                  </div>
                  {errors.firstName && <p className="mt-1 text-xs text-red-500 font-medium">{errors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Last Name</label>
                  <div className={`relative transition-all duration-300 ${focusedField === 'lastName' ? 'transform scale-[1.02]' : ''}`}>
                    <div className={`absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${focusedField === 'lastName' ? 'bg-ksp-red' : 'bg-gray-100'}`}>
                      <User className={`transition-colors duration-300 ${focusedField === 'lastName' ? 'text-white' : 'text-gray-400'}`} size={16} />
                    </div>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('lastName')}
                      onBlur={() => setFocusedField(null)}
                      className={`w-full pl-14 pr-4 py-3.5 bg-ksp-gray border-2 border-transparent rounded-xl focus:bg-white focus:border-ksp-red/30 focus:ring-4 focus:ring-ksp-red/10 transition-all duration-300 outline-none font-medium ${errors.lastName ? 'border-red-300 bg-red-50' : ''}`}
                      placeholder="Doe"
                      disabled={loading}
                    />
                  </div>
                  {errors.lastName && <p className="mt-1 text-xs text-red-500 font-medium">{errors.lastName}</p>}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                <div className={`relative transition-all duration-300 ${focusedField === 'email' ? 'transform scale-[1.02]' : ''}`}>
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${focusedField === 'email' ? 'bg-ksp-red' : 'bg-gray-100'}`}>
                    <Mail className={`transition-colors duration-300 ${focusedField === 'email' ? 'text-white' : 'text-gray-400'}`} size={18} />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full pl-16 pr-4 py-4 bg-ksp-gray border-2 border-transparent rounded-2xl focus:bg-white focus:border-ksp-red/30 focus:ring-4 focus:ring-ksp-red/10 transition-all duration-300 outline-none font-medium ${errors.email ? 'border-red-300 bg-red-50' : ''}`}
                    placeholder="you@example.com"
                    disabled={loading}
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-red-500 font-medium">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Phone Number <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <div className={`relative transition-all duration-300 ${focusedField === 'phone' ? 'transform scale-[1.02]' : ''}`}>
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${focusedField === 'phone' ? 'bg-ksp-red' : 'bg-gray-100'}`}>
                    <Phone className={`transition-colors duration-300 ${focusedField === 'phone' ? 'text-white' : 'text-gray-400'}`} size={18} />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('phone')}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full pl-16 pr-4 py-4 bg-ksp-gray border-2 border-transparent rounded-2xl focus:bg-white focus:border-ksp-red/30 focus:ring-4 focus:ring-ksp-red/10 transition-all duration-300 outline-none font-medium ${errors.phone ? 'border-red-300 bg-red-50' : ''}`}
                    placeholder="+94 71 234 5678"
                    disabled={loading}
                  />
                </div>
                {errors.phone && <p className="mt-1 text-xs text-red-500 font-medium">{errors.phone}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
                <div className={`relative transition-all duration-300 ${focusedField === 'password' ? 'transform scale-[1.02]' : ''}`}>
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${focusedField === 'password' ? 'bg-ksp-red' : 'bg-gray-100'}`}>
                    <Lock className={`transition-colors duration-300 ${focusedField === 'password' ? 'text-white' : 'text-gray-400'}`} size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full pl-16 pr-14 py-4 bg-ksp-gray border-2 border-transparent rounded-2xl focus:bg-white focus:border-ksp-red/30 focus:ring-4 focus:ring-ksp-red/10 transition-all duration-300 outline-none font-medium ${errors.password ? 'border-red-300 bg-red-50' : ''}`}
                    placeholder="At least 6 characters"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-ksp-red rounded-xl hover:bg-gray-100 transition-all duration-300"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-500 font-medium">{errors.password}</p>}
                
                {/* Password Strength */}
                {formData.password && (
                  <div className="mt-3 space-y-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-all ${i <= passwordStrength.score ? passwordStrength.color : 'bg-gray-200'}`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs font-medium ${passwordStrength.score >= 3 ? 'text-green-600' : passwordStrength.score >= 2 ? 'text-yellow-600' : 'text-red-500'}`}>
                      {passwordStrength.label}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <PasswordRequirement met={formData.password.length >= 6} text="At least 6 characters" />
                      <PasswordRequirement met={/[A-Z]/.test(formData.password)} text="Uppercase letter" />
                      <PasswordRequirement met={/[a-z]/.test(formData.password)} text="Lowercase letter" />
                      <PasswordRequirement met={/\d/.test(formData.password)} text="Number" />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Confirm Password</label>
                <div className={`relative transition-all duration-300 ${focusedField === 'confirmPassword' ? 'transform scale-[1.02]' : ''}`}>
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${focusedField === 'confirmPassword' ? 'bg-ksp-red' : 'bg-gray-100'}`}>
                    <Lock className={`transition-colors duration-300 ${focusedField === 'confirmPassword' ? 'text-white' : 'text-gray-400'}`} size={18} />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('confirmPassword')}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full pl-16 pr-14 py-4 bg-ksp-gray border-2 border-transparent rounded-2xl focus:bg-white focus:border-ksp-red/30 focus:ring-4 focus:ring-ksp-red/10 transition-all duration-300 outline-none font-medium ${errors.confirmPassword ? 'border-red-300 bg-red-50' : ''}`}
                    placeholder="Confirm your password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-ksp-red rounded-xl hover:bg-gray-100 transition-all duration-300"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="mt-1 text-xs text-red-500 font-medium">{errors.confirmPassword}</p>}
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <p className="mt-2 text-xs text-green-600 flex items-center gap-1 font-medium">
                    <CheckCircle size={14} /> Passwords match
                  </p>
                )}
              </div>

              {/* Terms */}
              <div>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-0.5">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => { setAgreeTerms(e.target.checked); if (errors.terms) setErrors(prev => ({ ...prev, terms: '' })); }}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-lg border-2 transition-all duration-300 flex items-center justify-center ${agreeTerms ? 'bg-ksp-red border-ksp-red' : 'border-gray-300 group-hover:border-ksp-red/50'}`}>
                      {agreeTerms && <CheckCircle size={14} className="text-white" />}
                    </div>
                  </div>
                  <span className="text-sm text-gray-600 group-hover:text-gray-900 font-medium">
                    I agree to the{' '}
                    <Link to="/terms" className="text-ksp-red hover:underline font-semibold">Terms of Service</Link>
                    {' '}and{' '}
                    <Link to="/privacy" className="text-ksp-red hover:underline font-semibold">Privacy Policy</Link>
                  </span>
                </label>
                {errors.terms && <p className="mt-1 text-xs text-red-500 font-medium">{errors.terms}</p>}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-ksp-red to-red-600 text-white py-4 rounded-2xl font-bold text-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-xl shadow-red-200/50 hover:shadow-2xl hover:shadow-red-300/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 size={22} className="animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight size={22} />
                  </>
                )}
              </button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-gray-100"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-white text-sm text-gray-400 font-medium">Already have an account?</span>
              </div>
            </div>

            <Link
              to="/login"
              className="block w-full py-4 border-2 border-gray-200 rounded-2xl text-center font-bold text-gray-700 hover:border-ksp-red hover:text-ksp-red hover:bg-red-50/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
