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
const path = require('path');
const PDFDocument = require('pdfkit');
const app = express();
const PORT = process.env.PORT || 3000;

// Global API object for bot
let globalApi = null;

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
  },
  pathao: {
    clientId: "",
    clientSecret: "",
    username: "",
    password: "",
    storeId: ""
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
  specifications: {
    "Power Source": "USB Rechargeable",
    "Battery": "Lithium-ion 2000mAh",
    "Usage Time": "2 Hours",
    "Charging Time": "2 Hours",
    "Blade Material": "Stainless Steel",
    "Waterproof": "Yes - IPX7"
  },
  status: "available"
};

// Data storage files
const ORDERS_FILE = 'data/orders.json';
const VISITORS_FILE = 'data/visitors.json';
const SETTINGS_FILE = 'data/settings.json';

// Ensure data directory exists
if (!fs.existsSync('data')) {
  fs.mkdirSync('data', { recursive: true });
}

// Load persistent data
let orders = loadOrders();
let visitorsData = loadVisitors();
let orderIdCounter = orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'trimmer-secret-key-2024-super-secure',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Data persistence functions
function loadOrders() {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading orders:', error);
  }
  return [];
}

function saveOrders() {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
  } catch (error) {
    console.error('Error saving orders:', error);
  }
}

function loadVisitors() {
  try {
    if (fs.existsSync(VISITORS_FILE)) {
      return JSON.parse(fs.readFileSync(VISITORS_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading visitors:', error);
  }
  return { total: 0, today: 0, lastReset: new Date().toDateString() };
}

function saveVisitors() {
  try {
    fs.writeFileSync(VISITORS_FILE, JSON.stringify(visitorsData, null, 2));
  } catch (error) {
    console.error('Error saving visitors:', error);
  }
}

// Visitor counter with daily reset
app.use((req, res, next) => {
  const today = new Date().toDateString();
  if (visitorsData.lastReset !== today) {
    visitorsData.today = 0;
    visitorsData.lastReset = today;
  }
  visitorsData.total++;
  visitorsData.today++;
  saveVisitors();
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

// REAL Bot function to send to Messenger
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

  try {
    if (globalApi) {
      globalApi.sendMessage(message, STORE_CONFIG.adminThreadId, (err, info) => {
        if (err) {
          console.error('❌ Failed to send message to admin thread:', err);
          saveFailedOrder(orderData);
        } else {
          console.log('✅ Order notification sent to admin thread successfully');
        }
      });
    } else {
      console.log('❌ Bot API not initialized (CONSOLE MODE). Using fallback method.');
      console.log('📝 ORDER FOR MANUAL SENDING:');
      console.log(message);
      saveFailedOrder(orderData);
    }
  } catch (error) {
    console.error('❌ Error sending to admin thread:', error);
    saveFailedOrder(orderData);
  }
}

// Save failed orders for retry
function saveFailedOrder(orderData) {
  const failedOrdersFile = 'data/failed_orders.json';
  let failedOrders = [];
  try {
    if (fs.existsSync(failedOrdersFile)) {
      failedOrders = JSON.parse(fs.readFileSync(failedOrdersFile, 'utf8'));
    }
  } catch (e) {
    console.log('No existing failed orders file or error reading it.');
  }
  
  failedOrders.push({
    ...orderData,
    failedAt: new Date().toISOString()
  });
  
  try {
    fs.writeFileSync(failedOrdersFile, JSON.stringify(failedOrders, null, 2));
    console.log(`💾 Order saved to ${failedOrdersFile} for manual processing`);
  } catch (writeError) {
    console.error(`❌ CRITICAL: Failed to write to ${failedOrdersFile}:`, writeError);
  }
}

// Initialize bot API from Goat-Bot
function initializeBotAPI() {
  try {
    if (typeof global.goatBot !== 'undefined' && global.goatBot.api) {
      globalApi = global.goatBot.api;
      console.log('🤖 Bot API initialized from Goat-Bot V2 (ACTIVE MODE)');
    } else {
      console.log('⚠️ Goat-Bot not found (global.goatBot.api is not available).');
      console.log('🤖 Running in CONSOLE MODE. Orders will be logged and saved to file.');
    }
  } catch (error) {
    console.log('⚠️ Could not initialize bot API:', error.message);
    console.log('📝 Orders will be logged to console and saved to file');
  }
}

// PDF Generation function
function generateOrderPDF(order) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const filename = `order_${order.orderId}.pdf`;
      const filepath = path.join(__dirname, 'data', 'pdfs', filename);
      
      // Ensure pdfs directory exists
      if (!fs.existsSync(path.join(__dirname, 'data', 'pdfs'))) {
        fs.mkdirSync(path.join(__dirname, 'data', 'pdfs'), { recursive: true });
      }
      
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);
      
      // Header
      doc.fontSize(20).fillColor('#2c3e50').text(STORE_CONFIG.storeName, 50, 50);
      doc.fontSize(12).fillColor('#7f8c8d').text('Invoice & Order Details', 50, 80);
      doc.moveDown();
      
      // Order Details
      doc.fontSize(16).fillColor('#2c3e50').text('Order Information', 50, 120);
      doc.fontSize(10).fillColor('#333');
      doc.text(`Order ID: ${order.orderId}`, 50, 150);
      doc.text(`Order Date: ${new Date(order.timestamp).toLocaleString()}`, 50, 165);
      doc.text(`Status: ${order.status}`, 50, 180);
      doc.moveDown();
      
      // Customer Information
      doc.fontSize(14).fillColor('#2c3e50').text('Customer Information', 50, 220);
      doc.fontSize(10).fillColor('#333');
      doc.text(`Name: ${order.name}`, 50, 245);
      doc.text(`Phone: ${order.phone}`, 50, 260);
      doc.text(`Email: ${order.email}`, 50, 275);
      doc.text(`Address: ${order.address}`, 50, 290);
      doc.text(`Area: ${order.area}`, 50, 305);
      doc.text(`City: ${order.city}`, 50, 320);
      doc.moveDown();
      
      // Product Information
      doc.fontSize(14).fillColor('#2c3e50').text('Product Information', 50, 360);
      doc.fontSize(10).fillColor('#333');
      doc.text(`Product: ${order.product}`, 50, 385);
      doc.text(`Quantity: ${order.quantity}`, 50, 400);
      doc.text(`Price: ${order.price}`, 50, 415);
      doc.text(`Payment Method: ${order.paymentMethod}`, 50, 430);
      doc.moveDown();
      
      // Notes
      if (order.notes && order.notes !== 'No additional notes') {
        doc.fontSize(14).fillColor('#2c3e50').text('Additional Notes', 50, 470);
        doc.fontSize(10).fillColor('#333').text(order.notes, 50, 495);
      }
      
      // Footer
      doc.fontSize(8).fillColor('#7f8c8d')
        .text(`Generated on ${new Date().toLocaleString()}`, 50, 550)
        .text(`Thank you for shopping with ${STORE_CONFIG.storeName}!`, 50, 565);
      
      doc.end();
      
      stream.on('finish', () => resolve(filename));
      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
}

// Pathao Integration Functions
async function getPathaoToken() {
  // Implementation for Pathao token generation
  return null;
}

async function createPathaoOrder(order) {
  // Implementation for Pathao order creation
  return { success: false, message: 'Pathao integration not configured' };
}

// Order submission API
app.post('/submit-order', async (req, res) => {
  try {
    const { name, phone, email, address, city, area, product, price, quantity, paymentMethod, notes } = req.body;

    // Basic Validation
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
      status: 'pending',
      pdfGenerated: false
    };
    
    orders.push(orderData);
    saveOrders();
    
    // Generate PDF
    try {
      await generateOrderPDF(orderData);
      orderData.pdfGenerated = true;
      saveOrders();
    } catch (pdfError) {
      console.error('PDF generation failed:', pdfError);
    }
    
    // Send to Messenger
    sendToMessenger(orderData);
    
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

// Admin Order Management APIs
app.post('/admin/update-order-status', requireAuth, (req, res) => {
  const { orderId, status } = req.body;
  const order = orders.find(o => o.orderId === orderId);
  
  if (order) {
    order.status = status;
    saveOrders();
    res.json({ success: true, message: 'Order status updated' });
  } else {
    res.status(404).json({ success: false, message: 'Order not found' });
  }
});

app.post('/admin/delete-order', requireAuth, (req, res) => {
  const { orderId } = req.body;
  const initialLength = orders.length;
  orders = orders.filter(o => o.orderId !== orderId);
  
  if (orders.length < initialLength) {
    saveOrders();
    res.json({ success: true, message: 'Order deleted successfully' });
  } else {
    res.status(404).json({ success: false, message: 'Order not found' });
  }
});

app.post('/admin/create-pathao-order', requireAuth, async (req, res) => {
  const { orderId } = req.body;
  const order = orders.find(o => o.orderId === orderId);
  
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }
  
  try {
    const result = await createPathaoOrder(order);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Pathao order creation failed' });
  }
});

// Homepage Route - FIXED IMAGE DISPLAY
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
        
        /* Image Slider - FIXED */
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
            height: 400px;
        }
        
        .slider {
            display: flex;
            transition: transform 0.5s ease-in-out;
            height: 100%;
        }
        
        .slide {
            min-width: 100%;
            height: 100%;
        }
        
        .slide img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            display: block;
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
        
        /* Responsive Design */
        @media (max-width: 992px) {
            .product-container {
                grid-template-columns: 1fr;
            }
        }
        
        @media (max-width: 768px) {
            .header-content {
                flex-direction: column;
                gap: 15px;
            }
            
            .nav {
                flex-wrap: wrap;
                justify-content: center;
                gap: 15px;
            }
            
            .hero {
                padding: 100px 0 60px;
                margin-top: 130px;
            }
            
            .hero h1 {
                font-size: 2.2em;
            }
            
            .product-info {
                padding: 30px 20px;
            }
            
            .slider-container {
                height: 300px;
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
                <!-- Image Slider - FIXED -->
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
                
                <!-- Product Info -->
                <div class="product-info">
                    <h1 class="product-title">${trimmerProduct.name}</h1>
                    
                    <div class="product-price">
                        <span class="current-price">${trimmerProduct.price}${STORE_CONFIG.currency}</span>
                        <span class="original-price">${trimmerProduct.originalPrice}${STORE_CONFIG.currency}</span>
                        <span class="discount-badge">-${trimmerProduct.discount}%</span>
                    </div>
                    
                    <div class="product-rating">
                        ${'★'.repeat(Math.floor(trimmerProduct.rating))}${trimmerProduct.rating % 1 !== 0 ? '☆' : ''} (${trimmerProduct.rating}) • ${trimmerProduct.reviews} Reviews
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
        // Image Slider Functionality - FIXED
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
            
            // Update dots
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === currentSlide);
            });
        }
        
        function startSlideShow() {
            stopSlideShow();
            slideInterval = setInterval(() => {
                showSlide(currentSlide + 1);
            }, 3000);
        }
        
        function stopSlideShow() {
            clearInterval(slideInterval);
        }

        // Auto slide
        startSlideShow();
        
        // Dot click events
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                showSlide(index);
                startSlideShow();
            });
        });
        
        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                try {
                    const target = document.querySelector(this.getAttribute('href'));
                    if (target) {
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                } catch(e) {
                    console.warn('Error scrolling to anchor:', e);
                }
            });
        });
    </script>
</body>
</html>
  `);
});

// Order page (same as before, but I'll include it for completeness)
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
    if (err) {
      console.error("Failed to destroy session:", err);
    }
    res.redirect('/admin/login');
  });
});

// Admin Panel (Enhanced with all features)
app.get('/admin', requireAuth, (req, res) => {
  const totalSales = orders.reduce((sum, order) => {
      const price = parseFloat(order.price) || 0;
      const quantity = parseInt(order.quantity) || 1;
      return sum + (price * quantity);
  }, 0);
  
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  
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
        .container { max-width: 1400px; margin: 0 auto; padding: 20px; }
        
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
        .header-info {
            display: flex;
            gap: 15px;
            align-items: center;
            flex-wrap: wrap;
        }

        .bot-status { 
            background: ${globalApi ? '#27ae60' : '#f39c12'};
            color: white; 
            padding: 8px 15px; 
            border-radius: 5px; 
            display: inline-block; 
            font-weight: 600;
        }
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
            margin-bottom: 30px;
        }
        .section-header {
            padding: 20px;
            background: #34495e;
            color: white;
            display: flex;
            justify-content: between;
            align-items: center;
            flex-wrap: wrap;
            gap: 15px;
        }
        .section-title { margin: 0; font-size: 1.5em; }
        
        .filters {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        .filter-btn {
            background: #2c3e50;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 5px;
            cursor: pointer;
        }
        .filter-btn.active {
            background: #3498db;
        }
        
        .orders-table-container { 
            overflow-x: auto;
        }
        table { width: 100%; border-collapse: collapse; min-width: 1000px; }
        th, td { padding: 15px; text-align: left; border-bottom: 1px solid #ecf0f1; }
        th { background: #34495e; color: white; position: sticky; top: 0; }
        
        .status-badge {
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 0.8em;
            font-weight: 600;
        }
        .status-pending { background: #fff3cd; color: #856404; }
        .status-confirmed { background: #d1ecf1; color: #0c5460; }
        .status-shipped { background: #d4edda; color: #155724; }
        .status-completed { background: #d1f7ff; color: #0066cc; }
        .status-cancelled { background: #f8d7da; color: #721c24; }
        
        .action-btn {
            padding: 6px 12px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.8em;
            margin: 2px;
        }
        .btn-edit { background: #3498db; color: white; }
        .btn-delete { background: #e74c3c; color: white; }
        .btn-pathao { background: #27ae60; color: white; }
        .btn-pdf { background: #9b59b6; color: white; }
        
        .no-orders {
            text-align: center; 
            padding: 50px; 
            color: #7f8c8d;
        }
        .no-orders i {
            font-size: 3em; 
            margin-bottom: 20px;
        }
        
        .footer-info {
            margin-top: 30px; 
            text-align: center; 
            color: #7f8c8d;
            font-size: 0.9em;
        }
        
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
            max-height: 80vh;
            overflow-y: auto;
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
                 <div class="bot-status">
                    <i class="fas fa-robot"></i> Bot: ${globalApi ? 'ACTIVE ✅' : 'CONSOLE MODE ⚠️'}
                </div>
                <a class="logout-btn" href="/admin/logout">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </a>
            </div>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${orders.length}</div>
                <div class="stat-label">Total Orders</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${visitorsData.today}</div>
                <div class="stat-label">Today's Visitors</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${totalSales.toFixed(0)}${STORE_CONFIG.currency}</div>
                <div class="stat-label">Total Sales</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${pendingOrders}</div>
                <div class="stat-label">Pending Orders</div>
            </div>
        </div>
        
        <div class="orders-section">
            <div class="section-header">
                <h2 class="section-title"><i class="fas fa-shopping-cart"></i> All Orders (${orders.length})</h2>
                <div class="filters">
                    <button class="filter-btn active" data-filter="all">All</button>
                    <button class="filter-btn" data-filter="pending">Pending</button>
                    <button class="filter-btn" data-filter="confirmed">Confirmed</button>
                    <button class="filter-btn" data-filter="completed">Completed</button>
                </div>
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
                                <tr class="order-row" data-status="${order.status}">
                                    <td><strong>${order.orderId}</strong></td>
                                    <td>${order.name}</td>
                                    <td>${order.phone}</td>
                                    <td>${order.product} (Qty: ${order.quantity})</td>
                                    <td>${order.price}</td>
                                    <td>
                                        <select class="status-select" data-order-id="${order.orderId}">
                                            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                                            <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                                            <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                                            <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                                            <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                                        </select>
                                    </td>
                                    <td>${new Date(order.timestamp).toLocaleString()}</td>
                                    <td>
                                        <button class="action-btn btn-pdf" onclick="downloadPDF('${order.orderId}')" title="Download PDF">
                                            <i class="fas fa-file-pdf"></i>
                                        </button>
                                        <button class="action-btn btn-pathao" onclick="createPathaoOrder('${order.orderId}')" title="Create Pathao Order">
                                            <i class="fas fa-shipping-fast"></i>
                                        </button>
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
            <p>🔒 Messenger Thread: ${STORE_CONFIG.adminThreadId} | 📞 Contact: ${STORE_CONFIG.phone}</p>
            <p>🤖 Bot Status: ${globalApi ? 'ACTIVE - Messages will be sent automatically' : 'CONSOLE MODE - Check console for order details'}</p>
        </div>
    </div>

    <!-- Modal for messages -->
    <div class="modal" id="messageModal">
        <div class="modal-content">
            <h3 id="modalTitle">Message</h3>
            <p id="modalMessage"></p>
            <button onclick="closeModal()" style="margin-top: 20px; padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">OK</button>
        </div>
    </div>

    <script>
        // Filter orders
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                const filter = this.dataset.filter;
                document.querySelectorAll('.order-row').forEach(row => {
                    if (filter === 'all' || row.dataset.status === filter) {
                        row.style.display = '';
                    } else {
                        row.style.display = 'none';
                    }
                });
            });
        });
        
        // Status update
        document.querySelectorAll('.status-select').forEach(select => {
            select.addEventListener('change', function() {
                const orderId = this.dataset.orderId;
                const status = this.value;
                
                fetch('/admin/update-order-status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orderId, status })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        showMessage('Status updated successfully');
                        // Update row status
                        const row = this.closest('tr');
                        row.dataset.status = status;
                    } else {
                        showMessage('Error updating status: ' + data.message, true);
                        this.value = row.dataset.status; // Revert on error
                    }
                })
                .catch(error => {
                    showMessage('Error updating status', true);
                    console.error('Error:', error);
                });
            });
        });
        
        // Delete order
        function deleteOrder(orderId) {
            if (confirm('Are you sure you want to delete this order?')) {
                fetch('/admin/delete-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orderId })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        showMessage('Order deleted successfully');
                        // Remove row from table
                        document.querySelector(\`tr[data-order-id="\${orderId}"]\`)?.remove();
                    } else {
                        showMessage('Error deleting order: ' + data.message, true);
                    }
                })
                .catch(error => {
                    showMessage('Error deleting order', true);
                    console.error('Error:', error);
                });
            }
        }
        
        // Create Pathao order
        function createPathaoOrder(orderId) {
            fetch('/admin/create-pathao-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showMessage('Pathao order created successfully');
                } else {
                    showMessage('Pathao order creation failed: ' + data.message, true);
                }
            })
            .catch(error => {
                showMessage('Error creating Pathao order', true);
                console.error('Error:', error);
            });
        }
        
        // Download PDF
        function downloadPDF(orderId) {
            window.open(\`/admin/order-pdf/\${orderId}\`, '_blank');
        }
        
        // Modal functions
        function showMessage(message, isError = false) {
            const modal = document.getElementById('messageModal');
            const modalTitle = document.getElementById('modalTitle');
            const modalMsg = document.getElementById('modalMessage');
            
            modalTitle.textContent = isError ? 'Error' : 'Success';
            modalTitle.style.color = isError ? '#e74c3c' : '#27ae60';
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

// PDF Download Route
app.get('/admin/order-pdf/:orderId', requireAuth, (req, res) => {
  const orderId = req.params.orderId;
  const order = orders.find(o => o.orderId === orderId);
  
  if (!order) {
    return res.status(404).send('Order not found');
  }
  
  const filepath = path.join(__dirname, 'data', 'pdfs', `order_${orderId}.pdf`);
  
  if (fs.existsSync(filepath)) {
    res.download(filepath);
  } else {
    res.status(404).send('PDF not found');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`=====================================================`);
  console.log(`🛒 ${STORE_CONFIG.storeName} running on port ${PORT}`);
  console.log(`📍 Live URL: http://localhost:${PORT}`);
  console.log(`=====================================================`);
  console.log(`🔐 Admin Panel: http://localhost:${PORT}/admin`);
  console.log(`   👤 Username: ${STORE_CONFIG.admin.username}`);
  console.log(`   🔑 Password: ${STORE_CONFIG.admin.password}`);
  console.log(`=====================================================`);
  console.log(`📞 Messenger Thread: ${STORE_CONFIG.adminThreadId}`);
  
  initializeBotAPI();
  
  console.log(`📊 Initial Orders: ${orders.length}`);
  console.log(`🚀 Server started successfully!`);
  console.log(`=====================================================`);
});

// Export for testing or if required by another module
module.exports = app;
