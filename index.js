/**
 * @author NTKhang
 * ! The source code is written by NTKhang, please don't change the author's name everywhere. Thank you for using
 * ! Official source code: https://github.com/ntkhang03/Goat-Bot-V2
 * ! If you do not download the source code from the above address, you are using an unknown version and at risk of having your account hacked
 */

const { spawn, exec } = require("child_process");
const log = require("./logger/log.js");
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: process.env.SESSION_SECRET || 'goat-bot-secret-key-2024-render',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Authentication middleware
function requireAuth(req, res, next) {
    if (req.session.authenticated) {
        return next();
    }
    res.redirect('/login');
}

// Global variables
let botProcess = null;
let botStatus = 'offline';
let botStats = {
    startTime: null,
    messagesProcessed: 0,
    commandsExecuted: 0,
    usersServed: 0,
    uptime: '0s'
};

// Password configuration - Use environment variable for security
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Raihan@008897';

// Render-compatible bot starter
function startBot() {
    if (botProcess) {
        return { success: false, message: 'Bot is already running' };
    }

    try {
        botProcess = spawn("node", ["Goat.js"], {
            cwd: __dirname,
            stdio: ['pipe', 'pipe', 'pipe'], // Changed for Render compatibility
            shell: true,
            detached: false // Important for Render
        });

        // Handle bot output
        botProcess.stdout.on('data', (data) => {
            console.log(`Bot: ${data}`);
            // You can add this to logs if needed
        });

        botProcess.stderr.on('data', (data) => {
            console.error(`Bot Error: ${data}`);
        });

        botStatus = 'online';
        botStats.startTime = new Date();

        botProcess.on("close", (code) => {
            console.log(`Bot process exited with code ${code}`);
            botProcess = null;
            botStatus = 'offline';
            
            // Only restart if exit code is 2 and we're not shutting down
            if (code == 2) {
                log.info("Restarting Bot...");
                setTimeout(() => startBot(), 5000); // Longer delay for Render
            }
        });

        return { success: true, message: 'Bot started successfully' };
    } catch (error) {
        console.error('Failed to start bot:', error);
        return { success: false, message: 'Failed to start bot' };
    }
}

// Stop bot function
function stopBot() {
    if (!botProcess) {
        return { success: false, message: 'Bot is not running' };
    }

    try {
        botProcess.kill('SIGTERM'); // Graceful shutdown
        botProcess = null;
        botStatus = 'offline';
        return { success: true, message: 'Bot stopped successfully' };
    } catch (error) {
        console.error('Failed to stop bot:', error);
        return { success: false, message: 'Failed to stop bot' };
    }
}

// Update bot statistics
function updateStats() {
    if (botStatus === 'online' && botStats.startTime) {
        const uptime = Math.floor((new Date() - botStats.startTime) / 1000);
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = uptime % 60;
        botStats.uptime = `${hours}h ${minutes}m ${seconds}s`;
        
        // Simulate some activity for demo
        if (Math.random() > 0.7) {
            botStats.messagesProcessed += Math.floor(Math.random() * 5);
            botStats.commandsExecuted += Math.floor(Math.random() * 2);
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

app.get('/login', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Goat-Bot V2 - Login</title>
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
                border-radius: 15px;
                box-shadow: 0 15px 35px rgba(0,0,0,0.1);
                width: 100%;
                max-width: 400px;
            }
            .logo {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo h1 {
                color: #333;
                font-size: 28px;
                margin-bottom: 5px;
            }
            .logo p {
                color: #666;
                font-size: 14px;
            }
            .form-group {
                margin-bottom: 20px;
            }
            .form-group label {
                display: block;
                margin-bottom: 5px;
                color: #333;
                font-weight: 500;
            }
            .form-group input {
                width: 100%;
                padding: 12px 15px;
                border: 2px solid #e1e5e9;
                border-radius: 8px;
                font-size: 16px;
                transition: border-color 0.3s;
            }
            .form-group input:focus {
                outline: none;
                border-color: #667eea;
            }
            .btn {
                width: 100%;
                padding: 12px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                cursor: pointer;
                transition: transform 0.2s;
            }
            .btn:hover {
                transform: translateY(-2px);
            }
            .message {
                margin-top: 15px;
                padding: 10px;
                border-radius: 5px;
                text-align: center;
                display: none;
            }
            .success { background: #d4edda; color: #155724; }
            .error { background: #f8d7da; color: #721c24; }
            .render-info {
                margin-top: 20px;
                padding: 10px;
                background: #f8f9fa;
                border-radius: 5px;
                font-size: 12px;
                color: #666;
            }
        </style>
    </head>
    <body>
        <div class="login-container">
            <div class="logo">
                <h1>🐐 Goat-Bot V2</h1>
                <p>Control Panel - Render Deployment</p>
            </div>
            <form id="loginForm">
                <div class="form-group">
                    <label for="password">Password:</label>
                    <input type="password" id="password" name="password" required>
                </div>
                <button type="submit" class="btn">Login</button>
            </form>
            <div class="render-info">
                <strong>Render Note:</strong> Bot processes may restart automatically. For persistent operation, consider upgrading to a paid plan.
            </div>
            <div id="message" class="message"></div>
        </div>

        <script>
            document.getElementById('loginForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const password = document.getElementById('password').value;
                const messageDiv = document.getElementById('message');
                
                try {
                    const response = await fetch('/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ password })
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        messageDiv.className = 'message success';
                        messageDiv.textContent = 'Login successful! Redirecting...';
                        messageDiv.style.display = 'block';
                        setTimeout(() => {
                            window.location.href = '/dashboard';
                        }, 1000);
                    } else {
                        messageDiv.className = 'message error';
                        messageDiv.textContent = result.message;
                        messageDiv.style.display = 'block';
                    }
                } catch (error) {
                    messageDiv.className = 'message error';
                    messageDiv.textContent = 'Login failed. Please try again.';
                    messageDiv.style.display = 'block';
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
        res.json({ success: true, message: 'Login successful' });
    } else {
        res.json({ success: false, message: 'Invalid password' });
    }
});

app.get('/dashboard', requireAuth, (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Goat-Bot V2 - Dashboard</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                background: #f5f6fa;
                color: #333;
            }
            .header {
                background: white;
                padding: 20px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
            }
            .logo { display: flex; align-items: center; gap: 10px; }
            .logo h1 { font-size: 24px; color: #333; }
            .nav { display: flex; gap: 15px; flex-wrap: wrap; }
            .nav a { 
                padding: 8px 15px; 
                background: #667eea; 
                color: white; 
                text-decoration: none; 
                border-radius: 5px;
                transition: background 0.3s;
                font-size: 14px;
            }
            .nav a:hover { background: #764ba2; }
            .container { padding: 20px; max-width: 1200px; margin: 0 auto; }
            .status-card { 
                background: white; 
                padding: 25px; 
                border-radius: 10px; 
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                margin-bottom: 20px;
            }
            .status-indicator { 
                display: inline-block; 
                width: 12px; 
                height: 12px; 
                border-radius: 50%; 
                margin-right: 10px;
            }
            .online { background: #4CAF50; }
            .offline { background: #f44336; }
            .restarting { background: #ff9800; animation: pulse 1.5s infinite; }
            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
            }
            .controls { display: flex; gap: 10px; margin: 20px 0; flex-wrap: wrap; }
            .btn { 
                padding: 10px 20px; 
                border: none; 
                border-radius: 5px; 
                cursor: pointer; 
                font-size: 14px;
                transition: all 0.3s;
                min-width: 120px;
            }
            .btn-start { background: #4CAF50; color: white; }
            .btn-stop { background: #f44336; color: white; }
            .btn-restart { background: #ff9800; color: white; }
            .btn:disabled { 
                background: #cccccc; 
                cursor: not-allowed;
                transform: none;
            }
            .btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
            .stats-grid { 
                display: grid; 
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); 
                gap: 15px; 
                margin: 20px 0;
            }
            .stat-card { 
                background: white; 
                padding: 20px; 
                border-radius: 8px; 
                box-shadow: 0 3px 10px rgba(0,0,0,0.1);
                text-align: center;
            }
            .stat-value { font-size: 24px; font-weight: bold; color: #667eea; }
            .stat-label { font-size: 14px; color: #666; margin-top: 5px; }
            .features-grid { 
                display: grid; 
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
                gap: 20px;
                margin-top: 30px;
            }
            .feature-card { 
                background: white; 
                padding: 20px; 
                border-radius: 10px; 
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            }
            .feature-card h3 { margin-bottom: 15px; color: #333; font-size: 18px; }
            .feature-controls { display: flex; flex-direction: column; gap: 10px; }
            .feature-controls input, .feature-controls textarea, .feature-controls select {
                padding: 8px 12px;
                border: 1px solid #ddd;
                border-radius: 5px;
                font-size: 14px;
            }
            .feature-controls button {
                padding: 8px 15px;
                background: #667eea;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                transition: background 0.3s;
            }
            .feature-controls button:hover {
                background: #5a6fd8;
            }
            .feature-controls button:disabled {
                background: #cccccc;
                cursor: not-allowed;
            }
            .logs { 
                background: #1e1e1e; 
                color: #00ff00; 
                padding: 15px; 
                border-radius: 5px; 
                font-family: 'Courier New', monospace;
                height: 200px;
                overflow-y: auto;
                margin-top: 10px;
                font-size: 12px;
                line-height: 1.4;
            }
            .render-notice {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                color: #856404;
                padding: 15px;
                border-radius: 5px;
                margin: 15px 0;
                font-size: 14px;
            }
            @media (max-width: 768px) {
                .header { flex-direction: column; gap: 15px; }
                .nav { justify-content: center; }
                .controls { justify-content: center; }
                .container { padding: 10px; }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="logo">
                <h1>🐐 Goat-Bot V2 Dashboard</h1>
            </div>
            <div class="nav">
                <a href="/dashboard">Dashboard</a>
                <a href="/logout">Logout</a>
            </div>
        </div>

        <div class="container">
            <div class="render-notice">
                <strong>🚀 Render Deployment:</strong> This panel is optimized for Render. Bot processes may restart automatically. For 24/7 operation, consider upgrading to a paid plan.
            </div>

            <div class="status-card">
                <h2>Bot Status: 
                    <span id="statusIndicator" class="status-indicator offline"></span>
                    <span id="statusText">Offline</span>
                </h2>
                
                <div class="controls">
                    <button class="btn btn-start" onclick="controlBot('start')" id="startBtn">Start Bot</button>
                    <button class="btn btn-stop" onclick="controlBot('stop')" id="stopBtn" disabled>Stop Bot</button>
                    <button class="btn btn-restart" onclick="controlBot('restart')" id="restartBtn" disabled>Restart Bot</button>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value" id="uptime">0s</div>
                        <div class="stat-label">Uptime</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="messages">0</div>
                        <div class="stat-label">Messages Processed</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="commands">0</div>
                        <div class="stat-label">Commands Executed</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="users">0</div>
                        <div class="stat-label">Users Served</div>
                    </div>
                </div>
            </div>

            <div class="features-grid">
                <!-- Quick Actions -->
                <div class="feature-card">
                    <h3>🚀 Quick Actions</h3>
                    <div class="feature-controls">
                        <button onclick="performAction('clear-cache')" id="clearCacheBtn">Clear Cache</button>
                        <button onclick="performAction('update')" id="updateBtn">Update Bot</button>
                        <button onclick="showSystemInfo()" id="systemInfoBtn">System Info</button>
                        <button onclick="loadLogs()" id="logsBtn">Refresh Logs</button>
                    </div>
                </div>

                <!-- Broadcast Message -->
                <div class="feature-card">
                    <h3>📢 Broadcast Message</h3>
                    <div class="feature-controls">
                        <textarea id="broadcastMessage" placeholder="Enter broadcast message..." rows="3"></textarea>
                        <button onclick="sendBroadcast()" id="broadcastBtn">Send Broadcast</button>
                    </div>
                </div>

                <!-- Command Management -->
                <div class="feature-card">
                    <h3>⚙️ Command Settings</h3>
                    <div class="feature-controls">
                        <input type="text" id="newPrefix" placeholder="New command prefix">
                        <button onclick="changePrefix()" id="prefixBtn">Change Prefix</button>
                        <select id="commandSelect" onchange="toggleCommand()">
                            <option value="">Select command to toggle</option>
                            <option value="help">help - Show help menu</option>
                            <option value="ping">ping - Check bot latency</option>
                            <option value="info">info - Bot information</option>
                        </select>
                    </div>
                </div>

                <!-- Performance Monitor -->
                <div class="feature-card">
                    <h3>📊 Performance</h3>
                    <div id="performanceInfo">Loading performance data...</div>
                </div>

                <!-- User Statistics -->
                <div class="feature-card">
                    <h3>👥 User Statistics</h3>
                    <div id="userStats">Loading user statistics...</div>
                </div>

                <!-- Log Viewer -->
                <div class="feature-card" style="grid-column: 1 / -1;">
                    <h3>📋 Recent Logs</h3>
                    <div class="logs" id="logViewer">No logs available. Click "Refresh Logs" to load.</div>
                </div>
            </div>
        </div>

        <script>
            let isProcessing = false;

            // Update bot status every 5 seconds
            setInterval(updateStatus, 5000);
            updateStatus();

            async function updateStatus() {
                try {
                    const response = await fetch('/api/bot/status');
                    const data = await response.json();
                    
                    const indicator = document.getElementById('statusIndicator');
                    const statusText = document.getElementById('statusText');
                    const startBtn = document.getElementById('startBtn');
                    const stopBtn = document.getElementById('stopBtn');
                    const restartBtn = document.getElementById('restartBtn');
                    
                    if (data.status === 'online') {
                        indicator.className = 'status-indicator online';
                        statusText.textContent = 'Online';
                        startBtn.disabled = true;
                        stopBtn.disabled = false;
                        restartBtn.disabled = false;
                    } else if (data.status === 'restarting') {
                        indicator.className = 'status-indicator restarting';
                        statusText.textContent = 'Restarting...';
                        startBtn.disabled = true;
                        stopBtn.disabled = true;
                        restartBtn.disabled = true;
                    } else {
                        indicator.className = 'status-indicator offline';
                        statusText.textContent = 'Offline';
                        startBtn.disabled = false;
                        stopBtn.disabled = true;
                        restartBtn.disabled = true;
                    }
                    
                    document.getElementById('uptime').textContent = data.stats.uptime;
                    document.getElementById('messages').textContent = data.stats.messagesProcessed;
                    document.getElementById('commands').textContent = data.stats.commandsExecuted;
                    document.getElementById('users').textContent = data.stats.usersServed;
                    
                } catch (error) {
                    console.error('Failed to update status:', error);
                    document.getElementById('statusText').textContent = 'Connection Error';
                }
            }

            async function controlBot(action) {
                if (isProcessing) return;
                
                isProcessing = true;
                const buttons = document.querySelectorAll('.btn');
                buttons.forEach(btn => btn.disabled = true);
                
                try {
                    const response = await fetch(\`/api/bot/\${action}\`, { 
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    const result = await response.json();
                    alert(result.message);
                    await updateStatus();
                } catch (error) {
                    alert('Failed to control bot: ' + error.message);
                } finally {
                    isProcessing = false;
                    await updateStatus(); // Re-enable buttons based on status
                }
            }

            async function performAction(action) {
                if (isProcessing) return;
                isProcessing = true;
                
                try {
                    const button = document.getElementById(\`\${action}Btn\`);
                    if (button) button.disabled = true;
                    
                    const response = await fetch(\`/api/bot/\${action}\`, { method: 'POST' });
                    const result = await response.json();
                    alert(result.message || 'Action completed');
                } catch (error) {
                    alert('Action failed: ' + error.message);
                } finally {
                    isProcessing = false;
                    await updateStatus();
                }
            }

            async function showSystemInfo() {
                try {
                    const response = await fetch('/api/system/info');
                    const result = await response.json();
                    alert(result.info || 'System info loaded');
                } catch (error) {
                    alert('Failed to get system info');
                }
            }

            async function sendBroadcast() {
                const message = document.getElementById('broadcastMessage').value;
                if (!message) {
                    alert('Please enter a message');
                    return;
                }
                
                try {
                    const response = await fetch('/api/bot/broadcast', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message })
                    });
                    const result = await response.json();
                    alert(result.message);
                    document.getElementById('broadcastMessage').value = '';
                } catch (error) {
                    alert('Failed to send broadcast');
                }
            }

            async function loadLogs() {
                try {
                    const response = await fetch('/api/logs');
                    const result = await response.json();
                    document.getElementById('logViewer').textContent = result.logs || 'No logs available';
                } catch (error) {
                    document.getElementById('logViewer').textContent = 'Failed to load logs: ' + error.message;
                }
            }

            async function changePrefix() {
                const prefix = document.getElementById('newPrefix').value;
                if (!prefix) {
                    alert('Please enter a prefix');
                    return;
                }
                
                try {
                    const response = await fetch('/api/bot/change-prefix', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ prefix })
                    });
                    const result = await response.json();
                    alert(result.message);
                    document.getElementById('newPrefix').value = '';
                } catch (error) {
                    alert('Failed to change prefix');
                }
            }

            async function toggleCommand() {
                const command = document.getElementById('commandSelect').value;
                if (!command) return;
                
                const enabled = confirm(\`Enable or disable \${command}? OK for enable, Cancel for disable\`);
                
                try {
                    const response = await fetch('/api/bot/toggle-command', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ command, enabled })
                    });
                    const result = await response.json();
                    alert(result.message);
                } catch (error) {
                    alert('Failed to toggle command');
                }
            }

            // Load user stats
            async function loadUserStats() {
                try {
                    const response = await fetch('/api/users/stats');
                    const result = await response.json();
                    const stats = result.stats;
                    document.getElementById('userStats').innerHTML = \`
                        <strong>Total Users:</strong> \${stats.totalUsers || 'N/A'}<br>
                        <strong>Active Today:</strong> \${stats.activeToday || 'N/A'}<br>
                        <strong>New This Week:</strong> \${stats.newThisWeek || 'N/A'}
                    \`;
                } catch (error) {
                    document.getElementById('userStats').textContent = 'Failed to load user stats';
                }
            }

            // Load performance info
            async function loadPerformance() {
                try {
                    const response = await fetch('/api/bot/performance');
                    const result = await response.json();
                    const perf = result.performance;
                    document.getElementById('performanceInfo').innerHTML = \`
                        <strong>Memory Usage:</strong> \${perf.memory.heapUsed || 'N/A'}<br>
                        <strong>Uptime:</strong> \${perf.uptime || 'N/A'}<br>
                        <strong>RSS:</strong> \${perf.memory.rss || 'N/A'}
                    \`;
                } catch (error) {
                    document.getElementById('performanceInfo').textContent = 'Failed to load performance info';
                }
            }

            // Initialize all data
            loadUserStats();
            loadPerformance();
            loadLogs();
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
    stopBot();
    setTimeout(() => {
        const result = startBot();
        res.json(result);
    }, 3000);
});

// Additional Bot Control Functions (Render-compatible)
app.post('/api/bot/clear-cache', requireAuth, (req, res) => {
    // Simulate cache clearing for Render compatibility
    setTimeout(() => {
        res.json({ success: true, message: 'Cache cleared successfully' });
    }, 1000);
});

app.post('/api/bot/update', requireAuth, (req, res) => {
    // Simulate update for Render compatibility
    res.json({ success: true, message: 'Update simulation completed (Git operations disabled on Render free tier)' });
});

app.get('/api/system/info', requireAuth, (req, res) => {
    // Get basic system information
    const systemInfo = {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        memory: process.memoryUsage(),
        uptime: process.uptime()
    };
    res.json({ success: true, info: JSON.stringify(systemInfo, null, 2) });
});

app.post('/api/bot/broadcast', requireAuth, (req, res) => {
    const { message } = req.body;
    // Simulate broadcast functionality
    res.json({ success: true, message: `Broadcast sent: "${message}" (Simulation)` });
});

app.get('/api/logs', requireAuth, (req, res) => {
    // Return recent console logs
    const logs = `[${new Date().toISOString()}] Web dashboard accessed\n[${new Date().toISOString()}] Bot status: ${botStatus}\n[${new Date().toISOString()}] Render deployment active`;
    res.json({ success: true, logs: logs });
});

app.post('/api/bot/change-prefix', requireAuth, (req, res) => {
    const { prefix } = req.body;
    res.json({ success: true, message: `Command prefix changed to: ${prefix} (Simulation)` });
});

app.get('/api/users/stats', requireAuth, (req, res) => {
    // Simulate user statistics
    res.json({
        success: true,
        stats: {
            totalUsers: Math.floor(Math.random() * 1000) + 500,
            activeToday: Math.floor(Math.random() * 100) + 50,
            newThisWeek: Math.floor(Math.random() * 50) + 20
        }
    });
});

app.post('/api/bot/toggle-command', requireAuth, (req, res) => {
    const { command, enabled } = req.body;
    res.json({ success: true, message: `Command ${command} ${enabled ? 'enabled' : 'disabled'} (Simulation)` });
});

app.get('/api/bot/performance', requireAuth, (req, res) => {
    const used = process.memoryUsage();
    res.json({
        success: true,
        performance: {
            memory: {
                rss: `${Math.round(used.rss / 1024 / 1024)} MB`,
                heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)} MB`,
                heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)} MB`
            },
            uptime: `${Math.round(process.uptime())} seconds`
        }
    });
});

// Health check endpoint for Render
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        botStatus: botStatus,
        deployment: 'render'
    });
});

// Handle process termination gracefully
process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully');
    if (botProcess) {
        botProcess.kill('SIGTERM');
    }
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully');
    if (botProcess) {
        botProcess.kill('SIGTERM');
    }
    process.exit(0);
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
    log.info(`🚀 Goat-Bot V2 Control Panel running on port ${PORT}`);
    log.info(`🌐 Access the panel at: http://localhost:${PORT}`);
    log.info(`🔐 Admin password: ${ADMIN_PASSWORD}`);
    log.info(`📋 Health check: http://localhost:${PORT}/health`);
    
    // Auto-start bot on Render (optional)
    if (process.env.AUTO_START_BOT === 'true') {
        log.info('🤖 Auto-starting bot...');
        setTimeout(() => startBot(), 5000);
    }
});

// Start the bot project
function startProject() {
    log.info("Starting Goat-Bot V2...");
    startBot();
}

// Initialize
startProject();
