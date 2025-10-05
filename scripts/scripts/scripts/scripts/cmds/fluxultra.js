const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "fluxultra",
    aliases: ["fluxu"],
    version: "1.0",
    author: "nexo_here",
    countDown: 10,
    role: 0,
    shortDescription: "Generate high quality AI image",
    longDescription: "Generate ultra-detailed AI image using Flux Pro Ultra model",
    category: "ai-image",
    guide: {
      en: "{pn} <prompt>\nExample: {pn} 1 boy, solo, cyberpunk"
    }
  },

  onStart: async function ({ args, message, event, api }) {
    const prompt = args.join(" ");
    if (!prompt) return message.reply("❌ Please provide a prompt.\nExample: fluxultra 1 boy, solo, cyberpunk");

    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    const apiUrl = `https://api.oculux.xyz/api/flux-1.1-pro-ultra?prompt=${encodeURIComponent(prompt)}`;
    const fileName = `${Date.now()}_fluxultra.jpg`;
    const filePath = path.join(__dirname, "cache", fileName);

    try {
      const res = await axios.get(apiUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(filePath, Buffer.from(res.data, "binary"));

      message.reply({ attachment: fs.createReadStream(filePath) }, () => {
        fs.unlinkSync(filePath);
        api.setMessageReaction("✅", event.messageID, () => {}, true);
      });

    } catch (err) {
      console.error("FluxUltra Error:", err.message);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      message.reply("❌ Failed to generate image.");
    }
  }
};
