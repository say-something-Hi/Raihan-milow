const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "geminiimg",
    aliases: ["gimg", "geminiimage"],
    version: "1.0",
    author: "nexo_here",
    shortDescription: "Generate image using Gemini 2.5 Pro",
    longDescription: "Send a prompt and receive only the generated image.",
    category: "ai-image",
    guide: "{pn} <prompt>\nExample: {pn} A cat in space"
  },

  onStart: async function ({ api, event, args }) {
    const uid = event.senderID;
    const prompt = args.join(" ");

    if (!prompt) {
      return api.sendMessage(
        "❌ Please provide an image prompt.",
        event.threadID,
        event.messageID
      );
    }

    const apiUrl = `https://api.oculux.xyz/api/gemini-2.5-pro?prompt=${encodeURIComponent(prompt)}&uid=${uid}&imgs=true`;

    try {
      const res = await axios.get(apiUrl);
      const responseText = res.data?.response || "";

      // Extract image URL from markdown ![...](URL)
      const match = responseText.match(/\!\[.*?\]\((https?:\/\/[^\s)]+)\)/);
      const imageUrl = match && match[1];

      if (!imageUrl) {
        return api.sendMessage("⚠️ No image URL found in Gemini response.", event.threadID, event.messageID);
      }

      const fileName = `${Date.now()}_gemini.jpg`;
      const filePath = path.join(__dirname, "cache", fileName);

      const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(filePath, imageResponse.data);

      api.sendMessage(
        { attachment: fs.createReadStream(filePath) },
        event.threadID,
        () => fs.unlinkSync(filePath),
        event.messageID
      );

    } catch (err) {
      console.error("Gemini image fetch error:", err);
      return api.sendMessage("❌ Failed to fetch or send the image.", event.threadID, event.messageID);
    }
  }
};
