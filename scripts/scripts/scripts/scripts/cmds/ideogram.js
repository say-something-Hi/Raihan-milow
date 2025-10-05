const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "ideogram",
    aliases: ["ig"],
    version: "1.0",
    author: "nexo_here",
    countDown: 10,
    role: 0,
    shortDescription: "Generate image with ideogram model",
    longDescription: "Create AI-generated image using ideogram v3 turbo model",
    category: "ai-image",
    guide: {
      en: "{pn} <prompt>\nExample: {pn} A boy holding a glowing sword"
    }
  },

  onStart: async function ({ args, message, event, api }) {
    const prompt = args.join(" ");
    if (!prompt) return message.reply("❌ Please provide a prompt.\nExample: ideogram A boy with glowing eyes");

    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    const url = `https://api.oculux.xyz/api/ideogramv3-turbo?prompt=${encodeURIComponent(prompt)}`;
    const fileName = `${Date.now()}_ideogram.jpg`;
    const filePath = path.join(__dirname, "cache", fileName);

    try {
      const res = await axios.get(url, { responseType: "arraybuffer" });
      fs.writeFileSync(filePath, Buffer.from(res.data, "binary"));

      message.reply({ attachment: fs.createReadStream(filePath) }, () => {
        fs.unlinkSync(filePath);
        api.setMessageReaction("✅", event.messageID, () => {}, true);
      });

    } catch (err) {
      console.error("Ideogram Error:", err.message);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      message.reply("❌ Failed to generate image from ideogram.");
    }
  }
};
