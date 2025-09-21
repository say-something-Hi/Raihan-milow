const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "minimax",
    aliases: ["mm"],
    version: "1.0",
    author: "nexo_here",
    countDown: 10,
    role: 0,
    shortDescription: "Generate AI image using MiniMax",
    longDescription: "Create AI-generated image with high quality using MiniMax endpoint",
    category: "ai-image",
    guide: {
      en: "{pn} <prompt>\nExample: {pn} A futuristic robot walking in the city"
    }
  },

  onStart: async function ({ args, message, event, api }) {
    const prompt = args.join(" ");
    if (!prompt) return message.reply("❌ Please provide a prompt.\nExample: minimax A cat wearing a crown");

    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    const apiUrl = `https://api.oculux.xyz/api/minimax-image?prompt=${encodeURIComponent(prompt)}`;
    const fileName = `${Date.now()}_minimax.jpg`;
    const filePath = path.join(__dirname, "cache", fileName);

    try {
      const response = await axios.get(apiUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(filePath, Buffer.from(response.data, "binary"));

      message.reply({ attachment: fs.createReadStream(filePath) }, () => {
        fs.unlinkSync(filePath);
        api.setMessageReaction("✅", event.messageID, () => {}, true);
      });

    } catch (error) {
      console.error("MiniMax API Error:", error.message);
      message.reply("❌ Failed to generate image using MiniMax.");
      api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
  }
};
