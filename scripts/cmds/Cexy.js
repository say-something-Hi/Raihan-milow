const jimp = require("jimp");
const fs = require("fs");

module.exports = {
  config: {
    name: "cexy",
    aliases: [],
    version: "1.4",
    author: "Ew'r Saim",
    countDown: 5,
    role: 0,
    shortDescription: "cexy avatar 🫦",
    longDescription: "jekono kauke tag kore tar avatar 1ta cexy background er upor bosan",
    category: "fun",
    guide: "{pn} @mention",
  },

  onStart: async function ({ message, event }) {
    const mention = Object.keys(event.mentions);
    if (mention.length === 0) return message.reply("👄 Mention someone to cexify them!");

    const targetID = mention[0];

    try {
      const imgPath = await generateCexyImage(targetID);
      message.reply({
        body: "eww cexy 🫦🥵",
        attachment: fs.createReadStream(imgPath),
      });

      setTimeout(() => fs.unlinkSync(imgPath), 30000);
    } catch (err) {
      console.error(err);
      message.reply("❌ Failed to create image.");
    }
  }
};

async function generateCexyImage(userID) {
  
  const canvasWidth = 480;
  const canvasHeight = 480;

  const avatarSize = 105; // Increased by 5
  const avatarX = ((canvasWidth - avatarSize) / 2) + 5; // Moved 5px right
  const avatarY = ((canvasHeight - avatarSize) / 2) - 120;

  const bg = await jimp.read("https://i.imgur.com/qS4TyJ1.jpeg");
  const avatar = await jimp.read(`https://graph.facebook.com/${userID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);

  bg.resize(canvasWidth, canvasHeight);
  avatar.circle().resize(avatarSize, avatarSize);

  bg.composite(avatar, avatarX, avatarY);

  const outPath = `cache/cexy_${Date.now()}.png`;
  await bg.writeAsync(outPath);
  return outPath;
    }
