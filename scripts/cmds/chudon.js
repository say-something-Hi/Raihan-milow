const axios = require("axios");
const fs = require("fs");
const path = require("path");

const apikey = "66e0cfbb-62b8-4829-90c7-c78cacc72ae2";

module.exports = {
  config: {
    name: "chudon",
    aliases: ["porn", "chudachudi"],
    version: "1.1",
    role: 2,
    author: "nexo_here",
    category: "fun",
    shortDescription: "Send random video from LootedPinay",
    longDescription: "Fetch and stream a random NSFW video from LootedPinay",
    guide: "{pn}chudon"
  },

  onStart: async function ({ api, event }) {
    try {
      const apiUrl = `https://kaiz-apis.gleeze.com/api/lootedpinay?limit=10&apikey=${apikey}`;
      const res = await axios.get(apiUrl);
      const videos = res.data?.videos;

      if (!videos || videos.length === 0) {
        return api.sendMessage("❌ No video found.", event.threadID, event.messageID);
      }

      const random = videos[Math.floor(Math.random() * videos.length)];
      const fileName = `chudon_${Date.now()}.mp4`;
      const filePath = path.join(__dirname, "tmp", fileName);

      const videoStream = await axios({
        url: random.mp4url,
        method: "GET",
        responseType: "stream"
      });

      const writer = fs.createWriteStream(filePath);
      videoStream.data.pipe(writer);

      writer.on("finish", () => {
        api.sendMessage({
          body: random.title,
          attachment: fs.createReadStream(filePath)
        }, event.threadID, () => fs.unlinkSync(filePath), event.messageID);
      });

      writer.on("error", () => {
        api.sendMessage("❌ Failed to download the video.", event.threadID, event.messageID);
      });

    } catch (err) {
      console.error("chudon error:", err);
      return api.sendMessage("❌ Something went wrong.", event.threadID, event.messageID);
    }
  }
};