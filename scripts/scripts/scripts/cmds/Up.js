const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "uptime",
    aliases: ["up", "upt"],
    version: "2.1",
    author: "Raihan",
    role: 0,
    noPrefix: true,
    shortDescription: {
      en: "Check bot uptime with ping and image"
    },
    longDescription: {
      en: "Display how long the bot is running along with ping time and a custom image"
    },
    category: "system",
    guide: {
      en: "Type 'up' to see bot uptime"
    }
  },

  onStart() {
    console.log("✅ Uptime command loaded.");
  },

  onChat: async function ({ event, message }) {
    const body = event.body?.toLowerCase() || "";
    if (body !== "up") return;

    const imagePath = path.join(__dirname, "uptime_image.png");

    try {
      // Step 1: Ping Calculation
      const pingMsg = await message.reply("⚡ Checking ping...");
      const start = Date.now();
      await new Promise(res => setTimeout(res, 100));
      const ping = Date.now() - start;

      // Step 2: Uptime Calculation
      const uptime = Math.floor(process.uptime()); // in seconds
      const days = Math.floor(uptime / (3600 * 24));
      const hours = Math.floor((uptime % (3600 * 24)) / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = uptime % 60;
      const upTimeStr = `${days}d ${hours}h ${minutes}m ${seconds}s`;

      // Step 3: Create Canvas
      const canvas = createCanvas(1000, 500);
      const ctx = canvas.getContext("2d");

      // Step 4: Load Background
      const bgUrl = "https://i.imgur.com/b4rDlP9.png";
      const background = await loadImage(bgUrl);
      ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

      // Step 5: Draw Text on Image
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 45px Arial";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0,0,0,0.7)";
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.shadowBlur = 4;

      ctx.fillText("🤖 BOT UPTIME", 60, 100);
      ctx.fillText(`⏳ ${upTimeStr}`, 60, 200);
      ctx.fillText(`⚡ Ping: ${ping}ms`, 60, 280);
      ctx.fillText(` Owner: Raihan `, 60, 360);

      // Step 6: Save and Send Image
      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(imagePath, buffer);

      await message.unsend(pingMsg.messageID);

      // Step 7: Final Response
      await message.reply({
        body:
`(✿◕‿◕)ﾉ 𝑩𝒐𝒕 𝑺𝒕𝒂𝒕𝒖𝒔 💖
⏱ 𝑼𝒑𝒕𝒊𝒎𝒆 : ${upTimeStr} ⏳
⚡ 𝑷𝒊𝒏𝒈 : ${ping} ms 
 𝑶𝒘𝒏𝒆𝒓 : 𝗥𝗮𝗶𝗛𝗮𝗻 
•  •  •  •  •  •  •  •  •  •  •  •  •  • `,
        attachment: fs.createReadStream(imagePath)
      });

    } catch (err) {
      console.error("❌ Error in uptime command:", err);
      await message.reply("❌ Something went wrong while generating uptime.");
    } finally {
      // Clean up image
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }
  }
};
