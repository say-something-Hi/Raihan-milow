module.exports = {
    config: {
        name: "bro",
        version: "7.3.1",
        hasPermssion: 0,
        credits: "RaiHan Edit",
        description: "Get Pair From Mention",
        commandCategory: "png",
        usages: "[@mention]",
        cooldowns: 5,
        dependencies: {
            "axios": "",
            "fs-extra": "",
            "path": "",
            "jimp": ""
        }
    },

    onStart: async function () {
        const { resolve } = global.nodemodule["path"];
        const { existsSync, mkdirSync } = global.nodemodule["fs-extra"];
        const { downloadFile } = global.utils;

        const dirMaterial = __dirname + '/cache/canvas/';
        const path = resolve(dirMaterial, 'sis.png');

        if (!existsSync(dirMaterial)) mkdirSync(dirMaterial, { recursive: true });
        if (!existsSync(path)) await downloadFile("https://i.imgur.com/n2FGJFe.jpg", path);

        console.log("✅ [BRO COMMAND] Resources loaded successfully!");
    },

    run: async function ({ event, api }) {
        const fs = global.nodemodule["fs-extra"];
        const path = global.nodemodule["path"];
        const axios = global.nodemodule["axios"];
        const jimp = global.nodemodule["jimp"];
        const { threadID, messageID, senderID } = event;
        const mention = Object.keys(event.mentions);

        if (!mention[0]) return api.sendMessage("আপনার ভাইকে মেনশন করুন ❤️‍🩹😙", threadID, messageID);

        const one = senderID;
        const two = mention[0];
        const __root = path.resolve(__dirname, "cache", "canvas");

        // Download avatars
        const avatarOnePath = path.join(__root, `avt_${one}.png`);
        const avatarTwoPath = path.join(__root, `avt_${two}.png`);
        const getAvatarOne = (await axios.get(
            `https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
            { responseType: 'arraybuffer' }
        )).data;
        const getAvatarTwo = (await axios.get(
            `https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
            { responseType: 'arraybuffer' }
        )).data;

        fs.writeFileSync(avatarOnePath, getAvatarOne);
        fs.writeFileSync(avatarTwoPath, getAvatarTwo);

        // Load background and create circular avatars
        const baseImg = await jimp.read(path.join(__root, "sis.png"));
        const circleOne = await jimp.read(await circle(avatarOnePath));
        const circleTwo = await jimp.read(await circle(avatarTwoPath));

        baseImg.composite(circleOne.resize(191, 191), 93, 111)
               .composite(circleTwo.resize(190, 190), 434, 107);

        const finalPath = path.join(__root, `bro_${one}_${two}.png`);
        const raw = await baseImg.getBufferAsync("image/png");
        fs.writeFileSync(finalPath, raw);

        // Clean up temporary avatars
        fs.unlinkSync(avatarOnePath);
        fs.unlinkSync(avatarTwoPath);

        // Send message with attachment
        return api.sendMessage({
            body: `🌸•❖•━━━━━━━━━•❖•🌸\n           ✧•❁ 𝐓𝐞𝐫𝐚 𝐁𝐚𝐢 ❁•✧\n🌸•❖•━━━━━━━━━•❖•🌸\n\n🤝 বন্ধুত্বের বাঁধন আজ আরও শক্ত হলো 💖\n\n 🫱 এই নে! রাখ তোর ভাইরে ❤️\n\n 👑 𝐁𝐑𝐎𝐓𝐇𝐄𝐑 𝐅𝐎𝐑𝐄𝐕𝐄𝐑 🩷\n\n🌸•❖•━━━━━━━━━━•❖•🌸`,
            attachment: fs.createReadStream(finalPath)
        }, threadID, () => fs.unlinkSync(finalPath), messageID);

        async function circle(imagePath) {
            const image = await jimp.read(imagePath);
            image.circle();
            return await image.getBufferAsync("image/png");
        }
    }
};
