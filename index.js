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

const { spawn } = require("child_process"); 
const log = require("./logger/log.js");
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// E-commerce Configuration - ON/OFF System
const STORE_CONFIG = {
  storeName: "Premium Shop",
  storeTagline: "Your Trusted Online Store",
  currency: "৳",
  adminThreadId: "1843705779576417", // ON/OFF - Change this ID as needed
  storeStatus: "open", // "open" or "closed"
  products: {
    enabled: true,
    list: [
      {
        id: 1,
        name: "Wireless Bluetooth Headphones",
        price: 1290,
        image: "🎧",
        category: "electronics",
        status: "available"
      },
      {
        id: 2,
        name: "Smart Watch Series 5",
        price: 2490,
        image: "⌚",
        category: "electronics", 
        status: "available"
      },
      {
        id: 3,
        name: "Premium T-Shirt",
        price: 490,
        image: "👕",
        category: "fashion",
        status: "available"
      },
      {
        id: 4,
        name: "Sports Shoes",
        price: 1590,
        image: "👟",
        category: "fashion",
        status: "available"
      },
      {
        id: 5,
        name: "Laptop Backpack",
        price: 890,
        image: "🎒",
        category: "accessories",
        status: "available"
      },
      {
        id: 6,
        name: "Phone Case",
        price: 290,
        image: "📱",
        category: "accessories",
        status: "available"
      }
    ]
  },
  categories: {
    enabled: true,
    list: ["all", "electronics", "fashion", "accessories"]
  }
};

// Store orders temporarily
let pendingOrders = new Map();
let orderCounter = 1;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Function to send order to admin thread
function sendOrderToAdmin(orderData) {
  if (STORE_CONFIG.storeStatus === "closed") {
    console.log("❌ Store is closed. Order not sent to admin.");
    return;
  }

  const adminMessage = `
🛒 **NEW ORDER RECEIVED** 🛒

📦 Order ID: ${orderData.orderId}
👤 Customer: ${orderData.name}
📞 Phone: ${orderData.phone}
📍 Address: ${orderData.address}
🛍️ Product: ${orderData.product}
💰 Price: ${orderData.price}${STORE_CONFIG.currency}
📝 Notes: ${orderData.notes}
⏰ Time: ${new Date(orderData.timestamp).toLocaleString()}

📞 **Please call the customer to confirm the order!**
  `;
  
  // Send to admin thread - REMOVE COMMENT TO ACTIVATE
  // api.sendMessage(adminMessage, STORE_CONFIG.adminThreadId);
  console.log(`📤 Sending to admin thread ${STORE_CONFIG.adminThreadId}:`, adminMessage);
}

// Main Store Homepage
app.get('/', (req, res) => {
  const availableProducts = STORE_CONFIG.products.list.filter(p => p.status === "available");
  
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${STORE_CONFIG.storeName} - ${STORE_CONFIG.storeTagline}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            min-height: 100vh;
            color: #333;
        }
        
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        
        /* Header */
        .header { 
            background: rgba(255,255,255,0.95); 
            backdrop-filter: blur(10px); 
            padding: 20px 0; 
            border-bottom: 2px solid rgba(255,255,255,0.2);
            box-shadow: 0 2px 20px rgba(0,0,0,0.1);
        }
        .navbar { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
        }
        .logo { 
            font-size: 2em; 
            font-weight: bold; 
            color: #2c3e50;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .logo span { color: #e74c3c; }
        .store-status {
            background: #27ae60;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.8em;
            font-weight: bold;
        }
        .store-status.closed {
            background: #e74c3c;
        }
        
        /* Hero Section */
        .hero { 
            text-align: center; 
            padding: 80px 0; 
            color: white; 
        }
        .hero h1 { 
            font-size: 3em; 
            margin-bottom: 20px; 
            text-shadow: 2px 2px 10px rgba(0,0,0,0.3); 
        }
        .hero p { 
            font-size: 1.3em; 
            margin-bottom: 30px; 
            opacity: 0.9; 
        }
        
        /* Categories */
        .categories {
            background: white;
            padding: 30px 0;
            margin-bottom: 30px;
        }
        .category-filters {
            display: flex;
            justify-content: center;
            gap: 15px;
            flex-wrap: wrap;
        }
        .category-btn {
            background: #f8f9fa;
            border: 2px solid #e9ecef;
            padding: 10px 25px;
            border-radius: 25px;
            cursor: pointer;
            transition: 0.3s;
            font-weight: 500;
        }
        .category-btn.active,
        .category-btn:hover {
            background: #3498db;
            color: white;
            border-color: #3498db;
        }
        
        /* Products Grid */
        .products { 
            padding: 50px 0; 
        }
        .section-title { 
            text-align: center; 
            font-size: 2.5em; 
            margin-bottom: 50px; 
            color: white;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .product-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); 
            gap: 30px; 
        }
        .product-card { 
            background: rgba(255,255,255,0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px; 
            padding: 25px; 
            text-align: center; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.1); 
            transition: 0.3s; 
            border: 1px solid rgba(255,255,255,0.2);
        }
        .product-card:hover { 
            transform: translateY(-10px); 
            box-shadow: 0 20px 40px rgba(0,0,0,0.2); 
        }
        .product-image { 
            font-size: 4em; 
            margin-bottom: 20px; 
        }
        .product-title { 
            font-size: 1.3em; 
            font-weight: bold; 
            margin-bottom: 15px; 
            color: #2c3e50;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .product-price { 
            font-size: 1.8em; 
            font-weight: bold; 
            color: #e74c3c; 
            margin-bottom: 20px; 
        }
        .buy-btn { 
            background: linear-gradient(135deg, #27ae60, #2ecc71); 
            color: white; 
            border: none; 
            padding: 12px 30px; 
            border-radius: 25px; 
            cursor: pointer; 
            font-size: 1.1em; 
            width: 100%; 
            transition: 0.3s; 
            font-weight: bold;
        }
        .buy-btn:hover { 
            background: linear-gradient(135deg, #219a52, #27ae60); 
            transform: translateY(-2px); 
        }
        .buy-btn:disabled {
            background: #95a5a6;
            cursor: not-allowed;
            transform: none;
        }
        
        /* Footer */
        .footer { 
            background: rgba(44, 62, 80, 0.9); 
            color: white; 
            padding: 50px 0; 
            text-align: center; 
            margin-top: 50px;
        }
        
        @media (max-width: 768px) {
            .hero h1 { font-size: 2.2em; }
            .product-grid { grid-template-columns: 1fr; }
            .navbar { flex-direction: column; gap: 15px; }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <header class="header">
        <div class="container">
            <nav class="navbar">
                <div class="logo">
                    <i class="fas fa-store"></i>
                    ${STORE_CONFIG.storeName}
                    <span class="store-status ${STORE_CONFIG.storeStatus === 'closed' ? 'closed' : ''}">
                        ${STORE_CONFIG.storeStatus === 'open' ? '🟢 OPEN' : '🔴 CLOSED'}
                    </span>
                </div>
                <div class="nav-links">
                    <span style="color: #666;">📞 Support: +880 XXXX-XXXXXX</span>
                </div>
            </nav>
        </div>
    </header>

    <!-- Hero Section -->
    <section class="hero" id="home">
        <div class="container">
            <h1>Welcome to ${STORE_CONFIG.storeName}</h1>
            <p>${STORE_CONFIG.storeTagline} - Quality Products at Best Prices</p>
            ${STORE_CONFIG.storeStatus === 'closed' ? 
              '<div style="background: rgba(231,76,60,0.9); padding: 20px; border-radius: 15px; max-width: 500px; margin: 0 auto;"><i class="fas fa-exclamation-triangle"></i> Store is currently closed. Orders will be processed when we reopen.</div>' : 
              ''
            }
        </div>
    </section>

    <!-- Categories -->
    ${STORE_CONFIG.categories.enabled ? `
    <section class="categories">
        <div class="container">
            <div class="category-filters" id="categoryFilters">
                <button class="category-btn active" data-category="all">All Products</button>
                ${STORE_CONFIG.categories.list.filter(cat => cat !== 'all').map(cat => `
                    <button class="category-btn" data-category="${cat}">${cat.charAt(0).toUpperCase() + cat.slice(1)}</button>
                `).join('')}
            </div>
        </div>
    </section>
    ` : ''}

    <!-- Products Section -->
    <section class="products" id="products">
        <div class="container">
            <h2 class="section-title">Our Products</h2>
            <div class="product-grid" id="productGrid">
                ${availableProducts.map(product => `
                    <div class="product-card" data-category="${product.category}">
                        <div class="product-image">${product.image}</div>
                        <div class="product-title">${product.name}</div>
                        <div class="product-price">${product.price}${STORE_CONFIG.currency}</div>
                        <button class="buy-btn" onclick="window.location.href='/product/${product.id}'" 
                                ${STORE_CONFIG.storeStatus === 'closed' ? 'disabled' : ''}>
                            ${STORE_CONFIG.storeStatus === 'closed' ? 'Store Closed' : 'Buy Now'}
                        </button>
                    </div>
                `).join('')}
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="footer" id="contact">
        <div class="container">
            <h3>${STORE_CONFIG.storeName}</h3>
            <p>${STORE_CONFIG.storeTagline}</p>
            <p>📧 Email: support@${STORE_CONFIG.storeName.toLowerCase().replace(' ', '')}.com</p>
            <p>📞 Phone: +880 XXXX-XXXXXX</p>
            <p>⏰ Hours: 9:00 AM - 11:00 PM</p>
            <p>&copy; 2024 ${STORE_CONFIG.storeName}. All rights reserved.</p>
        </div>
    </footer>

    <script>
        // Category filtering
        document.addEventListener('DOMContentLoaded', function() {
            const categoryBtns = document.querySelectorAll('.category-btn');
            const productCards = document.querySelectorAll('.product-card');
            
            categoryBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                    // Update active button
                    categoryBtns.forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    
                    const category = this.dataset.category;
                    
                    // Filter products
                    productCards.forEach(card => {
                        if (category === 'all' || card.dataset.category === category) {
                            card.style.display = 'block';
                        } else {
                            card.style.display = 'none';
                        }
                    });
                });
            });
        });
    </script>
</body>
</html>
  `);
});

// Individual Product Page
app.get('/product/:id', (req, res) => {
  const productId = parseInt(req.params.id);
  const product = STORE_CONFIG.products.list.find(p => p.id === productId);
  
  if (!product) {
    return res.redirect('/');
  }
  
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${product.name} - ${STORE_CONFIG.storeName}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            min-height: 100vh;
            padding: 40px 20px;
        }
        
        .container { max-width: 1000px; margin: 0 auto; }
        .back-btn { 
            background: rgba(255,255,255,0.2); 
            color: white; 
            border: none; 
            padding: 12px 25px; 
            border-radius: 25px; 
            cursor: pointer; 
            margin-bottom: 30px; 
            backdrop-filter: blur(10px); 
            transition: 0.3s; 
            font-size: 1em;
        }
        .back-btn:hover { 
            background: rgba(255,255,255,0.3); 
            transform: translateX(-5px); 
        }
        
        .product-detail { 
            background: rgba(255,255,255,0.95); 
            backdrop-filter: blur(20px); 
            border-radius: 30px; 
            padding: 50px; 
            box-shadow: 0 20px 60px rgba(0,0,0,0.2); 
        }
        .product-header { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 50px; 
            margin-bottom: 40px; 
        }
        .product-image { 
            background: linear-gradient(135deg, #667eea, #764ba2); 
            border-radius: 20px; 
            height: 300px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: white; 
            font-size: 6em;
        }
        .product-info h1 { 
            font-size: 2.2em; 
            color: #333; 
            margin-bottom: 20px; 
        }
        .product-price { 
            font-size: 2.5em; 
            color: #e74c3c; 
            font-weight: bold; 
            margin-bottom: 20px; 
        }
        .product-description { 
            color: #666; 
            line-height: 1.8; 
            margin-bottom: 30px; 
            font-size: 1.1em; 
        }
        
        .order-section { 
            background: linear-gradient(135deg, #27ae60, #2ecc71); 
            padding: 40px; 
            border-radius: 20px; 
            color: white; 
            text-align: center; 
            margin-top: 40px;
        }
        .order-btn { 
            background: #e74c3c; 
            color: white; 
            border: none; 
            padding: 20px 50px; 
            font-size: 1.3em; 
            border-radius: 50px; 
            cursor: pointer; 
            transition: 0.3s; 
            margin-top: 20px; 
            font-weight: bold;
        }
        .order-btn:hover { 
            background: #c0392b; 
            transform: translateY(-5px); 
            box-shadow: 0 15px 35px rgba(231,76,60,0.4); 
        }
        .order-btn:disabled {
            background: #95a5a6;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }
        
        @media (max-width: 768px) {
            .product-header { grid-template-columns: 1fr; gap: 30px; }
            .product-image { height: 200px; font-size: 4em; }
        }
    </style>
</head>
<body>
    <div class="container">
        <button class="back-btn" onclick="window.location.href='/'">
            <i class="fas fa-arrow-left"></i> Back to Store
        </button>
        
        <div class="product-detail">
            <div class="product-header">
                <div class="product-image">
                    ${product.image}
                </div>
                <div class="product-info">
                    <h1>${product.name}</h1>
                    <div class="product-price">${product.price}${STORE_CONFIG.currency}</div>
                    <p class="product-description">
                        High-quality ${product.name.toLowerCase()} with excellent features. 
                        This product offers the best value for your money with guaranteed satisfaction. 
                        Perfect for everyday use with durable materials and superior craftsmanship.
                    </p>
                    <button class="order-btn" onclick="window.location.href='/order/${product.id}'" 
                            ${STORE_CONFIG.storeStatus === 'closed' ? 'disabled' : ''}>
                        <i class="fas fa-shopping-cart"></i> 
                        ${STORE_CONFIG.storeStatus === 'closed' ? 'Store Closed' : 'Order Now'} - ${product.price}${STORE_CONFIG.currency}
                    </button>
                </div>
            </div>
            
            <div class="order-section">
                <h3><i class="fas fa-shipping-fast"></i> Fast Delivery</h3>
                <p>Get your product delivered within 24 hours anywhere in Bangladesh</p>
                <p><i class="fas fa-headset"></i> 24/7 Customer Support</p>
            </div>
        </div>
    </div>
</body>
</html>
  `);
});

// Order Page
app.get('/order/:productId', (req, res) => {
  const productId = parseInt(req.params.productId);
  const product = STORE_CONFIG.products.list.find(p => p.id === productId);
  
  if (!product || STORE_CONFIG.storeStatus === 'closed') {
    return res.redirect('/');
  }
  
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order ${product.name} - ${STORE_CONFIG.storeName}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            min-height: 100vh; 
            padding: 40px 20px; 
        }
        
        .container { max-width: 800px; margin: 0 auto; }
        .back-btn { 
            background: rgba(255,255,255,0.2); 
            color: white; 
            border: none; 
            padding: 12px 25px; 
            border-radius: 25px; 
            cursor: pointer; 
            margin-bottom: 30px; 
            backdrop-filter: blur(10px); 
            transition: 0.3s; 
        }
        .back-btn:hover { 
            background: rgba(255,255,255,0.3); 
        }
        
        .order-form { 
            background: rgba(255,255,255,0.95); 
            backdrop-filter: blur(20px); 
            border-radius: 30px; 
            padding: 50px; 
            box-shadow: 0 20px 60px rgba(0,0,0,0.2); 
        }
        .form-title { 
            text-align: center; 
            font-size: 2.2em; 
            color: #333; 
            margin-bottom: 10px; 
        }
        .form-subtitle { 
            text-align: center; 
            color: #666; 
            margin-bottom: 40px; 
        }
        
        .product-summary { 
            background: linear-gradient(135deg, #667eea, #764ba2); 
            color: white; 
            padding: 30px; 
            border-radius: 20px; 
            margin-bottom: 40px; 
            text-align: center; 
        }
        .product-name { 
            font-size: 1.5em; 
            margin-bottom: 10px; 
        }
        .product-price { 
            font-size: 2.2em; 
            font-weight: bold; 
        }
        
        .form-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 25px; 
            margin-bottom: 30px; 
        }
        .form-group { 
            margin-bottom: 25px; 
        }
        .form-group.full { 
            grid-column: 1 / -1; 
        }
        label { 
            display: block; 
            margin-bottom: 8px; 
            font-weight: 600; 
            color: #333; 
        }
        input, textarea, select { 
            width: 100%; 
            padding: 15px 20px; 
            border: 2px solid #e9ecef; 
            border-radius: 15px; 
            font-size: 1em; 
            transition: 0.3s; 
        }
        input:focus, textarea:focus, select:focus { 
            border-color: #667eea; 
            outline: none; 
            box-shadow: 0 0 0 3px rgba(102,126,234,0.1); 
        }
        textarea { 
            height: 120px; 
            resize: vertical; 
        }
        
        .submit-btn { 
            background: linear-gradient(135deg, #27ae60, #2ecc71); 
            color: white; 
            border: none; 
            padding: 20px; 
            font-size: 1.2em; 
            border-radius: 15px; 
            cursor: pointer; 
            width: 100%; 
            transition: 0.3s; 
            font-weight: bold; 
        }
        .submit-btn:hover { 
            transform: translateY(-3px); 
            box-shadow: 0 15px 35px rgba(39,174,96,0.4); 
        }
        
        .security-notice { 
            text-align: center; 
            margin-top: 20px; 
            color: #666; 
            font-size: 0.9em; 
        }
        .security-notice i { 
            color: #27ae60; 
            margin-right: 5px; 
        }
    </style>
</head>
<body>
    <div class="container">
        <button class="back-btn" onclick="window.location.href='/product/${product.id}'">
            <i class="fas fa-arrow-left"></i> Back to Product
        </button>
        
        <div class="order-form">
            <h1 class="form-title">Complete Your Order</h1>
            <p class="form-subtitle">Fill in your details and we'll contact you for confirmation</p>
            
            <div class="product-summary">
                <div class="product-name">${product.name}</div>
                <div class="product-price">${product.price}${STORE_CONFIG.currency}</div>
            </div>

            <form id="orderForm">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="name"><i class="fas fa-user"></i> Full Name *</label>
                        <input type="text" id="name" name="name" required placeholder="Enter your full name">
                    </div>
                    
                    <div class="form-group">
                        <label for="phone"><i class="fas fa-phone"></i> Phone Number *</label>
                        <input type="tel" id="phone" name="phone" required placeholder="01XXXXXXXXX">
                    </div>
                    
                    <div class="form-group full">
                        <label for="address"><i class="fas fa-map-marker-alt"></i> Delivery Address *</label>
                        <textarea id="address" name="address" required placeholder="Enter your complete delivery address with area, city, and postal code"></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="city"><i class="fas fa-city"></i> City *</label>
                        <input type="text" id="city" name="city" required placeholder="Your city">
                    </div>
                    
                    <div class="form-group">
                        <label for="area"><i class="fas fa-location-arrow"></i> Area *</label>
                        <input type="text" id="area" name="area" required placeholder="Your area">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="notes"><i class="fas fa-sticky-note"></i> Additional Notes (Optional)</label>
                    <textarea id="notes" name="notes" placeholder="Any special instructions for delivery..."></textarea>
                </div>
                
                <input type="hidden" name="product" value="${product.name}">
                <input type="hidden" name="price" value="${product.price}">
                <input type="hidden" name="productId" value="${product.id}">
                
                <button type="submit" class="submit-btn">
                    <i class="fas fa-paper-plane"></i> Submit Order & Wait for Call
                </button>
                
                <p class="security-notice">
                    <i class="fas fa-shield-alt"></i> Your information is secure. We will call you within 30 minutes to confirm your order.
                </p>
            </form>
        </div>
    </div>

    <script>
        document.getElementById('orderForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            
            // Show loading
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            submitBtn.disabled = true;
            
            try {
                const formData = new FormData(this);
                const response = await fetch('/submit-order', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(Object.fromEntries(formData))
                });
                
                const result = await response.json();
                
                if (result.success) {
                    // Show success message
                    submitBtn.innerHTML = '<i class="fas fa-check"></i> Order Submitted!';
                    submitBtn.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
                    
                    // Show success alert
                    alert('🎉 Order Submitted Successfully!\\\\n\\\\nWe have received your order. Our team will call you within 30 minutes to confirm and process your order.\\\\n\\\\nThank you for choosing ${STORE_CONFIG.storeName}!');
                    
                    // Redirect to home after 3 seconds
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 3000);
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                alert('❌ Error: ' + error.message);
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    </script>
</body>
</html>
  `);
});

// API endpoint to handle orders
app.post('/submit-order', (req, res) => {
  if (STORE_CONFIG.storeStatus === "closed") {
    return res.json({
      success: false,
      message: 'Store is currently closed. Please try again later.'
    });
  }

  const { name, phone, address, city, area, product, price, notes, productId } = req.body;
  
  // Generate order ID
  const orderId = 'ORD' + Date.now();
  
  // Store order temporarily
  const orderData = {
    orderId,
    name,
    phone, 
    address: `${address}, ${area}, ${city}`,
    product,
    price: price + STORE_CONFIG.currency,
    productId: parseInt(productId),
    notes: notes || 'No additional notes',
    timestamp: new Date().toISOString()
  };
  
  pendingOrders.set(orderId, orderData);
  
  // Log the order details
  console.log('🛒 NEW ORDER RECEIVED:');
  console.log('══════════════════════════════════════');
  console.log('📦 Order ID:', orderId);
  console.log('👤 Customer:', name);
  console.log('📞 Phone:', phone);
  console.log('📍 Address:', `${address}, ${area}, ${city}`);
  console.log('🛍️ Product:', product);
  console.log('💰 Price:', price + STORE_CONFIG.currency);
  console.log('📝 Notes:', notes || 'None');
  console.log('⏰ Time:', new Date().toLocaleString());
  console.log('══════════════════════════════════════');
  
  // Send order to admin thread
  sendOrderToAdmin(orderData);
  
  res.json({
    success: true,
    message: 'Order received successfully! Our team will call you within 30 minutes to confirm your order.',
    orderId: orderId,
    nextStep: 'Wait for phone call confirmation'
  });
});

// Admin panel to manage store (optional)
app.get('/admin', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Store Admin</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .admin-panel { max-width: 600px; margin: 0 auto; }
        .status-badge { padding: 10px 20px; border-radius: 20px; color: white; font-weight: bold; }
        .status-open { background: #27ae60; }
        .status-closed { background: #e74c3c; }
        button { padding: 10px 20px; margin: 5px; border: none; border-radius: 5px; cursor: pointer; }
        .btn-open { background: #27ae60; color: white; }
        .btn-close { background: #e74c3c; color: white; }
    </style>
</head>
<body>
    <div class="admin-panel">
        <h1>Store Admin Panel</h1>
        <p>Current Status: 
            <span class="status-badge ${STORE_CONFIG.storeStatus === 'open' ? 'status-open' : 'status-closed'}">
                ${STORE_CONFIG.storeStatus.toUpperCase()}
            </span>
        </p>
        <p>Admin Thread ID: ${STORE_CONFIG.adminThreadId}</p>
        <button class="btn-open" onclick="updateStatus('open')">Open Store</button>
        <button class="btn-close" onclick="updateStatus('closed')">Close Store</button>
        
        <h3>Pending Orders: ${pendingOrders.size}</h3>
        <div id="ordersList">
            ${Array.from(pendingOrders.values()).map(order => `
                <div style="border: 1px solid #ddd; padding: 10px; margin: 10px 0;">
                    <strong>${order.orderId}</strong> - ${order.name} - ${order.phone}
                </div>
            `).join('')}
        </div>
    </div>

    <script>
        function updateStatus(status) {
            fetch('/admin/status', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ status: status })
            }).then(() => location.reload());
        }
    </script>
</body>
</html>
  `);
});

// API to update store status
app.post('/admin/status', (req, res) => {
  const { status } = req.body;
  if (status === 'open' || status === 'closed') {
    STORE_CONFIG.storeStatus = status;
    res.json({ success: true, status: status });
  } else {
    res.json({ success: false, message: 'Invalid status' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🛒 ${STORE_CONFIG.storeName} e-commerce website running on port ${PORT}`);
  console.log(`📍 Visit: http://localhost:${PORT}`);
  console.log(`🛍️ Store Status: ${STORE_CONFIG.storeStatus}`);
  console.log(`📞 Admin Thread: ${STORE_CONFIG.adminThreadId}`);
});

// Start the bot
function startProject() { 
  const child = spawn("node", ["Goat.js"], { 
    cwd: __dirname, 
    stdio: "inherit", 
    shell: true 
  });
}

startProject();
