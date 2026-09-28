import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Mail, Lock, Eye, EyeOff, ArrowRight, Smartphone, 
  CheckCircle, AlertCircle, Loader2, Sparkles
} from 'lucide-react';
import api, { API_BASE_URL } from '../../services/api';
import { useAuthStore } from '../../context/store';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(location.state?.message || '');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const { setUser } = useAuthStore();

  const startGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    if (token && user) {
      const userData = JSON.parse(user);
      navigate(userData.role === 'admin' ? '/admin' : '/');
    }
  }, [navigate]);

  // Load remembered email
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setFormData(prev => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    // Email validation: must contain '@' and end with 'gmail.com'
    const emailLower = formData.email.toLowerCase().trim();
    if (!emailLower.includes('@') || !emailLower.endsWith('.com')) {
      setError('Please enter a valid Gmail address (e.g., user@gmail.com)');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/login', {
        email: formData.email.toLowerCase().trim(),
        password: formData.password
      });

      if (response.data.success) {
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', formData.email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }

        setUser(response.data.user, response.data.token);
        setSuccess('Login successful! Redirecting...');
        
        setTimeout(() => {
          const redirectTo = location.state?.from || 
            (response.data.user.role === 'admin' ? '/admin' : '/');
          navigate(redirectTo);
        }, 500);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

        <div className="relative z-10 space-y-12 flex flex-col justify-between flex-1">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-8">
              <Sparkles size={16} className="text-yellow-300" />
              <span className="text-white/90 text-sm font-medium">Welcome Back!</span>
            </div>
            <h1 className="text-5xl font-black text-white mb-8 leading-tight">
              Sign in to your<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-100">Account</span>
            </h1>
            <p className="text-white/70 text-lg max-w-xl leading-relaxed font-light">
              Manage your orders, track deliveries, and enjoy exclusive member benefits. Shop with confidence on Sri Lanka's trusted mobile phone retailer since 2015.
            </p>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-white/60 text-sm">© 2026 Kandy Super Phone. All rights reserved.</p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
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

          <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/60 p-6 md:p-8 border border-gray-100/50">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-black text-ksp-black mb-2">Welcome Back</h2>
              <p className="text-gray-500 font-medium">Enter your credentials to continue</p>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700 animate-shake">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertCircle size={20} />
                </div>
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-2xl flex items-center gap-3 text-green-700">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={20} />
                </div>
                <span className="text-sm font-medium">{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
                    className="w-full pl-16 pr-4 py-3.5 bg-ksp-gray border-2 border-transparent rounded-2xl focus:bg-white focus:border-ksp-red/30 focus:ring-4 focus:ring-ksp-red/10 transition-all duration-300 outline-none font-medium"
                    placeholder="you@example.com"
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
              </div>

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
                    className="w-full pl-16 pr-14 py-3.5 bg-ksp-gray border-2 border-transparent rounded-2xl focus:bg-white focus:border-ksp-red/30 focus:ring-4 focus:ring-ksp-red/10 transition-all duration-300 outline-none font-medium"
                    placeholder="Enter your password"
                    autoComplete="current-password"
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
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-lg border-2 transition-all duration-300 flex items-center justify-center ${rememberMe ? 'bg-ksp-red border-ksp-red' : 'border-gray-300 group-hover:border-ksp-red/50'}`}>
                      {rememberMe && <CheckCircle size={14} className="text-white" />}
                    </div>
                  </div>
                  <span className="text-sm text-gray-600 font-medium group-hover:text-gray-900 transition-colors">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-sm text-ksp-red hover:text-red-700 font-semibold transition-colors hover:underline decoration-2 underline-offset-2">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-ksp-red to-red-600 text-white py-4 rounded-2xl font-bold text-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-xl shadow-red-200/50 hover:shadow-2xl hover:shadow-red-300/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 size={22} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={22} />
                  </>
                )}
              </button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-gray-100"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-white text-sm text-gray-400 font-medium">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={startGoogleLogin}
              className="w-full py-4 px-4 bg-white border-2 border-gray-200 rounded-2xl font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all duration-300 flex items-center justify-center gap-3 group"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#EA4335" d="M12 10.2v3.85h5.5c-.24 1.28-.97 2.36-2.06 3.09v2.57h3.33c1.95-1.8 3.08-4.45 3.08-7.59 0-.73-.07-1.43-.2-2.11H12z" />
                <path fill="#34A853" d="M6.53 14.13l-.72.55-2.55 1.98C4.87 19.45 8.1 21.5 12 21.5c2.7 0 4.96-.89 6.62-2.42l-3.33-2.57c-.92.62-2.1.98-3.29.98-2.52 0-4.66-1.7-5.42-3.99z" />
                <path fill="#4A90E2" d="M3.26 6.98A9.48 9.48 0 0 0 2.5 10.2c0 1.13.27 2.2.74 3.16l3.27-2.54A5.68 5.68 0 0 1 6.3 10.2c0-.63.11-1.24.2-1.55z" />
                <path fill="#FBBC05" d="M12 5.27c1.47 0 2.79.51 3.83 1.5l2.87-2.87C17.01 2.28 14.77 1.5 12 1.5 8.1 1.5 4.87 3.55 3.26 6.98l3.03 2.35C7.34 7.2 9.48 5.27 12 5.27z" />
              </svg>
              Sign in with Google
            </button>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-gray-100"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-white text-sm text-gray-400 font-medium">New to Kandy Super Phone?</span>
              </div>
            </div>

            <Link
              to="/register"
              className="block w-full py-4 border-2 border-gray-200 rounded-2xl text-center font-bold text-gray-700 hover:border-ksp-red hover:text-ksp-red hover:bg-red-50/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              Create an Account
            </Link>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            By signing in, you agree to our{' '}
            <Link to="/terms" className="text-ksp-red hover:underline font-medium">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy" className="text-ksp-red hover:underline font-medium">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
