const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "ultragen",
    aliases: [],
    version: "1.0",
    author: "nexo_here",
    countDown: 10,
    role: 0,
    shortDescription: "Generate ultra-quality image",
    longDescription: "Generate a single high-quality AI-generated image using ultra settings",
    category: "ai-image",
    guide: {
      en: "{pn} <prompt>\nExample: {pn} A boy in futuristic armor"
    }
  },

  onStart: async function ({ args, message, event, api }) {
    const prompt = args.join(" ");
    if (!prompt) return message.reply("❌ Please provide a prompt.\nExample: ultragen A boy in futuristic armor");

    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    const url = `https://api.oculux.xyz/api/imagen4-ultra?prompt=${encodeURIComponent(prompt)}`;
    const fileName = `${Date.now()}_ultragen.jpg`;
    const filePath = path.join(__dirname, "cache", fileName);

    try {
      const res = await axios.get(url, { responseType: "arraybuffer" });
      fs.writeFileSync(filePath, Buffer.from(res.data, "binary"));

      message.reply({ attachment: fs.createReadStream(filePath) }, () => {
        fs.unlinkSync(filePath);
        api.setMessageReaction("✅", event.messageID, () => {}, true);
      });

    } catch (err) {
      console.error("Ultragen Error:", err.message);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      message.reply("❌ Failed to generate ultra-quality image.");
    }
  }
};
