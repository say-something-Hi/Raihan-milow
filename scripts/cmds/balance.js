const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage, registerFont } = require("canvas");
const fetch = require("node-fetch");

// Optional custom font
try {
  registerFont(path.join(__dirname, "fonts", "SegoeUI-Bold.ttf"), { family: "Segoe UI", weight: "bold" });
  registerFont(path.join(__dirname, "fonts", "SegoeUI-Regular.ttf"), { family: "Segoe UI" });
} catch(e){ console.log("Font not found, using default."); }

// -----------------------------
// Helper functions
// -----------------------------
function formatAmount(amount) {
  // Handle invalid or too large numbers
  if (amount === undefined || amount === null || isNaN(amount)) {
    return "0";
  }
  
  amount = Number(amount);
  
  // Handle Infinity and very large numbers
  if (!isFinite(amount) || amount > 1e18) {
    return "∞"; // Infinity symbol
  }
  
  if (amount >= 1e15) return (amount / 1e15).toFixed(1).replace(/\.0$/, "") + "Q";
  if (amount >= 1e12) return (amount / 1e12).toFixed(1).replace(/\.0$/, "") + "T";
  if (amount >= 1e9) return (amount / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
  if (amount >= 1e6) return (amount / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (amount >= 1e3) return (amount / 1e3).toFixed(0) + "K";
  
  return Math.floor(amount).toString();
}

function getTier(balance) {
  // Ensure balance is a valid number
  const validBalance = Number(balance) || 0;
  
  if (!isFinite(validBalance)) return { name: "GOD", color: "#ff0000", glow: "#ff4444" };
  if (validBalance < 1000) return { name: "Bronze", color: "#cd7f32", glow: "#cd7f32" };
  if (validBalance < 5000) return { name: "Silver", color: "#c0c0c0", glow: "#e0e0e0" };
  if (validBalance < 20000) return { name: "Gold", color: "#ffd700", glow: "#ffed4e" };
  if (validBalance < 50000) return { name: "Platinum", color: "#e5e4e2", glow: "#f0f0f0" };
  if (validBalance < 100000) return { name: "Diamond", color: "#0ff", glow: "#7ff" };
  return { name: "Master", color: "#ff00ff", glow: "#ff77ff" };
}

function createRoundedRect(ctx, x, y, width, height, radius) {
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
}

// Fixed avatar loading function using usersData.getAvatarUrl
async function loadUserAvatar(usersData, targetID) {
  try {
    const avatarURL = await usersData.getAvatarUrl(targetID);
    if (!avatarURL) {
      return null;
    }

    const response = await fetch(avatarURL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const buffer = await response.buffer();
    
    // Verify it's a valid image
    if (buffer.length < 100) {
      throw new Error("Image too small, likely invalid");
    }
    
    return buffer;
  } catch (error) {
    return null;
  }
}

// -----------------------------
// Module export
// -----------------------------
module.exports = {
  config: {
    name: "bal",
    aliases: ["balance", "money", "wallet"],
    version: "18.4",
    author: "GoatBot Devs + Raihan",
    countDown: 3,
    role: 0,
    category: "economy",
    description: "Premium balance card with advanced visuals",
    guide: {
      en: "{pn} - show balance (or reply user)\n{pn} t <amount> <user> - transfer balance"
    }
  },

  langs: {
    en: {
      title: "Milows Economy",
      transferSuccess: "✅ Successfully sent $%1 to %2!",
      transferFail: "❌ Failed to transfer. %1",
      insufficientFunds: "❌ You don't have enough balance!"
    }
  },

  onStart: async function({ message, event, args, usersData, getLang, api }) {

    // -----------------------------
    // Balance Transfer
    // -----------------------------
    if (args[0] && ["t","transfer","pay","send"].includes(args[0].toLowerCase())) {
      let amount = parseInt(args[1]);
      if (!amount || amount <= 0 || isNaN(amount)) return message.reply(getLang("transferFail","Invalid amount"));

      let recipientID;
      if (event.type === "message_reply" && event.messageReply) recipientID = event.messageReply.senderID;
      else if (args[2]) { const matches = args[2].match(/\d+/); if (matches) recipientID = matches[0]; }
      if (!recipientID) return message.reply(getLang("transferFail","No user specified"));
      if (event.senderID === recipientID) return message.reply("❌ You cannot send money to yourself!");

      const senderData = await usersData.get(event.senderID);
      // Validate sender balance
      const senderBalance = Number(senderData.money) || 0;
      if (senderBalance < amount) return message.reply(getLang("insufficientFunds"));
      
      const recipientData = await usersData.get(recipientID);

      senderData.money = senderBalance - amount;
      recipientData.money = (Number(recipientData.money) || 0) + amount;

      await usersData.set(event.senderID, senderData);
      await usersData.set(recipientID, recipientData);

      return message.reply(getLang("transferSuccess", formatAmount(amount), recipientData.name || "User"));
    }

    // -----------------------------
    // PREMIUM BALANCE CARD
    // -----------------------------
    let targetID = event.senderID;
    if (event.type === "message_reply" && event.messageReply) targetID = event.messageReply.senderID;

    const userData = await usersData.get(targetID);
    const userName = userData.name || "User";
    
    // Get raw balance for debugging
    const rawBalance = userData.money;
    console.log("Raw balance data:", rawBalance);
    console.log("Balance type:", typeof rawBalance);
    
    // Validate and sanitize balance
    let balance = Number(userData.money) || 0;
    if (isNaN(balance) || !isFinite(balance)) {
      balance = Infinity; // Show Infinity if it's actually Infinity
    }
    
    const formatted = formatAmount(balance);
    const tier = getTier(balance);

    console.log("Processed balance:", balance);
    console.log("Formatted balance:", formatted);
    console.log("Tier:", tier.name);

    // Load avatar with the correct method
    let avatarBuffer = null;
    let avatarImage = null;
    
    try {
      avatarBuffer = await loadUserAvatar(usersData, targetID);
      if (avatarBuffer) {
        avatarImage = await loadImage(avatarBuffer);
      }
    } catch (error) {
      // Silent fail - use placeholder
    }

    // Larger canvas for premium look
    const width = 900, height = 450;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // 🎨 ULTRA PREMIUM BACKGROUND
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, "#0a0a1f");
    bgGradient.addColorStop(0.3, "#151528");
    bgGradient.addColorStop(0.7, "#1a1a2e");
    bgGradient.addColorStop(1, "#0f0f23");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // ✨ ANIMATED PARTICLE EFFECT (Static representation)
    ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 2;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // 🏰 MAIN CARD CONTAINER with rounded corners
    const card = {
      x: 40,
      y: 30,
      width: width - 80,
      height: height - 60
    };

    // Card background with gradient and border
    ctx.save();
    createRoundedRect(ctx, card.x, card.y, card.width, card.height, 25);
    ctx.clip();
    
    const cardGradient = ctx.createLinearGradient(card.x, card.y, card.x, card.y + card.height);
    cardGradient.addColorStop(0, "rgba(255, 255, 255, 0.08)");
    cardGradient.addColorStop(1, "rgba(255, 255, 255, 0.03)");
    ctx.fillStyle = cardGradient;
    ctx.fillRect(card.x, card.y, card.width, card.height);
    
    // Card border glow
    ctx.strokeStyle = tier.color + "80";
    ctx.lineWidth = 3;
    ctx.shadowColor = tier.glow;
    ctx.shadowBlur = 25;
    createRoundedRect(ctx, card.x, card.y, card.width, card.height, 25);
    ctx.stroke();
    ctx.restore();

    // HEADER SECTION
    const header = {
      x: card.x + 40,
      y: card.y + 30,
      width: card.width - 80,
      height: 60
    };

    // Platform title
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 28px 'Segoe UI'";
    ctx.shadowColor = "rgba(255, 255, 255, 0.5)";
    ctx.shadowBlur = 10;
    ctx.fillText("💎 MILOWS ECONOMY", header.x, header.y + 25);
    ctx.shadowBlur = 0;

    // MAIN CONTENT AREA
    const content = {
      x: card.x + 40,
      y: card.y + 100,
      width: card.width - 80,
      height: card.height - 140
    };

    // LEFT SECTION - User Info (55%)
    const leftSection = {
      x: content.x,
      y: content.y,
      width: content.width * 0.55,
      height: content.height
    };

    // RIGHT SECTION - Visuals (45%)
    const rightSection = {
      x: content.x + content.width * 0.55 + 20,
      y: content.y,
      width: content.width * 0.45 - 20,
      height: content.height
    };

    // LEFT SECTION CONTENT
    // Balance Amount - MAIN FOCUS
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px 'Segoe UI'";
    ctx.fillText("CURRENT BALANCE", leftSection.x, leftSection.y + 25);

    // Special styling for Infinity
    if (formatted === "∞") {
      ctx.font = "bold 72px 'Segoe UI'";
      ctx.fillStyle = "#ff0000";
      ctx.shadowColor = "#ff0000";
      ctx.shadowBlur = 30;
      ctx.fillText(`$${formatted}`, leftSection.x, leftSection.y + 85);
    } else {
      ctx.font = "bold 62px 'Segoe UI'";
      ctx.fillStyle = "#39ff14";
      ctx.shadowColor = "#39ff14";
      ctx.shadowBlur = 20;
      ctx.fillText(`$${formatted}`, leftSection.x, leftSection.y + 85);
    }
    ctx.shadowBlur = 0;

    // User Info Box
    const userBox = {
      x: leftSection.x,
      y: leftSection.y + 120,
      width: leftSection.width,
      height: 120
    };

    // User box background
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    createRoundedRect(ctx, userBox.x, userBox.y, userBox.width, userBox.height, 15);
    ctx.fill();

    // User details
    const userDetails = {
      x: userBox.x + 20,
      y: userBox.y + 25
    };

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px 'Segoe UI'";
    ctx.fillText("👤 " + userName, userDetails.x, userDetails.y);

    ctx.font = "18px 'Segoe UI'";
    ctx.fillStyle = "#888888";
    ctx.fillText(`🆔 ${targetID}`, userDetails.x, userDetails.y + 35);

    // Tier display with badge
    const tierBadge = {
      x: userDetails.x,
      y: userDetails.y + 65,
      width: 150,
      height: 32
    };

    // Tier badge background
    ctx.fillStyle = tier.color + "30";
    createRoundedRect(ctx, tierBadge.x, tierBadge.y, tierBadge.width, tierBadge.height, 8);
    ctx.fill();

    // Tier text
    ctx.font = "bold 16px 'Segoe UI'";
    ctx.fillStyle = tier.color;
    ctx.fillText(`🏆 ${tier.name} TIER`, tierBadge.x + 10, tierBadge.y + 21);

    // RIGHT SECTION CONTENT
    // Avatar Container
    const avatarContainer = {
      x: rightSection.x,
      y: rightSection.y,
      width: 140,
      height: 140
    };

    // Avatar background circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarContainer.x + 70, avatarContainer.y + 70, 65, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctx.fill();
    
    // Avatar border
    ctx.strokeStyle = tier.color;
    ctx.lineWidth = 4;
    ctx.shadowColor = tier.glow;
    ctx.shadowBlur = 15;
    ctx.stroke();
    ctx.restore();

    // Avatar image with better error handling
    if (avatarImage) {
      try {
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarContainer.x + 70, avatarContainer.y + 70, 60, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avatarImage, avatarContainer.x + 10, avatarContainer.y + 10, 120, 120);
        ctx.restore();
      } catch (avatarError) {
        // Draw placeholder if avatar fails
        ctx.fillStyle = tier.color + "40";
        ctx.beginPath();
        ctx.arc(avatarContainer.x + 70, avatarContainer.y + 70, 60, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px 'Segoe UI'";
        ctx.textAlign = "center";
        ctx.fillText("AVATAR", avatarContainer.x + 70, avatarContainer.y + 70);
        ctx.textAlign = "left";
      }
    } else {
      // Draw placeholder when no avatar
      ctx.fillStyle = tier.color + "40";
      ctx.beginPath();
      ctx.arc(avatarContainer.x + 70, avatarContainer.y + 70, 60, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 14px 'Segoe UI'";
      ctx.textAlign = "center";
      ctx.fillText("NO AVATAR", avatarContainer.x + 70, avatarContainer.y + 70);
      ctx.textAlign = "left";
    }

    // Stats Section
    const stats = {
      x: rightSection.x,
      y: rightSection.y + 160,
      width: rightSection.width,
      height: 80
    };

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px 'Segoe UI'";
    ctx.fillText("📊 ACCOUNT STATS", stats.x, stats.y);

    // Stats boxes - ensure valid numbers
    const dailyGrowth = isFinite(balance) ? Math.floor(balance * 0.05) || 0 : Infinity;
    const weeklyGrowth = isFinite(balance) ? Math.floor(balance * 0.15) || 0 : Infinity;

    ctx.font = "14px 'Segoe UI'";
    ctx.fillStyle = "#39ff14";
    ctx.fillText(`↑ $${formatAmount(dailyGrowth)}/day`, stats.x, stats.y + 25);
    ctx.fillText(`↑ $${formatAmount(weeklyGrowth)}/week`, stats.x, stats.y + 45);

    // FOOTER
    const footer = {
      x: card.x + 40,
      y: card.y + card.height - 30
    };

    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "12px 'Segoe UI'";
    ctx.fillText("💳 Banking System • Secured & Encrypted", footer.x, footer.y);

    // 🎯 FINAL RENDER
    const filePath = path.join(__dirname, `bal_${targetID}.png`);
    
    try {
      const buffer = canvas.toBuffer("image/png", { 
        compressionLevel: 0,
        filters: canvas.PNG_FILTER_NONE
      });
      
      fs.writeFileSync(filePath, buffer);
      
      await message.reply({ 
        body: `👤 User: ${userName}\n💰 Balance: $${formatted}\n🏆 Tier: ${tier.name}`,
        attachment: fs.createReadStream(filePath) 
      });
      
      // Cleanup
      setTimeout(() => {
        try { fs.unlinkSync(filePath); } catch(e) {}
      }, 5000);
      
    } catch (finalError) {
      await message.reply("❌ Error generating balance card. Please try again.");
    }
  }
};
