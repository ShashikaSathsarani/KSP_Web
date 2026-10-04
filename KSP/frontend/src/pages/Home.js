import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Smartphone, 
  ShieldCheck, 
  Headphones, 
  ArrowRight,
  Gift,
  Tag,
  Star
} from 'lucide-react';
import api, { resolveMediaUrl } from '../services/api';
import { reviewService } from '../services/apiService';

const Home = () => {
  const [, setIsHovered] = useState(false);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loadingArrivals, setLoadingArrivals] = useState(true);
  const [premiumDeals, setPremiumDeals] = useState([]);
  const [loadingDeals, setLoadingDeals] = useState(true);
  const [latestReviews, setLatestReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [heroVideoUrl, setHeroVideoUrl] = useState('');
  const [loadingVideo, setLoadingVideo] = useState(true);

  useEffect(() => {
    // Fetch new arrivals
    const fetchNewArrivals = async () => {
      try {
        const response = await api.get('/products?isNewArrival=true&limit=4');
        console.log('🔍 New Arrivals API Response:', response.data);
        console.log('📦 Products found:', response.data.products?.length || 0);
        if (response.data.products?.length > 0) {
          console.log('🖼️ First product image URL:', response.data.products[0].imageUrl);
          console.log('🖼️ Constructed URL:', resolveMediaUrl(response.data.products[0].imageUrl));
        }
        if (response.data.products?.length === 0) {
          console.warn('⚠️ No products marked as NEW ARRIVAL in database!');
          console.warn('👉 Go to Admin Panel → Add/Edit Product → Check "Mark as New Arrival"');
        }
        setNewArrivals(response.data.products || []);
      } catch (error) {
        console.error('❌ Error fetching new arrivals:', error);
        // Use fallback data if API fails
        setNewArrivals([]);
      } finally {
        setLoadingArrivals(false);
      }
    };

    // Fetch premium deals (budget phones)
    const fetchPremiumDeals = async () => {
      try {
        const response = await api.get('/products?isPremiumDeal=true&limit=4');
        console.log('🏷️ Premium Deals API Response:', response.data);
        console.log('📦 Premium deals found:', response.data.products?.length || 0);
        if (response.data.products?.length === 0) {
          console.warn('⚠️ No products marked as PREMIUM DEAL in database!');
          console.warn('👉 Go to Admin Panel → Add/Edit Product → Check "Premium Deal"');
        }
        setPremiumDeals(response.data.products || []);
      } catch (error) {
        console.error('❌ Error fetching premium deals:', error);
        setPremiumDeals([]);
      } finally {
        setLoadingDeals(false);
      }
    };
    
    // Fetch latest reviews
    const fetchLatestReviews = async () => {
      try {
        const response = await reviewService.getLatestReviews(5);
        console.log('⭐ Latest Reviews API Response:', response.data);
        setLatestReviews(response.data.data?.reviews || []);
      } catch (error) {
        console.error('❌ Error fetching latest reviews:', error);
        setLatestReviews([]);
      } finally {
        setLoadingReviews(false);
      }
    };
    
    // Fetch hero video locally instead of API
    const fetchHeroVideo = () => {
      setLoadingVideo(true);
      setHeroVideoUrl('/videos/hero-video.mp4');
      setLoadingVideo(false);
    };
    
    fetchNewArrivals();
    fetchPremiumDeals();
    fetchLatestReviews();
    fetchHeroVideo();
  }, []);

  return (
    <div className="text-gray-900 min-h-screen overflow-x-hidden" style={{ backgroundColor: '#c4c4c4', fontFamily: 'Montserrat, sans-serif' }}>
      
      {/* --- HERO SECTION --- */}
      <section className="relative py-12 md:py-16 px-4 sm:px-8 md:px-16 lg:px-24 pt-12 md:pt-16" 
               onMouseEnter={() => setIsHovered(true)}
               onMouseLeave={() => setIsHovered(false)}>
        <div className="relative aspect-video min-h-[180px] md:aspect-auto md:h-96 w-full overflow-hidden rounded-2xl shadow-2xl bg-black">
        
          {/* Video Background */}
          {!loadingVideo && heroVideoUrl ? (
            <video
              key={heroVideoUrl}
              className="absolute inset-0 w-full h-full"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                backgroundColor: '#000',
              }}
              onLoadStart={() => console.log('Video loading...')}
              onCanPlay={() => console.log('Video ready')}
              onError={(e) => console.error('Video error:', e)}
            >
              <source src={heroVideoUrl} />
              Your browser does not support the video tag.
            </video>
          ) : !loadingVideo ? (
            <div className="absolute inset-0 flex items-center justify-center text-white text-xl">
              nothing to show
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white text-xl">
              Loading...
            </div>
          )}

          {/* Dark Overlay for Text Readability */}
          <div className="absolute inset-0 bg-black/20"></div>

          {/* Hero Content */}
          <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
          </div>
        </div>
      </section>

      {/* --- FEATURES: GLASS CARDS --- */}
      <section className="container mx-auto px-6 -mt-20 relative z-30">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: <ShieldCheck className="text-ksp-red" />, title: "Certified Authentic", desc: "100% Genuine products with global manufacturer warranty." },
            { icon: <Gift className="text-ksp-red" />, title: "Exclusive Deals", desc: "Special offers and discounts for loyal customers." },
            { icon: <Headphones className="text-ksp-red" />, title: "Expert Support", desc: "Dedicated support whenever you need assistance." }
          ].map((item, i) => (
            <div key={i} className="group p-8 rounded-3xl bg-gradient-to-br from-white/50 to-white/10 backdrop-blur-md border border-white/30 shadow-lg hover:shadow-2xl hover:border-ksp-red/50 hover:from-white/60 hover:to-white/20 transition-all duration-500">
              <div className="mb-4 p-3 bg-gradient-to-br from-gray-100/60 to-gray-200/20 backdrop-blur-sm rounded-2xl inline-block group-hover:scale-110 transition-transform">{item.icon}</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">{item.title}</h3>
              <p className="text-gray-700 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- NEW ARRIVALS SECTION --- */}
      <section className="container mx-auto px-6 py-16 mt-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
              New Arrivals
            </h2>
            <p className="text-gray-500 mt-2">
              Check out the latest additions to our collection.
            </p>
          </div>
          <Link 
            to="/products?sort=newest" 
            className="group inline-flex items-center gap-2 text-ksp-red font-semibold hover:gap-3 transition-all duration-300"
          >
            <span>View all new arrivals</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loadingArrivals ? (
            // Loading skeleton
            [...Array(4)].map((_, i) => (
              <div key={i} className="relative overflow-hidden rounded-2xl bg-white shadow-lg animate-pulse">
                <div className="h-64 bg-gray-200"></div>
                <div className="p-5 space-y-3">
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2 mt-4"></div>
                </div>
              </div>
            ))
          ) : newArrivals.length > 0 ? (
            newArrivals.map((product, i) => (
              <Link 
                key={product._id || i} 
                to={`/products/${product._id}`}
                className="group relative overflow-hidden rounded-2xl bg-white cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-400 transform hover:-translate-y-1"
              >
                {/* Product Image Container */}
                <div className="relative h-64 overflow-hidden bg-white flex items-center justify-center">
                  {product.imageUrl ? (
                    <img 
                      src={resolveMediaUrl(product.imageUrl)}
                      alt={product.name}
                      className="w-full h-full object-scale-down p-4 transform group-hover:scale-105 transition-transform duration-500"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        console.warn('🖼️ Image failed to load:', product.imageUrl, '- Using fallback');
                        e.target.style.display = 'none';
                        const fallback = document.createElement('div');
                        fallback.className = 'w-full h-full flex flex-col items-center justify-center bg-gray-100 p-4';
                        fallback.innerHTML = `
                          <svg class="w-16 h-16 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                          </svg>
                          <span class="text-gray-500 text-sm font-semibold">${product.brand}</span>
                          <span class="text-gray-400 text-xs text-center mt-1">${product.name}</span>
                        `;
                        e.target.parentElement.insertBefore(fallback, e.target);
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 p-4">
                      <Smartphone size={64} className="text-gray-300 mb-3" />
                      <span className="text-gray-500 text-sm font-semibold">{product.brand}</span>
                      <span className="text-gray-400 text-xs text-center mt-1">{product.name}</span>
                    </div>
                  )}
                  
                  {/* NEW Badge */}
                  <div className="absolute top-4 right-4 z-10">
                    <span className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-ksp-red text-white shadow-md">
                      New
                    </span>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-5">
                  {/* Brand */}
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    {product.brand}
                  </span>
                  
                  {/* Product Name */}
                  <h3 className="text-lg font-bold text-gray-900 mt-1 mb-3 leading-tight group-hover:text-ksp-red transition-colors duration-300 line-clamp-1">
                    {product.name}
                  </h3>
                  
                  {/* Price & Action */}
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-black text-ksp-red">
                      LKR {parseFloat(product.price).toLocaleString()}
                    </span>
                    <div className="w-9 h-9 flex items-center justify-center bg-gray-100 group-hover:bg-ksp-red rounded-full transition-all duration-300">
                      <ArrowRight size={16} className="text-gray-500 group-hover:text-white transition-colors duration-300" />
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            // Fallback when no new arrivals
            <div className="col-span-full text-center py-16">
              <Smartphone size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No new arrivals at the moment. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* --- PREMIUM DEALS SECTION --- */}
      <section className="container mx-auto px-6 py-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
              Premium Deals
            </h2>
            <p className="text-gray-500 mt-2">
              Budget-friendly phones with premium features.
            </p>
          </div>
          <Link 
            to="/products?sort=price_asc" 
            className="group inline-flex items-center gap-2 text-green-600 font-semibold hover:gap-3 transition-all duration-300"
          >
            <span>View all deals</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loadingDeals ? (
            // Loading skeleton
            [...Array(4)].map((_, i) => (
              <div key={i} className="relative overflow-hidden rounded-2xl bg-white shadow-lg animate-pulse">
                <div className="h-64 bg-gray-200"></div>
                <div className="p-5 space-y-3">
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2 mt-4"></div>
                </div>
              </div>
            ))
          ) : premiumDeals.length > 0 ? (
            premiumDeals.map((product, i) => (
              <Link 
                key={product._id || i} 
                to={`/products/${product._id}`}
                className="group relative overflow-hidden rounded-2xl bg-white cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-400 transform hover:-translate-y-1"
              >
                {/* Product Image Container */}
                <div className="relative h-64 overflow-hidden bg-white flex items-center justify-center">
                  {product.imageUrl ? (
                    <img 
                      src={resolveMediaUrl(product.imageUrl)}
                      alt={product.name}
                      className="w-full h-full object-scale-down p-4 transform group-hover:scale-105 transition-transform duration-500"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        console.warn('🖼️ Image failed to load:', product.imageUrl, '- Using fallback');
                        e.target.style.display = 'none';
                        const fallback = document.createElement('div');
                        fallback.className = 'w-full h-full flex flex-col items-center justify-center bg-gray-100 p-4';
                        fallback.innerHTML = `
                          <svg class="w-16 h-16 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                          </svg>
                          <span class="text-gray-500 text-sm font-semibold">${product.brand}</span>
                          <span class="text-gray-400 text-xs text-center mt-1">${product.name}</span>
                        `;
                        e.target.parentElement.insertBefore(fallback, e.target);
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 p-4">
                      <Smartphone size={64} className="text-gray-300 mb-3" />
                      <span className="text-gray-500 text-sm font-semibold">{product.brand}</span>
                      <span className="text-gray-400 text-xs text-center mt-1">{product.name}</span>
                    </div>
                  )}
                  
                  {/* DEAL Badge */}
                  <div className="absolute top-4 right-4 z-10">
                    <span className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-500 text-white shadow-md flex items-center gap-1">
                      <Tag size={12} /> Deal
                    </span>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-5">
                  {/* Brand */}
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    {product.brand}
                  </span>
                  
                  {/* Product Name */}
                  <h3 className="text-lg font-bold text-gray-900 mt-1 mb-3 leading-tight group-hover:text-green-600 transition-colors duration-300 line-clamp-1">
                    {product.name}
                  </h3>
                  
                  {/* Price & Action */}
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-black text-green-600">
                      LKR {parseFloat(product.price).toLocaleString()}
                    </span>
                    <div className="w-9 h-9 flex items-center justify-center bg-gray-100 group-hover:bg-green-500 rounded-full transition-all duration-300">
                      <ArrowRight size={16} className="text-gray-500 group-hover:text-white transition-colors duration-300" />
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            // Fallback when no premium deals
            <div className="col-span-full text-center py-16">
              <Tag size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No premium deals available at the moment. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* --- CATEGORIES: BENTO GRID --- */}
      <section className="container mx-auto px-6 py-24 rounded-3xl mt-12">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
          <div>
            <h2 className="text-4xl font-bold tracking-tight text-gray-900">Browse Collections</h2>
            <p className="text-gray-600 mt-2">Find the perfect companion for your lifestyle.</p>
          </div>
          <Link to="/products" className="text-ksp-red font-semibold flex items-center gap-2 hover:underline">
            View all brands <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-[800px] md:h-[600px]">
          {/* Large Card */}
          <Link to="/products?brand=Apple" className="md:col-span-2 md:row-span-2 relative group overflow-hidden rounded-3xl border border-gray-400 hover:border-ksp-red/50 cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105" style={{ backgroundImage: 'url(/images/iphone-bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', perspective: '1000px' }} onMouseMove={(e) => { const rect = e.currentTarget.getBoundingClientRect(); const x = (e.clientX - rect.left) / rect.width - 0.5; const y = (e.clientY - rect.top) / rect.height - 0.5; e.currentTarget.style.transform = `scale(1.01) rotateX(${y * 10}deg) rotateY(${x * 10}deg)`; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1) rotateX(0deg) rotateY(0deg)'; }}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent group-hover:from-black/70 transition-all duration-500"></div>
            <div className="absolute inset-0 group-hover:bg-ksp-red/10 transition-colors duration-500"></div>
            <div className="absolute bottom-8 left-8 transform group-hover:translate-y-2 transition-transform duration-500">
              <span className="text-xs font-bold tracking-widest text-ksp-red uppercase group-hover:text-white transition-colors duration-500">Premium</span>
              <h3 className="text-3xl font-bold mt-1 text-white group-hover:text-ksp-red transition-colors duration-500">Apple iPhone</h3>
            </div>
          </Link>

          {/* Medium Card */}
          <Link to="/products?brand=Samsung" className="md:col-span-2 relative group overflow-hidden rounded-3xl border border-gray-400 hover:border-ksp-red/50 cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105" style={{ backgroundImage: 'url(/images/samsung-bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', perspective: '1000px' }} onMouseMove={(e) => { const rect = e.currentTarget.getBoundingClientRect(); const x = (e.clientX - rect.left) / rect.width - 0.5; const y = (e.clientY - rect.top) / rect.height - 0.5; e.currentTarget.style.transform = `scale(1.01) rotateX(${y * 10}deg) rotateY(${x * 10}deg)`; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1) rotateX(0deg) rotateY(0deg)'; }}>
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent group-hover:from-black/70 transition-all duration-500"></div>
            <div className="absolute inset-0 group-hover:bg-ksp-red/10 transition-colors duration-500"></div>
            <div className="absolute bottom-8 left-8 flex flex-col justify-end">
              <h3 className="text-2xl font-bold text-white group-hover:text-ksp-red transition-colors duration-500">Samsung Galaxy</h3>
              <p className="text-gray-100 text-sm group-hover:text-white transition-colors duration-500">Foldables & S-Series</p>
            </div>
          </Link>

          {/* Small Cards */}
          <Link to="/products?brand=Xiaomi" className="relative group overflow-hidden rounded-3xl border border-gray-400 hover:border-ksp-red/50 cursor-pointer shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105" style={{ backgroundImage: 'url(/images/xiaomi-bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', perspective: '1000px' }} onMouseMove={(e) => { const rect = e.currentTarget.getBoundingClientRect(); const x = (e.clientX - rect.left) / rect.width - 0.5; const y = (e.clientY - rect.top) / rect.height - 0.5; e.currentTarget.style.transform = `scale(1.01) rotateX(${y * 10}deg) rotateY(${x * 10}deg)`; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1) rotateX(0deg) rotateY(0deg)'; }}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent group-hover:from-black/70 transition-all duration-500"></div>
            <div className="absolute inset-0 group-hover:bg-ksp-red/10 transition-colors duration-500"></div>
            <div className="absolute bottom-8 left-8 flex flex-col items-start text-left">
              <h3 className="font-bold text-2xl text-white group-hover:text-ksp-red transition-colors duration-500">Xiaomi</h3>
              <p className="text-xs text-gray-100 mt-1 group-hover:text-white transition-colors duration-500">Power meets Value</p>
            </div>
          </Link>

          <Link to="/products?brand=OnePlus" className="relative group overflow-hidden rounded-3xl border border-gray-400 hover:border-ksp-red/50 cursor-pointer shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105" style={{ backgroundImage: 'url(/images/infinix-bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', perspective: '1000px' }} onMouseMove={(e) => { const rect = e.currentTarget.getBoundingClientRect(); const x = (e.clientX - rect.left) / rect.width - 0.5; const y = (e.clientY - rect.top) / rect.height - 0.5; e.currentTarget.style.transform = `scale(1.01) rotateX(${y * 10}deg) rotateY(${x * 10}deg)`; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1) rotateX(0deg) rotateY(0deg)'; }}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent group-hover:from-black/70 transition-all duration-500"></div>
            <div className="absolute inset-0 group-hover:bg-ksp-red/10 transition-colors duration-500"></div>
            <div className="absolute bottom-8 left-8 flex flex-col items-start text-left">
              <h3 className="font-bold text-2xl text-white group-hover:text-ksp-red transition-colors duration-500">Infinix</h3>
              <p className="text-xs text-gray-100 mt-1 group-hover:text-white transition-colors duration-500">The Future is Now</p>
            </div>
          </Link>
        </div>
      </section>

      {/* --- QUICK BROWSE CATEGORIES --- */}
      <section className="container mx-auto px-6 py-16 mt-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
          <div>
            <h2 className="text-4xl font-bold tracking-tight text-gray-900">Browse by Category</h2>
            <p className="text-gray-600 mt-2">Find your perfect device.</p>
          </div>
          <Link to="/products" className="text-ksp-red font-semibold flex items-center gap-2 hover:underline">
            View all categories <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: "Phones", bg: "url(/images/phones-bg.jpg)" },
            { name: "Tablets", bg: "url(/images/tablets-bg.jpg)" },
            { name: "Earbuds", bg: "url(/images/earbuds-bg.jpg)" },
            { name: "Accessories", bg: "url(/images/accessories-bg.jpg)" }
          ].map((category, i) => (
            <Link key={i} to={`/products?productType=${category.name}`} className="group relative overflow-hidden rounded-2xl p-8 bg-gradient-to-br from-gray-800 to-gray-900 backdrop-blur-md border border-white/30 cursor-pointer shadow-md hover:shadow-lg hover:border-ksp-red/50 transition-all duration-500 transform hover:scale-105 h-56" style={{ backgroundImage: category.bg, backgroundSize: 'cover', backgroundPosition: 'center' }}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent group-hover:from-black/90 group-hover:via-black/50 transition-all duration-500"></div>
              <div className="absolute inset-0 group-hover:bg-ksp-red/10 transition-colors duration-500"></div>
              <div className="relative z-10 flex flex-col items-center justify-end h-full text-center">
                <h3 className="text-2xl font-bold text-white group-hover:text-ksp-red transition-colors duration-500">{category.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* --- AUTHORIZED BRANDS SECTION --- */}
      <section className="container mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>Authorized Dealer for Leading Mobile Brands</h2>
          <p className="text-gray-600 text-lg">We are proud partners of the world's most trusted mobile manufacturers.</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {[
            { name: "Apple", logo: "/images/brands/apple-logo.png", bg: "#ffffff" },
            { name: "Samsung", logo: "/images/brands/samsung-logo.png", bg: "#ffffff" },
            { name: "Xiaomi", logo: "/images/brands/xiaomi-logo.png", bg: "#ffffff" },
            { name: "Infinix", logo: "/images/brands/infinix-logo.png", bg: "#000000" },
            { name: "Blackview", logo: "/images/brands/blackview-logo.png", bg: "#ffffff" },
            { name: "Honor", logo: "/images/brands/honor-logo.png", bg: "#ffffff" },
            { name: "Nokia", logo: "/images/brands/nokia-logo.png", bg: "#ffffff" },
            { name: "Vivo", logo: "/images/brands/vivo-logo.png", bg: "#415FFF" },
            { name: "JBL", logo: "/images/brands/jbl-logo.png", bg: "#DC381D" },
            { name: "Soundcore", logo: "/images/brands/soundcore-logo.png", bg: "#ffffff" }
          ].map((brand, i) => (
            <div key={i} className="group h-32 rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 hover:scale-105 hover:shadow-2xl border border-gray-200 hover:border-ksp-red/50" style={{ backgroundColor: brand.bg }}>
              <img src={brand.logo} alt={brand.name} className="w-full h-full object-scale-down p-4 group-hover:scale-110 transition-transform duration-500" />
            </div>
          ))}
        </div>
      </section>
      <section className="bg-white py-20 border-t border-gray-300">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            {[
              { label: "Happy Clients", val: "10K+" },
              { label: "Phone Models", val: "500+" },
              { label: "Active Brands", val: "50+" },
              { label: "Support Rate", val: "99.9%" }
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-4xl md:text-5xl font-black text-ksp-red mb-2">{stat.val}</div>
                <div className="text-gray-600 uppercase tracking-widest text-xs font-bold">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- LATEST REVIEWS SECTION --- */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black text-ksp-black mb-4">CUSTOMER REVIEWS</h2>
            <p className="text-gray-600 text-lg">See what our customers are saying</p>
          </div>
          
          {loadingReviews ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading reviews...</p>
            </div>
          ) : latestReviews.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No reviews yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestReviews.slice(0, 5).map((review) => (
                <div key={review._id} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    {review.product?.imageUrl && (
                      <img 
                        src={resolveMediaUrl(review.product.imageUrl)}
                        alt={review.product.name}
                        className="w-16 h-16 object-cover rounded-lg"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/64'; }}
                      />
                    )}
                    <div className="flex-1">
                      <Link 
                        to={`/products/${review.product?._id}`} 
                        className="font-bold text-ksp-black hover:text-ksp-red transition-colors line-clamp-1"
                      >
                        {review.product?.name || 'Product'}
                      </Link>
                      <p className="text-sm text-gray-500">{review.product?.brand}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={16} 
                        className={i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                      />
                    ))}
                  </div>
                  
                  <p className="text-gray-700 mb-4 line-clamp-3">{review.comment}</p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-ksp-black">{review.user?.name}</span>
                    <span className="text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  
                  {review.isVerifiedPurchase && (
                    <div className="mt-3 inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      <ShieldCheck size={12} />
                      Verified Purchase
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-24 px-6" style={{ backgroundColor: '#c4c4c4' }}>
        <div className="container mx-auto relative rounded-[40px] overflow-hidden bg-ksp-red p-12 md:p-20 text-center">
          {/* Decorative Circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -mr-20 -mt-20 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/5 rounded-full -ml-20 -mb-20 blur-3xl"></div>
          
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-black mb-6 text-white">UPGRADE YOUR GEAR.</h2>
            <p className="text-white/90 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
              Join our newsletter or browse our clearance sale to get up to 15% off on selected flagship models.
            </p>
            <Link to="/products" className="inline-flex items-center gap-3 bg-white text-ksp-red px-10 py-5 rounded-full font-black text-lg hover:shadow-2xl hover:scale-105 transition-all">
              SHOP DEALS NOW <Smartphone size={22} />
            </Link>
          </div>
        </div>
      </section>
      
    </div>
  );
};

export default Home;