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

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve HTML pages from single file
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E-Commerce Store</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
        .product-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 30px; }
        .product-card { background: white; border-radius: 10px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .product-image { width: 100%; height: 200px; background: linear-gradient(45deg, #3498db, #9b59b6); border-radius: 5px; margin-bottom: 15px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; }
        .product-title { font-size: 1.2em; font-weight: bold; margin-bottom: 10px; }
        .product-price { color: #e74c3c; font-size: 1.3em; font-weight: bold; margin-bottom: 15px; }
        .buy-btn { background: #27ae60; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; width: 100%; font-size: 1.1em; }
        .buy-btn:hover { background: #219a52; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🛍️ Welcome to Our Store</h1>
        <p>Best products at best prices</p>
    </div>
    
    <div class="container">
        <div class="product-grid">
            <div class="product-card">
                <div class="product-image">PREMIUM PRODUCT</div>
                <div class="product-title">Premium Quality Product</div>
                <div class="product-price">690৳</div>
                <button class="buy-btn" onclick="window.location.href='/product'">Buy Now</button>
            </div>
            
            <div class="product-card">
                <div class="product-image">DELUXE PRODUCT</div>
                <div class="product-title">Deluxe Edition Product</div>
                <div class="product-price">890৳</div>
                <button class="buy-btn" onclick="window.location.href='/product'">Buy Now</button>
            </div>
        </div>
    </div>
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
    <title>Product Details</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: #f5f5f5; }
        .container { max-width: 800px; margin: 50px auto; padding: 20px; }
        .product-detail { background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .product-image { width: 100%; height: 300px; background: linear-gradient(45deg, #3498db, #9b59b6); border-radius: 10px; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5em; font-weight: bold; }
        .product-title { font-size: 1.8em; font-weight: bold; margin-bottom: 10px; }
        .product-price { color: #e74c3c; font-size: 2em; font-weight: bold; margin-bottom: 20px; }
        .product-description { margin-bottom: 30px; line-height: 1.6; color: #666; }
        .order-btn { background: #e67e22; color: white; border: none; padding: 15px 30px; border-radius: 5px; cursor: pointer; font-size: 1.1em; width: 100%; }
        .order-btn:hover { background: #d35400; }
        .back-btn { background: #95a5a6; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-bottom: 20px; }
        .back-btn:hover { background: #7f8c8d; }
    </style>
</head>
<body>
    <div class="container">
        <button class="back-btn" onclick="window.location.href='/'">← Back to Store</button>
        
        <div class="product-detail">
            <div class="product-image">PREMIUM PRODUCT IMAGE</div>
            <h1 class="product-title">Premium Quality Product</h1>
            <div class="product-price">690৳</div>
            <p class="product-description">
                High-quality premium product with excellent features. This product offers the best value for your money with guaranteed satisfaction. Perfect for everyday use with durable materials and superior craftsmanship.
            </p>
            <button class="order-btn" onclick="window.location.href='/order'">🛒 Order Now - 690৳</button>
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
    <title>Order Form</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: #f5f5f5; }
        .container { max-width: 600px; margin: 50px auto; padding: 20px; }
        .order-form { background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .form-title { font-size: 1.8em; font-weight: bold; margin-bottom: 20px; text-align: center; }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input, textarea { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 5px; font-size: 1em; }
        textarea { height: 80px; resize: vertical; }
        .submit-btn { background: #27ae60; color: white; border: none; padding: 15px; border-radius: 5px; cursor: pointer; font-size: 1.1em; width: 100%; }
        .submit-btn:hover { background: #219a52; }
        .back-btn { background: #95a5a6; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-bottom: 20px; }
        .back-btn:hover { background: #7f8c8d; }
        .product-info { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .price { color: #e74c3c; font-weight: bold; font-size: 1.2em; }
    </style>
</head>
<body>
    <div class="container">
        <button class="back-btn" onclick="window.location.href='/product'">← Back to Product</button>
        
        <div class="order-form">
            <div class="form-title">📦 Place Your Order</div>
            
            <div class="product-info">
                <strong>Product:</strong> Premium Quality Product<br>
                <strong class="price">Price: 690৳</strong>
            </div>

            <form id="orderForm" action="/submit-order" method="POST">
                <div class="form-group">
                    <label for="name">Full Name *</label>
                    <input type="text" id="name" name="name" required>
                </div>
                
                <div class="form-group">
                    <label for="address">Delivery Address *</label>
                    <textarea id="address" name="address" required></textarea>
                </div>
                
                <div class="form-group">
                    <label for="phone">Phone Number *</label>
                    <input type="tel" id="phone" name="phone" required>
                </div>
                
                <input type="hidden" name="product" value="Premium Quality Product">
                <input type="hidden" name="price" value="690">
                
                <button type="submit" class="submit-btn">✅ Submit Order</button>
            </form>
        </div>
    </div>

    <script>
        document.getElementById('orderForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
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
                alert('✅ ' + result.message);
                window.location.href = '/';
            } else {
                alert('❌ Error: ' + result.message);
            }
        });
    </script>
</body>
</html>
  `);
});

// API endpoint to handle orders
app.post('/submit-order', (req, res) => {
  const { name, address, phone, product } = req.body;
  
  // Log the order (you can save to database here)
  console.log('🛒 NEW ORDER RECEIVED:');
  console.log('Name:', name);
  console.log('Address:', address);
  console.log('Phone:', phone);
  console.log('Product:', product);
  console.log('Price: 690৳');
  console.log('---');
  
  res.json({
    success: true,
    message: 'Order received! Please go to Thread ID: 10054266134628383 and type "confirm 690tk" to complete your order.',
    threadId: '10054266134628383',
    instructions: 'Go to the specified thread and type: confirm 690tk'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🛒 E-commerce website running on port ${PORT}`);
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
