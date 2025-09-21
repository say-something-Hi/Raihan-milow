const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "t2i",
    version: "1.0",
    author: "nexo_here",
    shortDescription: { en: "Generate image from text using Kaizen text2image API" },
    longDescription: { en: "Generate AI image from prompt (binary response) via Kaizen text2image endpoint" },
    category: "ai-image",
    guide: { en: "{pn} [prompt]" }
  },

  onStart: async function({ message, args }) {
    const prompt = args.join(" ");
    if (!prompt) return message.reply("⚠️ | Please provide a prompt.");

    const loading = await message.reply("🖼️ Generating image, please wait...");

    const fileName = `t2i_${Date.now()}.jpg`;
    const filePath = path.join(__dirname, "cache", fileName);

    try {
      const res = await axios.get(`https://kaiz-apis.gleeze.com/api/text2image?prompt=${encodeURIComponent(prompt)}&apikey=66e0cfbb-62b8-4829-90c7-c78cacc72ae2`, {
        responseType: "arraybuffer"
      });

      await fs.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, res.data);

      await message.reply({
        attachment: fs.createReadStream(filePath)
      });

    } catch (error) {
      console.error(error);
      message.reply("❌ | Failed to generate image.");
    } finally {
      if (loading.messageID) message.unsend(loading.messageID);
      setTimeout(() => fs.remove(filePath), 30000);
    }
  }
};
