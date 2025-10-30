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

// Store orders temporarily (in production use database)
let pendingOrders = new Map();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve premium e-commerce website
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Premium Shop - Best Quality Products</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
        
        /* Header */
        .header { background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); padding: 20px 0; border-bottom: 1px solid rgba(255,255,255,0.2); }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        .navbar { display: flex; justify-content: space-between; align-items: center; }
        .logo { font-size: 2em; font-weight: bold; color: white; }
        .logo span { color: #ffd700; }
        .nav-links { display: flex; gap: 30px; }
        .nav-links a { color: white; text-decoration: none; font-weight: 500; transition: 0.3s; }
        .nav-links a:hover { color: #ffd700; }
        
        /* Hero Section */
        .hero { text-align: center; padding: 100px 0; color: white; }
        .hero h1 { font-size: 3.5em; margin-bottom: 20px; text-shadow: 2px 2px 10px rgba(0,0,0,0.3); }
        .hero p { font-size: 1.3em; margin-bottom: 30px; opacity: 0.9; }
        .cta-button { background: #ff6b6b; color: white; padding: 15px 40px; border: none; border-radius: 50px; font-size: 1.2em; cursor: pointer; transition: 0.3s; }
        .cta-button:hover { background: #ff5252; transform: translateY(-3px); box-shadow: 0 10px 25px rgba(255,107,107,0.3); }
        
        /* Products Section */
        .products { background: white; padding: 80px 0; }
        .section-title { text-align: center; font-size: 2.5em; margin-bottom: 50px; color: #333; }
        .product-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; }
        .product-card { background: #f8f9fa; border-radius: 20px; padding: 30px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.1); transition: 0.3s; border: 1px solid #e9ecef; }
        .product-card:hover { transform: translateY(-10px); box-shadow: 0 20px 40px rgba(0,0,0,0.15); }
        .product-icon { font-size: 3em; color: #667eea; margin-bottom: 20px; }
        .product-title { font-size: 1.4em; font-weight: bold; margin-bottom: 15px; color: #333; }
        .product-price { font-size: 2em; font-weight: bold; color: #ff6b6b; margin-bottom: 20px; }
        .product-features { list-style: none; margin-bottom: 25px; text-align: left; }
        .product-features li { padding: 8px 0; color: #666; }
        .product-features li i { color: #28a745; margin-right: 10px; }
        .buy-btn { background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 12px 30px; border-radius: 25px; cursor: pointer; font-size: 1.1em; width: 100%; transition: 0.3s; }
        .buy-btn:hover { background: linear-gradient(135deg, #764ba2, #667eea); transform: translateY(-2px); }
        
        /* Features Section */
        .features { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 80px 0; color: white; }
        .feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 40px; }
        .feature-card { text-align: center; padding: 30px; }
        .feature-icon { font-size: 3em; margin-bottom: 20px; }
        .feature-title { font-size: 1.4em; margin-bottom: 15px; font-weight: bold; }
        
        /* Footer */
        .footer { background: #2c3e50; color: white; padding: 50px 0; text-align: center; }
    </style>
</head>
<body>
    <!-- Header -->
    <header class="header">
        <div class="container">
            <nav class="navbar">
                <div class="logo">Premium<span>Shop</span></div>
                <div class="nav-links">
                    <a href="#home">Home</a>
                    <a href="#products">Products</a>
                    <a href="#features">Why Us</a>
                    <a href="#contact">Contact</a>
                </div>
            </nav>
        </div>
    </header>

    <!-- Hero Section -->
    <section class="hero" id="home">
        <div class="container">
            <h1>Premium Quality Products</h1>
            <p>Experience the best quality with unbeatable prices. Your satisfaction is our priority.</p>
            <button class="cta-button" onclick="scrollToProducts()">Shop Now <i class="fas fa-arrow-right"></i></button>
        </div>
    </section>

    <!-- Products Section -->
    <section class="products" id="products">
        <div class="container">
            <h2 class="section-title">Our Premium Products</h2>
            <div class="product-grid">
                <div class="product-card">
                    <div class="product-icon"><i class="fas fa-star"></i></div>
                    <div class="product-title">Premium Product Elite</div>
                    <div class="product-price">690৳</div>
                    <ul class="product-features">
                        <li><i class="fas fa-check"></i> High Quality Material</li>
                        <li><i class="fas fa-check"></i> 1 Year Warranty</li>
                        <li><i class="fas fa-check"></i> Free Delivery</li>
                        <li><i class="fas fa-check"></i> 24/7 Support</li>
                    </ul>
                    <button class="buy-btn" onclick="window.location.href='/product'">Buy Now <i class="fas fa-shopping-cart"></i></button>
                </div>
                
                <div class="product-card">
                    <div class="product-icon"><i class="fas fa-crown"></i></div>
                    <div class="product-title">Deluxe Edition</div>
                    <div class="product-price">890৳</div>
                    <ul class="product-features">
                        <li><i class="fas fa-check"></i> Premium Quality</li>
                        <li><i class="fas fa-check"></i> 2 Years Warranty</li>
                        <li><i class="fas fa-check"></i> Fast Delivery</li>
                        <li><i class="fas fa-check"></i> Priority Support</li>
                    </ul>
                    <button class="buy-btn" onclick="window.location.href='/product'">Buy Now <i class="fas fa-shopping-cart"></i></button>
                </div>
                
                <div class="product-card">
                    <div class="product-icon"><i class="fas fa-gem"></i></div>
                    <div class="product-title">Ultimate Package</div>
                    <div class="product-price">1,290৳</div>
                    <ul class="product-features">
                        <li><i class="fas fa-check"></i> Best Quality</li>
                        <li><i class="fas fa-check"></i> Lifetime Warranty</li>
                        <li><i class="fas fa-check"></i> Instant Delivery</li>
                        <li><i class="fas fa-check"></i VIP Support</li>
                    </ul>
                    <button class="buy-btn" onclick="window.location.href='/product'">Buy Now <i class="fas fa-shopping-cart"></i></button>
                </div>
            </div>
        </div>
    </section>

    <!-- Features Section -->
    <section class="features" id="features">
        <div class="container">
            <h2 class="section-title">Why Choose Us?</h2>
            <div class="feature-grid">
                <div class="feature-card">
                    <div class="feature-icon"><i class="fas fa-shipping-fast"></i></div>
                    <div class="feature-title">Fast Delivery</div>
                    <p>Get your products delivered within 24 hours</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon"><i class="fas fa-shield-alt"></i></div>
                    <div class="feature-title">Secure Payment</div>
                    <p>100% secure and encrypted payment process</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon"><i class="fas fa-headset"></i></div>
                    <div class="feature-title">24/7 Support</div>
                    <p>Round the clock customer support</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon"><i class="fas fa-undo"></i></div>
                    <div class="feature-title">Easy Returns</div>
                    <p>30-day hassle-free return policy</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="footer" id="contact">
        <div class="container">
            <h3>Premium Shop</h3>
            <p>Your trusted partner for quality products</p>
            <p>Email: support@premiumshop.com | Phone: +880 XXXX-XXXXXX</p>
            <p>&copy; 2024 Premium Shop. All rights reserved.</p>
        </div>
    </footer>

    <script>
        function scrollToProducts() {
            document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
        }
    </script>
</body>
</html>
  `);
});

app.get('/product', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Premium Product Elite - Premium Shop</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
        
        .container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
        .back-btn { background: rgba(255,255,255,0.2); color: white; border: none; padding: 12px 25px; border-radius: 25px; cursor: pointer; margin-bottom: 30px; backdrop-filter: blur(10px); transition: 0.3s; }
        .back-btn:hover { background: rgba(255,255,255,0.3); transform: translateX(-5px); }
        
        .product-detail { background: rgba(255,255,255,0.95); backdrop-filter: blur(20px); border-radius: 30px; padding: 50px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
        .product-header { display: grid; grid-template-columns: 1fr 1fr; gap: 50px; margin-bottom: 40px; }
        .product-image { background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 20px; height: 400px; display: flex; align-items: center; justify-content: center; color: white; font-size: 2em; }
        .product-info h1 { font-size: 2.5em; color: #333; margin-bottom: 20px; }
        .product-price { font-size: 3em; color: #ff6b6b; font-weight: bold; margin-bottom: 20px; }
        .product-rating { color: #ffd700; font-size: 1.3em; margin-bottom: 20px; }
        .product-description { color: #666; line-height: 1.8; margin-bottom: 30px; font-size: 1.1em; }
        
        .specs-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 40px 0; }
        .spec-card { background: #f8f9fa; padding: 20px; border-radius: 15px; text-align: center; }
        .spec-icon { font-size: 2em; color: #667eea; margin-bottom: 10px; }
        
        .order-section { background: linear-gradient(135deg, #667eea, #764ba2); padding: 40px; border-radius: 20px; color: white; text-align: center; }
        .order-btn { background: #ff6b6b; color: white; border: none; padding: 20px 50px; font-size: 1.3em; border-radius: 50px; cursor: pointer; transition: 0.3s; margin-top: 20px; }
        .order-btn:hover { background: #ff5252; transform: translateY(-5px); box-shadow: 0 15px 35px rgba(255,107,107,0.4); }
    </style>
</head>
<body>
    <div class="container">
        <button class="back-btn" onclick="window.location.href='/'"><i class="fas fa-arrow-left"></i> Back to Store</button>
        
        <div class="product-detail">
            <div class="product-header">
                <div class="product-image">
                    <i class="fas fa-star"></i>
                </div>
                <div class="product-info">
                    <h1>Premium Product Elite</h1>
                    <div class="product-price">690৳</div>
                    <div class="product-rating">
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                        (4.9/5.0)
                    </div>
                    <p class="product-description">
                        Experience unparalleled quality with our Premium Product Elite. Designed for excellence and built to last, this product offers the perfect combination of style, functionality, and durability. Trusted by thousands of satisfied customers worldwide.
                    </p>
                    <button class="order-btn" onclick="window.location.href='/order'">
                        <i class="fas fa-bolt"></i> Order Now - 690৳
                    </button>
                </div>
            </div>
            
            <div class="specs-grid">
                <div class="spec-card">
                    <div class="spec-icon"><i class="fas fa-award"></i></div>
                    <h3>Premium Quality</h3>
                    <p>Highest grade materials</p>
                </div>
                <div class="spec-card">
                    <div class="spec-icon"><i class="fas fa-shield-alt"></i></div>
                    <h3>1 Year Warranty</h3>
                    <p>Full coverage guarantee</p>
                </div>
                <div class="spec-card">
                    <div class="spec-icon"><i class="fas fa-shipping-fast"></i></div>
                    <h3>Free Delivery</h3>
                    <p>24-hour shipping</p>
                </div>
                <div class="spec-card">
                    <div class="spec-icon"><i class="fas fa-headset"></i></div>
                    <h3>24/7 Support</h3>
                    <p>Always here to help</p>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
  `);
});

app.get('/order', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Now - Premium Shop</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 40px 20px; }
        
        .container { max-width: 800px; margin: 0 auto; }
        .back-btn { background: rgba(255,255,255,0.2); color: white; border: none; padding: 12px 25px; border-radius: 25px; cursor: pointer; margin-bottom: 30px; backdrop-filter: blur(10px); transition: 0.3s; }
        .back-btn:hover { background: rgba(255,255,255,0.3); }
        
        .order-form { background: rgba(255,255,255,0.95); backdrop-filter: blur(20px); border-radius: 30px; padding: 50px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
        .form-title { text-align: center; font-size: 2.5em; color: #333; margin-bottom: 10px; }
        .form-subtitle { text-align: center; color: #666; margin-bottom: 40px; }
        
        .product-summary { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 30px; border-radius: 20px; margin-bottom: 40px; text-align: center; }
        .product-name { font-size: 1.5em; margin-bottom: 10px; }
        .product-price { font-size: 2.5em; font-weight: bold; }
        
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 30px; }
        .form-group { margin-bottom: 25px; }
        .form-group.full { grid-column: 1 / -1; }
        label { display: block; margin-bottom: 8px; font-weight: 600; color: #333; }
        input, textarea, select { width: 100%; padding: 15px 20px; border: 2px solid #e9ecef; border-radius: 15px; font-size: 1em; transition: 0.3s; }
        input:focus, textarea:focus, select:focus { border-color: #667eea; outline: none; box-shadow: 0 0 0 3px rgba(102,126,234,0.1); }
        textarea { height: 120px; resize: vertical; }
        
        .submit-btn { background: linear-gradient(135deg, #ff6b6b, #ff5252); color: white; border: none; padding: 20px; font-size: 1.2em; border-radius: 15px; cursor: pointer; width: 100%; transition: 0.3s; font-weight: bold; }
        .submit-btn:hover { transform: translateY(-3px); box-shadow: 0 15px 35px rgba(255,107,107,0.4); }
        
        .security-notice { text-align: center; margin-top: 20px; color: #666; font-size: 0.9em; }
        .security-notice i { color: #28a745; margin-right: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <button class="back-btn" onclick="window.location.href='/product'"><i class="fas fa-arrow-left"></i> Back to Product</button>
        
        <div class="order-form">
            <h1 class="form-title">Complete Your Order</h1>
            <p class="form-subtitle">Fill in your details and we'll contact you for confirmation</p>
            
            <div class="product-summary">
                <div class="product-name">Premium Product Elite</div>
                <div class="product-price">690৳</div>
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
                
                <input type="hidden" name="product" value="Premium Product Elite">
                <input type="hidden" name="price" value="690">
                
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
                    alert('🎉 Order Submitted Successfully!\\n\\nWe have received your order. Our team will call you within 30 minutes to confirm and process your order.\\n\\nThank you for choosing Premium Shop!');
                    
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
  const { name, phone, address, city, area, product, notes } = req.body;
  
  // Generate order ID
  const orderId = 'ORD' + Date.now();
  
  // Store order temporarily
  const orderData = {
    orderId,
    name,
    phone, 
    address: `${address}, ${area}, ${city}`,
    product,
    price: '690৳',
    notes: notes || 'No additional notes',
    timestamp: new Date().toISOString()
  };
  
  pendingOrders.set(orderId, orderData);
  
  // Log the order details
  console.log('🛒 NEW ORDER RECEIVED:');
  console.log('═════════════════');
  console.log('📦 Order ID:', orderId);
  console.log('👤 Customer:', name);
  console.log('📞 Phone:', phone);
  console.log('📍 Address:', `${address}, ${area}, ${city}`);
  console.log('🛍️ Product:', product);
  console.log('💰 Price: 690৳');
  console.log('📝 Notes:', notes || 'None');
  console.log('⏰ Time:', new Date().toLocaleString());
  console.log('═════════════════');
  
  // Here you can integrate with your bot to send this to admin thread
  // For example: sendOrderToAdmin(orderData);
  
  res.json({
    success: true,
    message: 'Order received successfully! Our team will call you within 30 minutes to confirm your order.',
    orderId: orderId,
    nextStep: 'Wait for phone call confirmation'
  });
});

// Function to send order to admin (you can integrate with your bot)
function sendOrderToAdmin(orderData) {
  const adminMessage = `
🛒 **NEW ORDER RECEIVED** 🛒

📦 Order ID: ${orderData.orderId}
👤 Customer: ${orderData.name}
📞 Phone: ${orderData.phone}
📍 Address: ${orderData.address}
🛍️ Product: ${orderData.product}
💰 Price: ${orderData.price}
📝 Notes: ${orderData.notes}
⏰ Time: ${new Date(orderData.timestamp).toLocaleString()}

📞 **Please call the customer to confirm the order!**
  `;
  
  // Here you would use your bot's API to send this message to admin thread
  // api.sendMessage(adminMessage, "10054266134628383");
  console.log('📤 Sending to admin thread:', adminMessage);
}

// Start server
app.listen(PORT, () => {
  console.log(`🛒 Premium e-commerce website running on port ${PORT}`);
  console.log(`📍 Visit: http://localhost:${PORT}`);
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
