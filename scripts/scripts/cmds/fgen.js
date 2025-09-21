const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "fastgen",
    aliases: ["imagen4fast"],
    version: "1.0",
    author: "nexo_here",
    countDown: 10,
    role: 0,
    shortDescription: "Generate AI image fast",
    longDescription: "Quickly generate an AI image based on your prompt.",
    category: "ai-image",
    guide: {
      en: "{pn} [prompt]\nExample: {pn} a bird flying in sunset sky"
    }
  },

  onStart: async function ({ args, message, event, api }) {
    const prompt = args.join(" ");
    if (!prompt) {
      return message.reply("❌ Please provide a prompt.\nExample: imagen4fast a bird flying in sunset sky");
    }

    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    const url = `https://renzweb.onrender.com/api/imagen4-fast?prompt=${encodeURIComponent(prompt)}`;

    try {
      const res = await axios.get(url, { responseType: "arraybuffer" });
      const fileName = `${Date.now()}_imagen4fast.jpg`;
      const filePath = path.join(__dirname, "cache", fileName);

      fs.writeFileSync(filePath, Buffer.from(res.data, "binary"));

      message.reply({ attachment: fs.createReadStream(filePath) }, () => {
        fs.unlinkSync(filePath);
        api.setMessageReaction("✅", event.messageID, () => {}, true);
      });

    } catch (err) {
      console.error("Image generation failed:", err.message);
      message.reply("❌ Failed to generate image.");
      api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
  }
};
