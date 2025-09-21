const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "luminarium",
    aliases: ["lm"],
    version: "1.0",
    author: "nexo_here",
    countDown: 10,
    role: 0,
    shortDescription: "Generate image with Luminarium AI",
    longDescription: "Create AI-generated image using Luminarium model",
    category: "ai-image",
    guide: {
      en: "{pn} <prompt>\nExample: {pn} A boy sitting under a neon tree"
    }
  },

  onStart: async function ({ args, message, event, api }) {
    const prompt = args.join(" ");
    if (!prompt) return message.reply("❌ Please provide a prompt.\nExample: luminarium A boy in forest");

    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    const apiUrl = `https://api.oculux.xyz/api/luminarium?prompt=${encodeURIComponent(prompt)}`;
    const fileName = `${Date.now()}_luminarium.jpg`;
    const filePath = path.join(__dirname, "cache", fileName);

    try {
      const response = await axios.get(apiUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(filePath, Buffer.from(response.data, "binary"));

      message.reply({ attachment: fs.createReadStream(filePath) }, () => {
        fs.unlinkSync(filePath);
        api.setMessageReaction("✅", event.messageID, () => {}, true);
      });

    } catch (error) {
      console.error("Luminarium API Error:", error.message);
      message.reply("❌ Failed to generate image with Luminarium.");
      api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
  }
};
