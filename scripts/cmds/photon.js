const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "photon",
    aliases: [],
    version: "1.0",
    author: "nexo_here",
    countDown: 10,
    role: 0,
    shortDescription: "Generate AI image using Photon",
    longDescription: "Create high-quality AI image using the Photon engine.",
    category: "ai-image",
    guide: {
      en: "{pn} <prompt>\nExample: {pn} A boy riding a dragon"
    }
  },

  onStart: async function ({ args, message, event, api }) {
    const prompt = args.join(" ");
    if (!prompt) return message.reply("❌ Please provide a prompt.\nExample: photon A boy flying through stars");

    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    const apiUrl = `https://api.oculux.xyz/api/photon?prompt=${encodeURIComponent(prompt)}`;
    const fileName = `${Date.now()}_photon.jpg`;
    const filePath = path.join(__dirname, "cache", fileName);

    try {
      const response = await axios.get(apiUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(filePath, Buffer.from(response.data, "binary"));

      message.reply({ attachment: fs.createReadStream(filePath) }, () => {
        fs.unlinkSync(filePath);
        api.setMessageReaction("✅", event.messageID, () => {}, true);
      });

    } catch (error) {
      console.error("Photon API Error:", error.message);
      message.reply("❌ Failed to generate image using Photon.");
      api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
  }
};
