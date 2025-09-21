const axios = require("axios");

const apiKey = "66e0cfbb-62b8-4829-90c7-c78cacc72ae2";

module.exports = {
  config: {
    name: "anime",
    version: "2.1",
    author: "nexo_here",
    category: "anime",
    shortDescription: "Get anime info",
    longDescription: "Fetches anime details like description, year, score, and episodes using Kaiz API",
    guide: "{pn} <anime title>"
  },

  onStart: async function ({ api, event, args }) {
    const title = args.join(" ");
    if (!title) {
      return api.sendMessage("❌ Please provide an anime title.", event.threadID, event.messageID);
    }

    const url = `https://kaiz-apis.gleeze.com/api/animeheaven?title=${encodeURIComponent(title)}&episode=1&apikey=${apiKey}`;

    try {
      const res = await axios.get(url);

      if (!res.data || !res.data.response || !res.data.response.title) {
        return api.sendMessage("❌ Anime not found or invalid response format.", event.threadID, event.messageID);
      }

      const data = res.data.response;

      const {
        title: animeTitle,
        thumbnail,
        description,
        episodes,
        year,
        score,
        episodeList
      } = data;

      const ep = episodeList && episodeList[0];
      const msg = `🎌 Title: ${animeTitle}
📅 Year: ${year}
⭐ Score: ${score}
📺 Total Episodes: ${episodes}
📝 Description: ${description}
▶️ Episode 1: ${ep?.download_url || "Not available"}`;

      return api.sendMessage(
        {
          body: msg,
          attachment: thumbnail ? await global.utils.getStreamFromURL(thumbnail) : null
        },
        event.threadID,
        event.messageID
      );

    } catch (err) {
      console.error("Anime command error:", err.message || err);
      return api.sendMessage("❌ Something went wrong while fetching anime info.", event.threadID, event.messageID);
    }
  }
};