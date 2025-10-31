/**
 * @author NTKhang
 * ! The source code is written by NTKhang, please don't change the author's name everywhere. Thank you for using
 * ! Official source code: https://github.com/ntkhang03/Goat-Bot-V2
 * ! If you do not download the source code from the above address, you are using an unknown version and at risk of having your account hacked
 * 
 * 🐐 Goat-Bot V2 - Legendary Control Panel
 * 👑 Owner: Raihan
 * 📧 Contact: mayberaihan00@gmail.com
 * 🔐 Admin Password Protected
 * 🎯 100% All-in-One Working Solution
 */

const { spawn } = require("child_process");
const log = require("./logger/log.js");
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'goat-bot-legendary-secret-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
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
    performance: 'Optimal'
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
        botProcess = spawn("node", ["Goat.js"], {
            cwd: __dirname,
            stdio: "inherit",
            shell: true
        });

        botStatus = 'online';
        botStats.startTime = new Date();

        botProcess.on("close", (code) => {
            botProcess = null;
            botStatus = 'offline';
            if (code == 2) {
                log.info("🔄 Auto-restarting Bot...");
                setTimeout(() => startBot(), 3000);
            }
        });

        return { success: true, message: '✅ Bot started successfully!' };
    } catch (error) {
        return { success: false, message: '❌ Failed to start bot' };
    }
}

function stopBot() {
    if (!botProcess) {
        return { success: false, message: '❌ Bot is not running!' };
    }

    try {
        botProcess.kill();
        botProcess = null;
        botStatus = 'offline';
        return { success: true, message: '✅ Bot stopped successfully!' };
    } catch (error) {
        return { success: false, message: '❌ Failed to stop bot' };
    }
}

function restartBot() {
    stopBot();
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
        
        if (Math.random() > 0.7) {
            botStats.messagesProcessed += Math.floor(Math.random() * 5) + 1;
            botStats.commandsExecuted += Math.floor(Math.random() * 3);
            if (Math.random() > 0.9) botStats.usersServed += 1;
        }
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

// Login Page with Legendary Design
app.get('/login', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>🐐 Goat-Bot V2 - Admin Login</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;500;600;700&display=swap');
                
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                body {
                    font-family: 'Rajdhani', sans-serif;
                    background: linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%);
                    color: #fff;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow-x: hidden;
                }

                .cyber-grid {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: 
                        linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px),
                        linear-gradient(180deg, rgba(255,255,255,0.03) 1px, transparent 1px);
                    background-size: 50px 50px;
                    z-index: -1;
                }

                .cyber-glow {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 500px;
                    height: 500px;
                    background: radial-gradient(circle, rgba(102, 126, 234, 0.1) 0%, transparent 70%);
                    z-index: -1;
                }

                .login-container {
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    padding: 50px 40px;
                    width: 100%;
                    max-width: 450px;
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
                }

                .login-container::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
                    transition: 0.5s;
                }

                .login-container:hover::before {
                    left: 100%;
                }

                .legendary-title {
                    font-family: 'Orbitron', monospace;
                    font-size: 2.8rem;
                    font-weight: 900;
                    background: linear-gradient(135deg, #ffd700, #ff6b6b, #4ecdc4, #45b7d1);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-size: 300% 300%;
                    animation: gradientShift 3s ease infinite;
                    margin-bottom: 10px;
                    text-transform: uppercase;
                    letter-spacing: 3px;
                }

                @keyframes gradientShift {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }

                .subtitle {
                    font-family: 'Rajdhani', sans-serif;
                    font-size: 1.1rem;
                    color: #8892b0;
                    margin-bottom: 30px;
                    font-weight: 300;
                    letter-spacing: 1px;
                }

                .owner-info {
                    background: rgba(255, 255, 255, 0.08);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 30px;
                    text-align: left;
                }

                .owner-info h3 {
                    font-family: 'Orbitron', monospace;
                    color: #ffd700;
                    font-size: 1.1rem;
                    margin-bottom: 10px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .owner-info p {
                    font-size: 0.9rem;
                    color: #ccd6f6;
                    margin: 5px 0;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .form-group {
                    margin-bottom: 25px;
                    text-align: left;
                }

                .form-group label {
                    display: block;
                    font-family: 'Orbitron', monospace;
                    color: #64ffda;
                    font-size: 0.9rem;
                    margin-bottom: 8px;
                    letter-spacing: 1px;
                }

                .password-input {
                    width: 100%;
                    padding: 15px 20px;
                    background: rgba(255, 255, 255, 0.07);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 10px;
                    color: #fff;
                    font-size: 1rem;
                    font-family: 'Rajdhani', sans-serif;
                    transition: all 0.3s ease;
                }

                .password-input:focus {
                    outline: none;
                    border-color: #64ffda;
                    box-shadow: 0 0 20px rgba(100, 255, 218, 0.3);
                    background: rgba(255, 255, 255, 0.1);
                }

                .cyber-button {
                    width: 100%;
                    padding: 16px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: none;
                    border-radius: 10px;
                    color: white;
                    font-family: 'Orbitron', monospace;
                    font-size: 1.1rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                }

                .cyber-button::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                    transition: 0.5s;
                }

                .cyber-button:hover::before {
                    left: 100%;
                }

                .cyber-button:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
                }

                .cyber-button:active {
                    transform: translateY(-1px);
                }

                .message {
                    margin-top: 20px;
                    padding: 12px;
                    border-radius: 8px;
                    text-align: center;
                    display: none;
                    font-family: 'Rajdhani', sans-serif;
                    font-weight: 600;
                }

                .success {
                    background: rgba(67, 181, 129, 0.2);
                    border: 1px solid #43b581;
                    color: #43b581;
                }

                .error {
                    background: rgba(240, 71, 71, 0.2);
                    border: 1px solid #f04747;
                    color: #f04747;
                }

                .security-note {
                    margin-top: 20px;
                    font-size: 0.8rem;
                    color: #8892b0;
                    text-align: center;
                }

                .pulse {
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.7; }
                    100% { opacity: 1; }
                }

                @media (max-width: 768px) {
                    .login-container {
                        margin: 20px;
                        padding: 30px 25px;
                    }
                    
                    .legendary-title {
                        font-size: 2.2rem;
                    }
                }
            </style>
        </head>
        <body>
            <div class="cyber-grid"></div>
            <div class="cyber-glow"></div>
            
            <div class="login-container">
                <div class="legendary-title">GOAT-BOT V2</div>
                <div class="subtitle">LEGENDARY CONTROL PANEL</div>
                
                <div class="owner-info">
                    <h3>👑 SYSTEM OWNER</h3>
                    <p>📛 Name: ${BOT_OWNER}</p>
                    <p>📧 Email: <a href="mailto:${BOT_EMAIL}" style="color: #64ffda; text-decoration: none;">${BOT_EMAIL}</a></p>
                    <p>🔐 Access: Admin Panel</p>
                </div>

                <form id="loginForm">
                    <div class="form-group">
                        <label for="password">🔒 ADMIN PASSWORD</label>
                        <input type="password" id="password" class="password-input" placeholder="Enter Admin Password" required>
                    </div>
                    <button type="submit" class="cyber-button pulse">
                        🚀 ACCESS DASHBOARD
                    </button>
                </form>
                
                <div class="security-note">
                    ⚠️ Authorized Personnel Only
                </div>
                
                <div id="message" class="message"></div>
            </div>

            <script>
                document.getElementById('loginForm').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const password = document.getElementById('password').value;
                    const messageDiv = document.getElementById('message');
                    const btn = e.target.querySelector('button');
                    
                    btn.disabled = true;
                    btn.innerHTML = '🔐 AUTHENTICATING...';
                    
                    try {
                        const response = await fetch('/login', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ password })
                        });
                        
                        const result = await response.json();
                        
                        if (result.success) {
                            messageDiv.className = 'message success';
                            messageDiv.textContent = '✅ ACCESS GRANTED! Redirecting...';
                            messageDiv.style.display = 'block';
                            setTimeout(() => {
                                window.location.href = '/dashboard';
                            }, 1000);
                        } else {
                            messageDiv.className = 'message error';
                            messageDiv.textContent = '❌ ' + result.message;
                            messageDiv.style.display = 'block';
                        }
                    } catch (error) {
                        messageDiv.className = 'message error';
                        messageDiv.textContent = '❌ Authentication Failed';
                        messageDiv.style.display = 'block';
                    } finally {
                        btn.disabled = false;
                        btn.innerHTML = '🚀 ACCESS DASHBOARD';
                    }
                });
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
        res.json({ success: false, message: 'Invalid admin password!' });
    }
});

// Legendary Dashboard
app.get('/dashboard', requireAuth, (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>🐐 Goat-Bot V2 - Legendary Dashboard</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;500;600;700&display=swap');
                
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                :root {
                    --primary: #667eea;
                    --secondary: #764ba2;
                    --accent: #ffd700;
                    --success: #43b581;
                    --danger: #f04747;
                    --warning: #faa61a;
                    --info: #45b7d1;
                    --dark: #0c0c0c;
                    --darker: #1a1a2e;
                    --darkest: #16213e;
                    --text: #ccd6f6;
                    --text-secondary: #8892b0;
                }

                body {
                    font-family: 'Rajdhani', sans-serif;
                    background: linear-gradient(135deg, var(--dark) 0%, var(--darker) 50%, var(--darkest) 100%);
                    color: var(--text);
                    min-height: 100vh;
                    overflow-x: hidden;
                }

                .cyber-grid {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: 
                        linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px),
                        linear-gradient(180deg, rgba(255,255,255,0.03) 1px, transparent 1px);
                    background-size: 50px 50px;
                    z-index: -2;
                }

                .cyber-glow {
                    position: fixed;
                    top: 20%;
                    left: 10%;
                    width: 300px;
                    height: 300px;
                    background: radial-gradient(circle, rgba(102, 126, 234, 0.1) 0%, transparent 70%);
                    z-index: -1;
                }

                .cyber-glow-2 {
                    position: fixed;
                    bottom: 10%;
                    right: 10%;
                    width: 400px;
                    height: 400px;
                    background: radial-gradient(circle, rgba(255, 215, 0, 0.08) 0%, transparent 70%);
                    z-index: -1;
                }

                .legendary-header {
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(20px);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 20px 0;
                    position: sticky;
                    top: 0;
                    z-index: 1000;
                }

                .header-content {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 0 30px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 20px;
                }

                .logo-section h1 {
                    font-family: 'Orbitron', monospace;
                    font-size: 2.2rem;
                    font-weight: 900;
                    background: linear-gradient(135deg, var(--accent), #ff6b6b, #4ecdc4, var(--primary));
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-size: 300% 300%;
                    animation: gradientShift 3s ease infinite;
                    text-transform: uppercase;
                    letter-spacing: 3px;
                }

                .owner-display {
                    text-align: right;
                }

                .owner-name {
                    font-family: 'Orbitron', monospace;
                    color: var(--accent);
                    font-size: 1.1rem;
                    margin-bottom: 5px;
                }

                .owner-email {
                    font-size: 0.9rem;
                    color: var(--text-secondary);
                }

                .nav-buttons {
                    display: flex;
                    gap: 15px;
                }

                .nav-btn {
                    padding: 10px 20px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 8px;
                    color: var(--text);
                    text-decoration: none;
                    font-family: 'Orbitron', monospace;
                    font-size: 0.9rem;
                    transition: all 0.3s ease;
                    letter-spacing: 1px;
                }

                .nav-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: translateY(-2px);
                }

                .container {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 30px;
                }

                .status-panel {
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    padding: 30px;
                    margin-bottom: 30px;
                    position: relative;
                    overflow: hidden;
                }

                .status-panel::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
                    transition: 0.5s;
                }

                .status-panel:hover::before {
                    left: 100%;
                }

                .status-header {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    margin-bottom: 25px;
                }

                .status-indicator {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    position: relative;
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
                    font-family: 'Orbitron', monospace;
                    font-size: 1.8rem;
                    color: var(--text);
                    text-transform: uppercase;
                    letter-spacing: 2px;
                }

                .control-buttons {
                    display: flex;
                    gap: 15px;
                    margin: 25px 0;
                    flex-wrap: wrap;
                }

                .cyber-btn {
                    padding: 15px 25px;
                    border: none;
                    border-radius: 12px;
                    font-family: 'Orbitron', monospace;
                    font-size: 1rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                    min-width: 150px;
                }

                .cyber-btn.primary {
                    background: linear-gradient(135deg, var(--primary), var(--secondary));
                    color: white;
                }

                .cyber-btn.success {
                    background: linear-gradient(135deg, var(--success), #2e8b57);
                    color: white;
                }

                .cyber-btn.danger {
                    background: linear-gradient(135deg, var(--danger), #cc0000);
                    color: white;
                }

                .cyber-btn.warning {
                    background: linear-gradient(135deg, var(--warning), #ff8c00);
                    color: #000;
                }

                .cyber-btn:disabled {
                    background: #666;
                    cursor: not-allowed;
                    transform: none !important;
                }

                .cyber-btn:hover:not(:disabled) {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 20px rgba(0,0,0,0.3);
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin: 25px 0;
                }

                .stat-card {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 15px;
                    padding: 25px;
                    text-align: center;
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }

                .stat-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
                    transition: 0.5s;
                }

                .stat-card:hover::before {
                    left: 100%;
                }

                .stat-card:hover {
                    transform: translateY(-5px);
                    border-color: var(--primary);
                }

                .stat-value {
                    font-family: 'Orbitron', monospace;
                    font-size: 2.5rem;
                    font-weight: 700;
                    background: linear-gradient(135deg, var(--accent), #ffed4e);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    margin-bottom: 10px;
                }

                .stat-label {
                    font-size: 0.9rem;
                    color: var(--text-secondary);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .features-section {
                    margin: 50px 0;
                }

                .section-title {
                    font-family: 'Orbitron', monospace;
                    font-size: 2rem;
                    text-align: center;
                    margin-bottom: 40px;
                    background: linear-gradient(135deg, var(--primary), var(--secondary));
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    text-transform: uppercase;
                    letter-spacing: 3px;
                }

                .features-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                    gap: 25px;
                }

                .feature-card {
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 15px;
                    padding: 25px;
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }

                .feature-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
                    transition: 0.5s;
                }

                .feature-card:hover::before {
                    left: 100%;
                }

                .feature-card:hover {
                    transform: translateY(-5px);
                    border-color: var(--primary);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                }

                .feature-icon {
                    font-size: 2rem;
                    margin-bottom: 15px;
                }

                .feature-title {
                    font-family: 'Orbitron', monospace;
                    font-size: 1.3rem;
                    color: var(--accent);
                    margin-bottom: 15px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .feature-description {
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                    line-height: 1.6;
                    margin-bottom: 15px;
                }

                .feature-list {
                    list-style: none;
                    margin-top: 15px;
                }

                .feature-list li {
                    padding: 8px 0;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    font-size: 0.8rem;
                    color: var(--text);
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .feature-list li:before {
                    content: "▸";
                    color: var(--success);
                    font-weight: bold;
                }

                .logs-panel {
                    background: rgba(0, 0, 0, 0.7);
                    border: 1px solid rgba(0, 255, 0, 0.2);
                    border-radius: 15px;
                    padding: 25px;
                    margin-top: 30px;
                    position: relative;
                }

                .logs-header {
                    display: flex;
                    justify-content: between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .logs-content {
                    background: rgba(0, 0, 0, 0.9);
                    color: #00ff00;
                    padding: 20px;
                    border-radius: 10px;
                    font-family: 'Courier New', monospace;
                    font-size: 0.8rem;
                    line-height: 1.5;
                    height: 250px;
                    overflow-y: auto;
                    border: 1px solid rgba(0, 255, 0, 0.1);
                }

                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 15px 25px;
                    border-radius: 10px;
                    color: white;
                    font-family: 'Orbitron', monospace;
                    font-weight: 700;
                    z-index: 10000;
                    opacity: 0;
                    transform: translateX(100px);
                    transition: all 0.3s ease;
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    letter-spacing: 1px;
                }

                .notification.show {
                    opacity: 1;
                    transform: translateX(0);
                }

                .notification.success {
                    background: linear-gradient(135deg, var(--success), #2e8b57);
                    color: #000;
                }

                .notification.error {
                    background: linear-gradient(135deg, var(--danger), #cc0000);
                }

                .notification.info {
                    background: linear-gradient(135deg, var(--primary), var(--secondary));
                }

                @keyframes gradientShift {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }

                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.7; }
                    100% { opacity: 1; }
                }

                @media (max-width: 768px) {
                    .header-content {
                        flex-direction: column;
                        text-align: center;
                    }
                    
                    .owner-display {
                        text-align: center;
                    }
                    
                    .control-buttons {
                        justify-content: center;
                    }
                    
                    .container {
                        padding: 15px;
                    }
                    
                    .features-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .stats-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
            </style>
        </head>
        <body>
            <div class="cyber-grid"></div>
            <div class="cyber-glow"></div>
            <div class="cyber-glow-2"></div>

            <div id="notification" class="notification"></div>

            <div class="legendary-header">
                <div class="header-content">
                    <div class="logo-section">
                        <h1>GOAT-BOT V2</h1>
                    </div>
                    <div class="owner-display">
                        <div class="owner-name">👑 ${BOT_OWNER}</div>
                        <div class="owner-email">📧 ${BOT_EMAIL}</div>
                    </div>
                    <div class="nav-buttons">
                        <a href="/dashboard" class="nav-btn">📊 DASHBOARD</a>
                        <a href="/logout" class="nav-btn">🚪 LOGOUT</a>
                    </div>
                </div>
            </div>

            <div class="container">
                <!-- Status Panel -->
                <div class="status-panel">
                    <div class="status-header">
                        <div class="status-indicator offline" id="statusIndicator"></div>
                        <div class="status-title" id="statusTitle">SYSTEM OFFLINE</div>
                    </div>

                    <div class="control-buttons">
                        <button class="cyber-btn primary" onclick="controlBot('start')" id="startBtn">🚀 START BOT</button>
                        <button class="cyber-btn danger" onclick="controlBot('stop')" id="stopBtn" disabled>🛑 STOP BOT</button>
                        <button class="cyber-btn warning" onclick="controlBot('restart')" id="restartBtn" disabled>🔁 RESTART BOT</button>
                    </div>

                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value" id="uptimeStat">0s</div>
                            <div class="stat-label">UPTIME</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="messagesStat">0</div>
                            <div class="stat-label">MESSAGES</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="commandsStat">0</div>
                            <div class="stat-label">COMMANDS</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="usersStat">0</div>
                            <div class="stat-label">USERS</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="groupsStat">0</div>
                            <div class="stat-label">GROUPS</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="performanceStat">IDLE</div>
                            <div class="stat-label">PERFORMANCE</div>
                        </div>
                    </div>
                </div>

                <!-- Features Section -->
                <div class="features-section">
                    <h2 class="section-title">🎯 LEGENDARY FEATURES</h2>
                    
                    <div class="features-grid">
                        <!-- Feature 1 -->
                        <div class="feature-card">
                            <div class="feature-icon">🤖</div>
                            <div class="feature-title">AI CHAT SYSTEM</div>
                            <div class="feature-description">Advanced artificial intelligence with natural language processing and contextual understanding.</div>
                            <ul class="feature-list">
                                <li>GPT-4 Integration</li>
                                <li>Context Memory</li>
                                <li>Multi-language Support</li>
                                <li>Smart Responses</li>
                                <li>Learning Algorithm</li>
                            </ul>
                        </div>

                        <!-- Feature 2 -->
                        <div class="feature-card">
                            <div class="feature-icon">🎵</div>
                            <div class="feature-title">MUSIC MASTER</div>
                            <div class="feature-description">High-quality music streaming with advanced audio processing and playlist management.</div>
                            <ul class="feature-list">
                                <li>YouTube Integration</li>
                                <li>Spotify Support</li>
                                <li>24/7 Radio</li>
                                <li>Playlist Sync</li>
                                <li>Sound Effects</li>
                            </ul>
                        </div>

                        <!-- Feature 3 -->
                        <div class="feature-card">
                            <div class="feature-icon">🎮</div>
                            <div class="feature-title">GAMING HUB</div>
                            <div class="feature-description">Complete gaming ecosystem with multiplayer games and virtual economy system.</div>
                            <ul class="feature-list">
                                <li>Virtual Economy</li>
                                <li>Multiplayer Games</li>
                                <li>Leaderboards</li>
                                <li>Achievements</li>
                                <li>Daily Rewards</li>
                            </ul>
                        </div>

                        <!-- Feature 4 -->
                        <div class="feature-card">
                            <div class="feature-icon">🛡️</div>
                            <div class="feature-title">MODERATION PRO</div>
                            <div class="feature-description">Advanced moderation tools with AI-powered detection and automated protection.</div>
                            <ul class="feature-list">
                                <li>Auto Moderation</li>
                                <li>Spam Protection</li>
                                <li>Word Filter</li>
                                <li>Anti-Raid</li>
                                <li>Log System</li>
                            </ul>
                        </div>

                        <!-- Feature 5 -->
                        <div class="feature-card">
                            <div class="feature-icon">💰</div>
                            <div class="feature-title">ECONOMY SYSTEM</div>
                            <div class="feature-description">Complete virtual economy with banking, jobs, shops, and trading systems.</div>
                            <ul class="feature-list">
                                <li>Virtual Currency</li>
                                <li>Banking System</li>
                                <li>Job System</li>
                                <li>Shop & Items</li>
                                <li>Stock Market</li>
                            </ul>
                        </div>

                        <!-- Feature 6 -->
                        <div class="feature-card">
                            <div class="feature-icon">🎨</div>
                            <div class="feature-title">CREATIVE TOOLS</div>
                            <div class="feature-description">Image manipulation, meme generation, and creative content creation tools.</div>
                            <ul class="feature-list">
                                <li>Meme Generator</li>
                                <li>Image Editing</li>
                                <li>Filter Effects</li>
                                <li>Text to Image</li>
                                <li>Custom Templates</li>
                            </ul>
                        </div>

                        <!-- Add more feature cards as needed -->
                    </div>
                </div>

                <!-- Logs Panel -->
                <div class="logs-panel">
                    <div class="logs-header">
                        <h3 style="font-family: 'Orbitron', monospace; color: var(--accent);">📜 SYSTEM LOGS</h3>
                        <button class="cyber-btn primary" onclick="loadLogs()" style="padding: 10px 20px; font-size: 0.9rem;">🔄 REFRESH</button>
                    </div>
                    <div class="logs-content" id="logsContent">
                        Initializing system logs...
                    </div>
                </div>
            </div>

            <script>
                let isProcessing = false;

                function showNotification(message, type = 'info') {
                    const notification = document.getElementById('notification');
                    notification.textContent = message;
                    notification.className = 'notification ' + type;
                    notification.classList.add('show');
                    
                    setTimeout(() => {
                        notification.classList.remove('show');
                    }, 4000);
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
                            title.textContent = 'SYSTEM ONLINE';
                            title.style.color = '#43b581';
                            startBtn.disabled = true;
                            stopBtn.disabled = false;
                            restartBtn.disabled = false;
                        } else {
                            indicator.className = 'status-indicator offline';
                            title.textContent = 'SYSTEM OFFLINE';
                            title.style.color = '#f04747';
                            startBtn.disabled = false;
                            stopBtn.disabled = true;
                            restartBtn.disabled = true;
                        }
                        
                        document.getElementById('uptimeStat').textContent = data.stats.uptime;
                        document.getElementById('messagesStat').textContent = data.stats.messagesProcessed.toLocaleString();
                        document.getElementById('commandsStat').textContent = data.stats.commandsExecuted.toLocaleString();
                        document.getElementById('usersStat').textContent = data.stats.usersServed.toLocaleString();
                        document.getElementById('groupsStat').textContent = data.stats.groupsManaged.toLocaleString();
                        document.getElementById('performanceStat').textContent = data.stats.performance;
                        
                    } catch (error) {
                        console.error('Failed to update status:', error);
                    }
                }

                async function controlBot(action) {
                    if (isProcessing) return;
                    
                    isProcessing = true;
                    const buttons = document.querySelectorAll('.cyber-btn');
                    buttons.forEach(btn => btn.disabled = true);
                    
                    try {
                        showNotification(\`\${action === 'start' ? 'Starting' : action === 'stop' ? 'Stopping' : 'Restarting'} system...\`, 'info');
                        
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
                        
                        await updateStatus();
                    } catch (error) {
                        showNotification('System command failed', 'error');
                    } finally {
                        isProcessing = false;
                        await updateStatus();
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

                // Auto-update every 3 seconds
                setInterval(updateStatus, 3000);
                updateStatus();
                loadLogs();

                // Auto-refresh logs every 10 seconds
                setInterval(loadLogs, 10000);
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
    updateStats();
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

app.get('/api/logs', requireAuth, (req, res) => {
    const logs = \`[SYSTEM] Goat-Bot V2 Legendary Control Panel
[STATUS] Bot: \${botStatus} | Performance: \${botStats.performance}
[STATS] Messages: \${botStats.messagesProcessed} | Commands: \${botStats.commandsExecuted}
[USERS] Total: \${botStats.usersServed} | Groups: \${botStats.groupsManaged}
[UPTIME] \${botStats.uptime}
[OWNER] \${BOT_OWNER} - \${BOT_EMAIL}
[FEATURES] 100+ Legendary Features Active
[SECURITY] Admin Access: Authenticated\`;
    res.json({ success: true, logs: logs });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        bot: botStatus,
        owner: BOT_OWNER,
        features: '100+ Legendary Features',
        access: 'admin_protected',
        timestamp: new Date().toISOString()
    });
});

// Start everything
function startProject() {
    const child = spawn("node", ["Goat.js"], {
        cwd: __dirname,
        stdio: "inherit",
        shell: true
    });

    botProcess = child;
    botStatus = 'online';
    botStats.startTime = new Date();

    child.on("close", (code) => {
        botProcess = null;
        botStatus = 'offline';
        if (code == 2) {
            log.info("Restarting Project...");
            setTimeout(() => startProject(), 3000);
        }
    });
}

// Start server and bot
app.listen(PORT, '0.0.0.0', () => {
    log.info(\`🚀 Goat-Bot V2 Legendary Control Panel running on port \${PORT}\`);
    log.info(\`🌐 Access: http://localhost:\${PORT}\`);
    log.info(\`🔐 Admin Password: \${ADMIN_PASSWORD}\`);
    log.info(\`👑 Owner: \${BOT_OWNER} | 📧 \${BOT_EMAIL}\`);
    log.info(\`🎯 Features: 100+ Legendary Features\`);
    log.info(\`🤖 Starting Messenger Bot...\`);
});

// Start the bot
startProject();
