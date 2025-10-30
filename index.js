/**
 * @author NTKhang
 * ! The source code is written by NTKhang, please don't change the author's name everywhere. Thank you for using
 * ! Official source code: https://github.com/ntkhang03/Goat-Bot-V2
 * ! If you do not download the source code from the above address, you are using an unknown version and at risk of having your account hacked
 * * English:
 * ! Please do not change the below code, it is very important for the project.
 * It is my motivation to maintain and develop the project for free.
 * ! If you change it, you will be banned forever
 * Thank you for using
 * * Vietnamese:
 * ! Vui lòng không thay đổi mã bên dưới, nó rất quan trọng đối với dự án.
 * Nó là động lực để tôi duy trì và phát triển dự án miễn phí.
 * ! Nếu thay đổi nó, bạn sẽ bị cấm vĩnh viễn
 * Cảm ơn bạn đã sử dụng */

const express = require('express');
const path = require('path');
const fs = require('fs-extra'); // fs-extra already includes fs
const axios = require('axios');
const moment = require('moment-timezone');
const { login } = require("fca-unofficial"); // <-- FCA Integration

const app = express();
const PORT = process.env.PORT || 3000;

let messengerApi = null; // Variable to hold the messenger API

// Store Configuration
const STORE_CONFIG = {
  storeName: "MegaMart BD",
  storeTagline: "Bangladesh's Largest Online Marketplace", 
  currency: "৳",
  adminThreadId: "1843705779576417", // <-- IMPORTANT: Your Messenger Thread ID
  storeStatus: "open",
  phone: "+880 XXXX-XXXXXX",
  email: "support@megamartbd.com",
  features: {
    wishlist: true,
    orderTracking: true,
    multiplePayment: true,
    fastDelivery: true
  }
};

// --- Messenger Bot Login ---
(function startMessengerBot() {
  const appstatePath = 'appstate.json';
  if (fs.existsSync(appstatePath)) {
    console.log('🤖 Logging in to Messenger...');
    try {
      login({ appState: JSON.parse(fs.readFileSync(appstatePath, 'utf8')) }, (err, api) => {
        if (err) {
          console.error('🔴 Messenger Login Failed:', err);
          return;
        }
        messengerApi = api;
        console.log('🟢 Messenger Login Successful!');
        api.sendMessage(`🛒 ${STORE_CONFIG.storeName} Server Started!\nBot is active and ready to send order notifications.`, STORE_CONFIG.adminThreadId);
      });
    } catch (e) {
      console.error('🔴 Failed to read appstate.json:', e);
    }
  } else {
    console.warn('⚠️ Warning: appstate.json not found.');
    console.warn('Messenger notifications will be disabled.');
  }
})();

// Generate 100+ products
function generateProducts() {
  const categories = [
    { id: "electronics", name: "Electronics", icon: "📱", sub: ["Smartphones", "Laptops", "Tablets", "Accessories"] },
    { id: "fashion", name: "Fashion", icon: "👕", sub: ["Men", "Women", "Kids", "Footwear"] },
    { id: "home", name: "Home & Living", icon: "🏠", sub: ["Furniture", "Kitchen", "Decor", "Gardening"] },
    { id: "beauty", name: "Beauty", icon: "💄", sub: ["Skincare", "Makeup", "Haircare", "Fragrances"] },
    { id: "sports", name: "Sports", icon: "⚽", sub: ["Fitness", "Outdoor", "Team Sports", "Equipment"] },
    { id: "books", name: "Books", icon: "📚", sub: ["Fiction", "Academic", "Children", "Business"] },
    { id: "toys", name: "Toys & Games", icon: "🎮", sub: ["Educational", "Outdoor", "Puzzles", "Video Games"] },
    { id: "health", name: "Health", icon: "💊", sub: ["Medicines", "Supplements", "Personal Care", "Medical Devices"] }
  ];

  const brands = {
    electronics: ["Samsung", "Xiaomi", "Apple", "Oppo", "Vivo", "Realme", "OnePlus"],
    fashion: ["H&M", "Zara", "Richman", "Aarong", "Yellow", "Catwalk"],
    home: ["IKEA", "Hatil", "Otobi", "Partex", "Regal", "Brothers"],
    beauty: ["Maybelline", "L'Oreal", "Garnier", "Ponds", "Vaseline", "Nivea"],
    sports: ["Nike", "Adidas", "Puma", "Reebok", "Decathlon", "Speedo"],
    books: ["Pearson", "McGraw-Hill", "Penguin", "Random House", "Oxford"],
    toys: ["Lego", "Barbie", "Hot Wheels", "Nerf", "Mattel", "Hasbro"],
    health: ["Square", "Beximco", "ACI", "Drug International", "Incepta"]
  };

  const products = [];
  let id = 1;

  categories.forEach(category => {
    const categoryBrands = brands[category.id] || ["Generic Brand"];
    for (let i = 1; i <= 12; i++) {
      const price = Math.floor(Math.random() * 5000) + 500;
      const originalPrice = price + Math.floor(Math.random() * 2000) + 500;
      const discount = Math.round((1 - price/originalPrice) * 100);
      const brand = categoryBrands[Math.floor(Math.random() * categoryBrands.length)];
      
      products.push({
        id: id++,
        name: `${brand} ${category.name} ${i}`,
        price: price,
        originalPrice: originalPrice,
        discount: discount > 0 ? discount : 0,
        image: category.icon,
        category: category.id,
        subcategory: category.sub[Math.floor(Math.random() * category.sub.length)],
        brand: brand,
        stock: Math.floor(Math.random() * 100) + 10,
        rating: (Math.random() * 2 + 3).toFixed(1),
        reviews: Math.floor(Math.random() * 500),
        description: `Premium ${category.name.toLowerCase()} product from ${brand}. High quality with excellent features and guaranteed satisfaction. Perfect for daily use.`,
        features: ["Premium Quality", "Durable", "Eco-Friendly", "1 Year Warranty", "Fast Delivery"],
        specifications: {
          material: ["Plastic", "Metal", "Wood", "Fabric"][Math.floor(Math.random() * 4)],
          color: ["Black", "White", "Blue", "Red", "Silver"][Math.floor(Math.random() * 5)],
          weight: `${(Math.random() * 5 + 0.1).toFixed(1)}kg`,
          dimensions: `${Math.floor(Math.random() * 50 + 10)}x${Math.floor(Math.random() * 30 + 5)}x${Math.floor(Math.random() * 20 + 2)}cm`
        },
        status: "available",
        tags: [category.id, brand.toLowerCase(), "bangladesh"],
        shipping: "Free delivery across Bangladesh",
        warranty: "1 year manufacturer warranty"
      });
    }
  });

  return products;
}

// Initialize data
const products = generateProducts();
let orders = [];
let orderIdCounter = 1;
let visitors = 0;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Visitor counter middleware
app.use((req, res, next) => {
  visitors++;
  next();
});

// --- REUSABLE HTML & CSS ---

const baseStyles = `
        :root {
            --primary: #2c5aa0;
            --secondary: #ff6b35;
            --success: #28a745;
            --danger: #dc3545;
            --warning: #ffc107;
            --info: #17a2b8;
            --dark: #343a40;
            --light: #f8f9fa;
            --gray: #6c757d;
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: #f4f5f7; color: #333; line-height: 1.6; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        
        /* Header */
        .top-bar { background: var(--dark); color: white; padding: 8px 0; font-size: 0.9em; }
        .top-bar .container { display: flex; justify-content: space-between; align-items: center; }
        .header { background: var(--primary); color: white; padding: 15px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); position: sticky; top: 0; z-index: 1000; }
        .header-content { display: flex; justify-content: space-between; align-items: center; }
        .logo { font-size: 1.8em; font-weight: bold; color: white; text-decoration: none; display: flex; align-items: center; gap: 10px; }
        .search-bar { display: flex; max-width: 500px; width: 100%; }
        .search-bar input { flex: 1; padding: 10px 15px; border: none; border-radius: 5px 0 0 5px; font-size: 1em; }
        .search-bar button { background: var(--secondary); color: white; border: none; padding: 10px 20px; border-radius: 0 5px 5px 0; cursor: pointer; }
        .header-actions { display: flex; gap: 20px; }
        .action-btn { color: white; text-decoration: none; display: flex; align-items: center; gap: 5px; }
        
        /* Navigation */
        .main-nav { background: white; padding: 15px 0; border-bottom: 1px solid #eee; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        .nav-content { display: flex; justify-content: space-between; align-items: center; }
        .category-menu { display: flex; gap: 25px; }
        .category-menu a { color: var(--dark); text-decoration: none; font-weight: 500; transition: color 0.3s; }
        .category-menu a:hover { color: var(--primary); }
        
        /* Hero (Homepage only) */
        .hero {
            background: linear-gradient(135deg, var(--primary), #1e4a8b);
            color: white;
            padding: 80px 0;
            text-align: center;
        }
        .hero h1 { font-size: 3em; margin-bottom: 20px; }
        .hero p { font-size: 1.2em; margin-bottom: 30px; opacity: 0.9; max-width: 600px; margin: 0 auto 30px; }
        .cta-button {
            background: var(--secondary);
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 5px;
            font-size: 1.1em;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: 0.3s;
        }
        .cta-button:hover { background: #e55a2b; transform: translateY(-2px); }
        
        /* Features */
        .features { padding: 60px 0; background: var(--light); }
        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 30px; }
        .feature-card { background: white; padding: 30px; border-radius: 10px; text-align: center; box-shadow: 0 5px 15px rgba(0,0,0,0.1); transition: 0.3s; }
        .feature-card:hover { transform: translateY(-5px); }
        .feature-card i { font-size: 2.5em; color: var(--primary); margin-bottom: 15px; }
        
        /* Products */
        .products { padding: 60px 0; }
        .section-title { text-align: center; font-size: 2.5em; margin-bottom: 40px; color: var(--primary); }
        .section-subtitle { text-align: center; color: var(--gray); margin-bottom: 50px; }
        .product-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 30px; }
        .product-card { 
            background: white; 
            border-radius: 10px; 
            padding: 20px; 
            box-shadow: 0 5px 15px rgba(0,0,0,0.1); 
            transition: box-shadow 0.3s; 
            position: relative; 
            display: flex; 
            flex-direction: column; 
            justify-content: space-between;
            min-height: 420px; /* Added for grid alignment */
        }
        .product-card:hover { 
            box-shadow: 0 10px 25px rgba(0,0,0,0.15); /* Removed transform */
        }
        .product-badge { position: absolute; top: 15px; right: 15px; background: var(--danger); color: white; padding: 5px 10px; border-radius: 15px; font-size: 0.8em; font-weight: bold; }
        .product-image { font-size: 3em; text-align: center; margin-bottom: 15px; height: 80px; display: flex; align-items: center; justify-content: center; }
        .product-title { font-size: 1.1em; font-weight: 600; margin-bottom: 10px; color: var(--dark); }
        .product-brand { color: var(--gray); font-size: 0.9em; margin-bottom: 10px; }
        .product-price { display: flex; align-items: center; gap: 10px; margin-bottom: 15px; flex-wrap: wrap; }
        .current-price { font-size: 1.3em; font-weight: bold; color: var(--secondary); }
        .original-price { color: var(--gray); text-decoration: line-through; }
        .discount { background: var(--danger); color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.8em; font-weight: bold; }
        .product-rating { color: var(--warning); margin-bottom: 15px; display: flex; align-items: center; gap: 5px; }
        .buy-btn { background: var(--primary); color: white; border: none; padding: 12px; border-radius: 5px; cursor: pointer; width: 100%; font-weight: 600; transition: 0.3s; text-align: center; text-decoration: none; display: inline-block; }
        .buy-btn:hover { background: var(--secondary); }
        
        /* Categories */
        .categories { padding: 60px 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        .categories-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .category-card { background: rgba(255,255,255,0.1); padding: 30px 20px; border-radius: 10px; text-align: center; transition: 0.3s; cursor: pointer; backdrop-filter: blur(10px); }
        .category-card:hover { background: rgba(255,255,255,0.2); transform: translateY(-5px); }
        .category-card i { font-size: 2.5em; margin-bottom: 15px; display: block; }
        
        /* Stats */
        .stats { padding: 60px 0; background: var(--dark); color: white; text-align: center; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 30px; }
        .stat-item h3 { font-size: 2.5em; font-weight: bold; color: var(--secondary); margin-bottom: 10px; }
        
        /* Footer */
        .footer { background: var(--dark); color: white; padding: 50px 0 20px; margin-top: 60px; }
        .footer-content { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 40px; margin-bottom: 40px; }
        .footer-section h3 { margin-bottom: 20px; color: var(--secondary); }
        .footer-section a { color: #ccc; text-decoration: none; display: block; margin-bottom: 10px; }
        .footer-section a:hover { color: white; }
        .footer-bottom { text-align: center; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); }
        .social-links { display: flex; gap: 15px; margin-top: 20px; justify-content: center; }
        .social-links a { color: white; background: rgba(255,255,255,0.1); width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        
        /* Page Wrapper */
        .page-wrapper { padding: 40px 0; background: white; min-height: 60vh; }
        .page-title { font-size: 2.5em; margin-bottom: 30px; color: var(--primary); text-align: center; }
        
        /* Product Detail */
        .product-detail-layout { display: grid; grid-template-columns: 1fr 1.5fr; gap: 40px; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 5px 20px rgba(0,0,0,0.1); }
        .product-detail-image { text-align: center; }
        .product-detail-image .main-image { font-size: 10em; }
        .product-detail-info .brand { color: var(--gray); font-size: 1.1em; margin-bottom: 10px; }
        .product-detail-info .title { font-size: 2.2em; font-weight: 700; color: var(--dark); margin-bottom: 15px; }
        .product-detail-info .rating { color: var(--warning); margin-bottom: 20px; font-size: 1.1em; }
        .product-detail-info .price-box { background: var(--light); padding: 20px; border-radius: 10px; margin-bottom: 20px; }
        .product-detail-info .price { font-size: 2.5em; font-weight: bold; color: var(--secondary); }
        .product-detail-info .original-price { color: var(--gray); text-decoration: line-through; margin-left: 15px; }
        .product-detail-info .discount { background: var(--danger); color: white; padding: 5px 12px; border-radius: 15px; font-size: 1em; font-weight: bold; display: inline-block; margin-left: 10px; }
        .product-detail-info .stock { color: var(--success); font-weight: bold; font-size: 1.1em; margin-bottom: 25px; }
        .product-detail-info .description { margin-bottom: 25px; }
        .product-detail-info .buy-btn-lg { background: var(--secondary); color: white; border: none; padding: 18px 35px; border-radius: 5px; cursor: pointer; width: 100%; font-weight: 600; transition: 0.3s; text-align: center; text-decoration: none; display: inline-block; font-size: 1.2em; }
        .product-detail-info .buy-btn-lg:hover { background: var(--primary); }
        .product-specs { margin-top: 30px; }
        .product-specs h3 { font-size: 1.5em; color: var(--primary); margin-bottom: 15px; border-bottom: 2px solid var(--light); padding-bottom: 10px; }
        .product-specs ul { list-style: none; padding-left: 0; }
        .product-specs li { background: var(--light); padding: 12px 15px; border-radius: 5px; margin-bottom: 8px; display: flex; justify-content: space-between; }
        .product-specs li strong { color: var(--dark); }
        
        /* Order Form */
        .order-layout { display: grid; grid-template-columns: 1fr 1.2fr; gap: 40px; }
        .order-summary { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 5px 20px rgba(0,0,0,0.1); }
        .order-summary .product-image { font-size: 5em; text-align: center; }
        .order-summary .product-title { font-size: 1.5em; font-weight: 600; margin-top: 15px; }
        .order-summary .product-price { font-size: 2em; color: var(--secondary); font-weight: bold; }
        .order-form { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 5px 20px rgba(0,0,0,0.1); }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; margin-bottom: 8px; font-weight: 600; }
        .form-group input, .form-group select, .form-group textarea {
            width: 100%;
            padding: 12px 15px;
            border: 1px solid #ccc;
            border-radius: 5px;
            font-size: 1em;
            font-family: 'Inter', sans-serif;
        }
        .form-group textarea { resize: vertical; min-height: 100px; }
        .submit-btn { background: var(--success); color: white; border: none; padding: 15px; border-radius: 5px; cursor: pointer; width: 100%; font-weight: 600; transition: 0.3s; font-size: 1.2em; }
        .submit-btn:hover { background: #218838; }
        .form-message { padding: 15px; border-radius: 5px; margin-top: 20px; text-align: center; font-weight: 600; display: none; }
        .form-message.success { background: var(--success); color: white; }
        .form-message.error { background: var(--danger); color: white; }
        
        /* Admin */
        .admin-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 40px; }
        .admin-stat-card { background: white; padding: 25px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); text-align: center; }
        .admin-stat-card h3 { font-size: 3em; color: var(--primary); }
        .admin-stat-card p { font-size: 1.2em; color: var(--gray); }
        .order-table { width: 100%; border-collapse: collapse; background: white; box-shadow: 0 5px 15px rgba(0,0,0,0.1); border-radius: 10px; overflow: hidden; }
        .order-table th, .order-table td { padding: 15px; border-bottom: 1px solid #eee; text-align: left; }
        .order-table th { background: var(--light); }
        .status-pending { background: var(--warning); color: var(--dark); padding: 5px 10px; border-radius: 15px; font-size: 0.9em; font-weight: 600; }
        
        /* Simple Page */
        .simple-page-content { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 5px 20px rgba(0,0,0,0.1); }
        .simple-page-content p { margin-bottom: 15px; line-height: 1.8; }
        .simple-page-content h3 { font-size: 1.5em; color: var(--primary); margin-top: 25px; margin-bottom: 10px; }

        /* Search Results */
        .search-results-header { text-align: center; margin-bottom: 40px; }
        .no-results { text-align: center; font-size: 1.2em; color: var(--gray); }
        
        /* Responsive */
        @media (max-width: 992px) {
            .product-detail-layout { grid-template-columns: 1fr; }
            .order-layout { grid-template-columns: 1fr; }
        }
        
        @media (max-width: 768px) {
            .header-content { flex-direction: column; gap: 15px; }
            .search-bar { max-width: 100%; }
            .hero h1 { font-size: 2.2em; }
            .product-grid { grid-template-columns: 1fr; }
            .category-menu { flex-wrap: wrap; gap: 15px; justify-content: center; }
            .top-bar .container { flex-direction: column; gap: 5px; }
            .stats-grid { grid-template-columns: 1fr 1fr; }
            .footer-content { grid-template-columns: 1fr; }
        }
`;

const headerHtml = (productsLength, storeConfig) => `
    <!-- Top Bar -->
    <div class="top-bar">
        <div class="container">
            <div class="store-info">
                <span><i class="fas fa-phone"></i> ${storeConfig.phone}</span>
                <span style="margin-left: 20px;"><i class="fas fa-envelope"></i> ${storeConfig.email}</span>
            </div>
            <div class="store-status">
                <span style="background: ${storeConfig.storeStatus === 'open' ? 'var(--success)' : 'var(--danger)'}; padding: 5px 15px; border-radius: 15px; font-size: 0.8em; font-weight: bold;">
                    <i class="fas fa-store"></i> ${storeConfig.storeStatus === 'open' ? 'OPEN' : 'CLOSED'}
                </span>
            </div>
        </div>
    </div>

    <!-- Header -->
    <header class="header">
        <div class="container">
            <div class="header-content">
                <a href="/" class="logo">
                    <i class="fas fa-shopping-bag"></i> ${storeConfig.storeName}
                </a>
                
                <div class="search-bar">
                    <input type="text" placeholder="Search ${productsLength}+ products..." id="searchInput">
                    <button onclick="performSearch()"><i class="fas fa-search"></i></button>
                </div>
                
                <div class="header-actions">
                    <a href="/account" class="action-btn">
                        <i class="fas fa-user"></i> Account
                    </a>
                    <a href="/wishlist" class="action-btn">
                        <i class="fas fa-heart"></i> Wishlist
                    </a>
                    <a href="/cart" class="action-btn">
                        <i class="fas fa-shopping-cart"></i> Cart
                    </a>
                </div>
            </div>
        </div>
    </header>

    <!-- Navigation -->
    <nav class="main-nav">
        <div class="container">
            <div class="nav-content">
                <div class="category-menu">
                    <a href="/">Home</a>
                    <a href="/products">All Products</a>
                    <a href="/category/electronics">Electronics</a>
                    <a href="/category/fashion">Fashion</a>
                    <a href="/category/home">Home & Living</a>
                    <a href="/category/beauty">Beauty</a>
                    <a href="/deals" style="color: var(--secondary); font-weight: bold;">
                        <i class="fas fa-bolt"></i> Hot Deals
                    </a>
                </div>
            </div>
        </div>
    </nav>
`;

const footerHtml = (storeConfig) => `
    <!-- Footer -->
    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <h3>${storeConfig.storeName}</h3>
                    <p>${storeConfig.storeTagline}</p>
                    <p>Your trusted online marketplace in Bangladesh</p>
                </div>
                
                <div class="footer-section">
                    <h3>Quick Links</h3>
                    <a href="/">Home</a>
                    <a href="/products">All Products</a>
                    <a href="/about">About Us</a>
                    <a href="/contact">Contact</a>
                </div>
                
                <div class="footer-section">
                    <h3>Customer Care</h3>
                    <a href="/shipping">Shipping Info</a>
                    <a href="/returns">Returns</a>
                    <a href="/faq">FAQ</a>
                    <a href="/support">Support</a>
                </div>
                
                <div class="footer-section">
                    <h3>Contact Info</h3>
                    <p><i class="fas fa-phone"></i> ${storeConfig.phone}</p>
                    <p><i class="fas fa-envelope"></i> ${storeConfig.email}</p>
                    <p><i class="fas fa-map-marker-alt"></i> Dhaka, Bangladesh</p>
                </div>
            </div>
            
            <div class="footer-bottom">
                <p>&copy; 2024 ${storeConfig.storeName}. All rights reserved. | Developed with ❤️ for Bangladesh</p>
                <div class="social-links">
                    <a href="#"><i class="fab fa-facebook-f"></i></a>
                    <a href="#"><i class="fab fa-twitter"></i></a>
                    <a href="#"><i class="fab fa-instagram"></i></a>
                    <a href="#"><i class="fab fa-linkedin-in"></i></a>
                </div>
            </div>
        </div>
    </footer>
`;

const searchScript = `
    <script>
        function performSearch() {
            const query = document.getElementById('searchInput').value.trim();
            if (query) {
                window.location.href = '/search?q=' + encodeURIComponent(query);
            }
        }
        
        document.getElementById('searchInput') && document.getElementById('searchInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') performSearch();
        });
    </script>
`;

// Helper function to render a product card
function renderProductCard(product) {
  return `
    <div class="product-card">
        ${product.discount > 0 ? `<div class="product-badge">-${product.discount}%</div>` : ''}
        <div class="product-image">${product.image}</div>
        <div>
            <div class="product-brand">${product.brand}</div>
            <div class="product-title">${product.name}</div>
            <div class="product-price">
                <span class="current-price">${product.price}${STORE_CONFIG.currency}</span>
                ${product.discount > 0 ? `
                    <span class="original-price">${product.originalPrice}${STORE_CONFIG.currency}</span>
                ` : ''}
            </div>
            <div class="product-rating">
                ${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5-Math.floor(product.rating))} 
                <span style="color: var(--gray); font-size: 0.9em;">(${product.reviews})</span>
            </div>
        </div>
        <a href="/product/${product.id}" class="buy-btn" style="margin-top: 15px;">
            <i class="fas fa-eye"></i> View Details
        </a>
    </div>
  `;
}


// --- Routes ---

app.get('/', (req, res) => {
  const featuredProducts = products.slice(0, 8);
  const onSaleProducts = products.filter(p => p.discount > 10).slice(0, 6);
  const bestSellers = products.sort((a, b) => b.reviews - a.reviews).slice(0, 6);
  const newArrivals = products.slice(-6).reverse();

  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${STORE_CONFIG.storeName} - ${STORE_CONFIG.storeTagline}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        ${baseStyles}
        body { background: #ffffff; } /* Homepage specific style */
    </style>
</head>
<body>
    ${headerHtml(products.length, STORE_CONFIG)}

    <!-- Hero Section -->
    <section class="hero">
        <div class="container">
            <h1>Welcome to ${STORE_CONFIG.storeName}</h1>
            <p>${STORE_CONFIG.storeTagline} - Discover ${products.length}+ Premium Products with Best Prices & Fast Delivery</p>
            <a href="#featured-products" class="cta-button">
                Shop Now <i class="fas fa-arrow-right"></i>
            </a>
        </div>
    </section>

    <!-- Features -->
    <section class="features">
        <div class="container">
            <div class="features-grid">
                <div class="feature-card">
                    <i class="fas fa-shipping-fast"></i>
                    <h3>Free Shipping</h3>
                    <p>Free delivery on orders over 1000৳ across Bangladesh</p>
                </div>
                <div class="feature-card">
                    <i class="fas fa-shield-alt"></i>
                    <h3>Secure Payment</h3>
                    <p>100% secure payment with SSL encryption</p>
                </div>
                <div class="feature-card">
                    <i class="fas fa-undo"></i>
                    <h3>Easy Returns</h3>
                    <p>7-day hassle-free return policy</p>
                </div>
                <div class="feature-card">
                    <i class="fas fa-headset"></i>
                    <h3>24/7 Support</h3>
                    <p>Round the clock customer support</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Categories -->
    <section class="categories">
        <div class="container">
            <h2 class="section-title" style="color: white;">Shop by Category</h2>
            <p class="section-subtitle" style="color: rgba(255,255,255,0.8);">Explore our wide range of product categories</p>
            <div class="categories-grid">
                ${generateProducts().reduce((acc, p) => { // Get unique categories
                  if (!acc.find(c => c.id === p.category)) {
                    acc.push({ id: p.category, name: p.category.charAt(0).toUpperCase() + p.category.slice(1), icon: p.image, count: products.filter(prod => prod.category === p.category).length });
                  }
                  return acc;
                }, []).slice(0, 8).map(cat => `
                <div class="category-card" onclick="window.location.href='/category/${cat.id}'">
                    <i style="font-size: 2.5em; margin-bottom: 15px; display: block;">${cat.icon}</i>
                    <h3>${cat.name}</h3>
                    <p>${cat.count} products</p>
                </div>
                `).join('')}
            </div>
        </div>
    </section>

    <!-- Featured Products -->
    <section class="products" id="featured-products">
        <div class="container">
            <h2 class="section-title">Featured Products</h2>
            <p class="section-subtitle">Handpicked products with best quality and prices</p>
            <div class="product-grid">
                ${featuredProducts.map(renderProductCard).join('')}
            </div>
        </div>
    </section>

    <!-- Hot Deals -->
    ${onSaleProducts.length > 0 ? `
    <section class="products" style="background: var(--light);">
        <div class="container">
            <h2 class="section-title">Hot Deals</h2>
            <p class="section-subtitle">Limited time offers with big discounts</p>
            <div class="product-grid">
                ${onSaleProducts.map(product => `
                    <div class="product-card">
                        <div class="product-badge" style="background: var(--danger);">-${product.discount}% OFF</div>
                        <div class="product-image">${product.image}</div>
                         <div>
                            <div class="product-brand">${product.brand}</div>
                            <div class="product-title">${product.name}</div>
                            <div class="product-price">
                                <span class="current-price">${product.price}${STORE_CONFIG.currency}</span>
                                <span class="original-price">${product.originalPrice}${STORE_CONFIG.currency}</span>
                            </div>
                        </div>
                        <a href="/product/${product.id}" class="buy-btn" style="background: var(--danger); margin-top: 15px;">
                            <i class="fas fa-eye"></i> View Details
                        </a>
                    </div>
                `).join('')}
            </div>
        </div>
    </section>
    ` : ''}

    <!-- Stats -->
    <section class="stats">
        <div class="container">
            <div class="stats-grid">
                <div class="stat-item">
                    <h3>${products.length}+</h3>
                    <p>Products</p>
                </div>
                <div class="stat-item">
                    <h3>${orders.length}+</h3>
                    <p>Orders</p>
                </div>
                <div class="stat-item">
                    <h3 id="visitors">${visitors}+</h3>
                    <p>Visitors</p>
                </div>
                <div class="stat-item">
                    <h3>24/7</h3>
                    <p>Support</p>
                </div>
            </div>
        </div>
    </section>

    ${footerHtml(STORE_CONFIG)}
    ${searchScript}
</body>
</html>
  `);
});

// Product detail page
app.get('/product/:id', (req, res) => {
  const productId = parseInt(req.params.id);
  const product = products.find(p => p.id === productId);
  
  if (!product) return res.redirect('/');
  
  const relatedProducts = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${product.name} - ${STORE_CONFIG.storeName}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        ${baseStyles}
    </style>
</head>
<body>
    ${headerHtml(products.length, STORE_CONFIG)}
    
    <div class="page-wrapper" style="background: var(--light);">
        <div class="container">
            <div class="product-detail-layout">
                <div class="product-detail-image">
                    <div class="main-image">${product.image}</div>
                    <!-- Add thumbnail images if available -->
                </div>
                <div class="product-detail-info">
                    <div class="brand">${product.brand}</div>
                    <h1 class="title">${product.name}</h1>
                    <div class="rating">
                        ${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5-Math.floor(product.rating))} 
                        <span>(${product.rating} stars / ${product.reviews} reviews)</span>
                    </div>
                    
                    <div class="price-box">
                        <span class="price">${product.price}${STORE_CONFIG.currency}</span>
                        ${product.discount > 0 ? `
                            <span class="original-price">${product.originalPrice}${STORE_CONFIG.currency}</span>
                            <span class="discount">-${product.discount}%</span>
                        ` : ''}
                    </div>
                    
                    <div class="stock">
                        <i class="fas fa-check-circle"></i> In Stock: ${product.stock} items
                    </div>
                    
                    <div class="description">
                        <p>${product.description}</p>
                    </div>
                    
                    <a href="/order/${product.id}" class="buy-btn-lg">
                        <i class="fas fa-shopping-cart"></i> Order Now
                    </a>
                    
                    <div class="product-specs">
                        <h3>Specifications</h3>
                        <ul>
                            <li><strong>Brand:</strong> <span>${product.brand}</span></li>
                            <li><strong>Material:</strong> <span>${product.specifications.material}</span></li>
                            <li><strong>Color:</strong> <span>${product.specifications.color}</span></li>
                            <li><strong>Weight:</strong> <span>${product.specifications.weight}</span></li>
                            <li><strong>Dimensions:</strong> <span>${product.specifications.dimensions}</span></li>
                            <li><strong>Warranty:</strong> <span>${product.warranty}</span></li>
                            <li><strong>Shipping:</strong> <span>${product.shipping}</span></li>
                        </ul>
                    </div>
                </div>
            </div>
            
            ${relatedProducts.length > 0 ? `
            <section class="products" style="padding-top: 60px;">
                <h2 class="section-title" style="text-align: left; margin-bottom: 30px;">Related Products</h2>
                <div class="product-grid" style="grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));">
                    ${relatedProducts.map(renderProductCard).join('')}
                </div>
            </section>
            ` : ''}
        </div>
    </div>
    
    ${footerHtml(STORE_CONFIG)}
    ${searchScript}
</body>
</html>
  `);
});

// Order page
app.get('/order/:productId', (req, res) => {
  const productId = parseInt(req.params.productId);
  const product = products.find(p => p.id === productId);
  
  if (!product) return res.redirect('/');

  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order ${product.name} - ${STORE_CONFIG.storeName}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        ${baseStyles}
    </style>
</head>
<body>
    ${headerHtml(products.length, STORE_CONFIG)}
    
    <div class="page-wrapper" style="background: var(--light);">
        <div class="container">
            <h1 class="page-title">Confirm Your Order</h1>
            
            <div class="order-layout">
                <div class="order-summary">
                    <h3>Your Order</h3>
                    <hr style="margin: 15px 0;">
                    <div class="product-image">${product.image}</div>
                    <div class="product-title">${product.name}</div>
                    <div class="product-brand">${product.brand}</div>
                    <div class="product-price">${product.price}${STORE_CONFIG.currency}</div>
                    <p style="margin-top: 20px; color: var(--gray);">${product.description}</p>
                </div>
                
                <div class="order-form">
                    <h3>Shipping Details</h3>
                    <p>Please fill out the form below to place your order.</p>
                    <form id="orderForm" style="margin-top: 20px;">
                        <!-- Hidden fields -->
                        <input type="hidden" name="product" value="${product.name}">
                        <input type="hidden" name="price" value="${product.price}">
                    
                        <div class="form-group">
                            <label for="name">Full Name *</label>
                            <input type="text" id="name" name="name" required>
                        </div>
                        <div class="form-group">
                            <label for="phone">Phone Number *</label>
                            <input type="tel" id="phone" name="phone" required>
                        </div>
                        <div class="form-group">
                            <label for="address">Full Address (Street, House No) *</label>
                            <input type="text" id="address" name="address" required>
                        </div>
                        <div class="form-group">
                            <label for="city">City *</label>
                            <select id="city" name="city" required>
                                <option value="Dhaka">Dhaka</option>
                                <option value="Chittagong">Chittagong</option>
                                <option value="Khulna">Khulna</option>
                                <option value="Sylhet">Sylhet</option>
                                <option value="Rajshahi">Rajshahi</option>
                                <option value="Barisal">Barisal</option>
                                <option value="Rangpur">Rangpur</option>
                                <option value="Mymensingh">Mymensingh</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="area">Area/Thana *</label>
                            <input type="text" id="area" name="area" required>
                        </div>
                         <div class="form-group">
                            <label for="quantity">Quantity</label>
                            <input type="number" id="quantity" name="quantity" value="1" min="1" max="${product.stock}">
                        </div>
                        <div class="form-group">
                            <label for="paymentMethod">Payment Method</label>
                            <select id="paymentMethod" name="paymentMethod">
                                <option value="Cash on Delivery">Cash on Delivery</option>
                                <option value="bKash" disabled>bKash (Coming Soon)</option>
                                <option value="Card" disabled>Credit/Debit Card (Coming Soon)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="notes">Additional Notes (Optional)</label>
                            <textarea id="notes" name="notes" placeholder="e.g. preferred delivery time"></textarea>
                        </div>
                        
                        <div id="formMessage" class="form-message"></div>
                        
                        <button type="submit" class="submit-btn" id="submitBtn">
                            <i class="fas fa-check-circle"></i> Place Order
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>
    
    ${footerHtml(STORE_CONFIG)}
    ${searchScript}
    
    <script>
        document.getElementById('orderForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = document.getElementById('submitBtn');
            const formMessage = document.getElementById('formMessage');
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Submitting...';
            
            const formData = new FormData(this);
            const data = Object.fromEntries(formData.entries());
            
            try {
                const response = await fetch('/submit-order', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    formMessage.textContent = result.message + ' Redirecting...';
                    formMessage.className = 'form-message success';
                    formMessage.style.display = 'block';
                    
                    // Clear form
                    this.reset();
                    
                    // Redirect to homepage after 3 seconds
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 3000);
                    
                } else {
                    throw new Error(result.message || 'An unknown error occurred.');
                }
                
            } catch (error) {
                formMessage.textContent = 'Error: ' + error.message;
                formMessage.className = 'form-message error';
                formMessage.style.display = 'block';
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Place Order';
            }
        });
    </script>
</body>
</html>
  `);
});

// Order submission API
app.post('/submit-order', (req, res) => {
  const { name, phone, email, address, city, area, product, price, quantity, paymentMethod, notes } = req.body;
  
  // Basic validation
  if (!name || !phone || !address || !city || !area || !product || !price) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields. Please fill out the form completely.'
    });
  }

  const orderId = 'MM' + Date.now();
  const orderData = {
    orderId,
    name,
    phone,
    email: email || 'Not provided',
    address: `${address}, ${area}, ${city}`,
    product,
    price: price + STORE_CONFIG.currency,
    quantity: quantity || 1,
    paymentMethod: paymentMethod || 'Cash on Delivery',
    notes: notes || 'No additional notes',
    timestamp: new Date().toISOString(),
    status: 'pending'
  };
  
  orders.push(orderData);
  orderIdCounter++;
  
  // Log order details to console
  console.log('🛒 NEW ORDER RECEIVED (CONSOLE):');
  console.log('══════════════════════════════════════');
  console.log('📦 Order ID:', orderData.orderId);
  console.log('👤 Customer:', orderData.name);
  console.log('📞 Phone:', orderData.phone);
  console.log('📍 Address:', orderData.address);
  console.log('🛍️ Product:', orderData.product);
  console.log('══════════════════════════════════════');
  
  // --- Send to Messenger ---
  if (messengerApi) {
    const orderMessage = `
🛒 Notun Order Esheche! 🛒
══════════════════════
👤 Customer: ${orderData.name}
📞 Phone: ${orderData.phone}
📍 Address: ${orderData.address}
🛍️ Product: ${orderData.product} (Qty: ${orderData.quantity})
💰 Price: ${orderData.price}
💳 Payment: ${orderData.paymentMethod}
📝 Notes: ${orderData.notes}
📦 Order ID: ${orderData.orderId}
    `;
    
    try {
      messengerApi.sendMessage(orderMessage, STORE_CONFIG.adminThreadId, (err) => {
        if (err) {
          console.error('🔴 Failed to send message to Messenger:', err);
        } else {
          console.log('🟢 Order notification sent to Messenger!');
        }
      });
    } catch (e) {
      console.error('🔴 Error calling messengerApi.sendMessage:', e);
    }
    
  } else {
    console.warn('⚠️ Messenger API not ready. Skipping notification.');
  }
  // --- End Messenger ---
  
  res.status(200).json({
    success: true,
    message: 'Order received successfully! Our team will call you within 30 minutes to confirm your order.',
    orderId: orderId,
    nextStep: 'Wait for phone call confirmation',
    contactInfo: STORE_CONFIG.phone
  });
});

// Products list page
app.get('/products', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>All Products - ${STORE_CONFIG.storeName}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        ${baseStyles}
    </style>
</head>
<body>
    ${headerHtml(products.length, STORE_CONFIG)}
    
    <div class="page-wrapper" style="background: var(--light);">
        <div class="container">
            <h1 class="page-title">All Products (${products.length})</h1>
            
            <section class="products" style="padding: 0;">
                <div class="product-grid">
                    ${products.map(renderProductCard).join('')}
                </div>
            </section>
        </div>
    </div>
    
    ${footerHtml(STORE_CONFIG)}
    ${searchScript}
</body>
</html>
  `);
});

// Category pages
app.get('/category/:category', (req, res) => {
  const category = req.params.category;
  const categoryProducts = products.filter(p => p.category === category);
  const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
  
  if (categoryProducts.length === 0) return res.redirect('/');
  
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${categoryName} - ${STORE_CONFIG.storeName}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        ${baseStyles}
    </style>
</head>
<body>
    ${headerHtml(products.length, STORE_CONFIG)}
    
    <div class="page-wrapper" style="background: var(--light);">
        <div class="container">
            <h1 class="page-title">${categoryName}</h1>
            <p class="section-subtitle" style="margin-top: -30px; margin-bottom: 40px;">Found ${categoryProducts.length} products in this category</p>
            
            <section class="products" style="padding: 0;">
                <div class="product-grid">
                    ${categoryProducts.map(renderProductCard).join('')}
                </div>
            </section>
        </div>
    </div>
    
    ${footerHtml(STORE_CONFIG)}
    ${searchScript}
</body>
</html>
  `);
});

// Admin page
app.get('/admin', (req, res) => {
  const recentOrders = [...orders].reverse(); // Show newest first
  
  res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Admin - ${STORE_CONFIG.storeName}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        ${baseStyles}
    </style>
</head>
<body>
    ${headerHtml(products.length, STORE_CONFIG)}
    
    <div class="page-wrapper" style="background: var(--light);">
        <div class="container">
            <h1 class="page-title">Admin Dashboard</h1>
            
            <div class="admin-grid">
                <div class="admin-stat-card">
                    <h3>${visitors}</h3>
                    <p>Total Visitors</p>
                </div>
                <div class="admin-stat-card">
                    <h3>${orders.length}</h3>
                    <p>Total Orders</p>
                </div>
                 <div class="admin-stat-card">
                    <h3>${products.length}</h3>
                    <p>Total Products</p>
                </div>
                 <div class="admin-stat-card">
                    <h3>${STORE_CONFIG.storeStatus.toUpperCase()}</h3>
                    <p>Store Status</p>
                </div>
            </div>
            
            <h2 style="font-size: 2em; color: var(--primary); margin-bottom: 20px;">Recent Orders</h2>
            
            <div style="overflow-x: auto;">
                <table class="order-table">
                    <thead>
                        <tr>
                            <th>Customer</th>
                            <th>Phone</th>
                            <th>Address</th>
                            <th>Product</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${recentOrders.length > 0 ? recentOrders.map(order => `
                            <tr>
                                <td>${order.name}</td>
                                <td>${order.phone}</td>
                                <td>${order.address}</td>
                                <td>${order.product} (x${order.quantity})</td>
                                <td>${order.price}</td>
                                <td><span class="status-pending">${order.status}</span></td>
                                <td>${new Date(order.timestamp).toLocaleString()}</td>
                            </tr>
                        `).join('') : `
                            <tr>
                                <td colspan="7" style="text-align: center; padding: 20px;">No orders yet.</td>
                            </tr>
                        `}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    
    ${footerHtml(STORE_CONFIG)}
    ${searchScript}
</body>
</html>
  `);
});

// About page
app.get('/about', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>About - ${STORE_CONFIG.storeName}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        ${baseStyles}
    </style>
</head>
<body>
    ${headerHtml(products.length, STORE_CONFIG)}
    
    <div class="page-wrapper" style="background: var(--light);">
        <div class="container">
            <h1 class="page-title">About ${STORE_CONFIG.storeName}</h1>
            
            <div class="simple-page-content">
                <p>Welcome to ${STORE_CONFIG.storeName}, ${STORE_CONFIG.storeTagline}. We are dedicated to bringing you the best products from around the world, right to your doorstep in Bangladesh.</p>
                <p>Our mission is to provide a seamless, reliable, and enjoyable online shopping experience. We believe in quality, affordability, and exceptional customer service.</p>
                
                <h3>Our Vision</h3>
                <p>To become the most trusted and customer-centric e-commerce platform in Bangladesh, empowering local businesses and delighting customers every day.</p>
                
                <h3>Why Shop With Us?</h3>
                <ul style="margin-left: 20px; line-height: 1.8;">
                    <li><b>Wide Selection:</b> Over ${products.length} products across various categories.</li>
                    <li><b>Best Prices:</b> We work hard to offer you competitive prices and amazing deals.</li>
                    <li><b>Fast Delivery:</b> Our logistics network ensures fast and reliable delivery to your location.</li>
                    <li><b>Secure Payments:</b> Shop with confidence using our secure payment gateways.</li>
                    <li><b>24/7 Support:</b> Our customer support team is always here to help you.</li>
                </ul>
            </div>
        </div>
    </div>
    
    ${footerHtml(STORE_CONFIG)}
    ${searchScript}
</body>
</html>
  `);
});

// Contact page
app.get('/contact', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Contact - ${STORE_CONFIG.storeName}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        ${baseStyles}
    </style>
</head>
<body>
    ${headerHtml(products.length, STORE_CONFIG)}
    
    <div class="page-wrapper" style="background: var(--light);">
        <div class="container">
            <h1 class="page-title">Contact Us</h1>
            <p class="section-subtitle" style="margin-top: -30px; margin-bottom: 40px;">We'd love to hear from you!</p>
            
            <div class="order-layout">
                <div class="simple-page-content">
                    <h3>Get in Touch</h3>
                    <p>If you have any questions, concerns, or feedback, please don't hesitate to reach out to us. Our team is available 24/7 to assist you.</p>
                    
                    <h4 style="margin-top: 20px; color: var(--primary);">Customer Support</h4>
                    <p><i class="fas fa-phone"></i> <strong>Phone:</strong> ${STORE_CONFIG.phone}</p>
                    <p><i class="fas fa-envelope"></i> <strong>Email:</strong> ${STORE_CONFIG.email}</p>
                    
                    <h4 style="margin-top: 20px; color: var(--primary);">Office Address</h4>
                    <p><i class="fas fa-map-marker-alt"></i> Dhaka, Bangladesh</p>
                </div>
                
                <div class="order-form">
                    <h3>Send Us a Message</h3>
                    <form style="margin-top: 20px;">
                        <div class="form-group">
                            <label for="contact_name">Your Name</label>
                            <input type="text" id="contact_name" name="contact_name">
                        </div>
                         <div class="form-group">
                            <label for="contact_email">Your Email</label>
                            <input type="email" id="contact_email" name="contact_email">
                        </div>
                         <div class="form-group">
                            <label for="contact_subject">Subject</label>
                            <input type="text" id="contact_subject" name="contact_subject">
                        </div>
                        <div class="form-group">
                            <label for="contact_message">Message</label>
                            <textarea id="contact_message" name="contact_message"></textarea>
                        </div>
                        <button type="submit" class="submit-btn" style="background: var(--primary);">Send Message</button>
                    </form>
                </div>
            </div>
        </div>
    </div>
    
    ${footerHtml(STORE_CONFIG)}
    ${searchScript}
</body>
</html>
  `);
});

// Search page
app.get('/search', (req, res) => {
  const query = req.query.q?.toLowerCase() || '';
  const searchResults = products.filter(product => 
    product.name.toLowerCase().includes(query) ||
    product.brand.toLowerCase().includes(query) ||
    product.category.toLowerCase().includes(query) ||
    product.description.toLowerCase().includes(query)
  );
  
  res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Search Results for "${query}" - ${STORE_CONFIG.storeName}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        ${baseStyles}
    </style>
</head>
<body>
    ${headerHtml(products.length, STORE_CONFIG)}
    
    <div class="page-wrapper" style="background: var(--light);">
        <div class="container">
            <div class="search-results-header">
                <h1 class="page-title" style="margin-bottom: 10px;">Search Results</h1>
                <p class="section-subtitle">Found ${searchResults.length} results for "<strong>${query}</strong>"</p>
            </div>
            
            <section class="products" style="padding: 0;">
                ${searchResults.length > 0 ? `
                    <div class="product-grid">
                        ${searchResults.map(renderProductCard).join('')}
                    </div>
                ` : `
                    <p class="no-results">No products found matching your search. Try a different keyword.</p>
                `}
            </section>
        </div>
    </div>
    
    ${footerHtml(STORE_CONFIG)}
    ${searchScript}
</body>
</html>
  `);
});

// Start server
app.listen(PORT, () => {
  console.log(`🛒 ${STORE_CONFIG.storeName} running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`📞 Admin Thread: ${STORE_CONFIG.adminThreadId}`);
  console.log(`🛍️ Products: ${products.length}`);
  console.log(`📊 Orders: ${orders.length}`);
  console.log(`👥 Visitors: ${visitors}`);
  console.log(`🚀 Server started successfully!`);
});

// Export for testing
module.exports = app;
