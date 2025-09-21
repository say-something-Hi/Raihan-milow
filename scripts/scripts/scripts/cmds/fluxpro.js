const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "fluxpro",
    aliases: [],
    version: "2.0",
    author: "nexo_here",
    countDown: 10,
    role: 0,
    shortDescription: "Generate image using Flux v1.1 Pro",
    longDescription: "Generate a powerful AI image using Flux 1.1 Pro model",
    category: "ai-image",
    guide: {
      en: "{pn} <prompt>\nExample: {pn} Collage, quad panel, top left: Superman, red and blue suit"
    }
  },

  onStart: async function ({ args, message, event, api }) {
    const prompt = args.join(" ");
    if (!prompt) return message.reply("❌ Please provide a prompt.\nExample: fluxpro Collage, quad panel, top left: Superman");

    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    const apiUrl = `https://api.oculux.xyz/api/flux-1.1-pro?prompt=${encodeURIComponent(prompt)}`;
    const fileName = `${Date.now()}_fluxpro.jpg`;
    const filePath = path.join(__dirname, "cache", fileName);

    try {
      const res = await axios.get(apiUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(filePath, Buffer.from(res.data, "binary"));

      message.reply({ attachment: fs.createReadStream(filePath) }, () => {
        fs.unlinkSync(filePath);
        api.setMessageReaction("✅", event.messageID, () => {}, true);
      });

    } catch (err) {
      console.error("FluxPro v1.1 Error:", err.message);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      message.reply("❌ Failed to generate image.");
    }
  }
};
