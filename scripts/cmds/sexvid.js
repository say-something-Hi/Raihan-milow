


module.exports = {
  config: {
    name: "video",
    aliases: ["Muslim","islam"],
    version: "2.0",
    author: "nexo_here",
    countDown: 0,
    role: 1,
    shortDescription: "",
    longDescription: "get Islamic video",
    category: " media ",
    guide: "{p}{n}",
  },

  sentVideos: [],

  onStart: async function ({ api, event, message }) {
    const senderID = event.senderID;

    const loadingMessage = await message.reply({
      body: "Tham video dicchi ektu Dara 😏",
    });

    const link = [
      ""];

    const availableVideos = link.filter(video => !this.sentVideos.includes(video));

    if (availableVideos.length === 0) {
      this.sentVideos = [];
    }

    const randomIndex = Math.floor(Math.random() * availableVideos.length);
    const randomVideo = availableVideos[randomIndex];

    this.sentVideos.push(randomVideo);

    if (senderID !== null) {
      message.reply({
        body: 'Dekh beta 😂',
        attachment: await global.utils.getStreamFromURL(randomVideo),
      });

      setTimeout(() => {
        api.unsendMessage(loadingMessage.messageID);
      }, 50000);
    }
  },
};
