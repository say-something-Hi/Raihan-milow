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
const session = require('express-session');
const fs = require('fs');
const { spawn } = require('child_process');

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

// Single trimmer product with multiple images
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
  ],
  status: "available"
};

let orders = []; // In-memory orders for the current session
let orderIdCounter = 1;
let visitors = 0;
let botProcess = null;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'trimmer-secret-key-2024',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
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

// Start Bot Function
function startBot() {
  try {
    console.log('🤖 Starting Goat-Bot V2...');
    botProcess = spawn('node', ['Goat.js'], {
      cwd: __dirname,
      stdio: 'inherit',
      shell: true
    });

    botProcess.on('error', (error) => {
      console.log('❌ Bot failed to start:', error.message);
    });

    botProcess.on('exit', (code) => {
      console.log(`🤖 Bot process exited with code ${code}`);
      botProcess = null;
    });

    return true;
  } catch (error) {
    console.log('❌ Bot startup error:', error.message);
    return false;
  }
}

// SIMPLE and RELIABLE Order Notification System
function sendToMessenger(orderData) {
  const message = `
🛍️ **NEW ORDER - ${STORE_CONFIG.storeName}** 🛍️

📦 **Order Details:**
Order ID: ${orderData.orderId}
Product: ${orderData.product}
Price: ${orderData.price}
Quantity: ${orderData.quantity}
Payment: ${orderData.paymentMethod}

👤 **Customer Information:**
Name: ${orderData.name}
Phone: ${orderData.phone}
Email: ${orderData.email}
Address: ${orderData.address}

📝 **Additional Info:**
Area: ${orderData.area}
City: ${orderData.city}
Notes: ${orderData.notes}
Order Time: ${new Date(orderData.timestamp).toLocaleString()}

📞 **ACTION REQUIRED:**
Please call the customer within 30 minutes to confirm this order!
  `;

  // Save order to a simple text file for manual checking
  const orderText = `
=================================
NEW ORDER - ${new Date().toLocaleString()}
=================================
Order ID: ${orderData.orderId}
Product: ${orderData.product}
Price: ${orderData.price}
Quantity: ${orderData.quantity}
Payment: ${orderData.paymentMethod}

Customer: ${orderData.name}
Phone: ${orderData.phone}
Email: ${orderData.email}
Address: ${orderData.address}

Area: ${orderData.area}
City: ${orderData.city}
Notes: ${orderData.notes}
=================================
  `;

  // Save to orders.txt file
  fs.appendFileSync('orders.txt', orderText, 'utf8');
  
  // Also save to JSON for admin panel
  const ordersFile = 'orders.json';
  let allOrders = [];
  
  try {
    if (fs.existsSync(ordersFile)) {
      allOrders = JSON.parse(fs.readFileSync(ordersFile, 'utf8'));
    }
  } catch (e) {
    console.log('Creating new orders file');
  }
  
  allOrders.push(orderData);
  fs.writeFileSync(ordersFile, JSON.stringify(allOrders, null, 2));
  
  console.log('✅ Order saved to files successfully!');
  console.log('📁 Check orders.txt and orders.json for order details');
  console.log('📞 Please manually contact the customer:', orderData.phone);
}

// Routes
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
        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
        }
        
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: #ffffff;
            color: #333;
            line-height: 1.6;
        }
        
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            padding: 0 15px; 
        }
        
        /* Header */
        .header { 
            background: #2c3e50; 
            color: white; 
            padding: 15px 0; 
            position: fixed;
            width: 100%;
            top: 0;
            z-index: 1000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .header-content { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
        }
        
        .logo { 
            font-size: 1.8em; 
            font-weight: bold; 
            color: white; 
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .nav { 
            display: flex; 
            gap: 25px; 
        }
        
        .nav a { 
            color: white; 
            text-decoration: none;
            font-weight: 500;
        }
        
        /* Hero Section */
        .hero {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 120px 0 80px;
            text-align: center;
            margin-top: 70px;
        }
        
        .hero h1 { 
            font-size: 3em; 
            margin-bottom: 20px; 
            font-weight: 700;
        }
        
        .hero p { 
            font-size: 1.3em; 
            margin-bottom: 30px; 
            opacity: 0.9;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        }
        
        .cta-button {
            background: #e74c3c;
            color: white;
            padding: 15px 40px;
            border: none;
            border-radius: 50px;
            font-size: 1.2em;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: all 0.3s ease;
            font-weight: 600;
        }
        
        .cta-button:hover {
            background: #c0392b;
            transform: translateY(-3px);
            box-shadow: 0 10px 25px rgba(231, 76, 60, 0.3);
        }
        
        /* Product Section */
        .product-section {
            padding: 80px 0;
            background: #f8f9fa;
        }
        
        .section-title {
            text-align: center;
            font-size: 2.5em;
            margin-bottom: 50px;
            color: #2c3e50;
            font-weight: 700;
        }
        
        .product-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 50px;
            align-items: center;
        }
        
        /* Image Slider */
        .image-slider {
            position: relative;
            background: white;
            border-radius: 15px;
            padding: 20px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.1);
        }
        
        .slider-container {
            position: relative;
            overflow: hidden;
            border-radius: 10px;
        }
        
        .slider {
            display: flex;
            transition: transform 0.5s ease-in-out;
        }
        
        .slide {
            min-width: 100%;
            height: 400px;
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            background-color: #f8f9fa;
        }
        
        .slider-nav {
            display: flex;
            justify-content: center;
            margin-top: 20px;
            gap: 10px;
        }
        
        .slider-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #ddd;
            cursor: pointer;
            transition: background 0.3s;
        }
        
        .slider-dot.active {
            background: #3498db;
        }
        
        /* Product Info */
        .product-info {
            background: white;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.1);
        }
        
        .product-title {
            font-size: 2em;
            margin-bottom: 15px;
            color: #2c3e50;
            font-weight: 700;
        }
        
        .product-price {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .current-price {
            font-size: 2.2em;
            color: #e74c3c;
            font-weight: 700;
        }
        
        .original-price {
            font-size: 1.5em;
            color: #7f8c8d;
            text-decoration: line-through;
        }
        
        .discount-badge {
            background: #e74c3c;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 1em;
            font-weight: 600;
        }
        
        .product-rating {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 25px;
            color: #f39c12;
        }
        
        .product-description {
            color: #5d6d7e;
            line-height: 1.8;
            margin-bottom: 30px;
            font-size: 1.1em;
        }
        
        .features-list {
            margin-bottom: 30px;
        }
        
        .feature-item {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
            color: #27ae60;
        }
        
        .buy-now-btn {
            background: #27ae60;
            color: white;
            border: none;
            padding: 18px 40px;
            font-size: 1.2em;
            border-radius: 50px;
            cursor: pointer;
            width: 100%;
            font-weight: 600;
            transition: all 0.3s ease;
        }
        
        .buy-now-btn:hover {
            background: #219a52;
            transform: translateY(-3px);
            box-shadow: 0 10px 25px rgba(39, 174, 96, 0.3);
        }
        
        /* Features Section */
        .features-section {
            padding: 80px 0;
            background: white;
        }
        
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 30px;
        }
        
        .feature-card {
            text-align: center;
            padding: 40px 20px;
            background: #f8f9fa;
            border-radius: 10px;
            transition: transform 0.3s ease;
        }
        
        .feature-card:hover {
            transform: translateY(-5px);
        }
        
        .feature-icon {
            font-size: 3em;
            color: #3498db;
            margin-bottom: 20px;
        }
        
        /* Footer */
        .footer {
            background: #2c3e50;
            color: white;
            padding: 50px 0 20px;
            text-align: center;
        }
        
        @media (max-width: 768px) {
            .header-content {
                flex-direction: column;
                gap: 15px;
            }
            
            .hero {
                padding: 100px 0 60px;
                margin-top: 120px;
            }
            
            .hero h1 {
                font-size: 2.2em;
            }
            
            .product-container {
                grid-template-columns: 1fr;
                gap: 30px;
            }
            
            .product-info {
                padding: 30px 20px;
            }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <header class="header">
        <div class="container">
            <div class="header-content">
                <a href="/" class="logo">
                    <i class="fas fa-store"></i> ${STORE_CONFIG.storeName}
                </a>
                <nav class="nav">
                    <a href="/">Home</a>
                    <a href="#product">Product</a>
                    <a href="#features">Features</a>
                    <a href="/admin" target="_blank">Admin</a>
                </nav>
            </div>
        </div>
    </header>

    <!-- Hero Section -->
    <section class="hero">
        <div class="container">
            <h1>Premium Hair Trimmer</h1>
            <p>${STORE_CONFIG.storeTagline} - Professional 3 IN 1 Trimmer for Men & Women</p>
            <a href="#product" class="cta-button">
                <i class="fas fa-shopping-cart"></i> Order Now - ${trimmerProduct.price}${STORE_CONFIG.currency}
            </a>
        </div>
    </section>

    <!-- Product Section -->
    <section class="product-section" id="product">
        <div class="container">
            <h2 class="section-title">Our Premium Trimmer</h2>
            <div class="product-container">
                <!-- Image Slider -->
                <div class="image-slider">
                    <div class="slider-container">
                        <div class="slider" id="imageSlider">
                            ${trimmerProduct.images.map(img => `
                                <div class="slide" style="background-image: url('${img}')"></div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="slider-nav" id="sliderNav">
                        ${trimmerProduct.images.map((_, index) => `
                            <div class="slider-dot ${index === 0 ? 'active' : ''}" data-index="${index}"></div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Product Info -->
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
                            <div class="feature-item">
                                <i class="fas fa-check-circle"></i>
                                <span>${feature}</span>
                            </div>
                        `).join('')}
                    </div>
                    
                    <button class="buy-now-btn" onclick="window.location.href='/order'">
                        <i class="fas fa-bolt"></i> Buy Now - ${trimmerProduct.price}${STORE_CONFIG.currency}
                    </button>
                </div>
            </div>
        </div>
    </section>

    <!-- Features Section -->
    <section class="features-section" id="features">
        <div class="container">
            <h2 class="section-title">Why Choose Our Trimmer?</h2>
            <div class="features-grid">
                <div class="feature-card">
                    <div class="feature-icon">💧</div>
                    <h3>Waterproof</h3>
                    <p>100% waterproof design for easy cleaning and wet use</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">⚡</div>
                    <h3>Fast Charging</h3>
                    <p>2 hours charging for 2 hours continuous usage</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">🔋</div>
                    <h3>Long Battery</h3>
                    <p>2000mAh lithium battery for extended use</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">🛡️</div>
                    <h3>1 Year Warranty</h3>
                    <p>Complete 1 year warranty on all parts</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
        <div class="container">
            <h3>${STORE_CONFIG.storeName}</h3>
            <p>${STORE_CONFIG.storeTagline}</p>
            <p>📞 ${STORE_CONFIG.phone} | ✉️ ${STORE_CONFIG.email}</p>
            <p>&copy; 2024 ${STORE_CONFIG.storeName}. All rights reserved.</p>
        </div>
    </footer>

    <script>
        // Image Slider Functionality
        let currentSlide = 0;
        const slides = document.querySelectorAll('.slide');
        const dots = document.querySelectorAll('.slider-dot');
        const slider = document.getElementById('imageSlider');
        
        function showSlide(index) {
            if (index >= slides.length) index = 0;
            if (index < 0) index = slides.length - 1;
            
            currentSlide = index;
            slider.style.transform = \`translateX(-\${currentSlide * 100}%)\`;
            
            // Update dots
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === currentSlide);
            });
        }
        
        // Auto slide every 3 seconds
        setInterval(() => {
            showSlide(currentSlide + 1);
        }, 3000);
        
        // Dot click events
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                showSlide(index);
            });
        });
        
        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    </script>
</body>
</html>
  `);
});

// Order page
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
    </style>
</head>
<body>
    <div class="container">
        <button class="back-btn" onclick="window.location.href='/'">
            <i class="fas fa-arrow-left"></i> Back to Home
        </button>
        
        <div class="order-form">
            <h1 class="form-title">Place Your Order</h1>
            
            <div class="product-summary">
                <strong>Product:</strong> ${trimmerProduct.name}<br>
                <strong>Price:</strong> ${trimmerProduct.price}${STORE_CONFIG.currency}<br>
                <strong>Brand:</strong> ${trimmerProduct.brand}
            </div>

            <form id="orderForm">
                <div class="form-group">
                    <label for="name"><i class="fas fa-user"></i> Full Name *</label>
                    <input type="text" id="name" name="name" required placeholder="Enter your full name">
                </div>
                
                <div class="form-group">
                    <label for="phone"><i class="fas fa-phone"></i> Phone Number *</label>
                    <input type="tel" id="phone" name="phone" required placeholder="01XXXXXXXXX">
                </div>
                
                <div class="form-group">
                    <label for="email"><i class="fas fa-envelope"></i> Email (Optional)</label>
                    <input type="email" id="email" name="email" placeholder="your@email.com">
                </div>
                
                <div class="form-group">
                    <label for="address"><i class="fas fa-map-marker-alt"></i> Delivery Address *</label>
                    <textarea id="address" name="address" required placeholder="Enter your complete delivery address"></textarea>
                </div>
                
                <div class="form-group">
                    <label for="city"><i class="fas fa-city"></i> City *</label>
                    <input type="text" id="city" name="city" required placeholder="Your city">
                </div>
                
                <div class="form-group">
                    <label for="area"><i class="fas fa-location-arrow"></i> Area *</label>
                    <input type="text" id="area" name="area" required placeholder="Your area">
                </div>
                
                <div class="form-group">
                    <label for="quantity"><i class="fas fa-box"></i> Quantity</label>
                    <select id="quantity" name="quantity">
                        ${[1,2,3,4,5].map(q => `<option value="${q}">${q}</option>`).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="payment"><i class="fas fa-credit-card"></i> Payment Method</label>
                    <select id="payment" name="paymentMethod">
                        <option value="Cash on Delivery">Cash on Delivery</option>
                        <option value="bKash">bKash</option>
                        <option value="Nagad">Nagad</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="notes"><i class="fas fa-sticky-note"></i> Additional Notes</label>
                    <textarea id="notes" name="notes" placeholder="Any special instructions..."></textarea>
                </div>
                
                <input type="hidden" name="product" value="${trimmerProduct.name}">
                <input type="hidden" name="price" value="${trimmerProduct.price}">
                <input type="hidden" name="productId" value="${trimmerProduct.id}">
                
                <button type="submit" class="submit-btn">
                    <i class="fas fa-paper-plane"></i> Submit Order
                </button>
            </form>
        </div>
    </div>

    <script>
        document.getElementById('orderForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = this.querySelector('button[type="submit"]');
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
                    // Use a simple alert, as custom modals are not set up
                    alert('✅ Order Submitted Successfully!\\n\\nWe will call you within 30 minutes to confirm your order.\\n\\nOrder ID: ' + result.orderId);
                    window.location.href = '/';
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

// Order submission API
app.post('/submit-order', (req, res) => {
  const { name, phone, email, address, city, area, product, price, quantity, paymentMethod, notes } = req.body;
  
  // Basic validation
  if (!name || !phone || !address || !city || !area) {
    return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
  }
  
  const orderId = 'DM' + Date.now();
  const orderData = {
    orderId,
    name,
    phone,
    email: email || 'Not provided',
    address: `${address}, ${area}, ${city}`, // Combine address fields
    product,
    price: (price * (quantity || 1)) + STORE_CONFIG.currency, // Calculate total price
    quantity: quantity || 1,
    paymentMethod: paymentMethod || 'Cash on Delivery',
    notes: notes || 'No additional notes',
    timestamp: new Date().toISOString(),
    status: 'pending' // Default status
  };
  
  // Add to in-memory array
  orders.push(orderData);
  
  // Send to Messenger (file logger)
  sendToMessenger(orderData);
  
  res.json({
    success: true,
    message: 'Order received successfully! Our team will call you within 30 minutes to confirm your order.',
    orderId: orderId
  });
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
        .error { color: #e74c3c; text-align: center; margin-top: 15px; }
    </style>
</head>
<body>
    <div class="login-container">
        <h1 class="login-title">
            <i class="fas fa-lock"></i> Admin Login
        </h1>
        <form id="loginForm">
            <div class="form-group">
                <label for="username"><i class="fas fa-user"></i> Username</label>
                <input type="text" id="username" name="username" required>
            </div>
            <div class="form-group">
                <label for="password"><i class="fas fa-key"></i> Password</label>
                <input type="password" id="password" name="password" required>
            </div>
            <button type="submit" class="login-btn">
                <i class="fas fa-sign-in-alt"></i> Login
            </button>
        </form>
        <div id="errorMessage" class="error"></div>
    </div>

    <script>
        document.getElementById('loginForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
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
                document.getElementById('errorMessage').textContent = result.message;
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
  req.session.destroy((err) => {
    if (err) {
      console.log('Error destroying session:', err);
    }
    res.redirect('/admin/login');
  });
});

// Admin Panel (Protected)
app.get('/admin', requireAuth, (req, res) => {
  // Load orders from file for persistence
  let fileOrders = [];
  try {
    if (fs.existsSync('orders.json')) {
      fileOrders = JSON.parse(fs.readFileSync('orders.json', 'utf8'));
    }
  } catch (e) {
    console.log('No orders file found or error reading file');
  }

  // Combine in-memory (session) orders with file orders, avoiding duplicates
  const allOrderIds = new Set(fileOrders.map(o => o.orderId));
  const combinedOrders = [
    ...fileOrders,
    ...orders.filter(o => !allOrderIds.has(o.orderId)) // Add only new session orders
  ];
  
  const totalSales = combinedOrders.reduce((sum, order) => {
    // Clean price string like "580৳" to 580
    const price = parseFloat(order.price.replace(STORE_CONFIG.currency, ''));
    return sum + (price || 0);
  }, 0);
  
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
            padding: 20px 30px; 
            border-radius: 10px; 
            margin-bottom: 30px; 
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .header h1 { margin: 0; font-size: 1.8em; }
        .logout-btn {
            background: #e74c3c;
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            text-decoration: none;
            font-weight: 600;
        }
        .logout-btn:hover { background: #c0392b; }

        .stats { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); 
            gap: 20px; 
            margin-bottom: 30px; 
        }
        .stat-card { 
            background: white; 
            padding: 25px; 
            border-radius: 10px; 
            box-shadow: 0 5px 15px rgba(0,0,0,0.05); 
            display: flex;
            align-items: center;
            gap: 20px;
        }
        .stat-card i { 
            font-size: 2.5em; 
            color: #3498db;
        }
        .stat-card .info h3 { 
            font-size: 1.1em; 
            color: #7f8c8d; 
            margin-bottom: 5px; 
            font-weight: 500;
        }
        .stat-card .info p { 
            font-size: 1.8em; 
            font-weight: 700; 
            color: #2c3e50; 
        }
        
        .card { 
            background: white; 
            padding: 30px; 
            border-radius: 10px; 
            box-shadow: 0 5px 15px rgba(0,0,0,0.05); 
            margin-bottom: 30px; 
            overflow-x: auto;
        }
        
        .card h2 { 
            margin-bottom: 20px; 
            color: #2c3e50; 
            border-bottom: 2px solid #ecf0f1;
            padding-bottom: 10px;
        }

        .bot-control p { 
            margin-bottom: 20px; 
            font-size: 1.1em; 
        }
        .status-on { color: #27ae60; font-weight: bold; }
        .status-off { color: #e74c3c; font-weight: bold; }
        .bot-btn { 
            text-decoration: none; 
            color: white; 
            padding: 12px 20px; 
            border-radius: 5px; 
            margin-right: 10px; 
            font-weight: 600;
            border: none;
            cursor: pointer;
            font-size: 1em;
        }
        .start { background: #27ae60; }
        .start:hover { background: #219a52; }
        .stop { background: #e74c3c; }
        .stop:hover { background: #c0392b; }
        
        .orders-table { 
            width: 100%; 
            border-collapse: collapse; 
            min-width: 800px;
        }
        .orders-table th, .orders-table td { 
            padding: 12px 15px; 
            border: 1px solid #ddd; 
            text-align: left; 
            vertical-align: top;
        }
        .orders-table th { 
            background: #ecf0f1; 
            color: #34495e;
            font-weight: 600;
        }
        .status-pending { 
            background: #f39c12; 
            color: white; 
            padding: 3px 8px; 
            border-radius: 3px; 
            font-size: 0.9em;
            font-weight: 500;
        }
        .status-confirmed { 
            background: #27ae60; 
            color: white; 
            padding: 3px 8px; 
            border-radius: 3px; 
            font-size: 0.9em;
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1><i class="fas fa-tachometer-alt"></i> Admin Dashboard</h1>
            <a href="/admin/logout" class="logout-btn"><i class="fas fa-sign-out-alt"></i> Logout</a>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <i class="fas fa-boxes" style="color: #27ae60;"></i>
                <div class="info">
                    <h3>Total Orders</h3>
                    <p>${combinedOrders.length}</p>
                </div>
            </div>
            <div class="stat-card">
                <i class="fas fa-dollar-sign" style="color: #e74c3c;"></i>
                <div class="info">
                    <h3>Total Sales</h3>
                    <p>${totalSales.toFixed(0)}${STORE_CONFIG.currency}</p>
                </div>
            </div>
            <div class="stat-card">
                <i class="fas fa-eye" style="color: #3498db;"></i>
                <div class="info">
                    <h3>Site Visitors</h3>
                    <p>${visitors}</p>
                </div>
            </div>
            <div class="stat-card">
                <i class="fas fa-box-open" style="color: #f39c12;"></i>
                <div class="info">
                    <h3>Trimmer Stock</h3>
                    <p>${trimmerProduct.stock}</p>
                </div>
            </div>
        </div>
        
        <div class="bot-control card">
            <h2><i class="fas fa-robot"></i> Bot Control</h2>
            <p>Bot Status: ${botProcess ? '<span class="status-on">Running</span>' : '<span class="status-off">Stopped</span>'}</p>
            <a href="/admin/start-bot" class="bot-btn start" ${botProcess ? 'style="opacity: 0.5; pointer-events: none;"' : ''}>
                <i class="fas fa-play"></i> Start Bot
            </a>
            <a href="/admin/stop-bot" class="bot-btn stop" ${!botProcess ? 'style="opacity: 0.5; pointer-events: none;"' : ''}>
                <i class="fas fa-stop"></i> Stop Bot
            </a>
        </div>
        
        <div class="orders-section card">
            <h2><i class="fas fa-list-alt"></i> Recent Orders</h2>
            <table class="orders-table">
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Date</th>
                        <th>Customer</th>
                        <th>Phone</th>
                        <th>Address</th>
                        <th>Product</th>
                        <th>Total</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${combinedOrders.length === 0 ? '<tr><td colspan="8" style="text-align: center;">No orders yet.</td></tr>' : ''}
                    ${combinedOrders.reverse().map(order => `
                        <tr>
                            <td>${order.orderId}</td>
                            <td>${new Date(order.timestamp).toLocaleString('en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                            <td>${order.name}</td>
                            <td>${order.phone}</td>
                            <td>${order.address}</td>
                            <td>${order.product} (x${order.quantity})</td>
                            <td>${order.price}</td>
                            <td><span class="status-${order.status}">${order.status}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>
  `);
});

// Admin: Start Bot
app.get('/admin/start-bot', requireAuth, (req, res) => {
  if (!botProcess) {
    const started = startBot();
    if (started) {
      console.log('Bot start initiated by admin.');
    } else {
      console.log('Admin tried to start bot, but it failed.');
    }
  }
  res.redirect('/admin');
});

// Admin: Stop Bot
app.get('/admin/stop-bot', requireAuth, (req, res) => {
  if (botProcess) {
    try {
      botProcess.kill('SIGTERM'); // Send termination signal
      console.log('Bot stop initiated by admin.');
      botProcess = null; // Immediately set to null
    } catch (e) {
      console.log('Error killing bot process:', e.message);
    }
  }
  res.redirect('/admin');
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 ${STORE_CONFIG.storeName} server running on http://localhost:${PORT}`);
  
  // Automatically start the bot when the server starts
  startBot();
});
