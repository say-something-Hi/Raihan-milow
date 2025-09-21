const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "recraft",
    aliases: [],
    version: "1.0",
    author: "nexo_here",
    countDown: 10,
    role: 0,
    shortDescription: "Generate image using Recraft",
    longDescription: "Create AI-generated art using the Recraft engine.",
    category: "ai-image",
    guide: {
      en: "{pn} <prompt>\nExample: {pn} A boy in futuristic armor"
    }
  },

  onStart: async function ({ args, message, event, api }) {
    const prompt = args.join(" ");
    if (!prompt) return message.reply("❌ Please provide a prompt.\nExample: recraft A boy wearing futuristic armor");

    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    const apiUrl = `https://api.oculux.xyz/api/recraftv3?prompt=${encodeURIComponent(prompt)}`;
    const fileName = `${Date.now()}_recraft.jpg`;
    const filePath = path.join(__dirname, "cache", fileName);

    try {
      const response = await axios.get(apiUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(filePath, Buffer.from(response.data, "binary"));

      message.reply({ attachment: fs.createReadStream(filePath) }, () => {
        fs.unlinkSync(filePath);
        api.setMessageReaction("✅", event.messageID, () => {}, true);
      });

    } catch (error) {
      console.error("Recraft API Error:", error.message);
      message.reply("❌ Failed to generate image using Recraft.");
      api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
  }
};
