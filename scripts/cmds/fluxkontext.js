const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "fluxkontext",
    aliases: ["fluxk"],
    version: "1.0",
    author: "nexo_here",
    countDown: 10,
    role: 0,
    shortDescription: "Generate image using Kontext model",
    longDescription: "Generate high-quality realistic image using AI (KontextMax)",
    category: "ai-image",
    guide: {
      en: "{pn} <prompt>\nExample: {pn} 1 boy, solo, realistic"
    }
  },

  onStart: async function ({ args, message, event, api }) {
    const prompt = args.join(" ");
    if (!prompt) return message.reply("❌ Please provide a prompt.\nExample: fluxkontext 1 boy, solo, realistic");

    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    const apiUrl = `https://api.oculux.xyz/api/kontextmax?prompt=${encodeURIComponent(prompt)}`;
    const fileName = `${Date.now()}_fluxkontext.jpg`;
    const filePath = path.join(__dirname, "cache", fileName);

    try {
      const res = await axios.get(apiUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(filePath, Buffer.from(res.data, "binary"));

      message.reply({ attachment: fs.createReadStream(filePath) }, () => {
        fs.unlinkSync(filePath);
        api.setMessageReaction("✅", event.messageID, () => {}, true);
      });

    } catch (err) {
      console.error("FluxKontext Error:", err.message);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      message.reply("❌ Failed to generate image.");
    }
  }
};
