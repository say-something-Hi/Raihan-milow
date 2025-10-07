const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// --- Main Command Module ---
module.exports = {
  config: {
    name: "top",
    aliases: ["richlist", "leaderboard"],
    version: "6.0 (Elegant & Simple)",
    author: "Gemini (Reliable Version)",
    shortDescription: "🏆 An elegant, reliable leaderboard.",
    longDescription: "A beautiful and highly reliable leaderboard with a premium card design. Fully self-contained and error-resistant.",
    category: "Economy",
    guide: {
      en: "{p}top [number]"
    }
  },

  onStart: async function ({ api, event, usersData, args }) {
    try {
      const allUsers = await usersData.getAll();
      const topCount = args[0] ? Math.min(parseInt(args[0]), 15) : 10;
      
      const topUsers = allUsers
        .filter(user => user.money !== undefined && user.userID)
        .sort((a, b) => b.money - a.money)
        .slice(0, topCount);

      if (topUsers.length === 0) {
        return api.sendMessage("❌ No users with money data found!", event.threadID);
      }
      
      const loadingMessage = await api.sendMessage("✅ Crafting an elegant new leaderboard...", event.threadID);

      const canvasWidth = 900;
      const cardHeight = 120;
      const canvasHeight = 180 + (topUsers.length * (cardHeight + 15)); // 15 is spacing
      const canvas = createCanvas(canvasWidth, canvasHeight);
      const ctx = canvas.getContext('2d');
      
      // Create a reusable placeholder avatar
      const placeholderAvatar = createPlaceholderAvatar();

      // Draw background
      drawDynamicBackground(ctx, canvasWidth, canvasHeight);

      // Draw Title
      ctx.font = 'bold 50px Impact, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 10;
      ctx.fillText("SERVER LEADERBOARD", canvasWidth / 2, 80);
      ctx.shadowColor = 'transparent';

      // Single loop for all users - much more reliable
      for (let i = 0; i < topUsers.length; i++) {
        const user = topUsers[i];
        const y = 140 + (i * (cardHeight + 15));
        const rankColor = getRankColor(i);

        // Draw the user card background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.roundRect(40, y, canvasWidth - 80, cardHeight, 20);
        ctx.fill();

        // Draw Rank Circle
        ctx.beginPath();
        ctx.arc(115, y + cardHeight / 2, 30, 0, Math.PI * 2);
        ctx.fillStyle = rankColor.circle;
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 30px Impact, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(i + 1, 115, y + cardHeight / 2 + 12);

        // Fetch and draw avatar
        let avatar;
        try {
            const avatarUrl = `https://graph.facebook.com/${user.userID}/picture?width=100&height=100&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
            const response = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
            avatar = await loadImage(response.data);
        } catch (error) {
            avatar = placeholderAvatar;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(230, y + cardHeight / 2, 45, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avatar, 185, y + cardHeight / 2 - 45, 90, 90);
        ctx.restore();
        
        // Add glowing border for top 3
        if (i < 3) {
            ctx.beginPath();
            ctx.arc(230, y + cardHeight / 2, 45, 0, Math.PI * 2);
            ctx.strokeStyle = rankColor.glow;
            ctx.lineWidth = 4;
            ctx.stroke();
        }

        // Draw Name
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 30px Verdana, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(truncateText(user.name || "Unknown User", 20), 300, y + 55);
        
        // Draw Money
        ctx.fillStyle = '#55E6C1'; // A nice green
        ctx.font = '24px Verdana, sans-serif';
        ctx.fillText(`$${formatMoney(user.money || 0)}`, 300, y + 85);
      }

      // --- Finalize and Send ---
      const cacheDir = path.join(__dirname, 'cache');
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
      const imagePath = path.join(cacheDir, `elegant_top_${Date.now()}.png`);
      
      fs.writeFileSync(imagePath, canvas.toBuffer('image/png'));

      api.sendMessage({ attachment: fs.createReadStream(imagePath) }, event.threadID, (err) => {
        if (err) console.error(err);
        fs.unlinkSync(imagePath);
        api.unsendMessage(loadingMessage.messageID);
      });

    } catch (error) {
      console.error("❌ Elegant Top Command Error:", error);
      api.sendMessage("⚠️ Failed to design the leaderboard. Please try again.", event.threadID);
    }
  }
};

// --- All Helper Functions (Reliable & Self-Contained) ---

function drawDynamicBackground(ctx, width, height) {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#232526');
    gradient.addColorStop(1, '#414345');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
}

function createPlaceholderAvatar() {
    const size = 100;
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#4a4a4a';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#cccccc';
    const headRadius = size * 0.2;
    ctx.beginPath();
    ctx.arc(size / 2, headRadius + size * 0.15, headRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(size / 2, size * 0.6 + size * 0.5, size * 0.6, Math.PI, Math.PI * 2);
    ctx.fill();
    return canvas;
}

function getRankColor(rank) {
    const colors = [
        { circle: '#D4AF37', glow: '#FFD700' }, // Gold
        { circle: '#A8A9AD', glow: '#C0C0C0' }, // Silver
        { circle: '#B08D57', glow: '#CD7F32' }, // Bronze
    ];
    return colors[rank] || { circle: '#36454F', glow: 'transparent' }; // Charcoal for others
}

function formatMoney(amount) {
    if (amount >= 1e15) return `${(amount / 1e15).toFixed(2)}QT`;
    if (amount >= 1e12) return `${(amount / 1e12).toFixed(2)}T`;
    if (amount >= 1e9) return `${(amount / 1e9).toFixed(2)}B`;
    if (amount >= 1e6) return `${(amount / 1e6).toFixed(2)}M`;
    if (amount >= 1e3) return `${(amount / 1e3).toFixed(2)}K`;
    return amount.toLocaleString();
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}
