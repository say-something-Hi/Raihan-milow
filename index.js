/**
 * @author NTKhang
 * ! The source code is written by NTKhang, please don't change the author's name everywhere. Thank you for using
 * ! Official source code: https://github.com/ntkhang03/Goat-Bot-V2
 * ! If you do not download the source code from the above address, you are using an unknown version and at risk of having your account hacked
 * * 🐐 Goat-Bot V2 - Mobile Responsive Control Panel (Raihan's Enhanced Version)
 * 👑 Owner: Raihan
 * 📧 Contact: mayberaihan00@gmail.com
 * 📱 Fully Mobile Compatible
 */

const { spawn } = require("child_process");
const log = require("./logger/log.js");
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'goat-bot-mobile-secret-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Configuration
const ADMIN_PASSWORD = 'Raihan@008897';
const BOT_OWNER = 'Raihan';
const BOT_EMAIL = 'mayberaihan00@gmail.com';

// Global variables
let botProcess = null;
let botStatus = 'offline';
let botStats = {
    startTime: null,
    messagesProcessed: 0,
    commandsExecuted: 0,
    usersServed: 0,
    groupsManaged: 0,
    uptime: '0s',
    performance: 'Optimal' // This can be updated via IPC
};

// Authentication middleware
function requireAuth(req, res, next) {
    if (req.session.authenticated) {
        return next();
    }
    res.redirect('/login');
}

// Bot Control Functions
function startBot() {
    if (botProcess) {
        return { success: false, message: '❌ Bot already running!' };
    }

    try {
        // MODIFICATION: Added 'ipc' to stdio to allow communication from Goat.js
        botProcess = spawn("node", ["Goat.js"], {
            cwd: __dirname,
            stdio: ["inherit", "inherit", "inherit", "ipc"], // stdin, stdout, stderr, ipc
            shell: false
        });

        botStatus = 'online';
        botStats.startTime = new Date();

        // MODIFICATION: Listen for messages (like stats) from the bot process
        botProcess.on('message', (message) => {
            if (message.type === 'statsUpdate' && message.data) {
                log.info('Received stats update from bot process.');
                botStats.messagesProcessed = message.data.messagesProcessed || botStats.messagesProcessed;
                botStats.commandsExecuted = message.data.commandsExecuted || botStats.commandsExecuted;
                botStats.usersServed = message.data.usersServed || botStats.usersServed;
                botStats.groupsManaged = message.data.groupsManaged || botStats.groupsManaged;
                botStats.performance = message.data.performance || botStats.performance;
            }
        });
        
        botProcess.on('error', (error) => {
            log.error(`Bot process error: ${error.message}`);
        });

        botProcess.on("close", (code) => {
            log.warn(`Bot process exited with code ${code}`);
            botProcess = null;
            botStatus = 'offline';
            botStats.uptime = '0s'; // Reset uptime
            // Auto-restart if exit code is 2 (e.g., custom restart)
            if (code == 2) {
                log.info("🔄 Auto-restarting Bot due to code 2...");
                setTimeout(() => startBot(), 3000);
            }
        });

        return { success: true, message: '✅ Bot started successfully!' };
    } catch (error) {
        log.error(`Failed to start bot: ${error.message}`);
        return { success: false, message: '❌ Failed to start bot' };
    }
}

function stopBot() {
    if (!botProcess) {
        return { success: false, message: '❌ Bot is not running!' };
    }

    try {
        // MODIFICATION: Remove all listeners to prevent memory leaks
        botProcess.removeAllListeners();
        botProcess.kill();
        botProcess = null;
        botStatus = 'offline';
        return { success: true, message: '✅ Bot stopped successfully!' };
    } catch (error) {
        log.error(`Failed to stop bot: ${error.message}`);
        return { success: false, message: '❌ Failed to stop bot' };
    }
}

function restartBot() {
    const stopResult = stopBot();
    if (!stopResult.success && stopResult.message.includes('not running')) {
        // If it's not running, just start it.
        return startBot();
    }
    
    setTimeout(() => startBot(), 3000);
    return { success: true, message: '🔄 Bot restarting...' };
}

function updateStats() {
    if (botStatus === 'online' && botStats.startTime) {
        const uptime = Math.floor((new Date() - botStats.startTime) / 1000);
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = uptime % 60;
        botStats.uptime = `${hours}h ${minutes}m ${seconds}s`;
        
        // MODIFICATION: Removed fake random stat increments.
        // Stats are now only updated via IPC messages from Goat.js
    }
}

// Routes
app.get('/', (req, res) => {
    if (req.session.authenticated) {
        res.redirect('/dashboard');
    } else {
        res.redirect('/login');
    }
});

// Mobile Responsive Login Page
app.get('/login', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <title>🐐 Goat-Bot V2</title>
            <style>
                /* Reset and Base Styles */
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    -webkit-tap-highlight-color: transparent;
                }

                html {
                    font-size: 16px;
                }

                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: #333;
                    min-height: 100vh;
                    min-height: -webkit-fill-available;
                    padding: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    line-height: 1.5;
                    transition: background 0.3s ease;
                }

                /* Login Container */
                .login-container {
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(20px);
                    border-radius: 20px;
                    padding: clamp(20px, 5vw, 40px);
                    width: 100%;
                    max-width: 400px;
                    text-align: center;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    transition: background 0.3s ease, color 0.3s ease;
                }

                /* Logo Section */
                .logo {
                    margin-bottom: clamp(20px, 6vw, 30px);
                }

                .logo h1 {
                    font-size: clamp(1.8rem, 8vw, 2.5rem);
                    font-weight: 800;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    margin-bottom: 8px;
                }

                .logo p {
                    font-size: clamp(0.9rem, 4vw, 1.1rem);
                    color: #666;
                    font-weight: 500;
                    transition: color 0.3s ease;
                }

                /* Owner Info */
                .owner-info {
                    background: rgba(102, 126, 234, 0.1);
                    border-radius: 12px;
                    padding: clamp(15px, 4vw, 20px);
                    margin-bottom: clamp(20px, 6vw, 30px);
                    border-left: 4px solid #667eea;
                    transition: background 0.3s ease, border-color 0.3s ease;
                }

                .owner-info h3 {
                    font-size: clamp(1rem, 4.5vw, 1.2rem);
                    color: #333;
                    margin-bottom: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: color 0.3s ease;
                }

                .owner-info p {
                    font-size: clamp(0.8rem, 3.5vw, 0.9rem);
                    color: #555;
                    margin: 4px 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    transition: color 0.3s ease;
                }

                /* Form Styles */
                .form-group {
                    margin-bottom: clamp(15px, 4vw, 20px);
                    text-align: left;
                }

                .form-group label {
                    display: block;
                    font-size: clamp(0.9rem, 4vw, 1rem);
                    font-weight: 600;
                    color: #333;
                    margin-bottom: 8px;
                    padding-left: 5px;
                    transition: color 0.3s ease;
                }

                .password-input {
                    width: 100%;
                    padding: clamp(12px, 4vw, 16px);
                    border: 2px solid #e1e5e9;
                    border-radius: 12px;
                    font-size: clamp(1rem, 4.5vw, 1.1rem);
                    background: #fff;
                    color: #333;
                    transition: all 0.3s ease;
                    -webkit-appearance: none;
                }

                .password-input:focus {
                    outline: none;
                    border-color: #667eea;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                    transform: translateY(-2px);
                }

                /* Button Styles */
                .login-btn {
                    width: 100%;
                    padding: clamp(14px, 4vw, 18px);
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-size: clamp(1rem, 4.5vw, 1.1rem);
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    margin-top: 10px;
                    -webkit-appearance: none;
                    touch-action: manipulation;
                }

                .login-btn:active {
                    transform: scale(0.98);
                }

                .login-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                    transform: none;
                }
                
                /* MODIFICATION: Theme Toggle Button */
                .theme-toggle-btn {
                    position: fixed;
                    top: clamp(10px, 3vw, 20px);
                    right: clamp(10px, 3vw, 20px);
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    border: none;
                    background: rgba(255, 255, 255, 0.2);
                    color: white;
                    font-size: 1.5rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    z-index: 1000;
                    -webkit-appearance: none;
                    touch-action: manipulation;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .theme-toggle-btn:active {
                    transform: scale(0.9);
                }
                
                body.dark-mode .theme-toggle-btn {
                    background: rgba(0, 0, 0, 0.3);
                    color: #fff;
                }

                /* Message Styles */
                .message {
                    margin-top: clamp(15px, 4vw, 20px);
                    padding: clamp(12px, 3vw, 15px);
                    border-radius: 10px;
                    text-align: center;
                    display: none;
                    font-size: clamp(0.9rem, 4vw, 1rem);
                    font-weight: 600;
                }

                .success {
                    background: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }

                .error {
                    background: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                }
                
                /* ... Responsive styles remain unchanged ... */

                /* MODIFICATION: Dark Mode Support (changed from @media to class-based) */
                body.dark-mode {
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                }
                
                body.dark-mode .login-container {
                    background: rgba(40, 40, 60, 0.95);
                    color: #fff;
                }
                
                body.dark-mode .logo p {
                    color: #ccc;
                }
                
                body.dark-mode .owner-info {
                    background: rgba(102, 126, 234, 0.2);
                    color: #fff;
                    border-left-color: #667eea;
                    border: 1px solid rgba(102, 126, 234, 0.3);
                    border-left: 4px solid #667eea;
                }
                
                body.dark-mode .owner-info h3 {
                    color: #fff;
                }
                
                body.dark-mode .owner-info p {
                    color: #ccc;
                }
                
                body.dark-mode .form-group label {
                    color: #fff;
                }
                
                body.dark-mode .password-input {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: rgba(255, 255, 255, 0.2);
                    color: #fff;
                }
                
                body.dark-mode .password-input::placeholder {
                    color: #888;
                }
                
                body.dark-mode .password-input:focus {
                    background: rgba(255, 255, 255, 0.15);
                }

                /* ... Safe Area Insets remain unchanged ... */

                /* Loading Animation */
                .loading {
                    display: inline-block;
                    width: 20px;
                    height: 20px;
                    border: 3px solid rgba(255,255,255,.3);
                    border-radius: 50%;
                    border-top-color: #fff;
                    animation: spin 1s ease-in-out infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            </style>
        </head>
        <body>
            <button id="theme-toggle" class="theme-toggle-btn">🌙</button>

            <div class="login-container">
                <div class="logo">
                    <h1>🐐 Goat-Bot V2</h1>
                    <p>Mobile Control Panel</p>
                </div>
                
                <div class="owner-info">
                    <h3>👑 ${BOT_OWNER}</h3>
                    <p>📧 ${BOT_EMAIL}</p>
                    <p>🔐 Admin Access Required</p>
                </div>

                <form id="loginForm">
                    <div class="form-group">
                        <label for="password">Admin Password:</label>
                        <input type="password" id="password" class="password-input" placeholder="Enter password" required>
                    </div>
                    <button type="submit" class="login-btn">🚀 Login to Dashboard</button>
                </form>
                
                <div id="message" class="message"></div>
            </div>

            <script>
                // MODIFICATION: Theme Toggle Script
                const themeToggleBtn = document.getElementById('theme-toggle');
                const bodyEl = document.body;

                function setLoginTheme(theme) {
                    if (theme === 'dark') {
                        bodyEl.classList.add('dark-mode');
                        themeToggleBtn.textContent = '☀️';
                        localStorage.setItem('theme', 'dark');
                    } else {
                        bodyEl.classList.remove('dark-mode');
                        themeToggleBtn.textContent = '🌙';
                        localStorage.setItem('theme', 'light');
                    }
                }

                themeToggleBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const currentTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                    setLoginTheme(currentTheme === 'dark' ? 'light' : 'dark');
                });

                // On page load, apply theme
                (function() {
                    const savedLoginTheme = localStorage.getItem('theme');
                    if (savedLoginTheme) {
                        setLoginTheme(savedLoginTheme);
                    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                        setLoginTheme('dark');
                    } else {
                        setLoginTheme('light');
                    }
                })();

                // Mobile-friendly touch events
                document.getElementById('loginForm').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const password = document.getElementById('password').value;
                    const messageDiv = document.getElementById('message');
                    const btn = e.target.querySelector('button');
                    
                    // Visual feedback
                    btn.disabled = true;
                    btn.innerHTML = '<div class="loading"></div> Authenticating...';
                    
                    try {
                        const response = await fetch('/login', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ password })
                        });
                        
                        const result = await response.json();
                        
                        if (result.success) {
                            messageDiv.className = 'message success';
                            messageDiv.textContent = '✅ Login successful!';
                            messageDiv.style.display = 'block';
                            
                            // Redirect after short delay
                            setTimeout(() => {
                                window.location.href = '/dashboard';
                            }, 800);
                        } else {
                            messageDiv.className = 'message error';
                            messageDiv.textContent = '❌ ' + result.message;
                            messageDiv.style.display = 'block';
                            
                            // Shake animation for error
                            btn.style.animation = 'shake 0.5s ease-in-out';
                            setTimeout(() => btn.style.animation = '', 500);
                        }
                    } catch (error) {
                        messageDiv.className = 'message error';
                        messageDiv.textContent = '❌ Network error. Try again.';
                        messageDiv.style.display = 'block';
                    } finally {
                        btn.disabled = false;
                        btn.textContent = '🚀 Login to Dashboard';
                    }
                });

                // Add shake animation for errors
                const style = document.createElement('style');
                style.textContent = \`
                    @keyframes shake {
                        0%, 100% { transform: translateX(0); }
                        25% { transform: translateX(-5px); }
                        75% { transform: translateX(5px); }
                    }
                \`;
                document.head.appendChild(style);
                
                // ... Other mobile scripts remain unchanged ...
            </script>
        </body>
        </html>
    `);
});

app.post('/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        req.session.authenticated = true;
        res.json({ success: true });
    } else {
        res.json({ success: false, message: 'Invalid password!' });
    }
});

// Mobile Responsive Dashboard
app.get('/dashboard', requireAuth, (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <title>🐐 Goat-Bot Dashboard</title>
            <style>
                /* Reset and Base Styles */
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    -webkit-tap-highlight-color: transparent;
                }

                :root {
                    --primary: #667eea;
                    --secondary: #764ba2;
                    --success: #43b581;
                    --danger: #f04747;
                    --warning: #faa61a;
                    --dark: #1a1a2e;
                    --darker: #16213e;
                    --text: #333;
                    --text-light: #666;
                    --bg: #f8f9fa;
                }

                html {
                    font-size: 16px;
                    scroll-behavior: smooth;
                }

                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
                    background: var(--bg);
                    color: var(--text);
                    line-height: 1.6;
                    min-height: 100vh;
                    min-height: -webkit-fill-available;
                    transition: background 0.3s ease, color 0.3s ease;
                }

                /* Header Styles */
                .mobile-header {
                    background: linear-gradient(135deg, var(--primary), var(--secondary));
                    color: white;
                    padding: clamp(15px, 4vw, 20px);
                    position: sticky;
                    top: 0;
                    z-index: 1000;
                    box-shadow: 0 2px 20px rgba(0,0,0,0.1);
                }

                .header-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                }

                .logo h1 {
                    font-size: clamp(1.3rem, 6vw, 1.8rem);
                    font-weight: 800;
                }

                .mobile-nav {
                    display: flex;
                    gap: 10px;
                }

                .nav-btn {
                    padding: 8px 16px;
                    background: rgba(255,255,255,0.2);
                    border: none;
                    border-radius: 8px;
                    color: white;
                    text-decoration: none;
                    font-size: clamp(0.8rem, 3.5vw, 0.9rem);
                    font-weight: 600;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 44px;
                    min-height: 38px;
                }

                .nav-btn:active {
                    transform: scale(0.95);
                }

                .owner-info {
                    font-size: clamp(0.8rem, 3.5vw, 0.9rem);
                    opacity: 0.9;
                }

                /* Main Container */
                .container {
                    padding: clamp(15px, 4vw, 20px);
                    max-width: 1200px;
                    margin: 0 auto;
                }

                /* Status Panel */
                .status-panel {
                    background: white;
                    border-radius: 16px;
                    padding: clamp(20px, 5vw, 30px);
                    margin-bottom: 20px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                    border: 1px solid rgba(0,0,0,0.05);
                    transition: background 0.3s ease, border-color 0.3s ease;
                }

                /* ... Status Header, Indicator, Title styles unchanged ... */
                .status-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 20px;
                }
                .status-indicator {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                }
                .status-indicator.online {
                    background: var(--success);
                    box-shadow: 0 0 10px var(--success);
                    animation: pulse 2s infinite;
                }
                .status-indicator.offline {
                    background: var(--danger);
                    box-shadow: 0 0 10px var(--danger);
                }
                .status-title {
                    font-size: clamp(1.2rem, 5vw, 1.5rem);
                    font-weight: 700;
                    color: var(--text);
                }


                /* ... Control Grid and Buttons styles unchanged ... */
                .control-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                    margin: 20px 0;
                }
                .control-btn {
                    padding: clamp(14px, 4vw, 18px);
                    border: none;
                    border-radius: 12px;
                    font-size: clamp(0.9rem, 4vw, 1rem);
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-align: center;
                    -webkit-appearance: none;
                    touch-action: manipulation;
                }
                .control-btn:active {
                    transform: scale(0.96);
                }
                .control-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }
                .btn-start {
                    background: linear-gradient(135deg, var(--success), #2e8b57);
                    color: white;
                }
                .btn-stop {
                    background: linear-gradient(135deg, var(--danger), #cc0000);
                    color: white;
                }
                .btn-restart {
                    grid-column: 1 / -1;
                    background: linear-gradient(135deg, var(--warning), #ff8c00);
                    color: #000;
                }


                /* Stats Grid */
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 12px;
                    margin: 20px 0;
                }

                .stat-card {
                    background: rgba(102, 126, 234, 0.05);
                    border: 1px solid rgba(102, 126, 234, 0.1);
                    border-radius: 12px;
                    padding: clamp(15px, 4vw, 20px);
                    text-align: center;
                    transition: all 0.3s ease;
                }
                /* ... Stat Card, Value, Label styles unchanged ... */
                .stat-card:active {
                    transform: scale(0.98);
                }
                .stat-value {
                    font-size: clamp(1.5rem, 7vw, 2rem);
                    font-weight: 800;
                    color: var(--primary);
                    margin-bottom: 5px;
                }
                .stat-label {
                    font-size: clamp(0.75rem, 3vw, 0.85rem);
                    color: var(--text-light);
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }


                /* Features Section */
                .features-section {
                    margin: 30px 0;
                }

                .section-title {
                    font-size: clamp(1.3rem, 5vw, 1.6rem);
                    font-weight: 700;
                    text-align: center;
                    margin-bottom: 20px;
                    color: var(--text);
                }

                .features-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 15px;
                }

                .feature-card {
                    background: white;
                    border-radius: 14px;
                    padding: clamp(18px, 4vw, 24px);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.06);
                    border: 1px solid rgba(0,0,0,0.05);
                    transition: all 0.3s ease;
                }
                /* ... Feature Card inner styles unchanged ... */
                .feature-card:active {
                    transform: translateY(-2px);
                }
                .feature-icon {
                    font-size: clamp(1.8rem, 8vw, 2.2rem);
                    margin-bottom: 12px;
                    text-align: center;
                }
                .feature-title {
                    font-size: clamp(1rem, 4.5vw, 1.2rem);
                    font-weight: 700;
                    color: var(--text);
                    margin-bottom: 10px;
                    text-align: center;
                }
                .feature-list {
                    list-style: none;
                }
                .feature-list li {
                    padding: 6px 0;
                    font-size: clamp(0.8rem, 3.5vw, 0.9rem);
                    color: var(--text-light);
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    border-bottom: 1px solid rgba(0,0,0,0.05);
                }
                .feature-list li:last-child {
                    border-bottom: none;
                }
                .feature-list li:before {
                    content: "✓";
                    color: var(--success);
                    font-weight: bold;
                    font-size: 0.9em;
                }


                /* ... Logs Panel styles unchanged ... */
                .logs-panel {
                    background: var(--dark);
                    border-radius: 14px;
                    padding: 20px;
                    margin-top: 20px;
                }
                .logs-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                }
                .logs-title {
                    font-size: clamp(1rem, 4.5vw, 1.2rem);
                    font-weight: 700;
                    color: white;
                }
                .logs-content {
                    background: rgba(0,0,0,0.3);
                    color: #00ff00;
                    padding: 15px;
                    border-radius: 8px;
                    font-family: 'Courier New', monospace;
                    font-size: clamp(0.75rem, 3vw, 0.85rem);
                    line-height: 1.4;
                    height: 150px;
                    overflow-y: auto;
                    border: 1px solid rgba(0,255,0,0.1);
                }

                /* ... Notification styles unchanged ... */
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    left: 20px;
                    padding: 15px 20px;
                    border-radius: 12px;
                    color: white;
                    font-weight: 700;
                    z-index: 10000;
                    opacity: 0;
                    transform: translateY(-20px);
                    transition: all 0.3s ease;
                    text-align: center;
                    backdrop-filter: blur(20px);
                }
                .notification.show {
                    opacity: 1;
                    transform: translateY(0);
                }
                .notification.success {
                    background: linear-gradient(135deg, var(--success), #2e8b57);
                }
                .notification.error {
                    background: linear-gradient(135deg, var(--danger), #cc0000);
                }
                .notification.info {
                    background: linear-gradient(135deg, var(--primary), var(--secondary));
                }

                /* ... Animations and Responsive Design styles unchanged ... */
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.7; }
                    100% { opacity: 1; }
                }

                @media (min-width: 768px) {
                    .control-grid {
                        grid-template-columns: repeat(3, 1fr);
                    }
                    .btn-restart {
                        grid-column: auto;
                    }
                    .stats-grid {
                        grid-template-columns: repeat(3, 1fr);
                    }
                    .features-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
                @media (min-width: 1024px) {
                    .features-grid {
                        grid-template-columns: repeat(3, 1fr);
                    }
                    .stats-grid {
                        grid-template-columns: repeat(6, 1fr);
                    }
                }
                /* ... other responsive styles ... */


                /* MODIFICATION: Dark Mode Support (changed from @media to class-based) */
                body.dark-mode {
                    --bg: #1a1a2e;
                    --text: #fff;
                    --text-light: #ccc;
                }
                
                body.dark-mode .status-panel, 
                body.dark-mode .feature-card {
                    background: rgba(255,255,255,0.05);
                    border-color: rgba(255,255,255,0.1);
                }
                
                body.dark-mode .stat-card {
                    background: rgba(102, 126, 234, 0.1);
                    border-color: rgba(102, 126, 234, 0.2);
                }
                
                /* ... Safe Area Insets remain unchanged ... */
            </style>
        </head>
        <body>
            <div id="notification" class="notification"></div>

            <header class="mobile-header">
                <div class="header-top">
                    <div class="logo">
                        <h1>🐐 Goat-Bot V2</h1>
                    </div>
                    <div class="mobile-nav">
                        <a href="#" class="nav-btn" id="theme-toggle" title="Toggle Theme">🌙</a>
                        <a href="/logout" class="nav-btn" title="Logout">🚪</a>
                    </div>
                </div>
                <div class="owner-info">
                    👑 ${BOT_OWNER} | 📧 ${BOT_EMAIL}
                </div>
            </header>

            <div class="container">
                <div class="status-panel">
                    <div class="status-header">
                        <div class="status-indicator offline" id="statusIndicator"></div>
                        <div class="status-title" id="statusTitle">Bot Offline</div>
                    </div>

                    <div class="control-grid">
                        <button class="control-btn btn-start" onclick="controlBot('start')" id="startBtn">
                            🚀 Start
                        </button>
                        <button class="control-btn btn-stop" onclick="controlBot('stop')" id="stopBtn" disabled>
                            🛑 Stop
                        </button>
                        <button class="control-btn btn-restart" onclick="controlBot('restart')" id="restartBtn" disabled>
                            🔁 Restart
                        </button>
                    </div>

                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value" id="uptimeStat">0s</div>
                            <div class="stat-label">Uptime</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="messagesStat">0</div>
                            <div class="stat-label">Messages</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="commandsStat">0</div>
                            <div class="stat-label">Commands</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="usersStat">0</div>
                            <div class="stat-label">Users</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="groupsStat">0</div>
                            <div class="stat-label">Groups</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="performanceStat">Idle</div>
                            <div class="stat-label">Performance</div>
                        </div>
                    </div>
                </div>

                <div class="features-section">
                    <h2 class="section-title">🎯 Bot Features</h2>
                    <div class="features-grid">
                        <div class="feature-card">
                            <div class="feature-icon">🤖</div>
                            <div class="feature-title">AI System</div>
                            <ul class="feature-list">
                                <li>Smart Chat</li>
                                <li>Image Generation</li>
                                <li>Voice Commands</li>
                                <li>Auto Replies</li>
                            </ul>
                        </div>
                        
                        <div class="feature-card">
                            <div class="feature-icon">🎵</div>
                            <div class="feature-title">Music</div>
                            <ul class="feature-list">
                                <li>YouTube Playback</li>
                                <li>Spotify Support</li>
                                <li>Playlists</li>
                                <li>24/7 Radio</li>
                            </ul>
                        </div>

                        <div class="feature-card">
                            <div class="feature-icon">🎮</div>
                            <div class="feature-title">Games</div>
                            <ul class="feature-list">
                                <li>Economy System</li>
                                <li>Multiplayer Games</li>
                                <li>Leaderboards</li>
                                <li>Daily Rewards</li>
                            </ul>
                        </div>
                        
                        <div class="feature-card">
                            <div class="feature-icon">🛡️</div>
                            <div class="feature-title">Moderation</div>
                            <ul class="feature-list">
                                <li>Auto Moderation</li>
                                <li>Spam Protection</li>
                                <li>Word Filter</li>
                                <li>Log System</li>
                            </ul>
                        </div>

                        <div class="feature-card">
                            <div class="feature-icon">👑</div>
                            <div class="feature-title">Bot Builder</div>
                            <ul class="feature-list">
                                <li>Name: Raihan</li>
                                <li>Role: Lead Developer</li>
                                <li>Contact: ${BOT_EMAIL}</li>
                                <li>Status: Active</li>
                            </ul>
                        </div>

                        <div class="feature-card">
                            <div class="feature-icon">🎨</div>
                            <div class="feature-title">Creative</div>
                            <ul class="feature-list">
                                <li>Meme Generator</li>
                                <li>Image Editing</li>
                                <li>Custom Commands</li>
                                <li>Themes</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div class="logs-panel">
                    <div class="logs-header">
                        <div class="logs-title">📜 System Logs</div>
                        <button class="nav-btn" onclick="loadLogs()" style="background: rgba(255,255,255,0.3);">🔄</button>
                    </div>
                    <div class="logs-content" id="logsContent">
                        Initializing system...
                    </div>
                </div>
            </div>

            <script>
                // MODIFICATION: Theme Toggle Script
                const themeToggle = document.getElementById('theme-toggle');
                const body = document.body;

                function setTheme(theme) {
                    if (theme === 'dark') {
                        body.classList.add('dark-mode');
                        themeToggle.textContent = '☀️';
                        localStorage.setItem('theme', 'dark');
                    } else {
                        body.classList.remove('dark-mode');
                        themeToggle.textContent = '🌙';
                        localStorage.setItem('theme', 'light');
                    }
                }

                themeToggle.addEventListener('click', (e) => {
                    e.preventDefault();
                    // Check local storage OR system preference
                    const currentTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
                });

                // On page load, apply theme
                (function() {
                    const savedTheme = localStorage.getItem('theme');
                    if (savedTheme) {
                        setTheme(savedTheme);
                    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                        // Default to system preference if no theme saved
                        setTheme('dark');
                    } else {
                        setTheme('light');
                    }
                })();


                // Dashboard Control Script
                let isProcessing = false;

                function showNotification(message, type = 'info') {
                    const notification = document.getElementById('notification');
                    notification.textContent = message;
                    notification.className = 'notification ' + type;
                    notification.classList.add('show');
                    
                    setTimeout(() => {
                        notification.classList.remove('show');
                    }, 3000);
                }

                async function updateStatus() {
                    try {
                        const response = await fetch('/api/bot/status');
                        const data = await response.json();
                        
                        const indicator = document.getElementById('statusIndicator');
                        const title = document.getElementById('statusTitle');
                        const startBtn = document.getElementById('startBtn');
                        const stopBtn = document.getElementById('stopBtn');
                        const restartBtn = document.getElementById('restartBtn');
                        
                        if (data.status === 'online') {
                            indicator.className = 'status-indicator online';
                            title.textContent = 'Bot Online';
                            startBtn.disabled = true;
                            stopBtn.disabled = false;
                            restartBtn.disabled = false;
                        } else {
                            indicator.className = 'status-indicator offline';
                            title.textContent = 'Bot Offline';
                            startBtn.disabled = false;
                            stopBtn.disabled = true;
                            restartBtn.disabled = true;
                        }
                        
                        // MODIFICATION: Stats are now updated from the API, which gets them via IPC
                        document.getElementById('uptimeStat').textContent = data.stats.uptime;
                        document.getElementById('messagesStat').textContent = data.stats.messagesProcessed.toLocaleString();
                        document.getElementById('commandsStat').textContent = data.stats.commandsExecuted.toLocaleString();
                        document.getElementById('usersStat').textContent = data.stats.usersServed.toLocaleString();
                        document.getElementById('groupsStat').textContent = data.stats.groupsManaged.toLocaleString();
                        document.getElementById('performanceStat').textContent = data.stats.performance;
                        
                    } catch (error) {
                        console.error('Failed to update status:', error);
                        // Show offline if API fails
                        document.getElementById('statusIndicator').className = 'status-indicator offline';
                        document.getElementById('statusTitle').textContent = 'Panel Offline';
                    }
                }

                async function controlBot(action) {
                    if (isProcessing) return;
                    
                    isProcessing = true;
                    // Disable all buttons during action
                    document.getElementById('startBtn').disabled = true;
                    document.getElementById('stopBtn').disabled = true;
                    document.getElementById('restartBtn').disabled = true;
                    
                    try {
                        showNotification(\`\${action === 'start' ? 'Starting' : action === 'stop' ? 'Stopping' : 'Restarting'} bot...\`, 'info');
                        
                        const response = await fetch(\`/api/bot/\${action}\`, { 
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' }
                        });
                        const result = await response.json();
                        
                        if (result.success) {
                            showNotification(result.message, 'success');
                        } else {
                            showNotification(result.message, 'error');
                        }
                        
                        // Wait a moment for status to update on server, then refresh client
                        setTimeout(updateStatus, 1500); 
                    } catch (error) {
                        showNotification('Action failed: Network error', 'error');
                    } finally {
                        isProcessing = false;
                        // Re-enable buttons based on new status after a delay
                        setTimeout(updateStatus, 3000); 
                    }
                }

                async function loadLogs() {
                    try {
                        const response = await fetch('/api/logs');
                        const result = await response.json();
                        document.getElementById('logsContent').textContent = result.logs || 'No logs available';
                    } catch (error) {
                        document.getElementById('logsContent').textContent = 'Failed to load logs';
                    }
                }

                // Mobile-friendly auto-update
                setInterval(updateStatus, 3000); // Update status every 3 seconds
                updateStatus(); // Initial update
                loadLogs(); // Initial log load

                // Auto-refresh logs
                setInterval(loadLogs, 10000); // Refresh logs every 10 seconds

                // ... Other mobile scripts remain unchanged ...
            </script>
        </body>
        </html>
    `);
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// API Routes
app.get('/api/bot/status', requireAuth, (req, res) => {
    updateStats(); // Update uptime
    res.json({
        status: botStatus,
        stats: botStats
    });
});

app.post('/api/bot/start', requireAuth, (req, res) => {
    const result = startBot();
    res.json(result);
});

app.post('/api/bot/stop', requireAuth, (req, res) => {
    const result = stopBot();
    res.json(result);
});

app.post('/api/bot/restart', requireAuth, (req, res) => {
    const result = restartBot();
    res.json(result);
});

// MODIFICATION: Logs API now pulls from "live" stats
app.get('/api/logs', requireAuth, (req, res) => {
    updateStats(); // Ensure uptime is current
    const logs = \`[System] Goat-Bot V2 Mobile Panel
[Status] Bot: \${botStatus} | Performance: \${botStats.performance}
[Stats] Messages: \${botStats.messagesProcessed} | Commands: \${botStats.commandsExecuted}
[Users] Total: \${botStats.usersServed} | Groups: \${botStats.groupsManaged}
[Uptime] \${botStats.uptime}
[Owner] \${BOT_OWNER} - \${BOT_EMAIL}
[Features] 100+ Mobile Optimized\`;
    res.json({ success: true, logs: logs });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        bot: botStatus,
        owner: BOT_OWNER,
        mobile: 'optimized',
        timestamp: new Date().toISOString()
    });
});

// MODIFICATION: Removed the old startProject() function.
// Bot will be started by the app.listen callback.

// Start server and bot
app.listen(PORT, '0.0.0.0', () => {
    log.info(\`🚀 Goat-Bot V2 Mobile Panel running on port \${PORT}\`);
    log.info(\`📱 Mobile Optimized: Yes\`);
    log.info(\`🌐 Access: http://localhost:\${PORT}\`);
    log.info(\`🔐 Admin Password: \${ADMIN_PASSWORD}\`);
    log.info(\`👑 Owner: \${BOT_OWNER}\`);
    
    // MODIFICATION: Start the bot process once the server is running
    log.info(\`🤖 Starting Messenger Bot...\`);
    const result = startBot();
    if (result.success) {
        log.info(result.message);
    } else {
        log.error(`Initial bot start failed: ${result.message}`);
    }
});
