/**
 * @author NTKhang
 * ! The source code is written by NTKhang, please don't change the author's name everywhere. Thank you for using
 * ! Official source code: https://github.com/ntkhang03/Goat-Bot-V2
 * ! If you do not download the source code from the above address, you are using an unknown version and at risk of having your account hacked
 * 
 * English:
 * ! Please do not change the below code, it is very important for the project.
 * It is my motivation to maintain and develop the project for free.
 * ! If you change it, you will be banned forever
 * Thank you for using
 * 
 * Vietnamese:
 * ! Vui lòng không thay đổi mã bên dưới, nó rất quan trọng đối với dự án.
 * Nó là động lực để tôi duy trì và phát triển dự án miễn phí.
 * ! Nếu thay đổi nó, bạn sẽ bị cấm vĩnh viễn
 * Cảm ơn bạn đã sử dụng */

const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const axios = require('axios');
const moment = require('moment-timezone');

const app = express();
const PORT = process.env.PORT || 3000;

// Store Configuration
const STORE_CONFIG = {
  storeName: "MegaMart BD",
  storeTagline: "Bangladesh's Largest Online Marketplace", 
  currency: "৳",
  adminThreadId: "1843705779576417",
  storeStatus: "open",
  phone: "+8801330513726",
  email: "mailraihanpremium@gmail.com",
  features: {
    wishlist: true,
    orderTracking: true,
    multiplePayment: true,
    fastDelivery: true
  }
};

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

// Routes
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
        body { font-family: 'Inter', sans-serif; background: #ffffff; color: #333; line-height: 1.6; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        
        /* Header */
        .top-bar { background: var(--dark); color: white; padding: 8px 0; font-size: 0.9em; }
        .top-bar .container { display: flex; justify-content: space-between; align-items: center; }
        .header { background: var(--primary); color: white; padding: 15px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header-content { display: flex; justify-content: space-between; align-items: center; }
        .logo { font-size: 1.8em; font-weight: bold; color: white; text-decoration: none; display: flex; align-items: center; gap: 10px; }
        .search-bar { display: flex; max-width: 500px; width: 100%; }
        .search-bar input { flex: 1; padding: 10px 15px; border: none; border-radius: 5px 0 0 5px; font-size: 1em; }
        .search-bar button { background: var(--secondary); color: white; border: none; padding: 10px 20px; border-radius: 0 5px 5px 0; cursor: pointer; }
        .header-actions { display: flex; gap: 20px; }
        .action-btn { color: white; text-decoration: none; display: flex; align-items: center; gap: 5px; }
        
        /* Navigation */
        .main-nav { background: rgba(255,255,255,0.95); padding: 15px 0; border-bottom: 1px solid #eee; }
        .nav-content { display: flex; justify-content: space-between; align-items: center; }
        .category-menu { display: flex; gap: 25px; }
        .category-menu a { color: var(--dark); text-decoration: none; font-weight: 500; transition: color 0.3s; }
        .category-menu a:hover { color: var(--primary); }
        
        /* Hero */
        .hero {
            background: linear-gradient(135deg, var(--primary), #1e4a8b);
            color: white;
            padding: 80px 0;
            text-align: center;
        }
        .hero h1 { font-size: 3em; margin-bottom: 20px; }
        .hero p { font-size: 1.2em; margin-bottom: 30px; opacity: 0.9; max-width: 600px; margin: 0 auto; }
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
        .product-card { background: white; border-radius: 10px; padding: 20px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); transition: 0.3s; position: relative; }
        .product-card:hover { transform: translateY(-5px); box-shadow: 0 10px 25px rgba(0,0,0,0.15); }
        .product-badge { position: absolute; top: 15px; right: 15px; background: var(--danger); color: white; padding: 5px 10px; border-radius: 15px; font-size: 0.8em; font-weight: bold; }
        .product-image { font-size: 3em; text-align: center; margin-bottom: 15px; height: 80px; display: flex; align-items: center; justify-content: center; }
        .product-title { font-size: 1.1em; font-weight: 600; margin-bottom: 10px; color: var(--dark); }
        .product-brand { color: var(--gray); font-size: 0.9em; margin-bottom: 10px; }
        .product-price { display: flex; align-items: center; gap: 10px; margin-bottom: 15px; flex-wrap: wrap; }
        .current-price { font-size: 1.3em; font-weight: bold; color: var(--secondary); }
        .original-price { color: var(--gray); text-decoration: line-through; }
        .discount { background: var(--danger); color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.8em; font-weight: bold; }
        .product-rating { color: var(--warning); margin-bottom: 15px; display: flex; align-items: center; gap: 5px; }
        .buy-btn { background: var(--primary); color: white; border: none; padding: 12px; border-radius: 5px; cursor: pointer; width: 100%; font-weight: 600; transition: 0.3s; }
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
        .footer { background: var(--dark); color: white; padding: 50px 0 20px; }
        .footer-content { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 40px; margin-bottom: 40px; }
        .footer-section h3 { margin-bottom: 20px; color: var(--secondary); }
        .footer-section a { color: #ccc; text-decoration: none; display: block; margin-bottom: 10px; }
        .footer-section a:hover { color: white; }
        .footer-bottom { text-align: center; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); }
        .social-links { display: flex; gap: 15px; margin-top: 20px; justify-content: center; }
        .social-links a { color: white; background: rgba(255,255,255,0.1); width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        
        @media (max-width: 768px) {
            .header-content { flex-direction: column; gap: 15px; }
            .search-bar { max-width: 100%; }
            .hero h1 { font-size: 2.2em; }
            .product-grid { grid-template-columns: 1fr; }
            .category-menu { flex-wrap: wrap; gap: 15px; justify-content: center; }
        }
    </style>
</head>
<body>
    <!-- Top Bar -->
    <div class="top-bar">
        <div class="container">
            <div class="store-info">
                <span><i class="fas fa-phone"></i> ${STORE_CONFIG.phone}</span>
                <span style="margin-left: 20px;"><i class="fas fa-envelope"></i> ${STORE_CONFIG.email}</span>
            </div>
            <div class="store-status">
                <span style="background: ${STORE_CONFIG.storeStatus === 'open' ? 'var(--success)' : 'var(--danger)'}; padding: 5px 15px; border-radius: 15px; font-size: 0.8em; font-weight: bold;">
                    <i class="fas fa-store"></i> ${STORE_CONFIG.storeStatus === 'open' ? 'OPEN' : 'CLOSED'}
                </span>
            </div>
        </div>
    </div>

    <!-- Header -->
    <header class="header">
        <div class="container">
            <div class="header-content">
                <a href="/" class="logo">
                    <i class="fas fa-shopping-bag"></i> ${STORE_CONFIG.storeName}
                </a>
                
                <div class="search-bar">
                    <input type="text" placeholder="Search ${products.length}+ products..." id="searchInput">
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
                <div class="category-card" onclick="window.location.href='/category/electronics'">
                    <i class="fas fa-mobile-alt"></i>
                    <h3>Electronics</h3>
                    <p>${products.filter(p => p.category === 'electronics').length} products</p>
                </div>
                <div class="category-card" onclick="window.location.href='/category/fashion'">
                    <i class="fas fa-tshirt"></i>
                    <h3>Fashion</h3>
                    <p>${products.filter(p => p.category === 'fashion').length} products</p>
                </div>
                <div class="category-card" onclick="window.location.href='/category/home'">
                    <i class="fas fa-home"></i>
                    <h3>Home & Living</h3>
                    <p>${products.filter(p => p.category === 'home').length} products</p>
                </div>
                <div class="category-card" onclick="window.location.href='/category/beauty'">
                    <i class="fas fa-spa"></i>
                    <h3>Beauty</h3>
                    <p>${products.filter(p => p.category === 'beauty').length} products</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Featured Products -->
    <section class="products" id="featured-products">
        <div class="container">
            <h2 class="section-title">Featured Products</h2>
            <p class="section-subtitle">Handpicked products with best quality and prices</p>
            <div class="product-grid">
                ${featuredProducts.map(product => `
                    <div class="product-card">
                        ${product.discount > 0 ? `<div class="product-badge">-${product.discount}%</div>` : ''}
                        <div class="product-image">${product.image}</div>
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
                        <button class="buy-btn" onclick="window.location.href='/product/${product.id}'">
                            <i class="fas fa-shopping-cart"></i> Buy Now
                        </button>
                    </div>
                `).join('')}
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
                        <div class="product-brand">${product.brand}</div>
                        <div class="product-title">${product.name}</div>
                        <div class="product-price">
                            <span class="current-price">${product.price}${STORE_CONFIG.currency}</span>
                            <span class="original-price">${product.originalPrice}${STORE_CONFIG.currency}</span>
                        </div>
                        <button class="buy-btn" onclick="window.location.href='/product/${product.id}'" style="background: var(--danger);">
                            <i class="fas fa-bolt"></i> Grab Deal
                        </button>
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
                    <h3>${visitors}+</h3>
                    <p>Visitors</p>
                </div>
                <div class="stat-item">
                    <h3>24/7</h3>
                    <p>Support</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <h3>${STORE_CONFIG.storeName}</h3>
                    <p>${STORE_CONFIG.storeTagline}</p>
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
                    <p><i class="fas fa-phone"></i> ${STORE_CONFIG.phone}</p>
                    <p><i class="fas fa-envelope"></i> ${STORE_CONFIG.email}</p>
                    <p><i class="fas fa-map-marker-alt"></i> Dhaka, Bangladesh</p>
                </div>
            </div>
            
            <div class="footer-bottom">
                <p>&copy; 2024 ${STORE_CONFIG.storeName}. All rights reserved. | Developed with ❤️ for Bangladesh</p>
                <div class="social-links">
                    <a href="#"><i class="fab fa-facebook-f"></i></a>
                    <a href="#"><i class="fab fa-twitter"></i></a>
                    <a href="#"><i class="fab fa-instagram"></i></a>
                    <a href="#"><i class="fab fa-linkedin-in"></i></a>
                </div>
            </div>
        </div>
    </footer>

    <script>
        function performSearch() {
            const query = document.getElementById('searchInput').value.trim();
            if (query) {
                window.location.href = '/search?q=' + encodeURIComponent(query);
            }
        }
        
        document.getElementById('searchInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') performSearch();
        });
    </script>
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
    <style>
        ${/* Previous CSS styles from product page */''}
    </style>
</head>
<body>
    ${/* Product page content */''}
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
    <style>
        ${/* Previous CSS styles from order page */''}
    </style>
</head>
<body>
    ${/* Order page content */''}
</body>
</html>
  `);
});

// Order submission API
app.post('/submit-order', (req, res) => {
  const { name, phone, email, address, city, area, product, price, quantity, paymentMethod, notes } = req.body;
  
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
  
  // Log order details
  console.log('🛒 NEW ORDER RECEIVED:');
  console.log('══════════════════════════════════════');
  console.log('📦 Order ID:', orderId);
  console.log('👤 Customer:', name);
  console.log('📞 Phone:', phone);
  console.log('📧 Email:', email || 'Not provided');
  console.log('📍 Address:', `${address}, ${area}, ${city}`);
  console.log('🛍️ Product:', product);
  console.log('💰 Price:', price + STORE_CONFIG.currency);
  console.log('📦 Quantity:', quantity || 1);
  console.log('💳 Payment:', paymentMethod || 'Cash on Delivery');
  console.log('📝 Notes:', notes || 'None');
  console.log('⏰ Time:', new Date().toLocaleString());
  console.log('══════════════════════════════════════');
  
  // In production, this would send to Messenger thread
  console.log('📤 Would send to Messenger thread:', STORE_CONFIG.adminThreadId);
  
  res.json({
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
    <style>
        ${/* Products page CSS */''}
    </style>
</head>
<body>
    ${/* Products page content */''}
</body>
</html>
  `);
});

// Category pages
app.get('/category/:category', (req, res) => {
  const category = req.params.category;
  const categoryProducts = products.filter(p => p.category === category);
  const categoryInfo = products.find(p => p.category === category);
  
  if (categoryProducts.length === 0) return res.redirect('/');
  
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${category.charAt(0).toUpperCase() + category.slice(1)} - ${STORE_CONFIG.storeName}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        ${/* Category page CSS */''}
    </style>
</head>
<body>
    ${/* Category page content */''}
</body>
</html>
  `);
});

// Admin page
app.get('/admin', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Admin - ${STORE_CONFIG.storeName}</title>
    <style>
        ${/* Admin page CSS */''}
    </style>
</head>
<body>
    ${/* Admin page content */''}
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
    <style>
        ${/* About page CSS */''}
    </style>
</head>
<body>
    ${/* About page content */''}
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
    <style>
        ${/* Contact page CSS */''}
    </style>
</head>
<body>
    ${/* Contact page content */''}
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
    <title>Search Results - ${STORE_CONFIG.storeName}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        ${/* Search page CSS */''}
    </style>
</head>
<body>
    ${/* Search page content */''}
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
