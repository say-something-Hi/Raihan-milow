const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "stablediffusion",
    aliases: ["sd"],
    version: "2.0",
    author: "NEXXO",
    countDown: 10,
    role: 0,
    shortDescription: "Generate 4-grid AI image from Stable Diffusion",
    longDescription: "Generates 4 AI images in a grid using Siputzx's stable-diffusion API and lets you pick one with U1–U4",
    category: "ai-image",
    guide: {
      en: "{pn} [prompt]\nExample: {pn} a cyberpunk city at night"
    }
  },

  onStart: async function ({ args, message, event, api }) {
    const prompt = args.join(" ");
    if (!prompt) return message.reply("❌ Please provide a prompt.\nExample: sd a warrior in a dark forest");

    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    const generateImages = async () => {
      const imagePaths = [];
      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

      for (let i = 0; i < 4; i++) {
        const url = `https://api.siputzx.my.id/api/ai/stable-diffusion?prompt=${encodeURIComponent(prompt)}`;
        try {
          const res = await axios.get(url, { responseType: "arraybuffer" });
          const imgPath = path.join(cacheDir, `${Date.now()}_sd_${i}.jpg`);
          fs.writeFileSync(imgPath, Buffer.from(res.data, "binary"));
          imagePaths.push(imgPath);
        } catch (err) {
          console.error("Image generation failed:", err.message);
          imagePaths.forEach(fp => fs.existsSync(fp) && fs.unlinkSync(fp));
          return null;
        }
      }

      return imagePaths;
    };

    const mergeImages = async (imagePaths) => {
      const canvas = createCanvas(1024, 1024);
      const ctx = canvas.getContext("2d");

      const imgs = await Promise.all(imagePaths.map(p => loadImage(p)));
      ctx.drawImage(imgs[0], 0, 0, 512, 512);
      ctx.drawImage(imgs[1], 512, 0, 512, 512);
      ctx.drawImage(imgs[2], 0, 512, 512, 512);
      ctx.drawImage(imgs[3], 512, 512, 512, 512);

      const mergedPath = path.join(__dirname, "cache", `${Date.now()}_merged_sd.jpg`);
      fs.writeFileSync(mergedPath, canvas.toBuffer("image/jpeg"));
      return mergedPath;
    };

    const imagePaths = await generateImages();
    if (!imagePaths || imagePaths.length !== 4) {
      message.reply("❌ Failed to generate images.");
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      return;
    }

    const grid = await mergeImages(imagePaths);
    if (!grid) {
      message.reply("❌ Failed to merge images.");
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      return;
    }

    message.reply({
      attachment: fs.createReadStream(grid),
      body: "Reply with [U1], [U2], [U3], or [U4] to get your selected image."
    }, (err, info) => {
      if (err) return;

      global.GoatBot.onReply.set(info.messageID, {
        commandName: "stablediffusion",
        author: event.senderID,
        images: imagePaths
      });

      api.setMessageReaction("✅", event.messageID, () => {}, true);
    });
  },

  onReply: async function ({ api, event, Reply, message }) {
    const { author, images } = Reply;
    if (event.senderID !== author) return;

    const choice = event.body.toUpperCase().trim();
    const match = choice.match(/^U([1-4])$/);
    if (!match) return;

    const index = parseInt(match[1]) - 1;
    const imagePath = images[index];

    if (!fs.existsSync(imagePath)) {
      return message.reply("❌ Image file not found.");
    }

    api.setMessageReaction("⏳", event.messageID, () => {}, true);
    message.reply({
      attachment: fs.createReadStream(imagePath)
    }, () => {
      api.setMessageReaction("✅", event.messageID, () => {}, true);

      // Clean up all 4 after sending
      images.forEach(p => fs.existsSync(p) && fs.unlinkSync(p));
      global.GoatBot.onReply.delete(event.messageID);
    });
  }
};
