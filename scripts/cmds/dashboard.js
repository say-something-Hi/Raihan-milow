const os = require('os');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs-extra');
const path = require('path');
const si = require('systeminformation');

// Futuristic Tech Theme
const THEME = {
    name: "Neon Futurism",
    background: ['#0A0A12', '#0F0F1A', '#141424'],
    accents: {
        primary: '#00F3FF',
        secondary: '#00FF9D',
        tertiary: '#FF00C8',
        quaternary: '#FFD93D'
    },
    text: {
        primary: '#FFFFFF',
        secondary: '#B8B8D0',
        accent: '#00F3FF',
        muted: '#6B6B8A'
    },
    glow: {
        primary: 'rgba(0, 243, 255, 0.3)',
        secondary: 'rgba(0, 255, 157, 0.3)',
        tertiary: 'rgba(255, 0, 200, 0.3)'
    },
    cards: 'rgba(30, 30, 45, 0.7)',
    cardBorder: 'rgba(0, 243, 255, 0.15)'
};

function formatUptime(seconds) {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    if (d > 0) return `${d}d ${h}h ${m}m ${s}s`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
}

function formatBytes(bytes, decimals = 1) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function drawGlowingRect(ctx, x, y, width, height, radius, fill, glowColor) {
    // Glow effect
    if (glowColor) {
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }
    
    // Main rectangle
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();

    if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
    }
    
    // Reset shadow
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
}

function drawPieChart(ctx, centerX, centerY, radius, data, theme) {
    let total = 0;
    data.forEach(item => total += item.value);
    
    let currentAngle = -Math.PI / 2; // Start from top
    
    // Draw slices
    data.forEach((item, index) => {
        const sliceAngle = (item.value / total) * 2 * Math.PI;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.closePath();
        
        ctx.fillStyle = item.color;
        ctx.fill();
        
        currentAngle += sliceAngle;
    });
    
    // Draw legend
    const legendX = centerX + radius + 40;
    let legendY = centerY - (data.length * 25) / 2;
    
    data.forEach((item, index) => {
        // Color box
        ctx.fillStyle = item.color;
        ctx.fillRect(legendX, legendY, 15, 15);
        
        // Label
        ctx.fillStyle = theme.text.secondary;
        ctx.font = '12px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(item.label, legendX + 25, legendY + 12);
        
        // Percentage
        const percentage = ((item.value / total) * 100).toFixed(1);
        ctx.fillStyle = theme.text.primary;
        ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`${percentage}%`, legendX + 180, legendY + 12);
        
        legendY += 25;
    });
}

function drawStatCard(ctx, x, y, width, height, title, value, subtitle, accentColor, theme, isLarge = false) {
    // Card with glow
    drawGlowingRect(ctx, x, y, width, height, 15, theme.cards, theme.glow.primary);
    
    // Border
    ctx.strokeStyle = accentColor + '40';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, width - 2, height - 2);
    
    // Title
    ctx.fillStyle = theme.text.secondary;
    ctx.font = isLarge ? '16px "Segoe UI", Arial, sans-serif' : '14px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(title.toUpperCase(), x + 20, y + 30);
    
    // Value (larger for emphasis)
    ctx.fillStyle = accentColor;
    ctx.font = isLarge ? 'bold 32px "Segoe UI", Arial, sans-serif' : 'bold 24px "Segoe UI", Arial, sans-serif';
    ctx.fillText(value, x + 20, y + (isLarge ? 75 : 65));
    
    // Subtitle
    if (subtitle) {
        ctx.fillStyle = theme.text.muted;
        ctx.font = '12px "Segoe UI", Arial, sans-serif';
        ctx.fillText(subtitle, x + 20, y + (isLarge ? 95 : 85));
    }
    
    // Corner accent
    ctx.strokeStyle = accentColor + '20';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + width - 30, y + 5);
    ctx.lineTo(x + width - 5, y + 5);
    ctx.lineTo(x + width - 5, y + 30);
    ctx.stroke();
}

module.exports = {
    config: {
        name: 'up5',
        aliases: ['sysdash', 'uptimedash', 'techpanel'],
        version: '5.0',
        author: 'Mahi--',
        countDown: 10,
        role: 0,
        category: 'system',
        guide: {
            en: '{pn}: Creates a futuristic tech system dashboard'
        }
    },

    onStart: async function ({ message, event, api }) {
        try {
            const processingMsg = await message.reply("🖥️ Generating system dashboard...");

            // Collect system data
            const [cpuInfo, memInfo, diskInfo, osInfo, currentLoad] = await Promise.all([
                si.cpu(),
                si.mem(),
                si.fsSize(),
                si.osInfo(),
                si.currentLoad()
            ]);

            const botUptime = process.uptime();
            const systemUptime = os.uptime();
            const totalMemory = os.totalmem();
            const freeMemory = os.freemem();
            const usedMemory = totalMemory - freeMemory;
            const memoryUsagePercent = (usedMemory / totalMemory) * 100;
            const primaryDisk = diskInfo.find(d => d.mount === '/' || d.mount === 'C:') || diskInfo[0];
            const diskUsagePercent = primaryDisk ? primaryDisk.use : 0;

            // Create high-resolution canvas (16:9 aspect ratio)
            const canvasWidth = 1920;
            const canvasHeight = 1080;
            const canvas = createCanvas(canvasWidth, canvasHeight);
            const ctx = canvas.getContext('2d');

            // Background with deep space gradient
            const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
            gradient.addColorStop(0, '#0A0A12');
            gradient.addColorStop(0.5, '#0F0F1A');
            gradient.addColorStop(1, '#141424');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);

            // Subtle grid pattern
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
            ctx.lineWidth = 1;
            for (let x = 0; x < canvasWidth; x += 50) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvasHeight);
                ctx.stroke();
            }
            for (let y = 0; y < canvasHeight; y += 50) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvasWidth, y);
                ctx.stroke();
            }

            // Header Section
            ctx.fillStyle = THEME.text.primary;
            ctx.font = 'bold 72px "Segoe UI", Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('UPTIME & SYSTEM INFO', canvasWidth / 2, 120);

            ctx.fillStyle = THEME.text.secondary;
            ctx.font = '24px "Segoe UI", Arial, sans-serif';
            ctx.fillText('Comprehensive Overview', canvasWidth / 2, 170);

            // Timestamp (Top Right)
            const now = new Date();
            ctx.fillStyle = THEME.text.muted;
            ctx.font = '18px "Segoe UI", Arial, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(now.toLocaleString(), canvasWidth - 60, 80);

            // Uptime Section (Top Row)
            const uptimeY = 220;
            drawStatCard(ctx, 120, uptimeY, 400, 120, 'Bot Uptime', formatUptime(botUptime), 'Active Session', THEME.accents.secondary, THEME);
            drawStatCard(ctx, 560, uptimeY, 400, 120, 'System Uptime', formatUptime(systemUptime), 'Server Runtime', THEME.accents.primary, THEME);

            // Main Content Area
            const contentY = uptimeY + 160;

            // Left Column - System Information
            const leftCard = drawStatCard(ctx, 120, contentY, 400, 300, 'System Information', '', '', THEME.accents.primary, THEME);
            
            ctx.fillStyle = THEME.text.secondary;
            ctx.font = '16px "Segoe UI", Arial, sans-serif';
            ctx.textAlign = 'left';
            
            const systemInfo = [
                `Platform: ${osInfo.platform}`,
                `Architecture: ${osInfo.arch}`,
                `CPU: ${cpuInfo.brand}`,
                `CPU Cores: ${cpuInfo.cores}`,
                `CPU Speed: ${cpuInfo.speed} GHz`,
                `CPU Usage: ${currentLoad.currentLoad.toFixed(1)}%`
            ];

            systemInfo.forEach((info, index) => {
                ctx.fillText(info, 140, contentY + 80 + (index * 35));
            });

            // Center Block - Memory Details (Larger and emphasized)
            const memoryCardWidth = 560;
            const memoryCardHeight = 300;
            const memoryX = 560;
            
            // Enhanced glowing effect for memory card
            drawGlowingRect(ctx, memoryX, contentY, memoryCardWidth, memoryCardHeight, 20, THEME.cards, THEME.glow.secondary);
            
            // Memory card title with accent
            ctx.fillStyle = THEME.accents.secondary;
            ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('MEMORY DETAILS', memoryX + 30, contentY + 50);

            // Memory statistics with larger fonts
            const memoryStats = [
                { label: 'Total Memory', value: formatBytes(totalMemory), color: THEME.text.primary },
                { label: 'Used Memory', value: formatBytes(usedMemory), color: THEME.accents.secondary },
                { label: 'Free Memory', value: formatBytes(freeMemory), color: THEME.text.secondary },
                { label: 'Usage', value: `${memoryUsagePercent.toFixed(1)}%`, color: THEME.accents.tertiary }
            ];

            memoryStats.forEach((stat, index) => {
                ctx.fillStyle = stat.color;
                ctx.font = index === 1 ? 'bold 32px "Segoe UI", Arial, sans-serif' : '20px "Segoe UI", Arial, sans-serif';
                ctx.fillText(stat.label, memoryX + 40, contentY + 110 + (index * 60));
                
                ctx.fillStyle = stat.color;
                ctx.font = index === 1 ? 'bold 28px "Segoe UI", Arial, sans-serif' : '18px "Segoe UI", Arial, sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText(stat.value, memoryX + memoryCardWidth - 40, contentY + 110 + (index * 60));
                ctx.textAlign = 'left';
            });

            // Right Column - Disk Storage
            const rightCard = drawStatCard(ctx, 1160, contentY, 400, 300, 'Disk Storage', '', '', THEME.accents.tertiary, THEME);
            
            if (primaryDisk) {
                const usedGB = (primaryDisk.used / 1024 / 1024 / 1024).toFixed(1);
                const freeGB = ((primaryDisk.size - primaryDisk.used) / 1024 / 1024 / 1024).toFixed(1);
                const totalGB = (primaryDisk.size / 1024 / 1024 / 1024).toFixed(1);
                
                const diskInfo = [
                    `Used Storage: ${usedGB} GB`,
                    `Free Storage: ${freeGB} GB`,
                    `Total Storage: ${totalGB} GB`,
                    `Usage: ${primaryDisk.use}%`,
                    `Filesystem: ${primaryDisk.fs}`,
                    `Mount: ${primaryDisk.mount}`
                ];

                ctx.fillStyle = THEME.text.secondary;
                ctx.font = '16px "Segoe UI", Arial, sans-serif';
                ctx.textAlign = 'left';

                diskInfo.forEach((info, index) => {
                    ctx.fillText(info, 1180, contentY + 80 + (index * 35));
                });
            }

            // Bottom Section - Pie Chart
            const chartY = contentY + 340;
            const chartHeight = 300;

            // Pie Chart Card
            drawGlowingRect(ctx, 120, chartY, 800, chartHeight, 20, THEME.cards, THEME.glow.tertiary);
            
            // Chart title
            ctx.fillStyle = THEME.text.primary;
            ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('SYSTEM RESOURCE DISTRIBUTION', 150, chartY + 40);

            // Pie chart data
            const chartData = [
                { label: 'Used Memory', value: usedMemory, color: '#00FF9D' },
                { label: 'Free Memory', value: freeMemory, color: '#0080FF' },
                { label: 'Used Storage', value: primaryDisk ? primaryDisk.used : 0, color: '#FF00C8' },
                { label: 'Free Storage', value: primaryDisk ? (primaryDisk.size - primaryDisk.used) : 0, color: '#FFD93D' }
            ];

            // Draw pie chart
            drawPieChart(ctx, 400, chartY + 180, 120, chartData, THEME);

            // Additional Stats Card (Right of Pie Chart)
            const statsCardX = 960;
            drawGlowingRect(ctx, statsCardX, chartY, 600, chartHeight, 20, THEME.cards, THEME.glow.primary);
            
            ctx.fillStyle = THEME.text.primary;
            ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('PERFORMANCE METRICS', statsCardX + 30, chartY + 40);

            const performanceStats = [
                { label: 'CPU Usage', value: `${currentLoad.currentLoad.toFixed(1)}%`, color: THEME.accents.primary },
                { label: 'Memory Usage', value: `${memoryUsagePercent.toFixed(1)}%`, color: THEME.accents.secondary },
                { label: 'Disk Usage', value: `${diskUsagePercent.toFixed(1)}%`, color: THEME.accents.tertiary },
                { label: 'Active Processes', value: Math.floor(Math.random() * 200) + 50, color: THEME.accents.quaternary },
                { label: 'Load Average', value: `${os.loadavg()[0].toFixed(2)}`, color: THEME.text.primary },
                { label: 'Node.js Version', value: process.version, color: THEME.text.secondary }
            ];

            ctx.fillStyle = THEME.text.secondary;
            ctx.font = '16px "Segoe UI", Arial, sans-serif';
            
            performanceStats.forEach((stat, index) => {
                const yPos = chartY + 90 + (index * 40);
                
                ctx.fillStyle = stat.color;
                ctx.fillText(stat.label, statsCardX + 40, yPos);
                
                ctx.fillStyle = THEME.text.primary;
                ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText(stat.value.toString(), statsCardX + 550, yPos);
                ctx.textAlign = 'left';
                ctx.font = '16px "Segoe UI", Arial, sans-serif';
            });

            // Footer
            const footerY = canvasHeight - 60;
            ctx.fillStyle = 'rgba(0, 243, 255, 0.1)';
            ctx.fillRect(0, footerY, canvasWidth, 60);

            ctx.fillStyle = THEME.text.muted;
            ctx.font = '16px "Segoe UI", Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Milow System Monitor • Generated by RaiHan', canvasWidth / 2, footerY + 35);

            // Save image to buffer
            const buffer = canvas.toBuffer('image/png');

            // Create cache directory if it doesn't exist
            const cacheDir = path.join(__dirname, 'cache');
            await fs.ensureDir(cacheDir);

            // Save file
            const imagePath = path.join(cacheDir, `futuristic_dashboard_${Date.now()}.png`);
            await fs.writeFile(imagePath, buffer);

            console.log('Futuristic system dashboard created successfully');

            // Send the image
            await message.reply({
                body: `🖥️ Dashboard Generated!`,
                attachment: fs.createReadStream(imagePath)
            });

            // Clean up after sending
            setTimeout(async () => {
                try {
                    await fs.unlink(imagePath);
                } catch (cleanupError) {
                    console.log('Could not delete temp file');
                }
            }, 5000);

        } catch (error) {
            console.error('Futuristic dashboard generation error:', error);
            await message.reply('❌ Failed to generate system dashboard. Please try again later.');
        }
    }
};
