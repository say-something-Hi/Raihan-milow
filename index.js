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
const session = require('express-session');
const app = express();
const PORT = process.env.PORT || 3000;

// Store Configuration
const STORE_CONFIG = {
  storeName: "Dhaka Market BD",
  storeTagline: "Your Trusted Online Shop, Always best product", 
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

// Generate 50+ realistic products
function generateProducts() {
  const categories = [
    { 
      id: "electronics", 
      name: "Electronics", 
      icon: "📱",
      products: [
        { name: "Samsung Galaxy A32", price: 22990, brand: "Samsung", image: "📱" },
        { name: "Xiaomi Redmi Note 11", price: 18990, brand: "Xiaomi", image: "📱" },
        { name: "Realme Narzo 50", price: 15990, brand: "Realme", image: "📱" },
        { name: "Wireless Bluetooth Headphones", price: 1290, brand: "SoundMax", image: "🎧" },
        { name: "Smart Watch Series 5", price: 3490, brand: "TechGear", image: "⌚" },
        { name: "Power Bank 20000mAh", price: 1890, brand: "PowerX", image: "🔋" }
      ]
    },
    { 
      id: "fashion", 
      name: "Fashion", 
      icon: "👕",
      products: [
        { name: "Men's Casual T-Shirt", price: 490, brand: "FashionWear", image: "👕" },
        { name: "Women's Summer Dress", price: 1290, brand: "StyleHub", image: "👗" },
        { name: "Jeans Pant", price: 1490, brand: "DenimCo", image: "👖" },
        { name: "Sports Shoes", price: 2490, brand: "StepUp", image: "👟" },
        { name: "Winter Jacket", price: 3290, brand: "WarmStyle", image: "🧥" },
        { name: "Formal Shirt", price: 890, brand: "OfficeWear", image: "👔" }
      ]
    },
    { 
      id: "home", 
      name: "Home & Kitchen", 
      icon: "🏠",
      products: [
        { name: "Non-Stick Cookware Set", price: 3490, brand: "KitchenPro", image: "🍳" },
        { name: "Queen Size Bed", price: 18990, brand: "ComfortSleep", image: "🛏️" },
        { name: "Sofa Set 3+2", price: 45990, brand: "HomeComfort", image: "🛋️" },
        { name: "Dining Table Set", price: 12990, brand: "FamilyDine", image: "🍽️" },
        { name: "Study Table", price: 4590, brand: "WorkSpace", image: "📚" },
        { name: "Kitchen Knife Set", price: 1590, brand: "SharpCut", image: "🔪" }
      ]
    },
    { 
      id: "beauty", 
      name: "Beauty", 
      icon: "💄",
      products: [
        { name: "Face Cream", price: 590, brand: "GlowSkin", image: "🧴" },
        { name: "Lipstick Set", price: 1290, brand: "ColorPop", image: "💄" },
        { name: "Perfume 100ml", price: 1890, brand: "Fragrance", image: "🌸" },
        { name: "Hair Dryer", price: 1490, brand: "StyleDry", image: "💇" },
        { name: "Makeup Kit", price: 2590, brand: "BeautyBox", image: "💅" },
        { name: "Face Wash", price: 290, brand: "CleanSkin", image: "🧼" }
      ]
    },
    { 
      id: "sports", 
      name: "Sports", 
      icon: "⚽",
      products: [
        { name: "Cricket Bat", price: 1890, brand: "SportsGear", image: "🏏" },
        { name: "Football", price: 890, brand: "KickPro", image: "⚽" },
        { name: "Yoga Mat", price: 1290, brand: "FitLife", image: "🧘" },
        { name: "Dumbbell Set", price: 3490, brand: "PowerLift", image: "💪" },
        { name: "Running Shoes", price: 2890, brand: "RunFast", image: "👟" },
        { name: "Sports Bag", price: 990, brand: "GymPack", image: "🎒" }
      ]
    }
  ];

  let allProducts = [];
  let id = 1;

  categories.forEach(category => {
    category.products.forEach(product => {
      const originalPrice = product.price + Math.floor(Math.random() * 1000) + 500;
      const discount = Math.round((1 - product.price/originalPrice) * 100);
      
      allProducts.push({
        id: id++,
        name: product.name,
        price: product.price,
        originalPrice: originalPrice,
        discount: discount > 15 ? discount : 0,
        image: product.image,
        category: category.id,
        categoryName: category.name,
        brand: product.brand,
        stock: Math.floor(Math.random() * 50) + 10,
        rating: (Math.random() * 2 + 3).toFixed(1),
        reviews: Math.floor(Math.random() * 200) + 50,
        description: `High-quality ${product.name.toLowerCase()} from ${product.brand}. Perfect for daily use with guaranteed satisfaction.`,
        features: ["Premium Quality", "Durable", "1 Year Warranty", "Fast Delivery"],
        status: "available"
      });
    });
  });

  return allProducts;
}

// Initialize data
const products = generateProducts();
let orders = [];
let orderIdCounter = 1;
let visitors = 0;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'shopnow-secret-key-2024',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
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

// Simulate bot function to send to Messenger
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

  console.log('📤 SENDING TO MESSENGER THREAD:');
  console.log('Thread ID:', STORE_CONFIG.adminThreadId);
  console.log(message);
  console.log('✅ Message sent successfully to Messenger!');

  // In real implementation, you would use:
  // global.api.sendMessage(message, STORE_CONFIG.adminThreadId);
}

// Routes
app.get('/', (req, res) => {
  const featuredProducts = products.slice(0, 8);
  const categories = [
    { id: "electronics", name: "Electronics", icon: "📱", count: products.filter(p => p.category === 'electronics').length },
    { id: "fashion", name: "Fashion", icon: "👕", count: products.filter(p => p.category === 'fashion').length },
    { id: "home", name: "Home & Kitchen", icon: "🏠", count: products.filter(p => p.category === 'home').length },
    { id: "beauty", name: "Beauty", icon: "💄", count: products.filter(p => p.category === 'beauty').length },
    { id: "sports", name: "Sports", icon: "⚽", count: products.filter(p => p.category === 'sports').length }
  ];

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
            background: #f5f5f5;
            color: #333;
            line-height: 1.6;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 15px; }
        
        /* Header */
        .header { background: #2c3e50; color: white; padding: 15px 0; }
        .header-content { display: flex; justify-content: space-between; align-items: center; }
        .logo { font-size: 1.8em; font-weight: bold; color: white; text-decoration: none; }
        .nav { display: flex; gap: 25px; }
        .nav a { color: white; text-decoration: none; }
        
        /* Hero */
        .hero {
            background: linear-gradient(135deg, #3498db, #2c3e50);
            color: white;
            padding: 60px 0;
            text-align: center;
        }
        .hero h1 { font-size: 2.5em; margin-bottom: 20px; }
        .hero p { font-size: 1.2em; margin-bottom: 30px; }
        .cta-button {
            background: #e74c3c;
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 5px;
            font-size: 1.1em;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
        }
        
        /* Categories */
        .categories { padding: 50px 0; }
        .section-title { text-align: center; font-size: 2em; margin-bottom: 40px; color: #2c3e50; }
        .categories-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .category-card {
            background: white;
            padding: 30px 20px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            cursor: pointer;
            transition: transform 0.3s;
        }
        .category-card:hover { transform: translateY(-5px); }
        .category-card i { font-size: 3em; margin-bottom: 15px; display: block; }
        
        /* Products */
        .products { padding: 50px 0; }
        .product-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 25px; }
        .product-card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            transition: transform 0.3s;
        }
        .product-card:hover { transform: translateY(-5px); }
        .product-image { font-size: 3em; text-align: center; margin-bottom: 15px; }
        .product-title { font-size: 1.1em; font-weight: 600; margin-bottom: 10px; }
        .product-price { font-size: 1.3em; color: #e74c3c; font-weight: bold; margin-bottom: 15px; }
        .buy-btn {
            background: #3498db;
            color: white;
            border: none;
            padding: 10px;
            border-radius: 5px;
            cursor: pointer;
            width: 100%;
            font-weight: 600;
        }
        
        /* Footer */
        .footer { background: #2c3e50; color: white; padding: 40px 0; text-align: center; }
        
        @media (max-width: 768px) {
            .header-content { flex-direction: column; gap: 15px; }
            .hero h1 { font-size: 2em; }
            .product-grid { grid-template-columns: 1fr; }
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
                    <a href="/products">Products</a>
                    <a href="/admin" target="_blank">Admin</a>
                </nav>
            </div>
        </div>
    </header>

    <!-- Hero Section -->
    <section class="hero">
        <div class="container">
            <h1>Welcome to ${STORE_CONFIG.storeName}</h1>
            <p>${STORE_CONFIG.storeTagline} - Discover Amazing Products at Best Prices</p>
            <a href="#products" class="cta-button">Shop Now <i class="fas fa-arrow-right"></i></a>
        </div>
    </section>

    <!-- Categories -->
    <section class="categories">
        <div class="container">
            <h2 class="section-title">Shop by Category</h2>
            <div class="categories-grid">
                ${categories.map(cat => `
                    <div class="category-card" onclick="window.location.href='/category/${cat.id}'">
                        <div style="font-size: 3em; margin-bottom: 15px;">${cat.icon}</div>
                        <h3>${cat.name}</h3>
                        <p>${cat.count} Products</p>
                    </div>
                `).join('')}
            </div>
        </div>
    </section>

    <!-- Featured Products -->
    <section class="products" id="products">
        <div class="container">
            <h2 class="section-title">Featured Products</h2>
            <div class="product-grid">
                ${featuredProducts.map(product => `
                    <div class="product-card">
                        <div class="product-image">${product.image}</div>
                        <div class="product-title">${product.name}</div>
                        <div class="product-price">${product.price}${STORE_CONFIG.currency}</div>
                        <div style="color: #f39c12; margin-bottom: 15px;">
                            ${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5-Math.floor(product.rating))} (${product.rating})
                        </div>
                        <button class="buy-btn" onclick="window.location.href='/product/${product.id}'">
                            <i class="fas fa-shopping-cart"></i> Buy Now
                        </button>
                    </div>
                `).join('')}
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
        <div class="container">
            <p>&copy; 2024 ${STORE_CONFIG.storeName}. All rights reserved.</p>
            <p>📞 ${STORE_CONFIG.phone} | ✉️ ${STORE_CONFIG.email}</p>
        </div>
    </footer>
</body>
</html>
  `);
});

// Product detail page
app.get('/product/:id', (req, res) => {
  const productId = parseInt(req.params.id);
  const product = products.find(p => p.id === productId);
  
  if (!product) return res.redirect('/');

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
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; }
        .container { max-width: 1000px; margin: 0 auto; padding: 20px; }
        .back-btn { background: #7f8c8d; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-bottom: 20px; }
        .product-detail { background: white; border-radius: 10px; padding: 30px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        .product-header { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; }
        .product-image { font-size: 6em; text-align: center; background: #ecf0f1; padding: 40px; border-radius: 10px; }
        .product-info h1 { font-size: 2em; margin-bottom: 15px; color: #2c3e50; }
        .product-price { font-size: 2em; color: #e74c3c; font-weight: bold; margin-bottom: 20px; }
        .product-rating { color: #f39c12; margin-bottom: 15px; }
        .product-description { color: #7f8c8d; line-height: 1.6; margin-bottom: 25px; }
        .order-btn { background: #27ae60; color: white; border: none; padding: 15px 30px; font-size: 1.2em; border-radius: 5px; cursor: pointer; }
        @media (max-width: 768px) {
            .product-header { grid-template-columns: 1fr; }
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
                <div class="product-image">${product.image}</div>
                <div class="product-info">
                    <h1>${product.name}</h1>
                    <div class="product-price">${product.price}${STORE_CONFIG.currency}</div>
                    <div class="product-rating">
                        ${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5-Math.floor(product.rating))} 
                        (${product.rating}) • ${product.reviews} reviews
                    </div>
                    <p class="product-description">${product.description}</p>
                    <p><strong>Brand:</strong> ${product.brand}</p>
                    <p><strong>Category:</strong> ${product.categoryName}</p>
                    <p><strong>Stock:</strong> ${product.stock} items available</p>
                    
                    <button class="order-btn" onclick="window.location.href='/order/${product.id}'">
                        <i class="fas fa-shopping-cart"></i> Order Now
                    </button>
                </div>
            </div>
        </div>
    </div>
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
        <button class="back-btn" onclick="window.location.href='/product/${product.id}'">
            <i class="fas fa-arrow-left"></i> Back to Product
        </button>
        
        <div class="order-form">
            <h1 class="form-title">Place Your Order</h1>
            
            <div class="product-summary">
                <strong>Product:</strong> ${product.name}<br>
                <strong>Price:</strong> ${product.price}${STORE_CONFIG.currency}<br>
                <strong>Brand:</strong> ${product.brand}
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
                
                <input type="hidden" name="product" value="${product.name}">
                <input type="hidden" name="price" value="${product.price}">
                <input type="hidden" name="productId" value="${product.id}">
                
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
                    alert('✅ Order Submitted Successfully!\\\\n\\\\nWe will call you within 30 minutes to confirm your order.\\\\n\\\\nOrder ID: ' + result.orderId);
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
  
  const orderId = 'SN' + Date.now();
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
  
  // Send to Messenger automatically
  sendToMessenger(orderData);
  
  res.json({
    success: true,
    message: 'Order received successfully! Our team will call you within 30 minutes to confirm your order.',
    orderId: orderId
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
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: #2c3e50; color: white; padding: 20px 0; text-align: center; }
        .product-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 25px; margin-top: 30px; }
        .product-card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); text-align: center; }
        .product-image { font-size: 3em; margin-bottom: 15px; }
        .buy-btn { background: #3498db; color: white; border: none; padding: 10px; border-radius: 5px; cursor: pointer; width: 100%; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="container">
            <h1>All Products (${products.length})</h1>
            <p>Browse our complete collection</p>
        </div>
    </div>
    
    <div class="container">
        <div class="product-grid">
            ${products.map(product => `
                <div class="product-card">
                    <div class="product-image">${product.image}</div>
                    <h3>${product.name}</h3>
                    <p style="color: #e74c3c; font-weight: bold; font-size: 1.2em;">${product.price}${STORE_CONFIG.currency}</p>
                    <p style="color: #f39c12;">${'★'.repeat(Math.floor(product.rating))} (${product.rating})</p>
                    <button class="buy-btn" onclick="window.location.href='/product/${product.id}'">
                        View Details
                    </button>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>
  `);
});

// Category pages
app.get('/category/:category', (req, res) => {
  const category = req.params.category;
  const categoryProducts = products.filter(p => p.category === category);
  const categoryName = products.find(p => p.category === category)?.categoryName || category;
  
  if (categoryProducts.length === 0) return res.redirect('/');
  
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${categoryName} - ${STORE_CONFIG.storeName}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: #2c3e50; color: white; padding: 20px 0; text-align: center; }
        .product-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 25px; margin-top: 30px; }
        .product-card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); text-align: center; }
        .product-image { font-size: 3em; margin-bottom: 15px; }
        .buy-btn { background: #3498db; color: white; border: none; padding: 10px; border-radius: 5px; cursor: pointer; width: 100%; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="container">
            <h1>${categoryName} (${categoryProducts.length} products)</h1>
            <p>Browse all ${categoryName.toLowerCase()} products</p>
        </div>
    </div>
    
    <div class="container">
        <div class="product-grid">
            ${categoryProducts.map(product => `
                <div class="product-card">
                    <div class="product-image">${product.image}</div>
                    <h3>${product.name}</h3>
                    <p style="color: #e74c3c; font-weight: bold; font-size: 1.2em;">${product.price}${STORE_CONFIG.currency}</p>
                    <p style="color: #f39c12;">${'★'.repeat(Math.floor(product.rating))} (${product.rating})</p>
                    <button class="buy-btn" onclick="window.location.href='/product/${product.id}'">
                        View Details
                    </button>
                </div>
            `).join('')}
        </div>
    </div>
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
  req.session.destroy();
  res.redirect('/admin/login');
});

// Admin Panel (Protected)
app.get('/admin', requireAuth, (req, res) => {
  const totalSales = orders.reduce((sum, order) => sum + (parseInt(order.price) * order.quantity), 0);
  
  res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Admin Panel - ${STORE_CONFIG.storeName}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: #2c3e50; color: white; padding: 20px; border-radius: 10px; margin-bottom: 30px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: white; padding: 25px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); text-align: center; }
        .stat-number { font-size: 2.5em; font-weight: bold; color: #3498db; }
        .orders-table { background: white; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); overflow: hidden; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 15px; text-align: left; border-bottom: 1px solid #ecf0f1; }
        th { background: #34495e; color: white; }
        .logout-btn { background: #e74c3c; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; float: right; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1><i class="fas fa-cog"></i> Admin Panel - ${STORE_CONFIG.storeName}</h1>
            <p>Manage your store efficiently</p>
            <button class="logout-btn" onclick="window.location.href='/admin/logout'">
                <i class="fas fa-sign-out-alt"></i> Logout
            </button>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${orders.length}</div>
                <div>Total Orders</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${products.length}</div>
                <div>Total Products</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${visitors}</div>
                <div>Website Visitors</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${totalSales}${STORE_CONFIG.currency}</div>
                <div>Total Sales</div>
            </div>
        </div>
        
        <div class="orders-table">
            <h2 style="padding: 20px; background: #34495e; color: white; margin: 0;">
                <i class="fas fa-shopping-cart"></i> Recent Orders (${orders.length})
            </h2>
            ${orders.length > 0 ? `
                <table>
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Phone</th>
                            <th>Product</th>
                            <th>Amount</th>
                            <th>Address</th>
                            <th>Time</th>
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
                                <td>${order.address}</td>
                                <td>${new Date(order.timestamp).toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : `
                <div style="text-align: center; padding: 50px; color: #7f8c8d;">
                    <i class="fas fa-shopping-cart" style="font-size: 3em; margin-bottom: 20px;"></i>
                    <h3>No orders yet</h3>
                    <p>Orders will appear here when customers place orders</p>
                </div>
            `}
        </div>
        
        <div style="margin-top: 30px; text-align: center; color: #7f8c8d;">
            <p>🔒 Messenger Thread: ${STORE_CONFIG.adminThreadId}</p>
            <p>📊 All orders are automatically sent to Messenger</p>
        </div>
    </div>
</body>
</html>
  `);
});

// Start server
app.listen(PORT, () => {
  console.log(`🛒 ${STORE_CONFIG.storeName} running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`🔐 Admin Panel: http://localhost:${PORT}/admin`);
  console.log(`👤 Username: ${STORE_CONFIG.admin.username}`);
  console.log(`🔑 Password: ${STORE_CONFIG.admin.password}`);
  console.log(`📞 Messenger Thread: ${STORE_CONFIG.adminThreadId}`);
  console.log(`🛍️ Products: ${products.length}`);
  console.log(`📊 Orders: ${orders.length}`);
  console.log(`🚀 Server started successfully!`);
});

// Export for testing
module.exports = app;
