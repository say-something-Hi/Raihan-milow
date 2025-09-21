const fs = require("fs");
const path = require("path");
const axios = require("axios");

const apikey = "66e0cfbb-62b8-4829-90c7-c78cacc72ae2";

module.exports = {
  config: {
    name: "blowjob",
    version: "1.1",
    role: 2,
    author: "nexo_here",
    category: "fun",
    shortDescription: "Send random blowjob gif",
    longDescription: "Fetch random blowjob gif from API and send as attachment",
    guide: "{pn}blowjob"
  },

  onStart: async function({ api, event }) {
    try {
      const apiUrl = `https://kaiz-apis.gleeze.com/api/blowjob?apikey=${apikey}`;
      const fileName = `blowjob_${Date.now()}.gif`;
      const filePath = path.join(__dirname, "tmp", fileName);

      const response = await axios({
        url: apiUrl,
        method: "GET",
        responseType: "stream"
      });

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      writer.on("finish", () => {
        api.sendMessage(
          {
            body: "Here's a random blowjob gif:",
            attachment: fs.createReadStream(filePath)
          },
          event.threadID,
          () => fs.unlinkSync(filePath),
          event.messageID
        );
      });

      writer.on("error", () => {
        api.sendMessage("❌ Error downloading gif.", event.threadID, event.messageID);
      });

    } catch (error) {
      console.error("blowjob command error:", error);
      api.sendMessage("❌ Something went wrong.", event.threadID, event.messageID);
    }
  }
};