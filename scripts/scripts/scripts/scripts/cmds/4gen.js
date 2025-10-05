const axios = require("axios");

module.exports = {
  config: {
    name: "4gen",
    version: "1.0",
    author: "nexo_here",
    shortDescription: { en: "Generate AI image using Kaizen 4gen API" },
    longDescription: { en: "Generate photorealistic image from prompt using Kaizen 4gen API" },
    category: "ai-image",
    guide: { en: "{pn} [prompt]" }
  },

  onStart: async function({ message, args }) {
    const prompt = args.join(" ");
    if (!prompt) return message.reply("⚠️ | Please provide a prompt.");

    const loading = await message.reply("🖼️ Generating image, please wait...");

    try {
      const apiUrl = `https://kaiz-apis.gleeze.com/api/4gen?prompt=${encodeURIComponent(prompt)}&ratio=1:1&stream=false&apikey=66e0cfbb-62b8-4829-90c7-c78cacc72ae2`;
      const res = await axios.get(apiUrl);

      if (!res.data || !res.data.image_url) {
        return message.reply("❌ | API did not return an image URL.");
      }

      const imgUrl = res.data.image_url;
      const imgStream = await axios.get(imgUrl, { responseType: "stream" });

      await message.reply({
        attachment: imgStream.data
      });

    } catch (err) {
      console.error(err);
      message.reply("❌ | Failed to generate or fetch image.");
    } finally {
      if (loading.messageID) message.unsend(loading.messageID);
    }
  }
};
