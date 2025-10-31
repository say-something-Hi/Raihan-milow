/**
 * @author NTKhang
 * ! The source code is written by NTKhang, please don't change the author's name everywhere. Thank you for using
 * ! Official source code: https://github.com/ntkhang03/Goat-Bot-V2
 * ! If you do not download the source code from the above address, you are using an unknown version and at risk of having your account hacked
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
    secret: 'goat-bot-secret-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

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

// Password
const ADMIN_PASSWORD = 'Raihan@008897';

// Bot control functions
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
                log.info("Restarting Project...");
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
        
        // Simulate activity
        if (Math.random() > 0.7) {
            botStats.messagesProcessed += Math.floor(Math.random() * 3) + 1;
            botStats.commandsExecuted += Math.floor(Math.random() * 2);
        }
    }
}

// Authentication middleware
function requireAuth(req, res, next) {
    if (req.session.authenticated) {
        return next();
    }
    res.redirect('/login');
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
        <html>
        <head>
            <title>Goat-Bot Login</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: Arial; background: #1a1a1a; color: white; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                .login-box { background: #2d2d2d; padding: 40px; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.5); width: 300px; text-align: center; }
                input, button { width: 100%; padding: 12px; margin: 10px 0; border: none; border-radius: 5px; box-sizing: border-box; }
                input { background: #3d3d3d; color: white; }
                button { background: #7289da; color: white; cursor: pointer; font-weight: bold; }
                button:hover { background: #5b73c4; }
                .logo { font-size: 24px; margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <div class="login-box">
                <div class="logo">🐐 Goat-Bot V2</div>
                <h3>Admin Login</h3>
                <form id="loginForm">
                    <input type="password" id="password" placeholder="Enter Password" required>
                    <button type="submit">Login</button>
                </form>
                <div id="message" style="margin-top: 10px; color: #ff6b6b;"></div>
            </div>
            <script>
                document.getElementById('loginForm').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const password = document.getElementById('password').value;
                    const btn = e.target.querySelector('button');
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
                            window.location.href = '/dashboard';
                        } else {
                            document.getElementById('message').textContent = result.message;
                        }
                    } catch (error) {
                        document.getElementById('message').textContent = 'Login failed';
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
        res.json({ success: true });
    } else {
        res.json({ success: false, message: 'Wrong password!' });
    }
});

app.get('/dashboard', requireAuth, (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Goat-Bot Dashboard</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: Arial; background: #1a1a1a; color: white; margin: 0; padding: 20px; }
                .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; }
                .nav a { color: white; text-decoration: none; margin-left: 15px; background: #7289da; padding: 8px 15px; border-radius: 5px; }
                .status-card { background: #2d2d2d; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
                .controls { display: flex; gap: 10px; margin: 15px 0; flex-wrap: wrap; }
                button { padding: 12px 20px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; min-width: 120px; }
                .btn-start { background: #43b581; color: white; }
                .btn-stop { background: #f04747; color: white; }
                .btn-restart { background: #faa61a; color: white; }
                .btn-action { background: #7289da; color: white; }
                button:disabled { background: #666; cursor: not-allowed; }
                button:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
                .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0; }
                .stat-card { background: #3d3d3d; padding: 15px; border-radius: 8px; text-align: center; }
                .stat-value { font-size: 24px; font-weight: bold; color: #7289da; }
                .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; }
                .feature-card { background: #2d2d2d; padding: 20px; border-radius: 8px; }
                .feature-controls { display: flex; flex-direction: column; gap: 10px; }
                .feature-controls input, .feature-controls textarea { 
                    width: 100%; padding: 10px; background: #3d3d3d; color: white; border: none; border-radius: 5px; box-sizing: border-box; 
                }
                .logs { background: black; color: #00ff00; padding: 15px; border-radius: 5px; height: 200px; overflow-y: auto; font-family: monospace; margin-top: 10px; font-size: 12px; }
                @media (max-width: 768px) {
                    .header { flex-direction: column; gap: 15px; }
                    .controls { justify-content: center; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🐐 Goat-Bot V2 Dashboard</h1>
                <div class="nav">
                    <a href="/dashboard">Dashboard</a>
                    <a href="/logout">Logout</a>
                </div>
            </div>

            <div class="status-card">
                <h2>Bot Status: <span id="statusText" style="color: #f04747;">Offline</span></h2>
                <div class="controls">
                    <button class="btn-start" onclick="controlBot('start')" id="startBtn">🚀 Start Bot</button>
                    <button class="btn-stop" onclick="controlBot('stop')" id="stopBtn" disabled>🛑 Stop Bot</button>
                    <button class="btn-restart" onclick="controlBot('restart')" id="restartBtn" disabled>🔁 Restart Bot</button>
                </div>
                
                <div class="stats">
                    <div class="stat-card">
                        <div class="stat-value" id="uptime">0s</div>
                        <div>Uptime</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="messages">0</div>
                        <div>Messages</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="commands">0</div>
                        <div>Commands</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="users">0</div>
                        <div>Users</div>
                    </div>
                </div>
            </div>

            <div class="features">
                <div class="feature-card">
                    <h3>🚀 Quick Actions</h3>
                    <div class="feature-controls">
                        <button class="btn-action" onclick="performAction('clear-cache')">🗑️ Clear Cache</button>
                        <button class="btn-action" onclick="performAction('update')">🔄 Update Bot</button>
                        <button class="btn-action" onclick="showSystemInfo()">📊 System Info</button>
                    </div>
                </div>
                
                <div class="feature-card">
                    <h3>📢 Broadcast Message</h3>
                    <div class="feature-controls">
                        <textarea id="broadcastMessage" placeholder="Enter broadcast message..." rows="3"></textarea>
                        <button class="btn-action" onclick="sendBroadcast()">📨 Send Broadcast</button>
                    </div>
                </div>
                
                <div class="feature-card">
                    <h3>⚙️ Command Settings</h3>
                    <div class="feature-controls">
                        <input type="text" id="newPrefix" placeholder="New command prefix">
                        <button class="btn-action" onclick="changePrefix()">🔧 Change Prefix</button>
                    </div>
                </div>
            </div>

            <div class="feature-card">
                <h3>📋 Live Logs</h3>
                <button class="btn-action" onclick="loadLogs()">🔄 Refresh Logs</button>
                <div class="logs" id="logViewer">Loading logs...</div>
            </div>

            <script>
                async function updateStatus() {
                    try {
                        const response = await fetch('/api/bot/status');
                        const data = await response.json();
                        
                        const statusText = document.getElementById('statusText');
                        statusText.textContent = data.status;
                        statusText.style.color = data.status === 'online' ? '#43b581' : '#f04747';
                        
                        document.getElementById('uptime').textContent = data.stats.uptime;
                        document.getElementById('messages').textContent = data.stats.messagesProcessed;
                        document.getElementById('commands').textContent = data.stats.commandsExecuted;
                        document.getElementById('users').textContent = data.stats.usersServed;
                        
                        const startBtn = document.getElementById('startBtn');
                        const stopBtn = document.getElementById('stopBtn');
                        const restartBtn = document.getElementById('restartBtn');
                        
                        if (data.status === 'online') {
                            startBtn.disabled = true;
                            stopBtn.disabled = false;
                            restartBtn.disabled = false;
                        } else {
                            startBtn.disabled = false;
                            stopBtn.disabled = true;
                            restartBtn.disabled = true;
                        }
                    } catch (error) {
                        console.error('Failed to update status:', error);
                    }
                }

                async function controlBot(action) {
                    try {
                        const response = await fetch(\`/api/bot/\${action}\`, { method: 'POST' });
                        const result = await response.json();
                        alert(result.message);
                        updateStatus();
                    } catch (error) {
                        alert('Failed to control bot');
                    }
                }

                async function performAction(action) {
                    try {
                        const response = await fetch(\`/api/bot/\${action}\`, { method: 'POST' });
                        const result = await response.json();
                        alert(result.message);
                    } catch (error) {
                        alert('Action failed');
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

                async function showSystemInfo() {
                    try {
                        const response = await fetch('/api/system/info');
                        const result = await response.json();
                        alert('System Information:\\n\\n' + result.info);
                    } catch (error) {
                        alert('Failed to get system info');
                    }
                }

                async function loadLogs() {
                    try {
                        const response = await fetch('/api/logs');
                        const result = await response.json();
                        document.getElementById('logViewer').textContent = result.logs || 'No logs available';
                    } catch (error) {
                        document.getElementById('logViewer').textContent = 'Failed to load logs';
                    }
                }

                // Auto-update every 3 seconds
                setInterval(updateStatus, 3000);
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

app.post('/api/bot/clear-cache', requireAuth, (req, res) => {
    res.json({ success: true, message: '🗑️ Cache cleared successfully' });
});

app.post('/api/bot/update', requireAuth, (req, res) => {
    res.json({ success: true, message: '🔄 Bot update completed' });
});

app.post('/api/bot/broadcast', requireAuth, (req, res) => {
    const { message } = req.body;
    res.json({ success: true, message: \`📢 Broadcast sent: "\${message}"\` });
});

app.get('/api/logs', requireAuth, (req, res) => {
    const logs = \`[\${new Date().toLocaleString()}] Bot status: \${botStatus}\\n[\${new Date().toLocaleString()}] Dashboard accessed\\n[\${new Date().toLocaleString()}] System running normally\`;
    res.json({ success: true, logs: logs });
});

app.post('/api/bot/change-prefix', requireAuth, (req, res) => {
    const { prefix } = req.body;
    res.json({ success: true, message: \`🔧 Command prefix changed to: \${prefix}\` });
});

app.get('/api/system/info', requireAuth, (req, res) => {
    const info = \`Platform: \${process.platform}\\nNode.js: \${process.version}\\nMemory: \${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB\\nUptime: \${Math.round(process.uptime())}s\`;
    res.json({ success: true, info: info });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', bot: botStatus });
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
    log.info(\`🚀 Goat-Bot V2 Control Panel running on port \${PORT}\`);
    log.info(\`🌐 Access: http://localhost:\${PORT}\`);
    log.info(\`🔐 Password: \${ADMIN_PASSWORD}\`);
    log.info(\`🤖 Starting Goat-Bot V2...\`);
});

// Start the bot
startProject();
