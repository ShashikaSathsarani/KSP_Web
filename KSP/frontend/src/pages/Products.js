import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { productService } from '../services/apiService';
import { resolveMediaUrl } from '../services/api';
import {
  Search,
  SlidersHorizontal,
  Grid3X3,
  LayoutList,
  ShoppingCart,
  Heart,
  ChevronDown,
  X,
  Sparkles,
  Zap,
  Shield,
  Tag,
  RefreshCw
} from 'lucide-react';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const navigate = useNavigate();

  // Filter states
  const [filters, setFilters] = useState({
    brand: searchParams.get('brand') || '',
    condition: searchParams.get('condition') || '',
    productType: searchParams.get('productType') || searchParams.get('category') || '',
    minPrice: '',
    maxPrice: '',
    storage: '',
    search: searchParams.get('search') || ''
  });

  const [sortBy, setSortBy] = useState('newest');

  const brands = ['Apple', 'Samsung', 'Xiaomi', 'OnePlus', 'Google', 'Huawei', 'POCO', 'Realme'];
  const conditions = ['Brand New', 'Pre-Owned'];
  const storageOptions = ['64GB', '128GB', '256GB', '512GB', '1TB'];

  // Sync filters with URL params when they change
  useEffect(() => {
    setFilters({
      brand: searchParams.get('brand') || '',
      condition: searchParams.get('condition') || '',
      productType: searchParams.get('productType') || searchParams.get('category') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      storage: searchParams.get('storage') || '',
      search: searchParams.get('search') || ''
    });
  }, [searchParams]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        ...(filters.brand && { brand: filters.brand }),
        ...(filters.condition && { condition: filters.condition }),
        ...(filters.productType && { productType: filters.productType }),
        ...(filters.minPrice && { minPrice: filters.minPrice }),
        ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
        ...(filters.search && { search: filters.search }),
        sortBy: sortBy === 'newest' ? 'createdAt' : sortBy === 'price-low' ? 'price' : sortBy === 'price-high' ? 'price' : 'name',
        sortOrder: sortBy === 'price-high' ? 'DESC' : sortBy === 'newest' ? 'DESC' : 'ASC'
      };
      const response = await productService.getAllProducts(params);
      setProducts(response.data.products || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const clearFilters = () => {
    setFilters({ brand: '', condition: '', productType: '', minPrice: '', maxPrice: '', storage: '', search: '' });
    setSearchParams({});
  };

  const toggleFavorite = (id) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const formatPrice = (price) => {
    return `LKR ${parseFloat(price).toLocaleString()}`;
  };

  const getStockBadge = (quantity) => {
    if (quantity === 0) return { text: 'Out of Stock', color: 'bg-red-500' };
    if (quantity <= 5) return { text: 'Low Stock', color: 'bg-orange-500' };
    return { text: 'In Stock', color: 'bg-green-500' };
  };

  const activeFiltersCount = Object.values(filters).filter(v => v !== '').length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#c4c4c4', fontFamily: 'Montserrat, sans-serif' }}>

      {/* Hero Section */}
      <section className="relative py-16 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-ksp-red opacity-95"></div>
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-ksp-red/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto relative z-10">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="text-ksp-red" size={20} />
              <span className="text-ksp-red font-semibold text-sm uppercase tracking-widest">Premium Collection</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white mb-4 leading-tight">
              Discover Your <span className="text-ksp-red">Perfect</span> Device
            </h1>
            <p className="text-gray-300 text-lg mb-8 max-w-xl">
              Browse our extensive collection of authentic smartphones from world-leading brands.
            </p>

            {/* Search Bar */}
            <div className="relative max-w-xl">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Search className="text-gray-400" size={20} />
              </div>
              <input
                type="text"
                placeholder="Search for phones, brands, models..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-14 pr-6 py-5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ksp-red/50 focus:border-ksp-red/50 transition-all"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-6 py-12">

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all ${showFilters ? 'bg-ksp-red text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                } shadow-md`}
            >
              <SlidersHorizontal size={18} />
              Filters
              {activeFiltersCount > 0 && (
                <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">{activeFiltersCount}</span>
              )}
            </button>

            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-3 text-gray-600 hover:text-ksp-red transition-colors"
              >
                <X size={16} /> Clear all
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-gray-600 text-sm">{products.length} products</span>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white px-5 py-3 pr-10 rounded-xl font-medium text-gray-700 shadow-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-ksp-red/20"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name: A-Z</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
            </div>

            {/* View Toggle */}
            <div className="flex bg-white rounded-xl p-1 shadow-md">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-ksp-red text-white' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Grid3X3 size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-ksp-red text-white' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <LayoutList size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-3xl p-6 mb-8 shadow-lg border border-gray-100 animate-fadeIn">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {/* Brand Filter */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Brand</label>
                <select
                  value={filters.brand}
                  onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ksp-red/20"
                >
                  <option value="">All Brands</option>
                  {brands.map(brand => <option key={brand} value={brand}>{brand}</option>)}
                </select>
              </div>

              {/* Condition Filter */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Condition</label>
                <select
                  value={filters.condition}
                  onChange={(e) => setFilters({ ...filters, condition: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ksp-red/20"
                >
                  <option value="">All Conditions</option>
                  {conditions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Storage Filter */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Storage</label>
                <select
                  value={filters.storage}
                  onChange={(e) => setFilters({ ...filters, storage: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ksp-red/20"
                >
                  <option value="">All Storage</option>
                  {storageOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Product Type Filter */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                <select
                  value={filters.productType}
                  onChange={(e) => setFilters({ ...filters, productType: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ksp-red/20"
                >
                  <option value="">All Categories</option>
                  <option value="Phones">Phones</option>
                  <option value="Tablets">Tablets</option>
                  <option value="Earbuds">Earbuds</option>
                  <option value="Smartwatches">Smartwatches</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Min Price</label>
                <input
                  type="number"
                  placeholder="Rs. 0"
                  value={filters.minPrice}
                  onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ksp-red/20"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Max Price</label>
                <input
                  type="number"
                  placeholder="Rs. 500,000"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ksp-red/20"
                />
              </div>
            </div>
          </div>
        )}

        {/* Active Filter Tags */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {filters.brand && (
              <span className="flex items-center gap-2 px-4 py-2 bg-ksp-red/10 text-ksp-red rounded-full text-sm font-medium">
                Brand: {filters.brand}
                <X size={14} className="cursor-pointer hover:scale-110" onClick={() => setFilters({ ...filters, brand: '' })} />
              </span>
            )}
            {filters.condition && (
              <span className="flex items-center gap-2 px-4 py-2 bg-ksp-red/10 text-ksp-red rounded-full text-sm font-medium">
                {filters.condition}
                <X size={14} className="cursor-pointer hover:scale-110" onClick={() => setFilters({ ...filters, condition: '' })} />
              </span>
            )}
            {filters.productType && (
              <span className="flex items-center gap-2 px-4 py-2 bg-ksp-red/10 text-ksp-red rounded-full text-sm font-medium">
                Category: {filters.productType}
                <X size={14} className="cursor-pointer hover:scale-110" onClick={() => setFilters({ ...filters, productType: '' })} />
              </span>
            )}
            {filters.search && (
              <span className="flex items-center gap-2 px-4 py-2 bg-ksp-red/10 text-ksp-red rounded-full text-sm font-medium">
                "{filters.search}"
                <X size={14} className="cursor-pointer hover:scale-110" onClick={() => setFilters({ ...filters, search: '' })} />
              </span>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw size={40} className="text-ksp-red animate-spin mb-4" />
            <p className="text-gray-600 font-medium">Loading products...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <p className="text-red-600 font-medium">Error loading products: {error}</p>
            <button onClick={fetchProducts} className="mt-4 px-6 py-2 bg-ksp-red text-white rounded-xl hover:bg-red-600 transition-colors">
              Try Again
            </button>
          </div>
        )}

        {/* No Products */}
        {!loading && !error && products.length === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search size={40} className="text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-700 mb-2">No products found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your filters or search terms</p>
            <button onClick={clearFilters} className="px-6 py-3 bg-ksp-red text-white rounded-xl font-semibold hover:bg-red-600 transition-colors">
              Clear Filters
            </button>
          </div>
        )}

        {/* Products Grid */}
        {!loading && !error && products.length > 0 && (
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'flex flex-col gap-4'
          }>
            {products.map((product) => {
              const stockBadge = getStockBadge(product.quantity);
              const isFavorite = favorites.includes(product._id);

              return viewMode === 'grid' ? (
                /* Grid Card */
                <div
                  key={product._id}
                  className="group bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100"
                >
                  {/* Image Container */}
                  <div className="relative h-64 bg-gradient-to-br from-gray-100 to-gray-50 overflow-hidden">
                    <img
                      src={product.imageUrl && product.imageUrl.trim() !== ''
                        ? resolveMediaUrl(product.imageUrl)
                        : 'https://via.placeholder.com/300x300?text=Phone'
                      }
                      alt={product.name}
                      className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/300x300?text=No+Image'; }}
                    />

                    {/* Badges */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      <span className={`${stockBadge.color} text-white text-xs font-bold px-3 py-1 rounded-full`}>
                        {stockBadge.text}
                      </span>
                      {product.condition !== 'Brand New' && (
                        <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                          {product.condition}
                        </span>
                      )}
                    </div>

                    {/* Favorite Button */}
                    <button
                      onClick={() => toggleFavorite(product._id)}
                      className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all ${isFavorite ? 'bg-ksp-red text-white' : 'bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-ksp-red hover:text-white'
                        }`}
                    >
                      <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
                    </button>

                    {/* Quick View Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <Link
                        to={`/products/${product._id}`}
                        className="px-6 py-3 bg-white text-gray-900 rounded-xl font-bold hover:bg-ksp-red hover:text-white transition-colors transform translate-y-4 group-hover:translate-y-0 duration-300"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-ksp-red uppercase tracking-wider">{product.brand}</span>
                      <span className="text-gray-300">•</span>
                      <span className="text-xs text-gray-500">{product.storage}</span>
                    </div>

                    <h3 className="font-bold text-gray-900 text-lg mb-3 line-clamp-2 group-hover:text-ksp-red transition-colors">
                      {product.name}
                    </h3>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-black text-gray-900">{formatPrice(product.price)}</span>
                      </div>
                      <button
                        disabled={product.quantity === 0}
                        onClick={() => navigate('/place-order', { state: { product, quantity: 1 } })}
                        className={`p-3 rounded-xl transition-all ${product.quantity === 0
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-ksp-red text-white hover:bg-red-600 hover:scale-110'
                          }`}
                      >
                        <ShoppingCart size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* List Card */
                <div
                  key={product._id}
                  className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all flex border border-gray-100"
                >
                  <div className="w-48 h-48 bg-gradient-to-br from-gray-100 to-gray-50 flex-shrink-0 relative overflow-hidden">
                    <img
                      src={product.imageUrl && product.imageUrl.trim() !== ''
                        ? resolveMediaUrl(product.imageUrl)
                        : 'https://via.placeholder.com/200x200?text=Phone'
                      }
                      alt={product.name}
                      className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/200x200?text=No+Image'; }}
                    />
                    <span className={`absolute top-3 left-3 ${stockBadge.color} text-white text-xs font-bold px-2 py-1 rounded-full`}>
                      {stockBadge.text}
                    </span>
                  </div>

                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-ksp-red uppercase tracking-wider">{product.brand}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-xs text-gray-500">{product.storage}</span>
                        {product.condition !== 'Brand New' && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="text-xs text-blue-500 font-medium">{product.condition}</span>
                          </>
                        )}
                      </div>
                      <h3 className="font-bold text-gray-900 text-xl mb-2 group-hover:text-ksp-red transition-colors">{product.name}</h3>
                      <p className="text-gray-500 text-sm line-clamp-2">{product.description || 'Premium smartphone with exceptional features.'}</p>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <span className="text-2xl font-black text-gray-900">{formatPrice(product.price)}</span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleFavorite(product._id)}
                          className={`p-3 rounded-xl transition-all ${isFavorite ? 'bg-ksp-red/10 text-ksp-red' : 'bg-gray-100 text-gray-600 hover:bg-ksp-red/10 hover:text-ksp-red'
                            }`}
                        >
                          <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
                        </button>
                        <Link
                          to={`/products/${product._id}`}
                          className="px-5 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                        >
                          Details
                        </Link>
                        <button
                          disabled={product.quantity === 0}
                          className={`px-5 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${product.quantity === 0
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-ksp-red text-white hover:bg-red-600'
                            }`}
                        >
                          <ShoppingCart size={18} /> Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: <Shield className="text-ksp-red" size={28} />, title: "Authentic Products", desc: "100% genuine devices with manufacturer warranty" },
            { icon: <Zap className="text-ksp-red" size={28} />, title: "Fast Delivery", desc: "Same-day delivery available in Kandy" },
            { icon: <Tag className="text-ksp-red" size={28} />, title: "Best Prices", desc: "Competitive prices with price match guarantee" }
          ].map((item, i) => (
            <div key={i} className="group p-8 rounded-3xl bg-white/80 backdrop-blur-md border border-white/50 shadow-lg hover:shadow-2xl hover:border-ksp-red/30 transition-all duration-500">
              <div className="mb-4 p-4 bg-ksp-red/10 rounded-2xl inline-block group-hover:scale-110 group-hover:bg-ksp-red/20 transition-all">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">{item.title}</h3>
              <p className="text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Products;
