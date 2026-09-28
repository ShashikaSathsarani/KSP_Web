import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Package, 
  Users, 
  TrendingUp, 
  Plus, 
  Search, 
  Edit,
  Trash2,
  Eye,
  ChevronDown,
  Box,
  ShoppingCart,
  BarChart3,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  Save,
  AlertCircle,
  RefreshCw,
  Sparkles,
  RotateCcw,
  User,
  Lock,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  CheckCircle,
  XCircle,
  FileText,
  Image,
  Shield,
  KeyRound,
  ExternalLink,
  Home,
  Clock
} from 'lucide-react';
import api, { resolveMediaUrl } from '../../services/api';
import { authService, adminService } from '../../services/apiService';
import { useNavigate } from 'react-router-dom';
import Subscriptions from './Subscriptions';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [settingsTab, setSettingsTab] = useState('store');
  
  // Orders state
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentOrdersLoading, setRecentOrdersLoading] = useState(false);
  
  // Payments state
  const [pendingPayments, setPendingPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentDetail, setShowPaymentDetail] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  
  // Clients state
  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [clientStatusFilter, setClientStatusFilter] = useState('all');
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientDetail, setShowClientDetail] = useState(false);
  
  // Sales Report state
  const [salesData, setSalesData] = useState(null);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesTimeFilter, setSalesTimeFilter] = useState('week');
  
  // Admin Profile state
  const [adminProfile, setAdminProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postalCode: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [profileTab, setProfileTab] = useState('info');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);
  
  // About Us form state
  const [aboutForm, setAboutForm] = useState({
    storeName: 'Kandy Super Phone',
    tagline: 'Your Trusted Mobile Partner Since 2015',
    description: 'Kandy Super Phone is the leading mobile phone retailer in Kandy, Sri Lanka. We are authorized dealers for all major brands including Apple, Samsung, Xiaomi, and more. Our commitment to quality and customer satisfaction has made us the go-to destination for all your mobile needs.',
    mission: 'To provide our customers with genuine, high-quality mobile devices at competitive prices, backed by exceptional after-sales service and support.',
    vision: 'To be the most trusted and preferred mobile retail destination in Sri Lanka, known for authenticity, variety, and customer care.',
    address: 'No. 123, Dalada Veediya, Kandy, Sri Lanka',
    phone: '+94 81 234 5678',
    email: 'info@kandysuperphone.lk',
    workingHours: 'Mon - Sat: 9:00 AM - 8:00 PM | Sun: 10:00 AM - 6:00 PM',
    yearsInBusiness: '10+',
    happyCustomers: '50,000+',
    brandsAvailable: '25+',
    warrantySupport: '100%'
  });

  // Load About Us data on mount
  useEffect(() => {
    const savedAboutData = localStorage.getItem('aboutUsData');
    if (savedAboutData) {
      setAboutForm(JSON.parse(savedAboutData));
    }
  }, []);

  // Save About Us data
  const handleSaveAboutUs = () => {
    localStorage.setItem('aboutUsData', JSON.stringify(aboutForm));
    setSuccess('About Us content saved successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  // Fetch admin profile
  const fetchAdminProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const response = await authService.getProfile();
      if (response.data.success) {
        setAdminProfile(response.data.user);
        setProfileForm({
          firstName: response.data.user.firstName || '',
          lastName: response.data.user.lastName || '',
          phone: response.data.user.phone || '',
          address: response.data.user.address || '',
          city: response.data.user.city || '',
          province: response.data.user.province || '',
          postalCode: response.data.user.postalCode || ''
        });
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setError('Failed to load profile');
    } finally {
      setProfileLoading(false);
    }
  }, []);

  // Helper function to group daily sales into weeks
  const groupByWeek = (dailySales) => {
    const weekMap = {};
    const weekLabels = {};

    dailySales.forEach(day => {
      const date = new Date(day._id);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weekMap[weekKey]) {
        weekMap[weekKey] = { orderCount: 0, revenue: 0 };
        weekLabels[weekKey] = `W${Math.ceil((date.getDate()) / 7)}`;
      }

      weekMap[weekKey].orderCount += day.orderCount;
      weekMap[weekKey].revenue += day.revenue;
    });

    return Object.entries(weekMap)
      .map(([key, value]) => ({
        _id: key,
        orderCount: value.orderCount,
        revenue: value.revenue,
        label: weekLabels[key]
      }))
      .sort((a, b) => new Date(a._id) - new Date(b._id));
  };

  // Helper function to group daily sales into months
  const groupByMonth = (dailySales) => {
    const monthMap = {};
    const monthLabels = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    dailySales.forEach(day => {
      const date = new Date(day._id);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthMap[monthKey]) {
        monthMap[monthKey] = { orderCount: 0, revenue: 0 };
        monthLabels[monthKey] = monthNames[date.getMonth()];
      }

      monthMap[monthKey].orderCount += day.orderCount;
      monthMap[monthKey].revenue += day.revenue;
    });

    return Object.entries(monthMap)
      .map(([key, value]) => ({
        _id: key,
        orderCount: value.orderCount,
        revenue: value.revenue,
        label: monthLabels[key]
      }))
      .sort((a, b) => a._id.localeCompare(b._id));
  };

  // Helper function to format chart data based on time filter
  const getChartData = () => {
    if (!salesData?.dailySales || salesData.dailySales.length === 0) {
      return [];
    }

    if (salesTimeFilter === 'week') {
      // For week, show each day with day name
      return salesData.dailySales.map(day => {
        const date = new Date(day._id);
        const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return {
          ...day,
          label: dayLabels[date.getDay()],
          dateStr: day._id
        };
      });
    } else if (salesTimeFilter === 'month') {
      // For month, group by weeks
      const weekData = groupByWeek(salesData.dailySales);
      return weekData.map(week => ({
        ...week,
        dateStr: week._id
      }));
    } else if (salesTimeFilter === 'year') {
      // For year, group by months
      const monthData = groupByMonth(salesData.dailySales);
      return monthData.map(month => ({
        ...month,
        dateStr: month._id
      }));
    }
  };

  // Fetch sales report
  const fetchSalesReport = useCallback(async () => {
    setSalesLoading(true);
    try {
      const today = new Date();
      const endDate = new Date(today);
      const startDate = new Date(today);

      if (salesTimeFilter === 'week') {
        startDate.setDate(today.getDate() - 7);
      } else if (salesTimeFilter === 'month') {
        startDate.setMonth(today.getMonth() - 1);
      } else if (salesTimeFilter === 'year') {
        startDate.setFullYear(today.getFullYear() - 1);
      }

      const params = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      };
      const response = await adminService.getSalesReport(params);
      if (response.data.success) {
        setSalesData(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch sales report:', err);
      setError('Failed to load sales report');
    } finally {
      setSalesLoading(false);
    }
  }, [salesTimeFilter]);

  // Fetch recent orders specifically for dashboard
  const fetchRecentOrders = useCallback(async () => {
    setRecentOrdersLoading(true);
    try {
      const response = await adminService.getAllOrders({ limit: 5 });
      if (response.data.success) {
        setRecentOrders(response.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch recent orders:', err);
    } finally {
      setRecentOrdersLoading(false);
    }
  }, []);

  // Fetch sales report when tab changes or filter changes
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchSalesReport();
      fetchRecentOrders();
    }
  }, [activeTab, fetchSalesReport, fetchRecentOrders]);

  // Load profile when profile tab is active
  useEffect(() => {
    if (activeTab === 'profile' && !adminProfile) {
      fetchAdminProfile();
    }
  }, [activeTab, adminProfile, fetchAdminProfile]);

  // Also fetch profile on component mount for header dropdown
  useEffect(() => {
    if (!adminProfile) {
      fetchAdminProfile();
    }
  }, [adminProfile, fetchAdminProfile]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch all orders for admin
  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const params = {};
      if (orderStatusFilter !== 'all') {
        params.status = orderStatusFilter;
      }
      const response = await adminService.getAllOrders(params);
      if (response.data.success) {
        setOrders(response.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Failed to load orders');
    } finally {
      setOrdersLoading(false);
    }
  }, [orderStatusFilter]);

  // Load orders when orders tab is active
  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
      // Poll for new orders every 30 seconds
      const interval = setInterval(fetchOrders, 30000);
      return () => clearInterval(interval);
    }
  }, [activeTab, fetchOrders]);

  // Update order status
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await adminService.updateOrderStatus(orderId, newStatus);
      if (response.data.success) {
        setSuccess(`Order status updated to ${newStatus}`);
        fetchOrders(); // Refresh orders
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update order status');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Delete order
  const handleDeleteOrder = async (orderId) => {
    const confirmed = window.confirm('Delete this order? This will remove the order and its items.');
    if (!confirmed) return;

    try {
      const response = await adminService.deleteOrder(orderId);
      if (response.data.success) {
        setSuccess('Order deleted successfully');
        setShowOrderDetail(false);
        setSelectedOrder(null);
        fetchOrders();
        fetchRecentOrders();
        fetchPendingPayments();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete order');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Fetch pending payment verifications
  const fetchPendingPayments = async () => {
    setPaymentsLoading(true);
    try {
      const response = await adminService.getPendingVerificationOrders();
      if (response.data.success) {
        setPendingPayments(response.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch pending payments:', err);
      setError('Failed to load pending payments');
    } finally {
      setPaymentsLoading(false);
    }
  };

  // Load payments when payments tab is active
  useEffect(() => {
    if (activeTab === 'payments') {
      fetchPendingPayments();
      // Poll for new payments every 30 seconds
      const interval = setInterval(fetchPendingPayments, 30000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  // Verify or reject payment
  const handleVerifyPayment = async (orderId, action) => {
    try {
      const response = await adminService.verifyPayment(orderId, action, rejectReason);
      if (response.data.success) {
        setSuccess(action === 'approve' ? 'Payment verified successfully!' : 'Payment rejected');
        setShowPaymentDetail(false);
        setSelectedPayment(null);
        setRejectReason('');
        fetchPendingPayments(); // Refresh list
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to verify payment');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Fetch all clients (customers)
  const fetchClients = useCallback(async () => {
    setClientsLoading(true);
    try {
      const params = { role: 'customer' };
      if (clientStatusFilter !== 'all') {
        params.status = clientStatusFilter;
      }
      if (clientSearchTerm) {
        params.search = clientSearchTerm;
      }
      const response = await adminService.getAllUsers(params);
      if (response.data.success) {
        setClients(response.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch clients:', err);
      setError('Failed to load clients');
    } finally {
      setClientsLoading(false);
    }
  }, [clientSearchTerm, clientStatusFilter]);

  // Load clients when clients tab is active
  useEffect(() => {
    if (activeTab === 'clients') {
      fetchClients();
    }
  }, [activeTab, fetchClients]);

  // Debounced search for clients
  useEffect(() => {
    if (activeTab === 'clients') {
      const timer = setTimeout(() => {
        fetchClients();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [activeTab, fetchClients]);

  // Toggle client status (active/inactive)
  const handleToggleClientStatus = async (clientId, currentStatus) => {
    try {
      const response = await adminService.updateUserStatus(clientId, !currentStatus);
      if (response.data.success) {
        setSuccess(`Client ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        fetchClients();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update client status');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Delete client
  const handleDeleteClient = async (client) => {
    // Client-side check before hitting the API
    if (client.orderCount > 0) {
      alert("Cannot delete user because there are some orders");
      return;
    }

    try {
      const response = await api.delete(`/admin/users/${client._id}`);
      if (response.data.success) {
        setSuccess('User deleted successfully!');
        if (selectedClient && selectedClient._id === client._id) {
          setShowClientDetail(false);
          setSelectedClient(null);
        }
        fetchClients();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to delete user';
      alert(errorMessage);
    }
  };

  // Handle profile form changes
  const handleProfileFormChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle password form changes
  const handlePasswordFormChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };

  // Save admin profile
  const handleSaveProfile = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await authService.updateProfile(profileForm);
      if (response.data.success) {
        setAdminProfile(response.data.user);
        // Update localStorage
        const currentUser = authService.getCurrentUser();
        authService.setAuthToken(localStorage.getItem('authToken'), {
          ...currentUser,
          ...response.data.user
        });
        setSuccess('Profile updated successfully!');
        setIsEditingProfile(false);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Change admin password
  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await authService.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );
      if (response.data.success) {
        setSuccess('Password changed successfully!');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };
  
  // Generate SKU from product name and brand
  const generateSKU = (name, brand, color = '') => {
    if (!name || !brand) return '';
    const nameAbbr = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3);
    const brandAbbr = brand.slice(0, 3).toUpperCase();
    const colorAbbr = color ? color.slice(0, 2).toUpperCase() : 'XX';
    const timestamp = Date.now().toString().slice(-4);
    return `${brandAbbr}-${nameAbbr}-${colorAbbr}-${timestamp}`;
  };

  // Product form state
  const [productForm, setProductForm] = useState({
    name: '', description: '', brand: '', price: '', storage: '128GB',
    condition: 'Brand New', color: '', ram: '8GB', quantity: 0, imageUrl: '', sku: '',
    isNewArrival: false, isPremiumDeal: false, productType: 'Phones'
  });

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      console.log('ℹ️ No file selected');
      return;
    }

    console.log('📤 File selected:', {
      name: file.name,
      size: file.size,
      type: file.type,
      sizeInMB: (file.size / (1024 * 1024)).toFixed(2)
    });

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      const msg = `❌ Invalid file type: ${file.type}. Only JPEG, JPG, PNG and WebP are allowed.`;
      console.warn(msg);
      setError(msg);
      setTimeout(() => setError(''), 5000);
      return;
    }

    // Validate file size (5MB)
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      const msg = `❌ File too large: ${(file.size / (1024 * 1024)).toFixed(2)}MB. Maximum size is 5MB.`;
      console.warn(msg);
      setError(msg);
      setTimeout(() => setError(''), 5000);
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      setImagePreview(readerEvent.target.result);
      console.log('👁️ Image preview generated');
    };
    reader.onerror = (error) => {
      console.error('❌ Error reading file:', error);
      setError('Error reading image file');
    };
    reader.readAsDataURL(file);

    // Upload file
    setUploadingImage(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      console.log('🚀 Starting upload to /api/upload/product-image');
      console.log('📦 FormData contents:', {
        fileField: 'image',
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });
      console.log('🔑 Token available:', !!localStorage.getItem('authToken'));
      
      const response = await api.post('/upload/product-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      console.log('✅ Image upload response received:', response.status);
      console.log('📎 Server response:', response.data);
      
      if (response.data.success) {
        setProductForm(prev => ({ 
          ...prev, 
          imageUrl: response.data.secure_url || response.data.imageUrl 
        }));
        console.log('💾 Cloudinary image URL stored:', response.data.secure_url || response.data.imageUrl);
        console.log('🆔 Cloudinary public ID:', response.data.public_id);
        setSuccess('✅ Image uploaded successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const msg = response.data.message || 'Upload failed';
        console.error('❌ Upload failed:', msg);
        setError(msg);
        setImagePreview(null);
      }
    } catch (err) {
      console.error('❌ Upload error occurred:');
      console.error('Status:', err.response?.status);
      console.error('Data:', err.response?.data);
      console.error('Message:', err.message);
      console.error('Full error:', err);
      
      const msg = err.response?.data?.message || err.message || 'Error uploading image';
      console.error('Final error message to show user:', msg);
      
      setError(msg);
      setImagePreview(null);
      setProductForm(prev => ({
        ...prev,
        imageUrl: ''
      }));
      setTimeout(() => setError(''), 5000);
    } finally {
      setUploadingImage(false);
    }
  };

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('user');
    
    console.log('🔐 Checking authentication on mount');
    console.log('🔑 Token exists:', !!token);
    console.log('👤 User data:', userStr);
    
    if (!token) {
      console.warn('❌ No token found - redirecting to login');
      navigate('/login', { state: { message: 'Please login as admin to access the dashboard' } });
      return;
    }
    
    let user;
    try {
      user = JSON.parse(userStr || '{}');
    } catch (e) {
      console.error('❌ Invalid user data in localStorage:', e);
      localStorage.clear();
      navigate('/login', { state: { message: 'Session invalid. Please login again.' } });
      return;
    }
    
    if (user.role !== 'admin') {
      console.warn('❌ User is not admin:', user.role);
      navigate('/login', { state: { message: 'Admin privileges required' } });
      return;
    }
    
    // Validate token format (JWT has 3 parts separated by dots)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.error('❌ Invalid token format - expected JWT with 3 parts, got:', tokenParts.length);
      localStorage.clear();
      navigate('/login', { state: { message: 'Invalid session. Please login again.' } });
      return;
    }
    
    // Try to decode the token payload (middle part)
    try {
      const payload = JSON.parse(atob(tokenParts[1]));
      const now = Math.floor(Date.now() / 1000);
      
      console.log('🔍 Token payload:', { 
        userId: payload.id, 
        email: payload.email, 
        role: payload.role,
        expiresAt: new Date(payload.exp * 1000).toLocaleString(),
        isExpired: payload.exp < now 
      });
      
      if (payload.exp && payload.exp < now) {
        console.error('❌ Token expired:', new Date(payload.exp * 1000).toLocaleString());
        localStorage.clear();
        navigate('/login', { state: { message: 'Session expired. Please login again.' } });
        return;
      }
    } catch (e) {
      console.error('❌ Could not decode token:', e);
      localStorage.clear();
      navigate('/login', { state: { message: 'Invalid session. Please login again.' } });
      return;
    }
    
    console.log('✅ Authentication validated successfully');
    setIsAuthenticated(true);
  }, [navigate]);

  // Fetch products from database
  const fetchProducts = async () => {
    if (!isAuthenticated) {
      console.log('⚠️ Not authenticated, skipping fetch');
      return;
    }
    setLoading(true);
    try {
      console.log('📡 Fetching products...');
      const response = await api.get('/products', { params: { search: searchTerm } });
      const productsData = response.data.products || response.data || [];
      console.log(`✅ Fetched ${productsData.length} products`);
      setProducts(productsData);
    } catch (err) {
      console.error('❌ Error fetching products:', err.response?.data || err.message);
      if (err.response?.status === 401) {
        console.log('🔐 Unauthorized - redirecting to login');
        navigate('/login', { state: { message: 'Session expired. Please login again.' } });
        return;
      }
      setError('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchProducts();
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isAuthenticated) return;
    const timer = setTimeout(() => fetchProducts(), 300);
    return () => clearTimeout(timer);
  }, [searchTerm, isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Create product
  const handleCreateProduct = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccess('');
    
    console.log('🔍 Form state before validation:', productForm);
    
    // Validate required fields with detailed messaging
    if (!productForm.name || !productForm.brand || !productForm.price || !productForm.sku) {
      const missing = [];
      if (!productForm.name) missing.push('Name');
      if (!productForm.brand) missing.push('Brand');
      if (!productForm.price) missing.push('Price');
      if (!productForm.sku) missing.push('SKU');
      
      const errorMsg = `Missing required fields: ${missing.join(', ')}`;
      console.warn('⚠️ Validation failed:', errorMsg);
      setError(errorMsg);
      return;
    }
    
    // Validate price is a valid number
    const price = parseFloat(productForm.price);
    if (isNaN(price) || price <= 0) {
      const priceError = 'Price must be a valid positive number';
      console.warn('⚠️ Price validation failed:', priceError);
      setError(priceError);
      return;
    }
    
    // Validate quantity
    const quantity = parseInt(productForm.quantity) || 0;
    if (quantity < 0) {
      const quantityError = 'Quantity cannot be negative';
      console.warn('⚠️ Quantity validation failed:', quantityError);
      setError(quantityError);
      return;
    }
    
    setLoading(true);
    try {
      const dataToSend = {
        ...productForm,
        price: price,
        quantity: quantity
      };
      
      // Get token and validate before request
      const token = localStorage.getItem('authToken');
      const user = localStorage.getItem('user');
      
      console.log('📝 Creating product with data:', dataToSend);
      console.log('🔑 Token available:', !!token);
      if (token) {
        console.log('🔑 Token (first 20 chars):', token.substring(0, 20) + '...');
        console.log('🔑 Token length:', token.length);
        
        // Validate token format
        const parts = token.split('.');
        if (parts.length !== 3) {
          throw new Error('Invalid token format in localStorage');
        }
        
        // Check if expired
        try {
          const payload = JSON.parse(atob(parts[1]));
          const now = Math.floor(Date.now() / 1000);
          if (payload.exp && payload.exp < now) {
            throw new Error('Token expired - please login again');
          }
          console.log('🔑 Token payload:', payload);
        } catch (decodeErr) {
          console.error('❌ Token decode error:', decodeErr.message);
        }
      }
      console.log('👤 User:', user);
      
      const response = await api.post('/admin/products', dataToSend);
      
      console.log('✅ Product created successfully!');
      console.log('📦 Response data:', response.data);
      
      setSuccess('Product created successfully!');
      setShowAddProduct(false);
      resetForm();
      await fetchProducts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('❌ ERROR creating product');
      console.error('Error response:', err.response?.data);
      console.error('Error message:', err.message);
      console.error('Full error:', err);
      
      const errorMessage = err.response?.data?.message || err.message || 'Error creating product';
      console.error('Final error message:', errorMessage);
      
      setError(errorMessage);
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Update product
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dataToSend = {
        ...productForm,
        price: parseFloat(productForm.price),
        quantity: parseInt(productForm.quantity) || 0
      };
      await api.put(`/admin/products/${selectedProduct._id}`, dataToSend);
      setSuccess('Product updated successfully!');
      setShowEditProduct(false);
      resetForm();
      fetchProducts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating product');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async () => {
    setLoading(true);
    try {
      // Use the permanent delete endpoint to physically remove it from database
      await api.delete(`/admin/products/${selectedProduct._id}/permanent`);
      setSuccess('Product deleted successfully!');
      setShowDeleteConfirm(false);
      setSelectedProduct(null);
      fetchProducts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting product');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setProductForm({
      name: '', description: '', brand: '', price: '', storage: '128GB',
      condition: 'Brand New', color: '', ram: '8GB', quantity: 0, imageUrl: '', sku: '',
      isNewArrival: false, isPremiumDeal: false, productType: 'Phones'
    });
    setSelectedProduct(null);
    setImagePreview(null);
  };

  const openEditModal = (product) => {
    setSelectedProduct(product);
    setImagePreview(resolveMediaUrl(product.imageUrl));
    setProductForm({
      name: product.name, description: product.description || '', brand: product.brand,
      price: product.price, storage: product.storage, condition: product.condition,
      color: product.color || '', ram: product.ram || '', quantity: product.quantity,
      imageUrl: product.imageUrl || '', sku: product.sku,
      isNewArrival: product.isNewArrival || false, isPremiumDeal: product.isPremiumDeal || false,
      productType: product.productType || 'Phones'
    });
    setShowEditProduct(true);
  };

  const formatPrice = (price) => {
    if (!price) return 'LKR 0.00';
    // Handle Decimal128 (MongoDB) which comes as $numberDecimal or object
    let numValue = price;
    if (typeof price === 'object') {
      numValue = price.$numberDecimal || price.toString();
    }
    const parsed = parseFloat(numValue);
    if (isNaN(parsed)) return 'LKR 0.00';
    return `LKR ${parsed.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  const formatAmount = (amount) => {
    if (!amount) return 'LKR 0.00';
    let numValue = amount;
    if (typeof amount === 'object') {
      numValue = amount.$numberDecimal || amount.toString();
    }
    const parsed = parseFloat(numValue);
    if (isNaN(parsed)) return 'LKR 0.00';
    return `LKR ${parsed.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  const getStockStatus = (qty) => {
    if (qty === 0) return 'Out of Stock';
    if (qty <= 5) return 'Low Stock';
    return 'In Stock';
  };

  // Sample data for non-product sections
  const stats = [
    { label: 'Total Products', value: products.length, change: '+3', icon: Package, color: 'bg-purple-500' },
    { label: 'In Stock', value: products.filter(p => p.quantity > 5).length, change: '+8', icon: Box, color: 'bg-green-500' },
    { label: 'Low Stock', value: products.filter(p => p.quantity > 0 && p.quantity <= 5).length, change: '-2', icon: AlertCircle, color: 'bg-yellow-500' },
    { label: 'Out of Stock', value: products.filter(p => p.quantity === 0).length, change: '0', icon: X, color: 'bg-red-500' }
  ];



  const menuItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'brand-new', label: 'Brand New', icon: Sparkles },
    { id: 'pre-owned', label: 'Pre-Owned', icon: RotateCcw },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'subscriptions', label: 'Subscriptions', icon: Mail },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'profile', label: 'My Profile', icon: User }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Stock': case 'Active': case 'Delivered': return 'bg-green-100 text-green-700';
      case 'Low Stock': case 'Shipped': return 'bg-yellow-100 text-yellow-700';
      case 'Out of Stock': case 'Inactive': case 'Pending': return 'bg-red-100 text-red-700';
      case 'Processing': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Show loading while checking authentication
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw size={32} className="animate-spin mx-auto mb-4 text-ksp-red" />
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full bg-gray-900 text-white z-50 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <img src="/images/ksp-logo.png" alt="KSP Logo" className={`${sidebarOpen ? 'w-12 h-12' : 'w-10 h-10'} object-contain transition-all duration-300`} />
            {sidebarOpen && (
              <div>
                <span className="font-black text-lg text-white">KSP</span>
                <span className="block text-xs text-gray-400">Admin Panel</span>
              </div>
            )}
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  activeTab === item.id 
                    ? 'bg-ksp-red text-white' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={20} />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all">
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-8 py-3 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <div className="hidden md:block">
                <h1 className="text-xl font-bold text-gray-900 capitalize">{activeTab}</h1>
                <p className="text-xs text-gray-500">Manage your store</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative hidden md:block">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="pl-9 pr-4 py-2 bg-gray-100 rounded-xl border-none focus:ring-2 focus:ring-ksp-red/20 focus:bg-white transition-all w-52 text-sm"
                />
              </div>
              <button className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <Bell size={18} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-ksp-red rounded-full"></span>
              </button>
              
              {/* Profile Dropdown */}
              <div className="relative" ref={profileDropdownRef}>
                <button 
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-ksp-red to-red-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    {adminProfile?.firstName?.charAt(0) || 'A'}{adminProfile?.lastName?.charAt(0) || ''}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-semibold text-gray-900">
                      {adminProfile?.firstName || 'Admin'} {adminProfile?.lastName || ''}
                    </p>
                    <p className="text-xs text-gray-500">Administrator</p>
                  </div>
                  <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-fadeIn overflow-hidden">
                    {/* User Info Header */}
                    <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-ksp-red to-red-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                          {adminProfile?.firstName?.charAt(0) || 'A'}{adminProfile?.lastName?.charAt(0) || ''}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">
                            {adminProfile?.firstName || 'Admin'} {adminProfile?.lastName || 'User'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{adminProfile?.email || 'admin@ksp.com'}</p>
                          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-ksp-red/10 text-ksp-red text-xs font-semibold rounded-full">
                            <Shield size={10} /> Admin
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <button
                        onClick={() => { setActiveTab('profile'); setProfileDropdownOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <User size={16} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">My Profile</p>
                          <p className="text-xs text-gray-400">View and edit your profile</p>
                        </div>
                      </button>

                      <button
                        onClick={() => { setActiveTab('profile'); setProfileTab('security'); setProfileDropdownOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <KeyRound size={16} className="text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Security</p>
                          <p className="text-xs text-gray-400">Change password</p>
                        </div>
                      </button>

                      <button
                        onClick={() => { setActiveTab('settings'); setProfileDropdownOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Settings size={16} className="text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Settings</p>
                          <p className="text-xs text-gray-400">Store preferences</p>
                        </div>
                      </button>
                    </div>

                    {/* View Store */}
                    <div className="border-t border-gray-100 pt-2 mt-1">
                      <button
                        onClick={() => { navigate('/'); setProfileDropdownOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-orange-50 transition-colors group"
                      >
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                          <Home size={16} className="text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-orange-600">View Store</p>
                          <p className="text-xs text-orange-400">Go to main website</p>
                        </div>
                        <ExternalLink size={14} className="text-orange-400" />
                      </button>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-gray-100 pt-2 mt-1">
                      <button
                        onClick={() => { handleLogout(); setProfileDropdownOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-red-50 transition-colors group"
                      >
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                          <LogOut size={16} className="text-red-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-red-600">Sign Out</p>
                          <p className="text-xs text-red-400">Log out of your account</p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div key={i} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-xl ${stat.color}`}>
                          <Icon size={24} className="text-white" />
                        </div>
                        <span className="text-green-500 text-sm font-semibold flex items-center gap-1">
                          <TrendingUp size={14} /> {stat.change}
                        </span>
                      </div>
                      <h3 className="text-3xl font-black text-gray-900 mb-1">{stat.value}</h3>
                      <p className="text-gray-500 text-sm">{stat.label}</p>
                    </div>
                  );
                })}
              </div>

              {/* Charts & Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Sales Chart */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Sales Overview</h2>
                    <select 
                      value={salesTimeFilter}
                      onChange={(e) => setSalesTimeFilter(e.target.value)}
                      className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-medium focus:outline-none cursor-pointer hover:bg-gray-200 transition-colors"
                    >
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                      <option value="year">This Year</option>
                    </select>
                  </div>
                  <div className="flex items-end justify-around h-64 bg-gradient-to-t from-gray-50 to-transparent rounded-xl p-6">
                    {salesLoading ? (
                      <div className="w-full flex items-center justify-center">
                        <RefreshCw size={24} className="animate-spin text-ksp-red" />
                      </div>
                    ) : (() => {
                      const chartData = getChartData();
                      return chartData && chartData.length > 0 ? (
                        chartData.map((item, i) => {
                          const maxRevenue = Math.max(...chartData.map(d => d.revenue || 0));
                          const heightPercent = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
                          return (
                            <div key={i} className="flex flex-col items-center gap-2 group">
                              <div 
                                className="bg-gradient-to-t from-ksp-red to-red-400 rounded-t-lg transition-all hover:from-red-600 hover:to-red-500 cursor-pointer hover:shadow-lg"
                                style={{ 
                                  width: salesTimeFilter === 'year' ? '30px' : '12px',
                                  height: `${Math.max(heightPercent * 2, 20)}px` 
                                }}
                                title={`${item.dateStr}: ${item.orderCount} orders, LKR ${item.revenue.toLocaleString('en-LK', {maximumFractionDigits: 0})}`}
                              ></div>
                              <span className="text-xs text-gray-500 font-medium">{item.label}</span>
                              <span className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors">{item.orderCount}</span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="w-full flex items-center justify-center text-gray-500">
                          <p>No sales data available for this period</p>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
                    <button 
                    onClick={() => setActiveTab('orders')}
                    className="text-ksp-red text-sm font-semibold hover:underline">View All</button>
                  </div>
                  <div className="space-y-4">
                    {recentOrdersLoading ? (
                      <div className="flex items-center justify-center py-10">
                        <RefreshCw size={24} className="animate-spin text-ksp-red" />
                      </div>
                    ) : recentOrders.length > 0 ? (
                      recentOrders.map((order, i) => (
                        <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => { setSelectedOrder(order); setShowOrderDetail(true); }}>
                          <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center">
                            <ShoppingCart size={18} className="text-gray-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">
                              {order.userId ? `${order.userId.firstName} ${order.userId.lastName}` : 'Guest Customer'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {order.items && order.items.length > 0 
                                ? `${order.items[0].productId?.name || 'Product'}${order.items.length > 1 ? ` + ${order.items.length - 1} more` : ''}`
                                : 'No items'}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10">
                        <p className="text-gray-500 text-sm">No recent orders</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Low Stock Alert */}
              <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-white mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <AlertCircle size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">Low Stock Alert</h3>
                    <p className="text-white/80 text-sm">{products.filter(p => p.quantity > 0 && p.quantity <= 5).length} products are running low on stock. Review inventory to avoid stockouts.</p>
                  </div>
                  <button onClick={() => setActiveTab('stock')} className="px-6 py-3 bg-white text-ksp-red font-bold rounded-xl hover:bg-gray-100 transition-colors">
                    Review Stock
                  </button>
                </div>
              </div>

              {/* All Products with Filter */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">All Products</h2>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                          type="text" 
                          placeholder="Search products..." 
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-2 bg-gray-100 rounded-xl border-none focus:ring-2 focus:ring-ksp-red/20 w-64 text-sm" 
                        />
                      </div>
                      <select 
                        value={conditionFilter}
                        onChange={(e) => setConditionFilter(e.target.value)}
                        className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ksp-red/20"
                      >
                        <option value="all">All Products</option>
                        <option value="Brand New">Brand New Only</option>
                        <option value="Pre-Owned">Pre-Owned Only</option>
                      </select>
                      <button 
                        onClick={fetchProducts}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors text-sm"
                      >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
                      </button>
                    </div>
                  </div>
                </div>
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Product</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">SKU</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Brand</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Condition</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Price</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Stock</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                      <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                        <RefreshCw size={24} className="animate-spin mx-auto mb-2" />Loading products...
                      </td></tr>
                    ) : products
                        .filter(p => conditionFilter === 'all' || p.condition === conditionFilter)
                        .filter(p => !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku?.toLowerCase().includes(searchTerm.toLowerCase()))
                        .length === 0 ? (
                      <tr><td colSpan="8" className="px-6 py-12 text-center text-gray-500">No products found</td></tr>
                    ) : products
                        .filter(p => conditionFilter === 'all' || p.condition === conditionFilter)
                        .filter(p => !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku?.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((product) => (
                      <tr key={product._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${product.condition === 'Brand New' ? 'bg-green-100' : 'bg-orange-100'}`}>
                              {product.condition === 'Brand New' ? (
                                <Sparkles size={20} className="text-green-600" />
                              ) : (
                                <RotateCcw size={20} className="text-orange-600" />
                              )}
                            </div>
                            <div>
                              <span className="font-semibold text-gray-900 block">{product.name}</span>
                              <span className="text-xs text-gray-500">{product.storage}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 font-mono text-sm">{product.sku}</td>
                        <td className="px-6 py-4 text-gray-600">{product.brand}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${product.condition === 'Brand New' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {product.condition}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900">{formatPrice(product.price)}</td>
                        <td className="px-6 py-4 text-gray-600">{product.quantity} units</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${getStatusColor(getStockStatus(product.quantity))}`}>
                            {getStockStatus(product.quantity)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openEditModal(product)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Edit">
                              <Edit size={18} className="text-blue-500" />
                            </button>
                            <button onClick={() => { setSelectedProduct(product); setShowDeleteConfirm(true); }} className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                              <Trash2 size={18} className="text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Brand New Tab */}
          {activeTab === 'brand-new' && (
            <>
              {/* Stock Summary Cards for Brand New */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-xl">
                      <Box size={22} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">In Stock</p>
                      <p className="text-2xl font-black text-gray-900">{products.filter(p => p.condition === 'Brand New' && p.quantity > 5).length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-yellow-100 rounded-xl">
                      <AlertCircle size={22} className="text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Low Stock</p>
                      <p className="text-2xl font-black text-gray-900">{products.filter(p => p.condition === 'Brand New' && p.quantity > 0 && p.quantity <= 5).length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-100 rounded-xl">
                      <X size={22} className="text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Out of Stock</p>
                      <p className="text-2xl font-black text-gray-900">{products.filter(p => p.condition === 'Brand New' && p.quantity === 0).length}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Search brand new products..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-ksp-red/20 w-80" 
                    />
                  </div>
                  <button 
                    onClick={fetchProducts}
                    className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Refresh
                  </button>
                </div>
                <button 
                  onClick={() => { resetForm(); setProductForm(prev => ({...prev, condition: 'Brand New'})); setShowAddProduct(true); }}
                  className="flex items-center gap-2 px-6 py-3 bg-ksp-red text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
                >
                  <Plus size={20} /> Add Brand New Product
                </button>
              </div>

              {/* Brand New Products Table */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Sparkles size={20} className="text-green-600" />
                    <span className="font-semibold text-green-800">Brand New Products</span>
                    <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      {products.filter(p => p.condition === 'Brand New').length} items
                    </span>
                  </div>
                </div>
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Product</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">SKU</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Brand</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Price</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Stock</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                      <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                        <RefreshCw size={24} className="animate-spin mx-auto mb-2" />Loading products...
                      </td></tr>
                    ) : products.filter(p => p.condition === 'Brand New').length === 0 ? (
                      <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-500">No brand new products found</td></tr>
                    ) : products.filter(p => p.condition === 'Brand New').map((product) => (
                      <tr key={product._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                              <Sparkles size={20} className="text-green-600" />
                            </div>
                            <div>
                              <span className="font-semibold text-gray-900 block">{product.name}</span>
                              <span className="text-xs text-gray-500">{product.storage} • {product.condition}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 font-mono text-sm">{product.sku}</td>
                        <td className="px-6 py-4 text-gray-600">{product.brand}</td>
                        <td className="px-6 py-4 font-semibold text-gray-900">{formatPrice(product.price)}</td>
                        <td className="px-6 py-4 text-gray-600">{product.quantity} units</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${getStatusColor(getStockStatus(product.quantity))}`}>
                            {getStockStatus(product.quantity)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openEditModal(product)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Edit">
                              <Edit size={18} className="text-blue-500" />
                            </button>
                            <button onClick={() => { setSelectedProduct(product); setShowDeleteConfirm(true); }} className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                              <Trash2 size={18} className="text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Pre-Owned Tab */}
          {activeTab === 'pre-owned' && (
            <>
              {/* Stock Summary Cards for Pre-Owned */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-xl">
                      <Box size={22} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">In Stock</p>
                      <p className="text-2xl font-black text-gray-900">{products.filter(p => p.condition === 'Pre-Owned' && p.quantity > 5).length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-yellow-100 rounded-xl">
                      <AlertCircle size={22} className="text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Low Stock</p>
                      <p className="text-2xl font-black text-gray-900">{products.filter(p => p.condition === 'Pre-Owned' && p.quantity > 0 && p.quantity <= 5).length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-100 rounded-xl">
                      <X size={22} className="text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Out of Stock</p>
                      <p className="text-2xl font-black text-gray-900">{products.filter(p => p.condition === 'Pre-Owned' && p.quantity === 0).length}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Search pre-owned products..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-ksp-red/20 w-80" 
                    />
                  </div>
                  <button 
                    onClick={fetchProducts}
                    className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Refresh
                  </button>
                </div>
                <button 
                  onClick={() => { resetForm(); setProductForm(prev => ({...prev, condition: 'Pre-Owned'})); setShowAddProduct(true); }}
                  className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors"
                >
                  <Plus size={20} /> Add Pre-Owned Product
                </button>
              </div>

              {/* Pre-Owned Products Table */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <RotateCcw size={20} className="text-orange-600" />
                    <span className="font-semibold text-orange-800">Pre-Owned Products</span>
                    <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                      {products.filter(p => p.condition === 'Pre-Owned').length} items
                    </span>
                  </div>
                </div>
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Product</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">SKU</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Brand</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Price</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Stock</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                      <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                        <RefreshCw size={24} className="animate-spin mx-auto mb-2" />Loading products...
                      </td></tr>
                    ) : products.filter(p => p.condition === 'Pre-Owned').length === 0 ? (
                      <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-500">No pre-owned products found</td></tr>
                    ) : products.filter(p => p.condition === 'Pre-Owned').map((product) => (
                      <tr key={product._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                              <RotateCcw size={20} className="text-orange-600" />
                            </div>
                            <div>
                              <span className="font-semibold text-gray-900 block">{product.name}</span>
                              <span className="text-xs text-gray-500">{product.storage} • {product.condition}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 font-mono text-sm">{product.sku}</td>
                        <td className="px-6 py-4 text-gray-600">{product.brand}</td>
                        <td className="px-6 py-4 font-semibold text-gray-900">{formatPrice(product.price)}</td>
                        <td className="px-6 py-4 text-gray-600">{product.quantity} units</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${getStatusColor(getStockStatus(product.quantity))}`}>
                            {getStockStatus(product.quantity)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openEditModal(product)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Edit">
                              <Edit size={18} className="text-blue-500" />
                            </button>
                            <button onClick={() => { setSelectedProduct(product); setShowDeleteConfirm(true); }} className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                              <Trash2 size={18} className="text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Clients Tab */}
          {activeTab === 'clients' && (
            <>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Search clients by name, email..." 
                      value={clientSearchTerm}
                      onChange={(e) => setClientSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-ksp-red/20 w-80" 
                    />
                  </div>
                  <select
                    value={clientStatusFilter}
                    onChange={(e) => setClientStatusFilter(e.target.value)}
                    className="px-4 py-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-ksp-red/20 text-sm font-medium"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <button 
                    onClick={fetchClients}
                    className="p-3 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                    title="Refresh"
                  >
                    <RefreshCw size={18} className={clientsLoading ? 'animate-spin text-ksp-red' : 'text-gray-500'} />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-500">
                    <span className="font-semibold text-gray-900">{clients.length}</span> customers found
                  </div>
                </div>
              </div>

              {/* Clients Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Users size={24} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
                      <p className="text-sm text-gray-500">Total Customers</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <CheckCircle size={24} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{clients.filter(c => c.isActive).length}</p>
                      <p className="text-sm text-gray-500">Active</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                      <XCircle size={24} className="text-red-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{clients.filter(c => !c.isActive).length}</p>
                      <p className="text-sm text-gray-500">Inactive</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Clock size={24} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {clients.filter(c => {
                          const date = new Date(c.createdAt);
                          const now = new Date();
                          const diffTime = Math.abs(now - date);
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          return diffDays <= 7;
                        }).length}
                      </p>
                      <p className="text-sm text-gray-500">New This Week</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Loading State */}
              {clientsLoading && (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <RefreshCw size={40} className="animate-spin text-ksp-red mx-auto mb-4" />
                    <p className="text-gray-500">Loading customers...</p>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!clientsLoading && clients.length === 0 && (
                <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users size={40} className="text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Customers Found</h3>
                  <p className="text-gray-500 mb-4">
                    {clientSearchTerm ? 'Try adjusting your search terms' : 'Customers will appear here when they register'}
                  </p>
                </div>
              )}

              {/* Clients Grid */}
              {!clientsLoading && clients.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {clients.map((client) => (
                    <div key={client._id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-ksp-red to-red-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                            {client.firstName?.charAt(0) || client.email?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900">
                              {client.firstName && client.lastName 
                                ? `${client.firstName} ${client.lastName}` 
                                : client.firstName || 'No Name'}
                            </h3>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                              client.isActive 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${client.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                              {client.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <p className="flex items-center gap-2">
                          <Mail size={14} className="text-gray-400" />
                          <span className="truncate">{client.email}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Phone size={14} className="text-gray-400" />
                          <span>{client.phone || 'Not provided'}</span>
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100 mb-4">
                        <div>
                          <p className="text-xs text-gray-500">Member Since</p>
                          <p className="font-semibold text-gray-900 text-sm">
                            {new Date(client.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Last Login</p>
                          <p className="font-semibold text-gray-900 text-sm">
                            {client.lastLogin 
                              ? new Date(client.lastLogin).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })
                              : 'Never'
                            }
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setSelectedClient(client);
                            setShowClientDetail(true);
                          }}
                          className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
                        >
                          <Eye size={14} /> View
                        </button>
                        <button
                          onClick={() => handleToggleClientStatus(client._id, client.isActive)}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                            client.isActive 
                              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {client.isActive ? <><XCircle size={14} /> Deactivate</> : <><CheckCircle size={14} /> Activate</>}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Client Detail Modal */}
              {showClientDetail && selectedClient && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-ksp-red to-red-600 p-6 text-white">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold">Customer Details</h3>
                        <button
                          onClick={() => {
                            setShowClientDetail(false);
                            setSelectedClient(null);
                          }}
                          className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-ksp-red to-red-600 rounded-full flex items-center justify-center text-white font-bold text-3xl shadow-lg">
                          {selectedClient.firstName?.charAt(0) || selectedClient.email?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-gray-900">
                            {selectedClient.firstName && selectedClient.lastName 
                              ? `${selectedClient.firstName} ${selectedClient.lastName}` 
                              : selectedClient.firstName || 'No Name'}
                          </h4>
                          <p className="text-gray-500">{selectedClient.email}</p>
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold mt-2 ${
                            selectedClient.isActive 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {selectedClient.isActive ? 'Active Account' : 'Inactive Account'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="bg-gray-50 rounded-xl p-4">
                          <h5 className="text-sm font-semibold text-gray-500 mb-3">Contact Information</h5>
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <Mail size={16} className="text-gray-400" />
                              <span className="text-gray-900">{selectedClient.email}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <Phone size={16} className="text-gray-400" />
                              <span className="text-gray-900">{selectedClient.phone || 'Not provided'}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-xl p-4">
                          <h5 className="text-sm font-semibold text-gray-500 mb-3">Account Information</h5>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500">Member Since</p>
                              <p className="font-semibold text-gray-900">
                                {new Date(selectedClient.createdAt).toLocaleDateString('en-US', {
                                  month: 'long',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Last Login</p>
                              <p className="font-semibold text-gray-900">
                                {selectedClient.lastLogin 
                                  ? new Date(selectedClient.lastLogin).toLocaleDateString('en-US', {
                                      month: 'long',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })
                                  : 'Never logged in'
                                }
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Account Role</p>
                              <p className="font-semibold text-gray-900 capitalize">{selectedClient.role}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Account ID</p>
                              <p className="font-mono text-xs text-gray-600">{selectedClient._id}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 mt-6">
                        <button
                          onClick={() => handleToggleClientStatus(selectedClient._id, selectedClient.isActive)}
                          className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${
                            selectedClient.isActive 
                              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {selectedClient.isActive 
                            ? <><XCircle size={18} /> Deactivate Account</> 
                            : <><CheckCircle size={18} /> Activate Account</>
                          }
                        </button>
                        <button
                          onClick={() => {
                            if (selectedClient.orderCount > 0) {
                              alert("Cannot delete user because there are some orders");
                            } else {
                              if (window.confirm('Are you sure you want to permanently delete this user?')) {
                                handleDeleteClient(selectedClient);
                              }
                            }
                          }}
                          className="px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                          title="Delete User"
                        >
                          <Trash2 size={18} /> Delete
                        </button>
                        <button
                          onClick={() => {
                            setShowClientDetail(false);
                            setSelectedClient(null);
                          }}
                          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              {/* Orders Header */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Order Management</h2>
                    <p className="text-sm text-gray-500">Manage and update customer orders in real-time</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={fetchOrders}
                      className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      title="Refresh Orders"
                    >
                      <RefreshCw size={18} className={ordersLoading ? 'animate-spin' : ''} />
                    </button>
                    <select 
                      value={orderStatusFilter}
                      onChange={(e) => setOrderStatusFilter(e.target.value)}
                      className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ksp-red/20"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-6 divide-x divide-gray-100 bg-gray-50">
                  <div className="p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
                    <p className="text-xs text-gray-500">Total</p>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-2xl font-bold text-orange-600">{orders.filter(o => o.status === 'pending').length}</p>
                    <p className="text-xs text-gray-500">Pending</p>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">{orders.filter(o => o.status === 'confirmed').length}</p>
                    <p className="text-xs text-gray-500">Confirmed</p>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-2xl font-bold text-yellow-600">{orders.filter(o => o.status === 'processing').length}</p>
                    <p className="text-xs text-gray-500">Processing</p>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-2xl font-bold text-purple-600">{orders.filter(o => o.status === 'shipped').length}</p>
                    <p className="text-xs text-gray-500">Shipped</p>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{orders.filter(o => o.status === 'delivered').length}</p>
                    <p className="text-xs text-gray-500">Delivered</p>
                  </div>
                </div>
              </div>

              {/* Orders Table */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {ordersLoading ? (
                  <div className="p-12 text-center">
                    <RefreshCw size={32} className="animate-spin mx-auto mb-4 text-ksp-red" />
                    <p className="text-gray-500">Loading orders...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="p-12 text-center">
                    <ShoppingCart size={48} className="mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No orders found</h3>
                    <p className="text-gray-500">Orders will appear here when customers place them</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Order ID</th>
                          <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Customer</th>
                          <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Items</th>
                          <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Amount</th>
                          <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Payment</th>
                          <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Date</th>
                          <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                          <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <span className="font-mono font-semibold text-ksp-red">{order.orderId}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {order.userId?.firstName} {order.userId?.lastName}
                                </p>
                                <p className="text-xs text-gray-500">{order.userId?.email}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-600">{order.itemCount || order.items?.length || 0} item(s)</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-semibold text-gray-900">
                                {formatAmount(order.totalAmount)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 
                                order.paymentStatus === 'pending_verification' ? 'bg-orange-100 text-orange-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {order.paymentMethod === 'cash_on_delivery' ? 'COD' : 
                                 order.paymentMethod === 'bank_slip' ? 'Bank' : 'Card'} • {
                                  order.paymentStatus === 'pending_verification' ? 'Pending Verify' : 
                                  order.paymentStatus || 'Unpaid'
                                }
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {new Date(order.createdAt).toLocaleDateString('en-US', { 
                                month: 'short', day: 'numeric', year: 'numeric' 
                              })}
                            </td>
                            <td className="px-6 py-4">
                              <select
                                value={order.status}
                                onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-0 cursor-pointer transition-colors ${
                                  order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                  order.status === 'shipped' ? 'bg-purple-100 text-purple-700' :
                                  order.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                                  order.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                                  order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                  'bg-orange-100 text-orange-700'
                                }`}
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-1">
                                <button 
                                  onClick={() => { setSelectedOrder(order); setShowOrderDetail(true); }}
                                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                  title="View Details"
                                >
                                  <Eye size={18} className="text-gray-500" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order Detail Modal */}
          {showOrderDetail && selectedOrder && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                    <p className="text-sm text-gray-500">#{selectedOrder.orderId}</p>
                  </div>
                  <button 
                    onClick={() => { setShowOrderDetail(false); setSelectedOrder(null); }}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Status */}
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500">Status:</span>
                      <select
                        value={selectedOrder.status}
                        onChange={(e) => {
                          handleUpdateOrderStatus(selectedOrder._id, e.target.value);
                          setSelectedOrder({ ...selectedOrder, status: e.target.value });
                        }}
                        className={`px-4 py-2 rounded-xl font-semibold border-0 cursor-pointer ${
                          selectedOrder.status === 'delivered' ? 'bg-green-100 text-green-700' :
                          selectedOrder.status === 'shipped' ? 'bg-purple-100 text-purple-700' :
                          selectedOrder.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                          selectedOrder.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                          selectedOrder.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-orange-100 text-orange-700'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <button
                      onClick={() => handleDeleteOrder(selectedOrder._id)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold"
                    >
                      <Trash2 size={16} /> Delete Order
                    </button>
                  </div>

                  {/* Customer Info */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Users size={18} /> Customer Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Name</p>
                        <p className="font-medium">{selectedOrder.userId?.firstName} {selectedOrder.userId?.lastName}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Email</p>
                        <p className="font-medium">{selectedOrder.userId?.email}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Phone</p>
                        <p className="font-medium">{selectedOrder.userId?.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Payment</p>
                        <p className="font-medium capitalize">
                          {selectedOrder.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 
                           selectedOrder.paymentMethod === 'bank_slip' ? 'Bank Transfer' : 
                           selectedOrder.paymentMethod}
                          {' • '}
                          <span className={
                            selectedOrder.paymentStatus === 'paid' ? 'text-green-600' : 
                            selectedOrder.paymentStatus === 'pending_verification' ? 'text-orange-600' : 
                            'text-yellow-600'
                          }>
                            {selectedOrder.paymentStatus === 'pending_verification' ? 'Pending Verification' : 
                             selectedOrder.paymentStatus || 'Unpaid'}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bank Slip - if applicable */}
                  {selectedOrder.bankSlipUrl && (
                    <div className="bg-blue-50 rounded-xl p-4">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <FileText size={18} /> Bank Slip
                      </h3>
                      <div className="flex items-center gap-4">
                        <a 
                          href={resolveMediaUrl(selectedOrder.bankSlipUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Eye size={16} /> View Bank Slip
                        </a>
                        {selectedOrder.paymentStatus === 'pending_verification' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleVerifyPayment(selectedOrder._id, 'approve')}
                              className="inline-flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                            >
                              <CheckCircle size={14} /> Approve
                            </button>
                            <button
                              onClick={() => { setSelectedPayment(selectedOrder); setShowPaymentDetail(true); setShowOrderDetail(false); }}
                              className="inline-flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                            >
                              <XCircle size={14} /> Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Shipping Address */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <MapPin size={18} /> Shipping Address
                    </h3>
                    <p className="text-gray-700">
                      {selectedOrder.shippingAddress}
                      {selectedOrder.shippingCity && `, ${selectedOrder.shippingCity}`}
                      {selectedOrder.shippingProvince && `, ${selectedOrder.shippingProvince}`}
                      {selectedOrder.shippingPostalCode && ` ${selectedOrder.shippingPostalCode}`}
                    </p>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Package size={18} /> Order Items
                    </h3>
                    <div className="space-y-3">
                      {selectedOrder.items?.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                          <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-gray-200">
                            {item.productId?.imageUrl ? (
                              <img src={resolveMediaUrl(item.productId.imageUrl)} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Box size={24} className="text-gray-300" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.productId?.name || 'Product'}</p>
                            <p className="text-sm text-gray-500">{item.productId?.brand}</p>
                            <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              {formatAmount(item.pricePerUnit)}
                            </p>
                            <p className="text-sm text-gray-500">
                              Subtotal: {formatAmount(item.subtotal)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="flex items-center justify-between p-4 bg-ksp-red/5 rounded-xl">
                    <span className="font-semibold text-gray-900">Total Amount</span>
                    <span className="text-2xl font-bold text-ksp-red">
                      {formatAmount(selectedOrder.totalAmount)}
                    </span>
                  </div>

                  {/* Order Notes */}
                  {selectedOrder.notes && (
                    <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                      <p className="text-xs text-yellow-700 uppercase tracking-wide mb-1 font-semibold">Customer Notes</p>
                      <p className="text-gray-700">{selectedOrder.notes}</p>
                    </div>
                  )}

                  {/* Timestamps */}
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>Created: {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                    {selectedOrder.updatedAt && (
                      <p>Last Updated: {new Date(selectedOrder.updatedAt).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Payment Verification</h2>
                      <p className="text-sm text-gray-500 mt-1">Verify bank slip payments and other payment methods</p>
                    </div>
                    <button 
                      onClick={fetchPendingPayments}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                    >
                      <RefreshCw size={16} className={paymentsLoading ? 'animate-spin' : ''} />
                      Refresh
                    </button>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100 bg-gray-50">
                  <div className="p-4 text-center">
                    <p className="text-2xl font-bold text-orange-600">{pendingPayments.length}</p>
                    <p className="text-xs text-gray-500">Pending Verification</p>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {pendingPayments.filter(p => p.paymentMethod === 'bank_slip').length}
                    </p>
                    <p className="text-xs text-gray-500">Bank Transfers</p>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {pendingPayments.filter(p => p.paymentMethod === 'payhere').length}
                    </p>
                    <p className="text-xs text-gray-500">PayHere</p>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {formatAmount(pendingPayments.reduce((sum, p) => {
                        let val = p.totalAmount;
                        if (typeof val === 'object') val = val.$numberDecimal || val.toString();
                        return sum + (parseFloat(val) || 0);
                      }, 0))}
                    </p>
                    <p className="text-xs text-gray-500">Total Value</p>
                  </div>
                </div>
              </div>

              {/* Pending Payments List */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {paymentsLoading ? (
                  <div className="p-12 text-center">
                    <RefreshCw size={32} className="animate-spin mx-auto mb-4 text-ksp-red" />
                    <p className="text-gray-500">Loading pending payments...</p>
                  </div>
                ) : pendingPayments.length === 0 ? (
                  <div className="p-12 text-center">
                    <CheckCircle size={48} className="mx-auto mb-4 text-green-300" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">All payments verified!</h3>
                    <p className="text-gray-500">No pending payment verifications at this time</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Order ID</th>
                          <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Customer</th>
                          <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Amount</th>
                          <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Payment Method</th>
                          <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Bank Slip</th>
                          <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Date</th>
                          <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingPayments.map((payment) => (
                          <tr key={payment._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <span className="font-mono font-semibold text-ksp-red">{payment.orderId}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {payment.userId?.firstName} {payment.userId?.lastName}
                                </p>
                                <p className="text-xs text-gray-500">{payment.userId?.email}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-semibold text-gray-900">
                                {formatAmount(payment.totalAmount)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                                payment.paymentMethod === 'bank_slip' ? 'bg-blue-100 text-blue-700' :
                                payment.paymentMethod === 'payhere' ? 'bg-purple-100 text-purple-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {payment.paymentMethod === 'bank_slip' ? 'Bank Transfer' : 
                                 payment.paymentMethod === 'cash_on_delivery' ? 'COD' : 
                                 payment.paymentMethod}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {payment.bankSlipUrl ? (
                                <a 
                                  href={resolveMediaUrl(payment.bankSlipUrl)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                                >
                                  <Image size={16} /> View Slip
                                </a>
                              ) : (
                                <span className="text-gray-400 text-sm">N/A</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {new Date(payment.createdAt).toLocaleDateString('en-US', { 
                                month: 'short', day: 'numeric', year: 'numeric' 
                              })}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => { setSelectedPayment(payment); setShowPaymentDetail(true); }}
                                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                  title="View Details"
                                >
                                  <Eye size={18} className="text-gray-500" />
                                </button>
                                <button 
                                  onClick={() => handleVerifyPayment(payment._id, 'approve')}
                                  className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                                  title="Approve Payment"
                                >
                                  <CheckCircle size={18} className="text-green-600" />
                                </button>
                                <button 
                                  onClick={() => { setSelectedPayment(payment); setShowPaymentDetail(true); }}
                                  className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                  title="Reject Payment"
                                >
                                  <XCircle size={18} className="text-red-600" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Detail Modal */}
          {showPaymentDetail && selectedPayment && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Payment Verification</h2>
                    <p className="text-sm text-gray-500">Order #{selectedPayment.orderId}</p>
                  </div>
                  <button 
                    onClick={() => { setShowPaymentDetail(false); setSelectedPayment(null); setRejectReason(''); }}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Customer Info */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Users size={18} /> Customer Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Name</p>
                        <p className="font-medium">{selectedPayment.userId?.firstName} {selectedPayment.userId?.lastName}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Email</p>
                        <p className="font-medium">{selectedPayment.userId?.email}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Phone</p>
                        <p className="font-medium">{selectedPayment.userId?.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Order Date</p>
                        <p className="font-medium">{new Date(selectedPayment.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="bg-blue-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <CreditCard size={18} /> Payment Details
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Payment Method</p>
                        <p className="font-medium capitalize">
                          {selectedPayment.paymentMethod === 'bank_slip' ? 'Bank Transfer' : selectedPayment.paymentMethod}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Amount</p>
                        <p className="font-bold text-lg text-ksp-red">
                          {formatAmount(selectedPayment.totalAmount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Payment Status</p>
                        <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-orange-100 text-orange-700">
                          Pending Verification
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bank Slip Preview */}
                  {selectedPayment.bankSlipUrl && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <FileText size={18} /> Bank Slip
                      </h3>
                      <div className="border rounded-xl overflow-hidden bg-white">
                        {selectedPayment.bankSlipUrl.endsWith('.pdf') ? (
                          <div className="p-8 text-center">
                            <FileText size={48} className="mx-auto mb-4 text-red-500" />
                            <p className="text-gray-600 mb-4">PDF Bank Slip</p>
                            <a 
                              href={resolveMediaUrl(selectedPayment.bankSlipUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-ksp-red text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                              <Eye size={16} /> View PDF
                            </a>
                          </div>
                        ) : (
                          <img 
                            src={resolveMediaUrl(selectedPayment.bankSlipUrl)}
                            alt="Bank Slip"
                            className="w-full max-h-96 object-contain"
                          />
                        )}
                      </div>
                      <a 
                        href={resolveMediaUrl(selectedPayment.bankSlipUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                      >
                        <Eye size={14} /> Open in new tab
                      </a>
                    </div>
                  )}

                  {/* Order Items */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Package size={18} /> Order Items
                    </h3>
                    <div className="space-y-3">
                      {selectedPayment.items?.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                          <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-gray-200">
                            {item.productId?.imageUrl ? (
                              <img src={resolveMediaUrl(item.productId.imageUrl)} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Box size={24} className="text-gray-300" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.productId?.name || 'Product'}</p>
                            <p className="text-sm text-gray-500">{item.productId?.brand}</p>
                            <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              {formatAmount(item.pricePerUnit)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rejection Reason */}
                  <div className="bg-red-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Rejection Reason (Optional)</h3>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Enter reason for rejection if applicable..."
                      className="w-full px-4 py-3 border border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                      rows={3}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleVerifyPayment(selectedPayment._id, 'approve')}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle size={20} /> Approve Payment
                    </button>
                    <button
                      onClick={() => handleVerifyPayment(selectedPayment._id, 'reject')}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
                    >
                      <XCircle size={20} /> Reject Payment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="max-w-4xl">
              {/* Settings Tabs */}
              <div className="flex items-center gap-2 mb-6 bg-white rounded-xl p-2 shadow-sm border border-gray-100">
                <button
                  onClick={() => setSettingsTab('store')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${settingsTab === 'store' ? 'bg-ksp-red text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  Store Settings
                </button>
                <button
                  onClick={() => setSettingsTab('about')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${settingsTab === 'about' ? 'bg-ksp-red text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  About Us Page
                </button>
              </div>

              {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">{success}</div>}
              {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}

              {/* Store Settings */}
              {settingsTab === 'store' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Store Settings</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Store Name</label>
                      <input type="text" value={aboutForm.storeName} onChange={(e) => setAboutForm({...aboutForm, storeName: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Email</label>
                      <input type="email" value={aboutForm.email} onChange={(e) => setAboutForm({...aboutForm, email: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                      <input type="text" value={aboutForm.phone} onChange={(e) => setAboutForm({...aboutForm, phone: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Store Address</label>
                      <input type="text" value={aboutForm.address} onChange={(e) => setAboutForm({...aboutForm, address: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Working Hours</label>
                      <input type="text" value={aboutForm.workingHours} onChange={(e) => setAboutForm({...aboutForm, workingHours: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20" />
                    </div>
                    <button onClick={handleSaveAboutUs} className="flex items-center gap-2 px-6 py-3 bg-ksp-red text-white rounded-xl font-semibold hover:bg-red-600 transition-colors">
                      <Save size={18} /> Save Changes
                    </button>
                  </div>
                </div>
              )}

              {/* About Us Settings */}
              {settingsTab === 'about' && (
                <div className="space-y-6">
                  {/* Hero Section */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Hero Section</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Store Name / Title</label>
                        <input type="text" value={aboutForm.storeName} onChange={(e) => setAboutForm({...aboutForm, storeName: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Tagline</label>
                        <input type="text" value={aboutForm.tagline} onChange={(e) => setAboutForm({...aboutForm, tagline: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20" />
                      </div>
                    </div>
                  </div>

                  {/* Stats Section */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Statistics</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Years in Business</label>
                        <input type="text" value={aboutForm.yearsInBusiness} onChange={(e) => setAboutForm({...aboutForm, yearsInBusiness: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Happy Customers</label>
                        <input type="text" value={aboutForm.happyCustomers} onChange={(e) => setAboutForm({...aboutForm, happyCustomers: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Brands Available</label>
                        <input type="text" value={aboutForm.brandsAvailable} onChange={(e) => setAboutForm({...aboutForm, brandsAvailable: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Warranty Support</label>
                        <input type="text" value={aboutForm.warrantySupport} onChange={(e) => setAboutForm({...aboutForm, warrantySupport: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20" />
                      </div>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">About Content</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Store Description</label>
                        <textarea rows={4} value={aboutForm.description} onChange={(e) => setAboutForm({...aboutForm, description: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20 resize-none"></textarea>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Our Mission</label>
                        <textarea rows={3} value={aboutForm.mission} onChange={(e) => setAboutForm({...aboutForm, mission: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20 resize-none"></textarea>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Our Vision</label>
                        <textarea rows={3} value={aboutForm.vision} onChange={(e) => setAboutForm({...aboutForm, vision: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20 resize-none"></textarea>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Contact Information</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                        <input type="text" value={aboutForm.address} onChange={(e) => setAboutForm({...aboutForm, address: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                          <input type="text" value={aboutForm.phone} onChange={(e) => setAboutForm({...aboutForm, phone: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                          <input type="email" value={aboutForm.email} onChange={(e) => setAboutForm({...aboutForm, email: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Working Hours</label>
                        <input type="text" value={aboutForm.workingHours} onChange={(e) => setAboutForm({...aboutForm, workingHours: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20" />
                      </div>
                    </div>
                  </div>

                  <button onClick={handleSaveAboutUs} className="flex items-center gap-2 px-6 py-3 bg-ksp-red text-white rounded-xl font-semibold hover:bg-red-600 transition-colors">
                    <Save size={18} /> Save About Us Content
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Subscriptions Tab */}
          {activeTab === 'subscriptions' && (
            <Subscriptions />
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="max-w-4xl">
              {/* Profile Tabs */}
              <div className="flex items-center gap-2 mb-6 bg-white rounded-xl p-2 shadow-sm border border-gray-100">
                <button
                  onClick={() => setProfileTab('info')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${profileTab === 'info' ? 'bg-ksp-red text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <User size={18} /> Profile Info
                </button>
                <button
                  onClick={() => setProfileTab('security')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${profileTab === 'security' ? 'bg-ksp-red text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Lock size={18} /> Security
                </button>
              </div>

              {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
              {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">{success}</div>}

              {profileLoading ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                  <RefreshCw size={32} className="animate-spin mx-auto mb-4 text-ksp-red" />
                  <p className="text-gray-600">Loading profile...</p>
                </div>
              ) : (
                <>
                  {/* Profile Info Tab */}
                  {profileTab === 'info' && adminProfile && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Profile Card */}
                      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-ksp-red to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-3xl font-bold text-white">
                            {adminProfile.firstName?.charAt(0)}{adminProfile.lastName?.charAt(0)}
                          </span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-1">
                          {adminProfile.firstName} {adminProfile.lastName}
                        </h2>
                        <p className="text-gray-500 mb-3">{adminProfile.email}</p>
                        <span className="inline-block px-4 py-1 bg-ksp-red/10 text-ksp-red rounded-full text-sm font-semibold capitalize">
                          {adminProfile.role}
                        </span>
                        <div className="mt-6 pt-6 border-t border-gray-100">
                          <p className="text-sm text-gray-500">
                            Member since {new Date(adminProfile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          </p>
                          {adminProfile.lastLogin && (
                            <p className="text-xs text-gray-400 mt-1">
                              Last login: {new Date(adminProfile.lastLogin).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Profile Details */}
                      <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex justify-between items-center mb-6">
                          <h2 className="text-xl font-bold text-gray-900">Profile Details</h2>
                          {!isEditingProfile ? (
                            <button
                              onClick={() => setIsEditingProfile(true)}
                              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                            >
                              <Edit size={16} /> Edit
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setIsEditingProfile(false);
                                setProfileForm({
                                  firstName: adminProfile.firstName || '',
                                  lastName: adminProfile.lastName || '',
                                  phone: adminProfile.phone || '',
                                  address: adminProfile.address || '',
                                  city: adminProfile.city || '',
                                  province: adminProfile.province || '',
                                  postalCode: adminProfile.postalCode || ''
                                });
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                            >
                              <X size={16} /> Cancel
                            </button>
                          )}
                        </div>

                        {!isEditingProfile ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                                <User size={20} className="text-ksp-red" />
                                <div>
                                  <p className="text-xs text-gray-500">First Name</p>
                                  <p className="font-semibold text-gray-900">{adminProfile.firstName || '-'}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                                <User size={20} className="text-ksp-red" />
                                <div>
                                  <p className="text-xs text-gray-500">Last Name</p>
                                  <p className="font-semibold text-gray-900">{adminProfile.lastName || '-'}</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                              <Mail size={20} className="text-ksp-red" />
                              <div>
                                <p className="text-xs text-gray-500">Email</p>
                                <p className="font-semibold text-gray-900">{adminProfile.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                              <Phone size={20} className="text-ksp-red" />
                              <div>
                                <p className="text-xs text-gray-500">Phone</p>
                                <p className="font-semibold text-gray-900">{adminProfile.phone || 'Not provided'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                              <MapPin size={20} className="text-ksp-red" />
                              <div>
                                <p className="text-xs text-gray-500">Address</p>
                                <p className="font-semibold text-gray-900">{adminProfile.address || 'Not provided'}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-xs text-gray-500">City</p>
                                <p className="font-semibold text-gray-900">{adminProfile.city || '-'}</p>
                              </div>
                              <div className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-xs text-gray-500">Province</p>
                                <p className="font-semibold text-gray-900">{adminProfile.province || '-'}</p>
                              </div>
                              <div className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-xs text-gray-500">Postal Code</p>
                                <p className="font-semibold text-gray-900">{adminProfile.postalCode || '-'}</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                                <input
                                  type="text"
                                  name="firstName"
                                  value={profileForm.firstName}
                                  onChange={handleProfileFormChange}
                                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                                <input
                                  type="text"
                                  name="lastName"
                                  value={profileForm.lastName}
                                  onChange={handleProfileFormChange}
                                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                              <input
                                type="email"
                                value={adminProfile.email}
                                disabled
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-100 text-gray-500"
                              />
                              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                              <input
                                type="tel"
                                name="phone"
                                value={profileForm.phone}
                                onChange={handleProfileFormChange}
                                placeholder="Enter phone number"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                              <input
                                type="text"
                                name="address"
                                value={profileForm.address}
                                onChange={handleProfileFormChange}
                                placeholder="Enter address"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20"
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                                <input
                                  type="text"
                                  name="city"
                                  value={profileForm.city}
                                  onChange={handleProfileFormChange}
                                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Province</label>
                                <select
                                  name="province"
                                  value={profileForm.province}
                                  onChange={handleProfileFormChange}
                                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20"
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
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Postal Code</label>
                                <input
                                  type="text"
                                  name="postalCode"
                                  value={profileForm.postalCode}
                                  onChange={handleProfileFormChange}
                                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20"
                                />
                              </div>
                            </div>
                            <button
                              onClick={handleSaveProfile}
                              disabled={loading}
                              className="flex items-center gap-2 px-6 py-3 bg-ksp-red text-white rounded-xl font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                              <Save size={18} /> {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Security Tab */}
                  {profileTab === 'security' && (
                    <div className="max-w-xl">
                      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                          <Lock size={20} className="text-ksp-red" /> Change Password
                        </h2>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label>
                            <input
                              type="password"
                              name="currentPassword"
                              value={passwordForm.currentPassword}
                              onChange={handlePasswordFormChange}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                            <input
                              type="password"
                              name="newPassword"
                              value={passwordForm.newPassword}
                              onChange={handlePasswordFormChange}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20"
                            />
                            <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
                            <input
                              type="password"
                              name="confirmPassword"
                              value={passwordForm.confirmPassword}
                              onChange={handlePasswordFormChange}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20"
                            />
                          </div>
                          <button
                            onClick={handleChangePassword}
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-3 bg-ksp-red text-white rounded-xl font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                          >
                            <Lock size={18} /> {loading ? 'Changing...' : 'Change Password'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Add Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Add New Product</h2>
              <button onClick={() => setShowAddProduct(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X size={20} /></button>
            </div>
            {error && <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
            {success && <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">{success}</div>}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name *</label>
                <input type="text" value={productForm.name} onChange={(e) => {
                  const newName = e.target.value;
                  const newSKU = generateSKU(newName, productForm.brand, productForm.color);
                  setProductForm({...productForm, name: newName, sku: newSKU});
                }} placeholder="e.g. iPhone 15 Pro Max" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">SKU</label>
                <input type="text" value={productForm.sku} onChange={(e) => setProductForm({...productForm, sku: e.target.value})} placeholder="Auto-generated (editable)" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20 bg-blue-50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Brand *</label>
                  <select value={productForm.brand} onChange={(e) => {
                    const newBrand = e.target.value;
                    const newSKU = generateSKU(productForm.name, newBrand, productForm.color);
                    setProductForm({...productForm, brand: newBrand, sku: newSKU});
                  }} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20">
                    <option value="">Select Brand</option>
                    <option value="Apple">Apple</option>
                    <option value="Samsung">Samsung</option>
                    <option value="Xiaomi">Xiaomi</option>
                    <option value="OnePlus">OnePlus</option>
                    <option value="Google">Google</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Product Type *</label>
                  <select value={productForm.productType} onChange={(e) => setProductForm({...productForm, productType: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20">
                    <option value="Phones">Phones</option>
                    <option value="Tablets">Tablets</option>
                    <option value="Earbuds">Earbuds</option>
                    <option value="Smartwatches">Smartwatches</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Condition</label>
                <select value={productForm.condition} onChange={(e) => setProductForm({...productForm, condition: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20">
                  <option value="Brand New">Brand New</option>
                  <option value="Pre-Owned">Pre-Owned</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Storage</label>
                <input type="text" value={productForm.storage} onChange={(e) => setProductForm({...productForm, storage: e.target.value})} placeholder="e.g. 256GB" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">RAM</label>
                  <input type="text" value={productForm.ram} onChange={(e) => setProductForm({...productForm, ram: e.target.value})} placeholder="e.g. 8GB" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Color</label>
                  <input type="text" value={productForm.color} onChange={(e) => {
                    const newColor = e.target.value;
                    const newSKU = generateSKU(productForm.name, productForm.brand, newColor);
                    setProductForm({...productForm, color: newColor, sku: newSKU});
                  }} placeholder="e.g. Midnight Black" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Price (LKR) *</label>
                  <input type="number" value={productForm.price} onChange={(e) => setProductForm({...productForm, price: e.target.value})} placeholder="389000" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Stock Quantity *</label>
                  <input type="number" value={productForm.quantity} onChange={(e) => setProductForm({...productForm, quantity: e.target.value})} placeholder="50" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea rows={3} value={productForm.description} onChange={(e) => setProductForm({...productForm, description: e.target.value})} placeholder="Product description..." className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20 resize-none"></textarea>
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={productForm.isNewArrival} 
                    onChange={(e) => setProductForm({...productForm, isNewArrival: e.target.checked})} 
                    className="w-4 h-4 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700">Mark as New Arrival</span>
                </label>
                <label className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={productForm.isPremiumDeal} 
                    onChange={(e) => setProductForm({...productForm, isPremiumDeal: e.target.checked})} 
                    className="w-4 h-4 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700">Mark as Premium Deal</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Product Image</label>
                <div className="space-y-3">
                  {/* Image Preview */}
                  {(imagePreview || productForm.imageUrl) && (
                    <div className="relative w-32 h-32 border border-gray-200 rounded-xl overflow-hidden">
                      <img 
                        src={imagePreview || resolveMediaUrl(productForm.imageUrl)}
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                      <button 
                        type="button"
                        onClick={() => { setImagePreview(null); setProductForm({...productForm, imageUrl: ''}); }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >×</button>
                    </div>
                  )}
                  {/* File Upload */}
                  <div className="flex items-center gap-3">
                    <label className="flex-1 flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-ksp-red/50 transition-colors">
                      <input 
                        type="file" 
                        accept=".png,.jpeg,.jpg,.webp,image/png,image/jpeg,image/jpg,image/webp" 
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      {uploadingImage ? (
                        <span className="text-gray-500">Uploading...</span>
                      ) : (
                        <span className="text-gray-500">📷 Click to upload image (PNG, JPG, WebP - max 5MB)</span>
                      )}
                    </label>
                  </div>
                  {/* OR URL Input */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">OR enter URL:</span>
                    <input 
                      type="text" 
                      value={productForm.imageUrl} 
                      onChange={(e) => { setProductForm({...productForm, imageUrl: e.target.value}); setImagePreview(null); }} 
                      placeholder="/images/products/phone.png" 
                      className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-ksp-red/20" 
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-4">
              <button onClick={() => { setShowAddProduct(false); resetForm(); }} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors">
                Cancel
              </button>
              <button onClick={handleCreateProduct} disabled={loading} className="px-6 py-3 bg-ksp-red text-white rounded-xl font-semibold hover:bg-red-600 transition-colors disabled:opacity-50">
                {loading ? 'Adding...' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditProduct && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Edit Product</h2>
              <button onClick={() => { setShowEditProduct(false); setSelectedProduct(null); }} className="p-2 hover:bg-gray-100 rounded-xl"><X size={20} /></button>
            </div>
            {error && <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
            {success && <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">{success}</div>}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name *</label>
                <input type="text" value={productForm.name} onChange={(e) => setProductForm({...productForm, name: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">SKU</label>
                <input type="text" value={productForm.sku} disabled className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Brand *</label>
                  <select value={productForm.brand} onChange={(e) => setProductForm({...productForm, brand: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20">
                    <option value="Apple">Apple</option>
                    <option value="Samsung">Samsung</option>
                    <option value="Xiaomi">Xiaomi</option>
                    <option value="OnePlus">OnePlus</option>
                    <option value="Google">Google</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Product Type *</label>
                  <select value={productForm.productType} onChange={(e) => setProductForm({...productForm, productType: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20">
                    <option value="Phones">Phones</option>
                    <option value="Tablets">Tablets</option>
                    <option value="Earbuds">Earbuds</option>
                    <option value="Smartwatches">Smartwatches</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Condition</label>
                <select value={productForm.condition} onChange={(e) => setProductForm({...productForm, condition: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20">
                  <option value="Brand New">Brand New</option>
                  <option value="Pre-Owned">Pre-Owned</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Storage</label>
                <input type="text" value={productForm.storage} onChange={(e) => setProductForm({...productForm, storage: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">RAM</label>
                  <input type="text" value={productForm.ram} onChange={(e) => setProductForm({...productForm, ram: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Color</label>
                  <input type="text" value={productForm.color} onChange={(e) => setProductForm({...productForm, color: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Price (LKR) *</label>
                  <input type="number" value={productForm.price} onChange={(e) => setProductForm({...productForm, price: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Stock Quantity *</label>
                  <input type="number" value={productForm.quantity} onChange={(e) => setProductForm({...productForm, quantity: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea rows={3} value={productForm.description} onChange={(e) => setProductForm({...productForm, description: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20 resize-none"></textarea>
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={productForm.isNewArrival} 
                    onChange={(e) => setProductForm({...productForm, isNewArrival: e.target.checked})} 
                    className="w-4 h-4 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700">Mark as New Arrival</span>
                </label>
                <label className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={productForm.isPremiumDeal} 
                    onChange={(e) => setProductForm({...productForm, isPremiumDeal: e.target.checked})} 
                    className="w-4 h-4 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700">Mark as Premium Deal</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Product Image</label>
                <div className="space-y-3">
                  {(imagePreview || productForm.imageUrl) && (
                    <div className="relative w-32 h-32 border border-gray-200 rounded-xl overflow-hidden">
                      <img 
                        src={imagePreview || resolveMediaUrl(productForm.imageUrl)}
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                      <button 
                        type="button"
                        onClick={() => { setImagePreview(null); setProductForm({...productForm, imageUrl: ''}); }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >×</button>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <label className="flex-1 flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-ksp-red/50 transition-colors">
                      <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={handleImageUpload} className="hidden" />
                      {uploadingImage ? <span className="text-gray-500">Uploading...</span> : <span className="text-gray-500">📷 Upload new image</span>}
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">OR URL:</span>
                    <input type="text" value={productForm.imageUrl} onChange={(e) => { setProductForm({...productForm, imageUrl: e.target.value}); setImagePreview(null); }} placeholder="/images/products/phone.png" className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-4">
              <button onClick={() => { setShowEditProduct(false); setSelectedProduct(null); resetForm(); }} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors">
                Cancel
              </button>
              <button onClick={handleUpdateProduct} disabled={loading} className="px-6 py-3 bg-ksp-red text-white rounded-xl font-semibold hover:bg-red-600 transition-colors disabled:opacity-50">
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} className="text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Delete Product?</h2>
              <p className="text-gray-500 mb-6">Are you sure you want to delete <span className="font-semibold">"{selectedProduct.name}"</span>? This action cannot be undone.</p>
              <div className="flex items-center justify-center gap-4">
                <button onClick={() => { setShowDeleteConfirm(false); setSelectedProduct(null); }} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
                <button onClick={handleDeleteProduct} disabled={loading} className="px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors disabled:opacity-50">
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {showAddClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Add New Client</h2>
              <button onClick={() => setShowAddClient(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <input type="text" placeholder="e.g. Kasun Perera" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <input type="email" placeholder="email@example.com" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                <input type="tel" placeholder="+94 77 123 4567" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                <textarea rows={2} placeholder="Full address..." className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ksp-red/20 resize-none"></textarea>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-4">
              <button onClick={() => setShowAddClient(false)} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors">
                Cancel
              </button>
              <button className="px-6 py-3 bg-ksp-red text-white rounded-xl font-semibold hover:bg-red-600 transition-colors">
                Add Client
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
