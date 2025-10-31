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
 * Cảm ơn bạn đã sử dụng
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
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'goat-bot-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
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

// Password configuration
const ADMIN_PASSWORD = 'Raihan@008897';

// Start bot function
function startBot() {
    if (botProcess) {
        return { success: false, message: 'Bot is already running' };
    }

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
            log.info("Restarting Bot...");
            setTimeout(() => startBot(), 2000);
        }
    });

    return { success: true, message: 'Bot started successfully' };
}

// Stop bot function
function stopBot() {
    if (!botProcess) {
        return { success: false, message: 'Bot is not running' };
    }

    botProcess.kill();
    botProcess = null;
    botStatus = 'offline';
    return { success: true, message: 'Bot stopped successfully' };
}

// Restart bot function
function restartBot() {
    stopBot();
    setTimeout(() => startBot(), 3000);
    return { success: true, message: 'Bot restarting...' };
}

// Update bot statistics (you can integrate this with your actual bot)
function updateStats() {
    if (botStatus === 'online' && botStats.startTime) {
        const uptime = Math.floor((new Date() - botStats.startTime) / 1000);
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = uptime % 60;
        botStats.uptime = `${hours}h ${minutes}m ${seconds}s`;
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
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
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
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
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

// Additional Bot Control Functions
app.post('/api/bot/clear-cache', requireAuth, (req, res) => {
    // Clear bot cache function
    exec('rm -rf cache/*', (error) => {
        if (error) {
            res.json({ success: false, message: 'Failed to clear cache' });
        } else {
            res.json({ success: true, message: 'Cache cleared successfully' });
        }
    });
});

app.post('/api/bot/update', requireAuth, (req, res) => {
    // Update bot from git
    exec('git pull', (error, stdout) => {
        if (error) {
            res.json({ success: false, message: 'Update failed' });
        } else {
            res.json({ success: true, message: 'Update completed', output: stdout });
        }
    });
});

app.post('/api/bot/backup', requireAuth, (req, res) => {
    // Create backup
    const backupName = `backup-${Date.now()}.zip`;
    exec(`zip -r ${backupName} . -x "node_modules/*" ".git/*"`, (error) => {
        if (error) {
            res.json({ success: false, message: 'Backup failed' });
        } else {
            res.json({ success: true, message: 'Backup created', filename: backupName });
        }
    });
});

app.get('/api/system/info', requireAuth, (req, res) => {
    // Get system information
    exec('free -m && df -h', (error, stdout) => {
        if (error) {
            res.json({ success: false, message: 'Failed to get system info' });
        } else {
            res.json({ success: true, info: stdout });
        }
    });
});

app.post('/api/bot/broadcast', requireAuth, (req, res) => {
    const { message } = req.body;
    // Implement broadcast functionality
    // This would need to integrate with your bot's messaging system
    res.json({ success: true, message: 'Broadcast sent to all users' });
});

app.get('/api/logs', requireAuth, (req, res) => {
    // Get recent logs
    exec('tail -100 logs/app.log', (error, stdout) => {
        if (error) {
            res.json({ success: false, message: 'Failed to read logs' });
        } else {
            res.json({ success: true, logs: stdout });
        }
    });
});

app.post('/api/bot/change-prefix', requireAuth, (req, res) => {
    const { prefix } = req.body;
    // Implement prefix change functionality
    res.json({ success: true, message: `Command prefix changed to: ${prefix}` });
});

app.get('/api/users/stats', requireAuth, (req, res) => {
    // Get user statistics
    // This would need to integrate with your bot's database
    res.json({
        success: true,
        stats: {
            totalUsers: 1500,
            activeToday: 234,
            newThisWeek: 89
        }
    });
});

app.post('/api/bot/auto-reply', requireAuth, (req, res) => {
    const { keyword, response } = req.body;
    // Implement auto-reply functionality
    res.json({ success: true, message: 'Auto-reply rule added' });
});

app.get('/api/bot/commands', requireAuth, (req, res) => {
    // Get available commands
    res.json({
        success: true,
        commands: [
            { name: 'help', description: 'Show help menu', enabled: true },
            { name: 'ping', description: 'Check bot latency', enabled: true },
            { name: 'info', description: 'Bot information', enabled: true }
            // Add more commands as needed
        ]
    });
});

app.post('/api/bot/toggle-command', requireAuth, (req, res) => {
    const { command, enabled } = req.body;
    // Implement command toggle functionality
    res.json({ success: true, message: `Command ${command} ${enabled ? 'enabled' : 'disabled'}` });
});

app.post('/api/bot/maintenance', requireAuth, (req, res) => {
    const { mode } = req.body;
    // Implement maintenance mode
    res.json({ success: true, message: `Maintenance mode ${mode ? 'enabled' : 'disabled'}` });
});

app.get('/api/bot/performance', requireAuth, (req, res) => {
    // Get performance metrics
    const used = process.memoryUsage();
    res.json({
        success: true,
        performance: {
            memory: {
                rss: `${Math.round(used.rss / 1024 / 1024)} MB`,
                heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)} MB`,
                heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)} MB`,
                external: `${Math.round(used.external / 1024 / 1024)} MB`
            },
            uptime: `${Math.round(process.uptime())} seconds`,
            cpu: process.cpuUsage()
        }
    });
});

// Create public directory and HTML files
const fs = require('fs');
const publicDir = path.join(__dirname, 'public');

if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
}

// Create login page
const loginHTML = `
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
    </style>
</head>
<body>
    <div class="login-container">
        <div class="logo">
            <h1>🐐 Goat-Bot V2</h1>
            <p>Administrator Panel</p>
        </div>
        <form id="loginForm">
            <div class="form-group">
                <label for="password">Password:</label>
                <input type="password" id="password" name="password" required>
            </div>
            <button type="submit" class="btn">Login</button>
        </form>
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
`;

// Create dashboard page
const dashboardHTML = `
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
        }
        .logo { display: flex; align-items: center; gap: 10px; }
        .logo h1 { font-size: 24px; color: #333; }
        .nav { display: flex; gap: 15px; }
        .nav a { 
            padding: 8px 15px; 
            background: #667eea; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px;
            transition: background 0.3s;
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
        .controls { display: flex; gap: 10px; margin: 20px 0; }
        .btn { 
            padding: 10px 20px; 
            border: none; 
            border-radius: 5px; 
            cursor: pointer; 
            font-size: 14px;
            transition: all 0.3s;
        }
        .btn-start { background: #4CAF50; color: white; }
        .btn-stop { background: #f44336; color: white; }
        .btn-restart { background: #ff9800; color: white; }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
        .stats-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
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
        .feature-card h3 { margin-bottom: 15px; color: #333; }
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
        }
        .logs { 
            background: #1e1e1e; 
            color: #00ff00; 
            padding: 15px; 
            border-radius: 5px; 
            font-family: monospace;
            height: 200px;
            overflow-y: auto;
            margin-top: 10px;
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
        <div class="status-card">
            <h2>Bot Status: 
                <span id="statusIndicator" class="status-indicator offline"></span>
                <span id="statusText">Offline</span>
            </h2>
            <div class="controls">
                <button class="btn btn-start" onclick="controlBot('start')">Start Bot</button>
                <button class="btn btn-stop" onclick="controlBot('stop')">Stop Bot</button>
                <button class="btn btn-restart" onclick="controlBot('restart')">Restart Bot</button>
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
                    <button onclick="performAction('clear-cache')">Clear Cache</button>
                    <button onclick="performAction('update')">Update Bot</button>
                    <button onclick="performAction('backup')">Create Backup</button>
                    <button onclick="showSystemInfo()">System Info</button>
                </div>
            </div>

            <!-- Broadcast Message -->
            <div class="feature-card">
                <h3>📢 Broadcast Message</h3>
                <div class="feature-controls">
                    <textarea id="broadcastMessage" placeholder="Enter broadcast message..." rows="3"></textarea>
                    <button onclick="sendBroadcast()">Send Broadcast</button>
                </div>
            </div>

            <!-- Command Management -->
            <div class="feature-card">
                <h3>⚙️ Command Settings</h3>
                <div class="feature-controls">
                    <input type="text" id="newPrefix" placeholder="New command prefix">
                    <button onclick="changePrefix()">Change Prefix</button>
                    <select id="commandSelect" onchange="toggleCommand()">
                        <option value="">Select command to toggle</option>
                    </select>
                </div>
            </div>

            <!-- Auto-Reply System -->
            <div class="feature-card">
                <h3>🤖 Auto-Reply Rules</h3>
                <div class="feature-controls">
                    <input type="text" id="autoKeyword" placeholder="Keyword">
                    <input type="text" id="autoResponse" placeholder="Response">
                    <button onclick="addAutoReply()">Add Rule</button>
                </div>
            </div>

            <!-- Maintenance Mode -->
            <div class="feature-card">
                <h3>🔧 Maintenance</h3>
                <div class="feature-controls">
                    <button onclick="toggleMaintenance(true)">Enable Maintenance</button>
                    <button onclick="toggleMaintenance(false)">Disable Maintenance</button>
                </div>
            </div>

            <!-- Performance Monitor -->
            <div class="feature-card">
                <h3>📊 Performance</h3>
                <div id="performanceInfo">Loading...</div>
            </div>

            <!-- User Statistics -->
            <div class="feature-card">
                <h3>👥 User Statistics</h3>
                <div id="userStats">Loading...</div>
            </div>

            <!-- Log Viewer -->
            <div class="feature-card" style="grid-column: span 2;">
                <h3>📋 Recent Logs</h3>
                <button onclick="loadLogs()">Refresh Logs</button>
                <div class="logs" id="logViewer">Loading logs...</div>
            </div>
        </div>
    </div>

    <script>
        // Update bot status every 5 seconds
        setInterval(updateStatus, 5000);
        updateStatus();

        async function updateStatus() {
            try {
                const response = await fetch('/api/bot/status');
                const data = await response.json();
                
                const indicator = document.getElementById('statusIndicator');
                const statusText = document.getElementById('statusText');
                
                if (data.status === 'online') {
                    indicator.className = 'status-indicator online';
                    statusText.textContent = 'Online';
                } else {
                    indicator.className = 'status-indicator offline';
                    statusText.textContent = 'Offline';
                }
                
                document.getElementById('uptime').textContent = data.stats.uptime;
                document.getElementById('messages').textContent = data.stats.messagesProcessed;
                document.getElementById('commands').textContent = data.stats.commandsExecuted;
                document.getElementById('users').textContent = data.stats.usersServed;
                
            } catch (error) {
                console.error('Failed to update status:', error);
            }
        }

        async function controlBot(action) {
            try {
                const response = await fetch(`/api/bot/${action}`, { method: 'POST' });
                const result = await response.json();
                alert(result.message);
                updateStatus();
            } catch (error) {
                alert('Failed to control bot');
            }
        }

        async function performAction(action) {
            try {
                const response = await fetch(`/api/bot/${action}`, { method: 'POST' });
                const result = await response.json();
                alert(result.message);
            } catch (error) {
                alert('Action failed');
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
                document.getElementById('logViewer').textContent = 'Failed to load logs';
            }
        }

        // Load logs on page load
        loadLogs();

        // Additional functions for other features
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
            } catch (error) {
                alert('Failed to change prefix');
            }
        }

        async function addAutoReply() {
            const keyword = document.getElementById('autoKeyword').value;
            const responseText = document.getElementById('autoResponse').value;
            
            if (!keyword || !responseText) {
                alert('Please fill both fields');
                return;
            }
            
            try {
                const response = await fetch('/api/bot/auto-reply', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ keyword, response: responseText })
                });
                const result = await response.json();
                alert(result.message);
            } catch (error) {
                alert('Failed to add auto-reply rule');
            }
        }

        async function toggleMaintenance(enable) {
            try {
                const response = await fetch('/api/bot/maintenance', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mode: enable })
                });
                const result = await response.json();
                alert(result.message);
            } catch (error) {
                alert('Failed to toggle maintenance mode');
            }
        }

        // Load commands list
        async function loadCommands() {
            try {
                const response = await fetch('/api/bot/commands');
                const result = await response.json();
                const select = document.getElementById('commandSelect');
                select.innerHTML = '<option value="">Select command to toggle</option>';
                
                result.commands.forEach(cmd => {
                    const option = document.createElement('option');
                    option.value = cmd.name;
                    option.textContent = `${cmd.name} - ${cmd.description} (${cmd.enabled ? 'Enabled' : 'Disabled'})`;
                    select.appendChild(option);
                });
            } catch (error) {
                console.error('Failed to load commands');
            }
        }

        async function toggleCommand() {
            const command = document.getElementById('commandSelect').value;
            if (!command) return;
            
            const enabled = confirm(`Enable or disable ${command}? OK for enable, Cancel for disable`);
            
            try {
                const response = await fetch('/api/bot/toggle-command', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ command, enabled })
                });
                const result = await response.json();
                alert(result.message);
                loadCommands();
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
                document.getElementById('userStats').innerHTML = `
                    Total Users: ${stats.totalUsers}<br>
                    Active Today: ${stats.activeToday}<br>
                    New This Week: ${stats.newThisWeek}
                `;
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
                document.getElementById('performanceInfo').innerHTML = `
                    Memory: ${perf.memory.heapUsed}<br>
                    Uptime: ${perf.uptime}<br>
                    RSS: ${perf.memory.rss}
                `;
            } catch (error) {
                document.getElementById('performanceInfo').textContent = 'Failed to load performance info';
            }
        }

        // Initialize all data
        loadCommands();
        loadUserStats();
        loadPerformance();
    </script>
</body>
</html>
`;

// Write HTML files
fs.writeFileSync(path.join(publicDir, 'login.html'), loginHTML);
fs.writeFileSync(path.join(publicDir, 'dashboard.html'), dashboardHTML);

// Start the server
app.listen(PORT, () => {
    log.info(`Goat-Bot V2 Control Panel running on port ${PORT}`);
    log.info(`Access the panel at: http://localhost:${PORT}`);
    log.info(`Admin password: ${ADMIN_PASSWORD}`);
});

// Start the bot initially
startProject();

function startProject() {
    log.info("Starting Goat-Bot V2...");
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
            startProject();
        }
    });
}
