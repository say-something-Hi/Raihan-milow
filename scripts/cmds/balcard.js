const { createCanvas } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "balanceCard",
    aliases: ["balcard"],
    version: "1.0",
    author: "Raihan",
    shortDescription: "💰 your Canvas Balance Card",
    longDescription: "Generates a premium balance card using Canvas (no external links), ready to send in GoatBot.",
    category: "Utility"
  },

  onStart: async function({ api, event, args, usersData }) {
    const { senderID, threadID } = event;

    try {
      const user = await usersData.get(senderID);
      if (!user || typeof user.money !== "number")
        return api.sendMessage("🔒 User data not found or invalid.", threadID);

      const userName = user.name || "User";
      const balance = args[0] || this.formatMoney(user.money);
      const userID = senderID;

      const imagePath = await this.generateBalanceCard(userName, userID, balance);

      await api.sendMessage({ attachment: fs.createReadStream(imagePath) }, threadID);
      await fs.remove(imagePath);

    } catch (err) {
      console.error("Balance Card Error:", err);
      api.sendMessage("❌ Failed to generate balance card.", threadID);
    }
  },

  generateBalanceCard: async function(userName, userID, balance) {
    const width = 500;
    const height = 500;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#A67C52");
    gradient.addColorStop(1, "#C19A6B");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Gold border
    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 6;
    ctx.strokeRect(5, 5, width - 10, height - 10);

    // Header
    ctx.fillStyle = "#FFD700"; // Gold
    ctx.font = "bold 32px Sans";
    ctx.textAlign = "center";
    ctx.fillText("💳 Premium Balance 💳", width / 2, 80);

    // User name
    ctx.font = "bold 26px Sans";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(`👤 ${userName}`, width / 2, 180);

    // User ID
    ctx.font = "16px Sans";
    ctx.fillStyle = "#f5deb3"; // soft wheat color
    ctx.fillText(`ID ${userID}`, width / 2, 210);

    // Balance
    ctx.font = "bold 50px Sans";
    ctx.fillStyle = "#2ecc71"; // green
    ctx.fillText(`💰 ${balance}`, width / 2, 300);

    // Shadow effect for balance
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 6;
    ctx.fillText(`💰 ${balance}`, width / 2, 300);
    ctx.shadowBlur = 0;

    // Save PNG
    const filePath = path.join(__dirname, `balance_card_${Date.now()}.png`);
    const buffer = canvas.toBuffer("image/png");
    await fs.writeFile(filePath, buffer);
    return filePath;
  },

  formatMoney: function(amount) {
    const units = ["", "K", "M", "B"];
    let index = 0;
    let num = Number(amount);

    while (num >= 1000 && index < units.length - 1) {
      num /= 1000;
      index++;
    }

    return num.toFixed(num % 1 ? 2 : 0) + units[index];
  }
};
