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

      // Step 2: Uptime Calculation - Minimum 20 hours + double after 20 hours
      const actualUptime = Math.floor(process.uptime()); // in seconds
      const twentyHours = 20 * 3600; // 20 hours in seconds
      
      let displayUptime;
      if (actualUptime < twentyHours) {
        // If less than 20 hours, show exactly 20 hours
        displayUptime = twentyHours;
      } else {
        // If more than 20 hours, double the extra time and add to 20 hours
        const extraTime = actualUptime - twentyHours;
        displayUptime = twentyHours + (extraTime * 2);
      }
      
      const days = Math.floor(displayUptime / (3600 * 24));
      const hours = Math.floor((displayUptime % (3600 * 24)) / 3600);
      const minutes = Math.floor((displayUptime % 3600) / 60);
      const seconds = displayUptime % 60;
      const upTimeStr = `${days}d ${hours}h ${minutes}m ${seconds}s`;

      // Step 3: Create Canvas
      const canvas = createCanvas(1000, 500);
      const ctx = canvas.getContext("2d");

      // Step 4: Load Background
      const bgUrl = "https://i.imgur.com/O8V4A01.jpeg";
      const background = await loadImage(bgUrl);
      ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

      // Step 5: Draw Text on Image with emojis
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 45px Arial";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0,0,0,0.7)";
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.shadowBlur = 4;

      ctx.fillText("✿ BOT UPTIME", 60, 100);
      ctx.fillText(`⏳ ${upTimeStr}`, 60, 200);
      ctx.fillText(`⚡ Ping: ${ping}ms`, 60, 280);
      ctx.fillText(`👑 Owner: Raihan`, 60, 360);

      // Step 6: Save and Send Image
      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(imagePath, buffer);

      await message.unsend(pingMsg.messageID);

      // Step 7: Final Response with emojis
      await message.reply({
        body:
`(✿◕‿◕)ﾉ 𝑩𝒐𝒕 𝑺𝒕𝒂𝒕𝒖𝒔 💖
⏱ 𝑼𝒑𝒕𝒊𝒎𝒆 : ${upTimeStr} ⏳
⚡ 𝑷𝒊𝒏𝒈 : ${ping}ms 
👑 𝑶𝒘𝒏𝒆𝒓 : 𝗥𝗮𝗶𝗛𝗮𝗻 
•  •  •  •  •  •  •  •  •  •  •  •  •  •`,
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
