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
 * 🌐 Render Deployment Ready
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
    secret: process.env.SESSION_SECRET || 'goat-bot-legendary-secret-2024-render',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Configuration
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Raihan@008897';
const BOT_OWNER = process.env.BOT_OWNER || 'Raihan';
const BOT_EMAIL = process.env.BOT_EMAIL || 'mayberaihan00@gmail.com';

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
        log.info("🤖 Starting Messenger Bot...");
        
        botProcess = spawn("node", ["Goat.js"], {
            cwd: __dirname,
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: true
        });

        botStatus = 'online';
        botStats.startTime = new Date();

        // Handle bot process output
        botProcess.stdout.on('data', (data) => {
            log.info(`🤖 Bot: ${data.toString().trim()}`);
        });

        botProcess.stderr.on('data', (data) => {
            log.error(`🤖 Bot Error: ${data.toString().trim()}`);
        });

        botProcess.on("close", (code) => {
            log.warn(`🤖 Bot process exited with code ${code}`);
            botProcess = null;
            botStatus = 'offline';
            // NO AUTO-RESTART - Manual control only
        });

        botProcess.on("error", (error) => {
            log.error(`🤖 Bot process error: ${error.message}`);
            botProcess = null;
            botStatus = 'offline';
        });

        return { success: true, message: '✅ Bot started successfully!' };
    } catch (error) {
        log.error(`❌ Failed to start bot: ${error.message}`);
        return { success: false, message: '❌ Failed to start bot' };
    }
}

function stopBot() {
    if (!botProcess) {
        return { success: false, message: '❌ Bot is not running!' };
    }

    try {
        log.info("🛑 Stopping Messenger Bot...");
        botProcess.kill('SIGTERM');
        botProcess = null;
        botStatus = 'offline';
        return { success: true, message: '✅ Bot stopped successfully!' };
    } catch (error) {
        log.error(`❌ Failed to stop bot: ${error.message}`);
        return { success: false, message: '❌ Failed to stop bot' };
    }
}

function restartBot() {
    stopBot();
    setTimeout(() => {
        startBot();
    }, 3000);
    return { success: true, message: '🔄 Bot restarting...' };
}

function updateStats() {
    if (botStatus === 'online' && botStats.startTime) {
        const uptime = Math.floor((new Date() - botStats.startTime) / 1000);
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = uptime % 60;
        botStats.uptime = `${hours}h ${minutes}m ${seconds}s`;
        
        // Simulate activity for demo
        if (Math.random() > 0.7) {
            botStats.messagesProcessed += Math.floor(Math.random() * 5) + 1;
            botStats.commandsExecuted += Math.floor(Math.random() * 3);
            if (Math.random() > 0.9) botStats.usersServed += 1;
            if (Math.random() > 0.95) botStats.groupsManaged += 1;
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

// Stylish Login Page with Owner Display
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

                .owner-display {
                    background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(102, 126, 234, 0.1));
                    border: 1px solid rgba(255, 215, 0, 0.3);
                    border-radius: 15px;
                    padding: 20px;
                    margin: 25px 0;
                    position: relative;
                    overflow: hidden;
                }

                .owner-crown {
                    font-size: 2rem;
                    margin-bottom: 10px;
                    animation: float 3s ease-in-out infinite;
                }

                .owner-name {
                    font-family: 'Orbitron', monospace;
                    font-size: 1.4rem;
                    background: linear-gradient(135deg, #ffd700, #ffed4e);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    margin-bottom: 5px;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                }

                .owner-email {
                    font-size: 0.9rem;
                    color: #64ffda;
                    font-weight: 500;
                }

                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
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

                .cyber-button:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
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
            </style>
        </head>
        <body>
            <div class="cyber-grid"></div>
            
            <div class="login-container">
                <div class="legendary-title">GOAT-BOT V2</div>
                <div style="color: #8892b0; margin-bottom: 20px;">LEGENDARY CONTROL PANEL</div>
                
                <!-- Stylish Owner Display -->
                <div class="owner-display">
                    <div class="owner-crown">👑</div>
                    <div class="owner-name">${BOT_OWNER}</div>
                    <div class="owner-email">${BOT_EMAIL}</div>
                </div>

                <form id="loginForm">
                    <div class="form-group">
                        <label for="password">🔒 ADMIN PASSWORD</label>
                        <input type="password" id="password" class="password-input" placeholder="Enter Admin Password" required>
                    </div>
                    <button type="submit" class="cyber-button">
                        🚀 ACCESS DASHBOARD
                    </button>
                </form>
                
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

// Dashboard
app.get('/dashboard', requireAuth, (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>🐐 Goat-Bot V2 - Dashboard</title>
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
                }

                .header {
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(20px);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 20px 0;
                }

                .header-content {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 20px;
                }

                .logo h1 {
                    font-family: 'Orbitron', monospace;
                    font-size: 2rem;
                    background: linear-gradient(135deg, #ffd700, #ff6b6b, #4ecdc4);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .owner-info {
                    text-align: right;
                }

                .owner-name {
                    font-family: 'Orbitron', monospace;
                    font-size: 1.2rem;
                    background: linear-gradient(135deg, #ffd700, #ffed4e);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    margin-bottom: 5px;
                }

                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 30px 20px;
                }

                .status-panel {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 15px;
                    padding: 30px;
                    margin-bottom: 30px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .status-header {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    margin-bottom: 20px;
                }

                .status-indicator {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                }

                .status-indicator.online {
                    background: #43b581;
                    box-shadow: 0 0 10px #43b581;
                    animation: pulse 2s infinite;
                }

                .status-indicator.offline {
                    background: #f04747;
                    box-shadow: 0 0 10px #f04747;
                }

                .status-title {
                    font-family: 'Orbitron', monospace;
                    font-size: 1.5rem;
                }

                .control-buttons {
                    display: flex;
                    gap: 15px;
                    margin: 25px 0;
                    flex-wrap: wrap;
                }

                .btn {
                    padding: 12px 24px;
                    border: none;
                    border-radius: 8px;
                    font-family: 'Orbitron', monospace;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    min-width: 140px;
                }

                .btn-primary {
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: white;
                }

                .btn-danger {
                    background: linear-gradient(135deg, #f04747, #cc0000);
                    color: white;
                }

                .btn-warning {
                    background: linear-gradient(135deg, #faa61a, #ff8c00);
                    color: black;
                }

                .btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 15px;
                    margin: 25px 0;
                }

                .stat-card {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                    padding: 20px;
                    text-align: center;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .stat-value {
                    font-family: 'Orbitron', monospace;
                    font-size: 1.8rem;
                    color: #ffd700;
                    margin-bottom: 5px;
                }

                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 15px 25px;
                    border-radius: 8px;
                    color: white;
                    font-family: 'Orbitron', monospace;
                    z-index: 1000;
                    opacity: 0;
                    transform: translateX(100px);
                    transition: all 0.3s ease;
                }

                .notification.show {
                    opacity: 1;
                    transform: translateX(0);
                }

                .notification.success {
                    background: #43b581;
                }

                .notification.error {
                    background: #f04747;
                }

                .nav-buttons {
                    display: flex;
                    gap: 10px;
                }

                .nav-btn {
                    padding: 8px 16px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 6px;
                    color: #fff;
                    text-decoration: none;
                    font-family: 'Orbitron', monospace;
                    font-size: 0.8rem;
                    transition: all 0.3s ease;
                }

                .nav-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                }

                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.7; }
                    100% { opacity: 1; }
                }
            </style>
        </head>
        <body>
            <div id="notification" class="notification"></div>

            <div class="header">
                <div class="header-content">
                    <div class="logo">
                        <h1>GOAT-BOT V2</h1>
                    </div>
                    <div class="owner-info">
                        <div class="owner-name">👑 ${BOT_OWNER}</div>
                        <div style="color: #8892b0; font-size: 0.9rem;">${BOT_EMAIL}</div>
                    </div>
                    <div class="nav-buttons">
                        <a href="/dashboard" class="nav-btn">📊 DASHBOARD</a>
                        <a href="/logout" class="nav-btn">🚪 LOGOUT</a>
                    </div>
                </div>
            </div>

            <div class="container">
                <div class="status-panel">
                    <div class="status-header">
                        <div class="status-indicator offline" id="statusIndicator"></div>
                        <h2 class="status-title" id="statusTitle">SYSTEM OFFLINE</h2>
                    </div>

                    <div class="control-buttons">
                        <button class="btn btn-primary" onclick="controlBot('start')" id="startBtn">🚀 START BOT</button>
                        <button class="btn btn-danger" onclick="controlBot('stop')" id="stopBtn" disabled>🛑 STOP BOT</button>
                        <button class="btn btn-warning" onclick="controlBot('restart')" id="restartBtn" disabled>🔁 RESTART BOT</button>
                    </div>

                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value" id="uptimeStat">0s</div>
                            <div>UPTIME</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="messagesStat">0</div>
                            <div>MESSAGES</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="commandsStat">0</div>
                            <div>COMMANDS</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="usersStat">0</div>
                            <div>USERS</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="groupsStat">0</div>
                            <div>GROUPS</div>
                        </div>
                    </div>
                </div>
            </div>

            <script>
                function showNotification(message, type = 'success') {
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
                        
                        if (data.status === 'online') {
                            indicator.className = 'status-indicator online';
                            title.textContent = 'SYSTEM ONLINE';
                            title.style.color = '#43b581';
                            document.getElementById('startBtn').disabled = true;
                            document.getElementById('stopBtn').disabled = false;
                            document.getElementById('restartBtn').disabled = false;
                        } else {
                            indicator.className = 'status-indicator offline';
                            title.textContent = 'SYSTEM OFFLINE';
                            title.style.color = '#f04747';
                            document.getElementById('startBtn').disabled = false;
                            document.getElementById('stopBtn').disabled = true;
                            document.getElementById('restartBtn').disabled = true;
                        }
                        
                        document.getElementById('uptimeStat').textContent = data.stats.uptime;
                        document.getElementById('messagesStat').textContent = data.stats.messagesProcessed;
                        document.getElementById('commandsStat').textContent = data.stats.commandsExecuted;
                        document.getElementById('usersStat').textContent = data.stats.usersServed;
                        document.getElementById('groupsStat').textContent = data.stats.groupsManaged;
                        
                    } catch (error) {
                        console.error('Failed to update status:', error);
                    }
                }

                async function controlBot(action) {
                    const buttons = document.querySelectorAll('.btn');
                    buttons.forEach(btn => btn.disabled = true);
                    
                    try {
                        showNotification(\`\${action === 'start' ? 'Starting' : action === 'stop' ? 'Stopping' : 'Restarting'} bot...\`, 'success');
                        
                        const response = await fetch(\`/api/bot/\${action}\`, { 
                            method: 'POST'
                        });
                        const result = await response.json();
                        
                        if (result.success) {
                            showNotification(result.message, 'success');
                        } else {
                            showNotification(result.message, 'error');
                        }
                        
                        await updateStatus();
                    } catch (error) {
                        showNotification('Action failed', 'error');
                    } finally {
                        await updateStatus();
                    }
                }

                // Auto-update every 3 seconds
                setInterval(updateStatus, 3000);
                updateStatus();
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

// Health check endpoint for Render
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'Goat-Bot V2 Web Dashboard',
        bot_status: botStatus,
        owner: BOT_OWNER,
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    log.info(`🚀 Goat-Bot V2 Web Dashboard running on port ${PORT}`);
    log.info(`🌐 Access: http://localhost:${PORT}`);
    log.info(`🔐 Admin Password: ${ADMIN_PASSWORD}`);
    log.info(`👑 Owner: ${BOT_OWNER} | 📧 ${BOT_EMAIL}`);
    log.info(`⚡ Render Deployment Ready`);
    log.info(`🤖 Bot Status: ${botStatus} - Manual control via dashboard`);
});

module.exports = app;
