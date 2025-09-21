const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "anygen",
    aliases: [],
    version: "1.0",
    author: "NEXXO",
    countDown: 15,
    role: 0,
    shortDescription: "Generate image using Kaiz API",
    longDescription: "Generate premium image with model selection using Kaiz API",
    category: "ai-image",
    guide: {
      en: "{pn} [model_number] | [prompt]\nExample: {pn} 2 | roronoa zoro holding sword"
    }
  },

  onStart: async function ({ args, message }) {
    if (!args[0]) {
      return message.reply(`❌ Please provide model number and prompt.\n\nExample:\n${global.GoatBot.config.prefix}anygen 2 | zoro holding sword\n\nUse "${global.GoatBot.config.prefix}anygen model" to see available models.`);
    }

    // Show model list
    if (args[0].toLowerCase() === "model") {
      return message.reply(
`🎨 Available Models:
1: Cyberpunk
2: Anime
3: Old Drawing
4: Renaissance Painting
5: Cartoon
6: Cute Creature
7: Abstract Painting
8: Dark
9: Fantasy
10: 3D Origami
11: 3D Hologram
12: Pop Art
13: Pixel World
14: Manga
15: Fantasy World
16: Vintage`
      );
    }

    const input = args.join(" ").split("|").map(i => i.trim());
    const model = input[0];
    const prompt = input[1];

    if (!model || !prompt) {
      return message.reply("❌ Invalid format. Use:\nanygen [model_number] | [prompt]");
    }

    const apiKey = "66e0cfbb-62b8-4829-90c7-c78cacc72ae2";
    const url = `https://kaiz-apis.gleeze.com/api/nuelink?prompt=${encodeURIComponent(prompt)}&model=${model}&apikey=${apiKey}`;

    try {
      const response = await axios({
        url,
        method: "GET",
        responseType: "arraybuffer"
      });

      const fileName = `${Date.now()}_anygen.jpg`;
      const filePath = path.join(__dirname, "cache", fileName);
      fs.writeFileSync(filePath, Buffer.from(response.data, "binary"));

      message.reply({
        body: `✅ Image generated:\n📌 Prompt: ${prompt}\n🎨 Model: ${model}`,
        attachment: fs.createReadStream(filePath)
      }, () => fs.unlinkSync(filePath));

    } catch (err) {
      console.error(err);
      message.reply("❌ Failed to generate image. Make sure your prompt is valid and model is between 1–16.");
    }
  }
};
