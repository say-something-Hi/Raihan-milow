/**
 * @author NTKhang & Raihan
 * ! Official source code: https://github.com/ntkhang03/Goat-Bot-V2
 * ! Enhanced by Raihan for Mobile Responsive Control Panel
 * 🐐 Goat-Bot V2 - All-in-One Render Deployment Version
 * 👑 Owner: Raihan
 * 📧 Contact: mayberaihan00@gmail.com
 */

const { spawn, exec } = require("child_process");
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

// Initialize Express App
const app = express();
const PORT = process.env.PORT || 3000;

// Configuration - CHANGE THESE FOR SECURITY
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Raihan@008897';
const BOT_OWNER = process.env.BOT_OWNER || 'Raihan';
const BOT_EMAIL = process.env.BOT_EMAIL || 'mayberaihan00@gmail.com';

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'goat-bot-mobile-secret-2024-raihan',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Global variables
let botProcess = null;
let botStatus = 'offline';
let botRestartCount = 0;
let botStats = {
    startTime: null,
    messagesProcessed: 0,
    commandsExecuted: 0,
    usersServed: 0,
    groupsManaged: 0,
    uptime: '0s',
    performance: 'Optimal',
    lastUpdate: new Date()
};

// Logger function
function log(level, message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    console.log(logMessage);
}

// Authentication middleware
function requireAuth(req, res, next) {
    if (req.session.authenticated) {
        return next();
    }
    res.status(401).json({ error: 'Authentication required' });
}

// Bot Control Functions
function startBot() {
    if (botProcess && botStatus === 'online') {
        return { success: false, message: '❌ Bot already running!' };
    }

    try {
        log('info', 'Starting bot process...');
        
        // Try to start the bot process
        botProcess = spawn('node', ['Goat.js'], {
            cwd: __dirname,
            stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
            shell: false
        });

        botStatus = 'online';
        botStats.startTime = new Date();
        botRestartCount++;

        // Handle bot process output
        botProcess.stdout.on('data', (data) => {
            const output = data.toString().trim();
            if (output) {
                log('bot', output);
                // Extract stats from bot output if possible
                updateStatsFromOutput(output);
            }
        });

        botProcess.stderr.on('data', (data) => {
            const error = data.toString().trim();
            if (error) {
                log('error', `Bot Error: ${error}`);
            }
        });

        // Handle IPC messages from bot
        botProcess.on('message', (message) => {
            if (message && message.type === 'statsUpdate') {
                updateBotStats(message.data);
            }
        });

        botProcess.on('error', (error) => {
            log('error', `Bot process error: ${error.message}`);
            botStatus = 'error';
        });

        botProcess.on('close', (code, signal) => {
            log('warn', `Bot process exited with code ${code} and signal ${signal}`);
            botProcess = null;
            botStatus = 'offline';
            
            // Auto-restart logic
            if (code === 2 || code === null) {
                log('info', '🔄 Auto-restarting bot...');
                setTimeout(() => {
                    if (botRestartCount < 10) { // Prevent infinite restart loops
                        startBot();
                    } else {
                        log('error', 'Max restart attempts reached. Manual intervention required.');
                    }
                }, 5000);
            }
        });

        return { success: true, message: '✅ Bot started successfully!' };
    } catch (error) {
        log('error', `Failed to start bot: ${error.message}`);
        return { success: false, message: '❌ Failed to start bot' };
    }
}

function stopBot() {
    if (!botProcess || botStatus !== 'online') {
        return { success: false, message: '❌ Bot is not running!' };
    }

    try {
        log('info', 'Stopping bot process...');
        botProcess.removeAllListeners();
        
        // Graceful shutdown
        if (botProcess.kill('SIGTERM')) {
            setTimeout(() => {
                if (botProcess) {
                    botProcess.kill('SIGKILL');
                }
            }, 5000);
            
            botProcess = null;
            botStatus = 'offline';
            botRestartCount = 0;
            return { success: true, message: '✅ Bot stopped successfully!' };
        } else {
            return { success: false, message: '❌ Failed to stop bot process' };
        }
    } catch (error) {
        log('error', `Failed to stop bot: ${error.message}`);
        return { success: false, message: '❌ Failed to stop bot' };
    }
}

function restartBot() {
    log('info', 'Restarting bot...');
    const stopResult = stopBot();
    
    if (stopResult.success || stopResult.message.includes('not running')) {
        setTimeout(() => {
            startBot();
        }, 3000);
        return { success: true, message: '🔄 Bot restarting...' };
    }
    
    return stopResult;
}

function updateBotStats(newStats) {
    if (newStats) {
        Object.keys(newStats).forEach(key => {
            if (botStats.hasOwnProperty(key)) {
                botStats[key] = newStats[key];
            }
        });
        botStats.lastUpdate = new Date();
    }
}

function updateStatsFromOutput(output) {
    // Simple heuristic to update stats from console output
    if (output.includes('message') && output.includes('processed')) {
        botStats.messagesProcessed++;
    }
    if (output.includes('command') && (output.includes('executed') || output.includes('running'))) {
        botStats.commandsExecuted++;
    }
    if (output.includes('connected') || output.includes('logged in')) {
        botStats.performance = 'Optimal';
    }
}

function calculateUptime() {
    if (botStatus === 'online' && botStats.startTime) {
        const uptimeMs = new Date() - botStats.startTime;
        const seconds = Math.floor(uptimeMs / 1000);
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }
    return '0s';
}

// Routes
app.get('/', (req, res) => {
    if (req.session.authenticated) {
        res.redirect('/dashboard');
    } else {
        res.redirect('/login');
    }
});

// Login Page
app.get('/login', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🐐 Goat-Bot V2 Login</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            background: linear-gradient(135deg, #667eea, #764ba2);
            min-height: 100vh; display: flex; align-items: center; justify-content: center;
            padding: 20px;
        }
        .login-container {
            background: white; padding: 40px; border-radius: 20px; 
            box-shadow: 0 20px 40px rgba(0,0,0,0.1); max-width: 400px; width: 100%;
        }
        .logo { text-align: center; margin-bottom: 30px; }
        .logo h1 { color: #333; margin-bottom: 10px; }
        .owner-info { 
            background: #f8f9fa; padding: 15px; border-radius: 10px; 
            margin-bottom: 20px; text-align: center;
        }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input { 
            width: 100%; padding: 15px; border: 2px solid #ddd; 
            border-radius: 10px; font-size: 16px;
        }
        button { 
            width: 100%; padding: 15px; background: #667eea; color: white;
            border: none; border-radius: 10px; font-size: 16px; cursor: pointer;
        }
        .message { margin-top: 15px; padding: 10px; border-radius: 5px; display: none; }
        .success { background: #d4edda; color: #155724; }
        .error { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="logo">
            <h1>🐐 Goat-Bot V2</h1>
            <p>Control Panel</p>
        </div>
        <div class="owner-info">
            <strong>👑 ${BOT_OWNER}</strong><br>
            <small>📧 ${BOT_EMAIL}</small>
        </div>
        <form id="loginForm">
            <div class="form-group">
                <label>Password:</label>
                <input type="password" id="password" required>
            </div>
            <button type="submit">Login</button>
        </form>
        <div id="message"></div>
    </div>
    <script>
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = document.getElementById('password').value;
            const btn = e.target.querySelector('button');
            const message = document.getElementById('message');
            
            btn.disabled = true;
            btn.textContent = 'Logging in...';
            
            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password })
                });
                const result = await response.json();
                
                if (result.success) {
                    message.className = 'message success';
                    message.textContent = 'Login successful!';
                    message.style.display = 'block';
                    setTimeout(() => window.location.href = '/dashboard', 1000);
                } else {
                    message.className = 'message error';
                    message.textContent = result.message;
                    message.style.display = 'block';
                }
            } catch (error) {
                message.className = 'message error';
                message.textContent = 'Network error';
                message.style.display = 'block';
            } finally {
                btn.disabled = false;
                btn.textContent = 'Login';
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
        req.session.user = { name: BOT_OWNER, email: BOT_EMAIL };
        res.json({ success: true });
    } else {
        res.json({ success: false, message: 'Invalid password!' });
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
    <title>🐐 Goat-Bot Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            background: #f5f5f5; color: #333;
        }
        .header {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white; padding: 20px; text-align: center;
        }
        .container { padding: 20px; max-width: 1200px; margin: 0 auto; }
        .status-panel { 
            background: white; padding: 20px; border-radius: 15px; 
            box-shadow: 0 5px 15px rgba(0,0,0,0.1); margin-bottom: 20px;
        }
        .status-indicator { 
            display: inline-block; width: 12px; height: 12px; 
            border-radius: 50%; margin-right: 10px;
        }
        .online { background: #43b581; }
        .offline { background: #f04747; }
        .controls { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin: 20px 0; }
        button { 
            padding: 15px; border: none; border-radius: 10px; 
            font-size: 16px; cursor: pointer; transition: all 0.3s;
        }
        .btn-start { background: #43b581; color: white; }
        .btn-stop { background: #f04747; color: white; }
        .btn-restart { background: #faa61a; color: white; }
        button:disabled { opacity: 0.5; cursor: not-allowed; }
        .stats { 
            display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); 
            gap: 15px; margin: 20px 0;
        }
        .stat-card {
            background: #f8f9fa; padding: 15px; border-radius: 10px; text-align: center;
        }
        .stat-value { font-size: 24px; font-weight: bold; color: #667eea; }
        .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
        .logs { 
            background: #1a1a1a; color: #00ff00; padding: 15px; 
            border-radius: 10px; font-family: monospace; 
            height: 200px; overflow-y: auto; margin-top: 20px;
        }
        .notification {
            position: fixed; top: 20px; right: 20px; padding: 15px 20px;
            border-radius: 10px; color: white; display: none;
        }
        .success { background: #43b581; }
        .error { background: #f04747; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🐐 Goat-Bot V2 Dashboard</h1>
        <p>👑 ${BOT_OWNER} | 📧 ${BOT_EMAIL}</p>
        <a href="/logout" style="color: white; margin-top: 10px; display: inline-block;">Logout</a>
    </div>
    
    <div class="container">
        <div class="status-panel">
            <h2>
                <span class="status-indicator offline" id="statusIndicator"></span>
                <span id="statusText">Bot Offline</span>
            </h2>
            
            <div class="controls">
                <button class="btn-start" onclick="controlBot('start')" id="startBtn">Start Bot</button>
                <button class="btn-stop" onclick="controlBot('stop')" id="stopBtn" disabled>Stop Bot</button>
                <button class="btn-restart" onclick="controlBot('restart')" id="restartBtn" disabled>Restart Bot</button>
            </div>
            
            <div class="stats">
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
        
        <div class="logs" id="logs">
            Loading system logs...
        </div>
    </div>
    
    <div class="notification" id="notification"></div>

    <script>
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
                    statusText.textContent = 'Bot Online';
                    startBtn.disabled = true;
                    stopBtn.disabled = false;
                    restartBtn.disabled = false;
                } else {
                    indicator.className = 'status-indicator offline';
                    statusText.textContent = 'Bot Offline';
                    startBtn.disabled = false;
                    stopBtn.disabled = true;
                    restartBtn.disabled = true;
                }
                
                // Update stats
                document.getElementById('uptimeStat').textContent = data.stats.uptime;
                document.getElementById('messagesStat').textContent = data.stats.messagesProcessed;
                document.getElementById('commandsStat').textContent = data.stats.commandsExecuted;
                document.getElementById('usersStat').textContent = data.stats.usersServed;
                document.getElementById('groupsStat').textContent = data.stats.groupsManaged;
                document.getElementById('performanceStat').textContent = data.stats.performance;
                
            } catch (error) {
                console.error('Failed to update status:', error);
            }
        }
        
        async function controlBot(action) {
            const btn = document.getElementById(action + 'Btn');
            const originalText = btn.textContent;
            
            btn.disabled = true;
            btn.textContent = 'Processing...';
            
            try {
                const response = await fetch('/api/bot/' + action, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                const result = await response.json();
                
                showNotification(result.message, result.success ? 'success' : 'error');
                
                // Update status after action
                setTimeout(updateStatus, 2000);
                
            } catch (error) {
                showNotification('Action failed: ' + error.message, 'error');
            } finally {
                setTimeout(() => {
                    btn.textContent = originalText;
                    updateStatus(); // Re-enable buttons based on current status
                }, 3000);
            }
        }
        
        async function loadLogs() {
            try {
                const response = await fetch('/api/logs');
                const result = await response.json();
                document.getElementById('logs').textContent = result.logs;
            } catch (error) {
                document.getElementById('logs').textContent = 'Failed to load logs';
            }
        }
        
        function showNotification(message, type) {
            const notification = document.getElementById('notification');
            notification.textContent = message;
            notification.className = 'notification ' + type;
            notification.style.display = 'block';
            
            setTimeout(() => {
                notification.style.display = 'none';
            }, 3000);
        }
        
        // Auto-update
        setInterval(updateStatus, 3000);
        setInterval(loadLogs, 5000);
        updateStatus();
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
    botStats.uptime = calculateUptime();
    res.json({
        status: botStatus,
        stats: botStats,
        restartCount: botRestartCount
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
    botStats.uptime = calculateUptime();
    const logs = `Goat-Bot V2 Control Panel - Render Deployment
Status: ${botStatus} | Uptime: ${botStats.uptime}
Messages Processed: ${botStats.messagesProcessed}
Commands Executed: ${botStats.commandsExecuted}
Users Served: ${botStats.usersServed}
Groups Managed: ${botStats.groupsManaged}
Performance: ${botStats.performance}
Restart Count: ${botRestartCount}
Last Update: ${botStats.lastUpdate.toISOString()}
Owner: ${BOT_OWNER} (${BOT_EMAIL})
Server: Render ${process.env.NODE_ENV || 'development'}`;
    
    res.json({ success: true, logs: logs });
});

// Health check endpoint for Render
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        bot: botStatus,
        uptime: botStats.uptime,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Error handling
app.use((err, req, res, next) => {
    log('error', `Server error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Graceful shutdown
process.on('SIGINT', () => {
    log('info', 'Shutting down gracefully...');
    if (botProcess) {
        botProcess.kill();
    }
    process.exit(0);
});

process.on('SIGTERM', () => {
    log('info', 'Received SIGTERM, shutting down...');
    if (botProcess) {
        botProcess.kill();
    }
    process.exit(0);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    log('info', `🚀 Goat-Bot V2 Control Panel started on port ${PORT}`);
    log('info', `📱 Mobile Optimized: Yes`);
    log('info', `👑 Owner: ${BOT_OWNER}`);
    log('info', `🔐 Admin access at: http://localhost:${PORT}`);
    
    // Auto-start bot
    setTimeout(() => {
        log('info', '🤖 Starting bot process...');
        startBot();
    }, 2000);
});

// Export for testing
module.exports = app;
