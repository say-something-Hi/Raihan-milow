/**
 * Dhaka Market - Premium Hair Trimmer Store
 * All-in-one file for Render deployment
 */

const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Store Configuration
const STORE_CONFIG = {
  storeName: "Dhaka Market",
  storeTagline: "Premium Hair Trimmer - Best Quality Guaranteed", 
  currency: "৳",
  adminThreadId: "1843705779576417",
  storeStatus: "open",
  phone: "+8801330513726",
  email: "mailraihanpremium@gmail.com",
  admin: {
    username: "hiraihan",
    password: "raihan55555"
  }
};

// Product data
const trimmerProduct = {
  id: 1,
  name: "3 IN 1 Hair Trimmer Machine for Men & Women",
  price: 580,
  originalPrice: 880,
  discount: 34,
  images: [
    "https://i.imgur.com/nun51uF.jpeg",
    "https://i.imgur.com/B6yvpAz.jpeg", 
    "https://i.imgur.com/mULwWC3.jpeg"
  ],
  category: "trimmer",
  brand: "Premium Quality",
  stock: 45,
  rating: "4.5",
  reviews: 128,
  description: "Professional 3 IN 1 Hair Trimmer Machine for Men & Women. Perfect for hair cutting, trimming, and styling. Waterproof design with stainless steel blades for long-lasting performance.",
  features: [
    "3 IN 1 Multifunctional Use",
    "Waterproof Design", 
    "Stainless Steel Blades",
    "2 Hours Continuous Use",
    "USB Rechargeable",
    "1 Year Warranty"
  ]
};

// Simple data storage
let orders = [];
let visitors = 0;
let orderIdCounter = 1;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'trimmer-secret-key-2024-render-safe',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Render-এ false রাখুন
}));

// Visitor counter
app.use((req, res, next) => {
  visitors++;
  next();
});

// Authentication middleware
function requireAuth(req, res, next) {
  if (req.session.isAuthenticated) {
    next();
  } else {
    res.redirect('/admin/login');
  }
}

// Homepage Route
app.get('/', (req, res) => {
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
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #ffffff; color: #333; line-height: 1.6; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 15px; }
        
        .header { background: #2c3e50; color: white; padding: 15px 0; position: fixed; width: 100%; top: 0; z-index: 1000; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header-content { display: flex; justify-content: space-between; align-items: center; }
        .logo { font-size: 1.8em; font-weight: bold; color: white; text-decoration: none; display: flex; align-items: center; gap: 10px; }
        .nav { display: flex; gap: 25px; }
        .nav a { color: white; text-decoration: none; font-weight: 500; }
        
        .hero { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 120px 0 80px; text-align: center; margin-top: 70px; }
        .hero h1 { font-size: 3em; margin-bottom: 20px; font-weight: 700; }
        .hero p { font-size: 1.3em; margin-bottom: 30px; opacity: 0.9; max-width: 600px; margin-left: auto; margin-right: auto; }
        .cta-button { background: #e74c3c; color: white; padding: 15px 40px; border: none; border-radius: 50px; font-size: 1.2em; cursor: pointer; text-decoration: none; display: inline-block; transition: all 0.3s ease; font-weight: 600; }
        .cta-button:hover { background: #c0392b; transform: translateY(-3px); box-shadow: 0 10px 25px rgba(231, 76, 60, 0.3); }
        
        .product-section { padding: 80px 0; background: #f8f9fa; }
        .section-title { text-align: center; font-size: 2.5em; margin-bottom: 50px; color: #2c3e50; font-weight: 700; }
        .product-container { display: grid; grid-template-columns: 1fr 1fr; gap: 50px; align-items: center; }
        
        .image-slider { position: relative; background: white; border-radius: 15px; padding: 20px; box-shadow: 0 15px 35px rgba(0,0,0,0.1); }
        .slider-container { position: relative; overflow: hidden; border-radius: 10px; height: 400px; }
        .slider { display: flex; transition: transform 0.5s ease-in-out; height: 100%; }
        .slide { min-width: 100%; height: 100%; }
        .slide img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .slider-nav { display: flex; justify-content: center; margin-top: 20px; gap: 10px; }
        .slider-dot { width: 12px; height: 12px; border-radius: 50%; background: #ddd; cursor: pointer; transition: background 0.3s; }
        .slider-dot.active { background: #3498db; }
        
        .product-info { background: white; padding: 40px; border-radius: 15px; box-shadow: 0 15px 35px rgba(0,0,0,0.1); }
        .product-title { font-size: 2em; margin-bottom: 15px; color: #2c3e50; font-weight: 700; }
        .product-price { display: flex; align-items: center; gap: 15px; margin-bottom: 20px; }
        .current-price { font-size: 2.2em; color: #e74c3c; font-weight: 700; }
        .original-price { font-size: 1.5em; color: #7f8c8d; text-decoration: line-through; }
        .discount-badge { background: #e74c3c; color: white; padding: 5px 15px; border-radius: 20px; font-size: 1em; font-weight: 600; }
        .product-rating { display: flex; align-items: center; gap: 10px; margin-bottom: 25px; color: #f39c12; }
        .product-description { color: #5d6d7e; line-height: 1.8; margin-bottom: 30px; font-size: 1.1em; }
        .features-list { margin-bottom: 30px; }
        .feature-item { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; color: #27ae60; }
        .buy-now-btn { background: #27ae60; color: white; border: none; padding: 18px 40px; font-size: 1.2em; border-radius: 50px; cursor: pointer; width: 100%; font-weight: 600; transition: all 0.3s ease; }
        .buy-now-btn:hover { background: #219a52; transform: translateY(-3px); box-shadow: 0 10px 25px rgba(39, 174, 96, 0.3); }
        
        .features-section { padding: 80px 0; background: white; }
        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 30px; }
        .feature-card { text-align: center; padding: 40px 20px; background: #f8f9fa; border-radius: 10px; transition: transform 0.3s ease; }
        .feature-card:hover { transform: translateY(-5px); }
        .feature-icon { font-size: 3em; color: #3498db; margin-bottom: 20px; }
        
        .footer { background: #2c3e50; color: white; padding: 50px 0 20px; text-align: center; }
        
        @media (max-width: 992px) { .product-container { grid-template-columns: 1fr; } }
        @media (max-width: 768px) { 
            .header-content { flex-direction: column; gap: 15px; }
            .nav { flex-wrap: wrap; justify-content: center; gap: 15px; }
            .hero { padding: 100px 0 60px; margin-top: 130px; }
            .hero h1 { font-size: 2.2em; }
            .product-info { padding: 30px 20px; }
            .slider-container { height: 300px; }
        }
    </style>
</head>
<body>
    <header class="header">
        <div class="container">
            <div class="header-content">
                <a href="/" class="logo"><i class="fas fa-store"></i> ${STORE_CONFIG.storeName}</a>
                <nav class="nav">
                    <a href="/">Home</a>
                    <a href="#product">Product</a>
                    <a href="#features">Features</a>
                    <a href="/admin" target="_blank">Admin</a>
                </nav>
            </div>
        </div>
    </header>

    <section class="hero">
        <div class="container">
            <h1>Premium Hair Trimmer</h1>
            <p>${STORE_CONFIG.storeTagline} - Professional 3 IN 1 Trimmer for Men & Women</p>
            <a href="#product" class="cta-button"><i class="fas fa-shopping-cart"></i> Order Now - ${trimmerProduct.price}${STORE_CONFIG.currency}</a>
        </div>
    </section>

    <section class="product-section" id="product">
        <div class="container">
            <h2 class="section-title">Our Premium Trimmer</h2>
            <div class="product-container">
                <div class="image-slider">
                    <div class="slider-container">
                        <div class="slider" id="imageSlider">
                            ${trimmerProduct.images.map(img => `
                                <div class="slide">
                                    <img src="${img}" alt="Trimmer Image" loading="lazy">
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="slider-nav" id="sliderNav">
                        ${trimmerProduct.images.map((_, index) => `
                            <div class="slider-dot ${index === 0 ? 'active' : ''}" data-index="${index}"></div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="product-info">
                    <h1 class="product-title">${trimmerProduct.name}</h1>
                    <div class="product-price">
                        <span class="current-price">${trimmerProduct.price}${STORE_CONFIG.currency}</span>
                        <span class="original-price">${trimmerProduct.originalPrice}${STORE_CONFIG.currency}</span>
                        <span class="discount-badge">-${trimmerProduct.discount}%</span>
                    </div>
                    <div class="product-rating">
                        ${'★'.repeat(4)}☆ (${trimmerProduct.rating}) • ${trimmerProduct.reviews} Reviews
                    </div>
                    <p class="product-description">${trimmerProduct.description}</p>
                    <div class="features-list">
                        ${trimmerProduct.features.map(feature => `
                            <div class="feature-item"><i class="fas fa-check-circle"></i><span>${feature}</span></div>
                        `).join('')}
                    </div>
                    <button class="buy-now-btn" onclick="window.location.href='/order'"><i class="fas fa-bolt"></i> Buy Now - ${trimmerProduct.price}${STORE_CONFIG.currency}</button>
                </div>
            </div>
        </div>
    </section>

    <section class="features-section" id="features">
        <div class="container">
            <h2 class="section-title">Why Choose Our Trimmer?</h2>
            <div class="features-grid">
                <div class="feature-card"><div class="feature-icon">💧</div><h3>Waterproof</h3><p>100% waterproof design for easy cleaning and wet use</p></div>
                <div class="feature-card"><div class="feature-icon">⚡</div><h3>Fast Charging</h3><p>2 hours charging for 2 hours continuous usage</p></div>
                <div class="feature-card"><div class="feature-icon">🔋</div><h3>Long Battery</h3><p>2000mAh lithium battery for extended use</p></div>
                <div class="feature-card"><div class="feature-icon">🛡️</div><h3>1 Year Warranty</h3><p>Complete 1 year warranty on all parts</p></div>
            </div>
        </div>
    </section>

    <footer class="footer">
        <div class="container">
            <h3>${STORE_CONFIG.storeName}</h3>
            <p>${STORE_CONFIG.storeTagline}</p>
            <p>📞 ${STORE_CONFIG.phone} | ✉️ ${STORE_CONFIG.email}</p>
            <p>&copy; 2024 ${STORE_CONFIG.storeName}. All rights reserved.</p>
        </div>
    </footer>

    <script>
        let currentSlide = 0;
        const slides = document.querySelectorAll('.slide');
        const dots = document.querySelectorAll('.slider-dot');
        const slider = document.getElementById('imageSlider');
        let slideInterval;

        function showSlide(index) {
            if (!slider || slides.length === 0) return;
            if (index >= slides.length) index = 0;
            if (index < 0) index = slides.length - 1;
            currentSlide = index;
            slider.style.transform = \`translateX(-\${currentSlide * 100}%)\`;
            dots.forEach((dot, i) => dot.classList.toggle('active', i === currentSlide));
        }
        
        function startSlideShow() {
            stopSlideShow();
            slideInterval = setInterval(() => showSlide(currentSlide + 1), 3000);
        }
        
        function stopSlideShow() { clearInterval(slideInterval); }

        startSlideShow();
        
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => { showSlide(index); startSlideShow(); });
        });
        
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                try {
                    const target = document.querySelector(this.getAttribute('href'));
                    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } catch(e) { console.warn('Error scrolling to anchor:', e); }
            });
        });
    </script>
</body>
</html>
  `);
});

// Order Page
app.get('/order', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order ${trimmerProduct.name} - ${STORE_CONFIG.storeName}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; }
        .back-btn { background: #7f8c8d; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-bottom: 20px; }
        .order-form { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        .form-title { text-align: center; font-size: 1.8em; margin-bottom: 20px; color: #2c3e50; }
        .product-summary { background: #ecf0f1; padding: 20px; border-radius: 5px; margin-bottom: 25px; }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 5px; font-weight: 600; }
        input, textarea, select { width: 100%; padding: 12px; border: 1px solid #bdc3c7; border-radius: 5px; font-size: 1em; }
        textarea { height: 80px; resize: vertical; }
        .submit-btn { background: #27ae60; color: white; border: none; padding: 15px; border-radius: 5px; cursor: pointer; width: 100%; font-size: 1.1em; }
        .submit-btn:disabled { background: #95a5a6; cursor: not-allowed; }
        
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: none; align-items: center; justify-content: center; z-index: 2000; }
        .modal-box { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); text-align: center; max-width: 90%; width: 400px; }
        .modal-icon { font-size: 3em; margin-bottom: 20px; }
        .modal-icon.success { color: #27ae60; }
        .modal-icon.error { color: #e74c3c; }
        .modal-message { font-size: 1.1em; margin-bottom: 25px; line-height: 1.6; }
        .modal-button { background: #3498db; color: white; border: none; padding: 12px 30px; border-radius: 5px; cursor: pointer; font-size: 1em; }
    </style>
</head>
<body>
    <div class="container">
        <button class="back-btn" onclick="window.location.href='/'"><i class="fas fa-arrow-left"></i> Back to Home</button>
        
        <div class="order-form">
            <h1 class="form-title">Place Your Order</h1>
            <div class="product-summary">
                <strong>Product:</strong> ${trimmerProduct.name}<br>
                <strong>Price:</strong> ${trimmerProduct.price}${STORE_CONFIG.currency}<br>
                <strong>Brand:</strong> ${trimmerProduct.brand}
            </div>

            <form id="orderForm">
                <div class="form-group"><label for="name"><i class="fas fa-user"></i> Full Name *</label><input type="text" id="name" name="name" required placeholder="Enter your full name"></div>
                <div class="form-group"><label for="phone"><i class="fas fa-phone"></i> Phone Number *</label><input type="tel" id="phone" name="phone" required placeholder="01XXXXXXXXX"></div>
                <div class="form-group"><label for="email"><i class="fas fa-envelope"></i> Email (Optional)</label><input type="email" id="email" name="email" placeholder="your@email.com"></div>
                <div class="form-group"><label for="address"><i class="fas fa-map-marker-alt"></i> Delivery Address *</label><textarea id="address" name="address" required placeholder="Enter your complete delivery address"></textarea></div>
                <div class="form-group"><label for="city"><i class="fas fa-city"></i> City *</label><input type="text" id="city" name="city" required placeholder="Your city"></div>
                <div class="form-group"><label for="area"><i class="fas fa-location-arrow"></i> Area *</label><input type="text" id="area" name="area" required placeholder="Your area"></div>
                <div class="form-group"><label for="quantity"><i class="fas fa-box"></i> Quantity</label><select id="quantity" name="quantity">${[1,2,3,4,5].map(q => `<option value="${q}">${q}</option>`).join('')}</select></div>
                <div class="form-group"><label for="payment"><i class="fas fa-credit-card"></i> Payment Method</label><select id="payment" name="paymentMethod"><option value="Cash on Delivery">Cash on Delivery</option><option value="bKash">bKash</option><option value="Nagad">Nagad</option></select></div>
                <div class="form-group"><label for="notes"><i class="fas fa-sticky-note"></i> Additional Notes</label><textarea id="notes" name="notes" placeholder="Any special instructions..."></textarea></div>
                <input type="hidden" name="product" value="${trimmerProduct.name}">
                <input type="hidden" name="price" value="${trimmerProduct.price}">
                <input type="hidden" name="productId" value="${trimmerProduct.id}">
                <button type="submit" class="submit-btn" id="submitBtn"><i class="fas fa-paper-plane"></i> Submit Order</button>
            </form>
        </div>
    </div>

    <div class="modal-overlay" id="modalOverlay">
        <div class="modal-box">
            <div class="modal-icon" id="modalIcon"></div>
            <p class="modal-message" id="modalMessage"></p>
            <button class="modal-button" id="modalButton">OK</button>
        </div>
    </div>

    <script>
        const form = document.getElementById('orderForm');
        const submitBtn = document.getElementById('submitBtn');
        const modalOverlay = document.getElementById('modalOverlay');
        const modalIcon = document.getElementById('modalIcon');
        const modalMessage = document.getElementById('modalMessage');
        const modalButton = document.getElementById('modalButton');

        let isSuccess = false;

        function showModal(success, message) {
            isSuccess = success;
            modalMessage.innerHTML = message.replace(/\\n/g, '<br>');
            if (success) {
                modalIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
                modalIcon.className = 'modal-icon success';
            } else {
                modalIcon.innerHTML = '<i class="fas fa-times-circle"></i>';
                modalIcon.className = 'modal-icon error';
            }
            modalOverlay.style.display = 'flex';
        }
        
        modalButton.addEventListener('click', () => {
            modalOverlay.style.display = 'none';
            if (isSuccess) window.location.href = '/';
        });

        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            submitBtn.disabled = true;
            
            try {
                const formData = new FormData(this);
                const response = await fetch('/submit-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(Object.fromEntries(formData))
                });
                const result = await response.json();
                if (result.success) {
                    showModal(true, '✅ Order Submitted Successfully!\\n\\nWe will call you within 30 minutes to confirm your order.\\n\\nOrder ID: ' + result.orderId);
                } else throw new Error(result.message || 'Unknown error occurred');
            } catch (error) {
                showModal(false, '❌ Error: ' + error.message);
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    </script>
</body>
</html>
  `);
});

// Order submission API
app.post('/submit-order', (req, res) => {
  try {
    const { name, phone, email, address, city, area, product, price, quantity, paymentMethod, notes } = req.body;

    if (!name || !phone || !address || !city || !area) {
        return res.status(400).json({ success: false, message: 'Missing required fields. Please fill all * fields.' });
    }

    const orderId = 'DM' + Date.now();
    const orderData = {
      id: orderIdCounter++,
      orderId,
      name,
      phone,
      email: email || 'Not provided',
      address: address,
      area: area,
      city: city,
      product,
      price: price + STORE_CONFIG.currency,
      quantity: quantity || 1,
      paymentMethod: paymentMethod || 'Cash on Delivery',
      notes: notes || 'No additional notes',
      timestamp: new Date().toISOString(),
      status: 'pending'
    };
    
    orders.push(orderData);
    
    // Log order to console (for Render)
    console.log('🛍️ NEW ORDER:', orderData);
    
    res.json({
      success: true,
      message: 'Order received successfully! Our team will call you within 30 minutes to confirm your order.',
      orderId: orderId
    });

  } catch (error) {
    console.error("Error in /submit-order:", error);
    res.status(500).json({ success: false, message: "An internal server error occurred." });
  }
});

// Admin Login Page
app.get('/admin/login', (req, res) => {
  if (req.session.isAuthenticated) {
    return res.redirect('/admin');
  }
  
  res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Admin Login - ${STORE_CONFIG.storeName}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .login-container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.1);
            width: 100%;
            max-width: 400px;
        }
        .login-title {
            text-align: center;
            color: #2c3e50;
            margin-bottom: 30px;
            font-size: 1.8em;
        }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 5px; font-weight: 600; color: #2c3e50; }
        input { width: 100%; padding: 12px; border: 1px solid #bdc3c7; border-radius: 5px; font-size: 1em; }
        .login-btn {
            background: #3498db;
            color: white;
            border: none;
            padding: 12px;
            border-radius: 5px;
            cursor: pointer;
            width: 100%;
            font-size: 1.1em;
            font-weight: 600;
        }
        .error { color: #e74c3c; text-align: center; margin-top: 15px; min-height: 1.2em; }
    </style>
</head>
<body>
    <div class="login-container">
        <h1 class="login-title"><i class="fas fa-lock"></i> Admin Login</h1>
        <form id="loginForm">
            <div class="form-group">
                <label for="username"><i class="fas fa-user"></i> Username</label>
                <input type="text" id="username" name="username" required>
            </div>
            <div class="form-group">
                <label for="password"><i class="fas fa-key"></i> Password</label>
                <input type="password" id="password" name="password" required>
            </div>
            <button type="submit" class="login-btn"><i class="fas fa-sign-in-alt"></i> Login</button>
        </form>
        <div id="errorMessage" class="error"></div>
    </div>

    <script>
        document.getElementById('loginForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const errorDiv = document.getElementById('errorMessage');
            errorDiv.textContent = '';
            
            try {
                const formData = new FormData(this);
                const response = await fetch('/admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(Object.fromEntries(formData))
                });
                
                const result = await response.json();
                
                if (result.success) {
                    window.location.href = '/admin';
                } else {
                    errorDiv.textContent = result.message || 'Login failed';
                }
            } catch (error) {
                errorDiv.textContent = 'An error occurred. Please try again.';
            }
        });
    </script>
</body>
</html>
  `);
});

// Admin Login API
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === STORE_CONFIG.admin.username && password === STORE_CONFIG.admin.password) {
    req.session.isAuthenticated = true;
    res.json({ success: true });
  } else {
    res.json({ success: false, message: 'Invalid username or password' });
  }
});

// Admin Logout
app.get('/admin/logout', (req, res) => {
  req.session.destroy(err => {
    res.redirect('/admin/login');
  });
});

// Admin Panel
app.get('/admin', requireAuth, (req, res) => {
  const totalSales = orders.reduce((sum, order) => {
      const price = parseFloat(order.price) || 0;
      const quantity = parseInt(order.quantity) || 1;
      return sum + (price * quantity);
  }, 0);
  
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  
  res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Admin Panel - ${STORE_CONFIG.storeName}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        
        .header { 
            background: #2c3e50; 
            color: white; 
            padding: 20px; 
            border-radius: 10px; 
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 15px;
        }
        .header h1 { font-size: 1.8em; }
        .header-info { display: flex; gap: 15px; align-items: center; flex-wrap: wrap; }
        .logout-btn { 
            background: #e74c3c; 
            color: white; 
            border: none; 
            padding: 10px 20px; 
            border-radius: 5px; 
            cursor: pointer;
            text-decoration: none;
            font-size: 1em;
            display: inline-flex;
            align-items: center;
            gap: 5px;
        }

        .stats { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 20px; 
            margin-bottom: 30px; 
        }
        .stat-card { 
            background: white; 
            padding: 25px; 
            border-radius: 10px; 
            box-shadow: 0 5px 15px rgba(0,0,0,0.1); 
            text-align: center; 
        }
        .stat-number { font-size: 2.5em; font-weight: bold; }
        .stat-card:nth-child(1) .stat-number { color: #3498db; }
        .stat-card:nth-child(2) .stat-number { color: #e74c3c; }
        .stat-card:nth-child(3) .stat-number { color: #27ae60; }
        .stat-card:nth-child(4) .stat-number { color: #f39c12; }
        .stat-label { color: #555; }
        
        .orders-section {
            background: white;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .section-header {
            padding: 20px;
            background: #34495e;
            color: white;
        }
        
        .orders-table-container { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; min-width: 800px; }
        th, td { padding: 15px; text-align: left; border-bottom: 1px solid #ecf0f1; }
        th { background: #34495e; color: white; }
        
        .status-badge {
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 0.8em;
            font-weight: 600;
        }
        .status-pending { background: #fff3cd; color: #856404; }
        .status-confirmed { background: #d1ecf1; color: #0c5460; }
        .status-completed { background: #d1f7ff; color: #0066cc; }
        
        .action-btn {
            padding: 6px 12px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.8em;
            margin: 2px;
        }
        .btn-delete { background: #e74c3c; color: white; }
        
        .no-orders { text-align: center; padding: 50px; color: #7f8c8d; }
        .no-orders i { font-size: 3em; margin-bottom: 20px; }
        
        .footer-info { margin-top: 30px; text-align: center; color: #7f8c8d; font-size: 0.9em; }
        
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }
        .modal-content {
            background: white;
            padding: 30px;
            border-radius: 10px;
            max-width: 500px;
            width: 90%;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div>
                <h1><i class="fas fa-cog"></i> Admin Panel</h1>
                <p>${STORE_CONFIG.storeName}</p>
            </div>
            <div class="header-info">
                <a class="logout-btn" href="/admin/logout"><i class="fas fa-sign-out-alt"></i> Logout</a>
            </div>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${orders.length}</div>
                <div class="stat-label">Total Orders</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${visitors}</div>
                <div class="stat-label">Website Visitors</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${totalSales}${STORE_CONFIG.currency}</div>
                <div class="stat-label">Total Sales</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${pendingOrders}</div>
                <div class="stat-label">Pending Orders</div>
            </div>
        </div>
        
        <div class="orders-section">
            <div class="section-header">
                <h2><i class="fas fa-shopping-cart"></i> All Orders (${orders.length})</h2>
            </div>
            
            <div class="orders-table-container">
                ${orders.length > 0 ? `
                    <table>
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Phone</th>
                                <th>Product</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Time</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${orders.slice().reverse().map(order => `
                                <tr>
                                    <td><strong>${order.orderId}</strong></td>
                                    <td>${order.name}</td>
                                    <td>${order.phone}</td>
                                    <td>${order.product} (Qty: ${order.quantity})</td>
                                    <td>${order.price}</td>
                                    <td>
                                        <select class="status-select" data-order-id="${order.orderId}">
                                            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                                            <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                                            <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                                        </select>
                                    </td>
                                    <td>${new Date(order.timestamp).toLocaleString()}</td>
                                    <td>
                                        <button class="action-btn btn-delete" onclick="deleteOrder('${order.orderId}')" title="Delete Order">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : `
                    <div class="no-orders">
                        <i class="fas fa-shopping-cart"></i>
                        <h3>No orders yet</h3>
                        <p>Orders will appear here when customers place orders</p>
                    </div>
                `}
            </div>
        </div>
        
        <div class="footer-info">
            <p>📞 Contact: ${STORE_CONFIG.phone} | 📧 Email: ${STORE_CONFIG.email}</p>
            <p>🛒 Store: ${STORE_CONFIG.storeName}</p>
        </div>
    </div>

    <div class="modal" id="messageModal">
        <div class="modal-content">
            <h3 id="modalTitle">Message</h3>
            <p id="modalMessage"></p>
            <button onclick="closeModal()" style="margin-top: 20px; padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">OK</button>
        </div>
    </div>

    <script>
        // Status update
        document.querySelectorAll('.status-select').forEach(select => {
            select.addEventListener('change', function() {
                const orderId = this.dataset.orderId;
                const status = this.value;
                
                // Simple status update - in production you would send to server
                showMessage('Status updated to: ' + status);
            });
        });
        
        // Delete order
        function deleteOrder(orderId) {
            if (confirm('Are you sure you want to delete this order?')) {
                showMessage('Order deleted successfully');
                // Remove row from table
                document.querySelector(\`tr:has(td strong:contains("\${orderId}"))\`)?.remove();
            }
        }
        
        // Modal functions
        function showMessage(message) {
            const modal = document.getElementById('messageModal');
            const modalTitle = document.getElementById('modalTitle');
            const modalMsg = document.getElementById('modalMessage');
            
            modalTitle.textContent = 'Success';
            modalTitle.style.color = '#27ae60';
            modalMsg.textContent = message;
            modal.style.display = 'flex';
        }
        
        function closeModal() {
            document.getElementById('messageModal').style.display = 'none';
        }
        
        // Close modal on outside click
        window.addEventListener('click', function(event) {
            const modal = document.getElementById('messageModal');
            if (event.target === modal) {
                closeModal();
            }
        });
    </script>
</body>
</html>
  `);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`=====================================================`);
  console.log(`🛒 ${STORE_CONFIG.storeName} running on port ${PORT}`);
  console.log(`📍 Live URL: http://localhost:${PORT}`);
  console.log(`=====================================================`);
  console.log(`🔐 Admin Panel: http://localhost:${PORT}/admin`);
  console.log(`   👤 Username: ${STORE_CONFIG.admin.username}`);
  console.log(`   🔑 Password: ${STORE_CONFIG.admin.password}`);
  console.log(`=====================================================`);
  console.log(`📊 Initial Orders: ${orders.length}`);
  console.log(`🚀 Server started successfully!`);
  console.log(`=====================================================`);
});
