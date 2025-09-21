const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "imagen4",
    aliases: [],
    version: "1.0",
    author: "nexo_here",
    countDown: 10,
    role: 0,
    shortDescription: "Generate image using Imagen4",
    longDescription: "Generate AI image via Imagen4",
    category: "ai-image",
    guide: {
      en: "{pn} [prompt]\nExample: {pn} A boy, Eren Yeager"
    }
  },

  onStart: async function ({ args, message, event, api }) {
    const prompt = args.join(" ");
    if (!prompt) {
      return message.reply("❌ Please provide a prompt.\nExample: imagen4 A boy, Eren Yeager");
    }

    // React loading
    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    const url = `https://api.oculux.xyz/api/imagen4?prompt=${encodeURIComponent(prompt)}`;

    try {
      const res = await axios.get(url, { responseType: "arraybuffer" });

      const fileName = `${Date.now()}_imagen4.jpg`;
      const filePath = path.join(__dirname, "cache", fileName);
      fs.writeFileSync(filePath, Buffer.from(res.data, "binary"));

      // Send image without caption
      message.reply({ attachment: fs.createReadStream(filePath) }, () => {
        fs.unlinkSync(filePath);
        api.setMessageReaction("✅", event.messageID, () => {}, true);
      });

    } catch (err) {
      console.error(err);
      message.reply("❌ Failed to generate image.");
      api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
  }
};
