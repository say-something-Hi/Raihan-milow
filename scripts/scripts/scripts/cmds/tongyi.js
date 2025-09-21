const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "tongyi",
    aliases: [],
    version: "1.0",
    author: "nexo_here",
    countDown: 10,
    role: 0,
    shortDescription: "Generate image using Tongyi API",
    longDescription: "Create AI-generated image from text prompt using Tongyi model.",
    category: "ai-image",
    guide: {
      en: "{pn} <prompt>\nExample: {pn} A boy playing in the park"
    }
  },

  onStart: async function ({ args, message, event, api }) {
    const prompt = args.join(" ");
    if (!prompt)
      return message.reply(
        "❌ Please provide a prompt.\nExample: imagine A boy playing in the park"
      );

    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    const apiUrl = `https://api.oculux.xyz/api/tongyi?prompt=${encodeURIComponent(prompt)}`;
    const fileName = `${Date.now()}_imagine.jpg`;
    const filePath = path.join(__dirname, "cache", fileName);

    try {
      const response = await axios.get(apiUrl, { responseType: "arraybuffer" });

      fs.writeFileSync(filePath, Buffer.from(response.data, "binary"));

      message.reply({ attachment: fs.createReadStream(filePath) }, () => {
        fs.unlinkSync(filePath);
        api.setMessageReaction("✅", event.messageID, () => {}, true);
      });
    } catch (error) {
      console.error("Imagine API Error:", error.message);
      message.reply("❌ Failed to generate image using Tongyi API.");
      api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
  }
};
