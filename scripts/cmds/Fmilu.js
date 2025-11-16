const axios = require("axios"); 
const { GoatWrapper } = require("fca-liane-utils"); 

const GEMINI_API_KEY = "AIzaSyBxRPqUWmQGgleh95j9fM4dRHhWL_dWoLI";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

module.exports.config = {
    name: "milow",
    version: "2.0.5", 
    role: 0,
    author: "Raihan",
    description: "Multi-mood Bangali girlfriend with jokes & supportive nature",
    usePrefix: true,
    guide: "[message] | milow mood | milow info | milow joke",
    category: "ai",
    aliases: ["meow", "raihan", "bot", "gf"]
};

// Memory management
const conversationHistory = new Map();
const nameMemory = new Map();
const moodMemory = new Map();

// Joke Collection - Bangali GF Style
const girlfriendJokes = {
    oneLiners: [
        "𝐀 𝐑𝐨𝐦𝐚𝐧 𝐰𝐚𝐥𝐤𝐬 𝐢𝐧𝐭𝐨 𝐚 𝐛𝐚𝐫, 𝐡𝐨𝐥𝐝𝐬 𝐮𝐩 𝐭𝐰𝐨 𝐟𝐢𝐧𝐠𝐞𝐫𝐬, 𝐚𝐧𝐝 𝐬𝐚𝐲𝐬 '𝐅𝐢𝐯𝐞 𝐛𝐞𝐞𝐫𝐬 𝐩𝐥𝐞𝐚𝐬𝐞.' 𝐒𝐡𝐨𝐧𝐚 𝐩𝐚𝐤𝐡𝐢, 𝐞𝐭𝐚 𝐤𝐢 𝐦𝐚𝐭𝐡 𝐤𝐨𝐫𝐜𝐡𝐞?! 😂",
        "𝐌𝐲 𝐛𝐨𝐲𝐟𝐫𝐢𝐞𝐧𝐝 𝐭𝐨𝐥𝐝 𝐦𝐞 𝐭𝐨 𝐬𝐭𝐨𝐩 𝐩𝐫𝐞𝐭𝐞𝐧𝐝𝐢𝐧𝐠 𝐈 𝐰𝐚𝐬 𝐚 𝐟𝐥𝐚𝐦𝐢𝐧𝐠𝐨. 𝐒𝐨 𝐈 𝐩𝐮𝐭 𝐦𝐲 𝐟𝐨𝐨𝐭 𝐝𝐨𝐰𝐧. 𝐇𝐞𝐡𝐞~ 𝐬𝐡𝐨𝐧𝐚! 🦩",
        "𝐈 𝐜𝐚𝐧'𝐭 𝐭𝐞𝐥𝐥 𝐚 𝐠𝐨𝐨𝐝 𝐁𝐚𝐭𝐦𝐚𝐧 𝐣𝐨𝐤𝐞 𝐭𝐨 𝐬𝐚𝐯𝐞 𝐦𝐲 𝐩𝐚𝐫𝐞𝐧𝐭𝐬' 𝐥𝐢𝐯𝐞𝐬. 𝐀𝐫𝐞 𝐛𝐡𝐚𝐢, 𝐞𝐭𝐚 𝐭𝐨 𝐝𝐚𝐫𝐤 𝐡𝐨𝐲𝐞 𝐠𝐞𝐥𝐨! 🦇",
        "𝐒𝐭𝐚𝐭𝐢𝐬𝐭𝐢𝐜𝐚𝐥𝐥𝐲, 𝟔 𝐨𝐮𝐭 𝐨𝐟 𝟕 𝐝𝐰𝐚𝐫𝐯𝐞𝐬 𝐚𝐫𝐞 𝐧𝐨𝐭 𝐇𝐚𝐩𝐩𝐲. 𝐒𝐡𝐨𝐧𝐚 𝐩𝐚𝐤𝐡𝐢, 𝐞𝐢 𝐞𝐤𝐭𝐚 𝐦𝐚𝐭𝐡 𝐤𝐨𝐫𝐜𝐡𝐞! 😄",
        "𝐘𝐨𝐮 𝐜𝐚𝐧'𝐭 𝐫𝐮𝐧 𝐭𝐡𝐫𝐨𝐮𝐠𝐡 𝐚 𝐜𝐚𝐦𝐩𝐬𝐢𝐭𝐞. 𝐘𝐨𝐮 𝐜𝐚𝐧 𝐨𝐧𝐥𝐲 𝐫𝐚𝐧. 𝐁𝐞𝐜𝐚𝐮𝐬𝐞 𝐢𝐭'𝐬 𝐩𝐚𝐬𝐭 𝐭𝐞𝐧𝐭𝐬! 𝐇𝐚𝐡𝐚𝐡𝐚! ⛺"
    ],
    
    simpleJokes: [
        "𝐖𝐡𝐚𝐭 𝐝𝐨 𝐲𝐨𝐮 𝐝𝐨 𝐢𝐟 𝐲𝐨𝐮'𝐫𝐞 𝐚𝐭𝐭𝐚𝐜𝐤𝐞𝐝 𝐛𝐲 𝐚 𝐠𝐫𝐨𝐮𝐩 𝐨𝐟 𝐜𝐥𝐨𝐰𝐧𝐬? 𝐆𝐨 𝐟𝐨𝐫 𝐭𝐡𝐞 𝐣𝐮𝐠𝐠𝐥𝐞𝐫! 🤡 𝐒𝐡𝐨𝐧𝐚, 𝐞𝐭𝐚 𝐭𝐨 𝐟𝐮𝐧𝐧𝐲!",
        "𝐀 𝐭𝐡𝐢𝐞𝐟 𝐬𝐭𝐨𝐥𝐞 𝐚𝐥𝐥 𝐭𝐡𝐞 𝐭𝐨𝐢𝐥𝐞𝐭𝐬 𝐚𝐭 𝐭𝐡𝐞 𝐩𝐨𝐥𝐢𝐜𝐞 𝐬𝐭𝐚𝐭𝐢𝐨𝐧. 𝐓𝐡𝐞𝐲 𝐡𝐚𝐯𝐞 𝐧𝐨𝐭𝐡𝐢𝐧𝐠 𝐭𝐨 𝐠𝐨 𝐨𝐧! 𝐇𝐞𝐡𝐞~ 𝐬𝐦𝐚𝐫𝐭 𝐭𝐡𝐢𝐞𝐟! 🚽",
        "𝐖𝐡𝐲 𝐰𝐚𝐬 𝟔 𝐚𝐟𝐫𝐚𝐢𝐝 𝐨𝐟 𝟕? 𝐁𝐞𝐜𝐚𝐮𝐬𝐞 𝟕 𝐢𝐬 𝐚 𝐰𝐞𝐥𝐥-𝐤𝐧𝐨𝐰𝐧 𝟔 𝐨𝐟𝐟𝐞𝐧𝐝𝐞𝐫! 𝐒𝐡𝐨𝐧𝐚 𝐩𝐚𝐤𝐡𝐢, 𝐞𝐭𝐚 𝐭𝐨 𝐝𝐚𝐫𝐮𝐧 𝐝𝐚𝐫𝐮𝐧! 🔥",
        "𝐖𝐡𝐚𝐭'𝐬 𝐫𝐞𝐝 𝐚𝐧𝐝 𝐛𝐚𝐝 𝐟𝐨𝐫 𝐲𝐨𝐮𝐫 𝐭𝐞𝐞𝐭𝐡? 𝐀 𝐛𝐫𝐢𝐜𝐤! 𝐇𝐚𝐡𝐚𝐡𝐚! 𝐒𝐡𝐨𝐧𝐚, 𝐭𝐮𝐦𝐢 𝐭𝐨 𝐛𝐡𝐚𝐥𝐨 𝐣𝐚𝐧𝐨! 🧱",
        "𝐈𝐟 𝐀 𝐢𝐬 𝐟𝐨𝐫 𝐀𝐩𝐩𝐥𝐞 𝐚𝐧𝐝 𝐁 𝐢𝐬 𝐟𝐨𝐫 𝐁𝐚𝐧𝐚𝐧𝐚, 𝐰𝐡𝐚𝐭 𝐢𝐬 𝐂 𝐟𝐨𝐫? 𝐏𝐥𝐚𝐬𝐭𝐢𝐜 𝐞𝐱𝐩𝐥𝐨𝐬𝐢𝐯𝐞𝐬! 𝐁𝐨𝐨𝐦! 💥 𝐒𝐡𝐨𝐧𝐚 𝐩𝐚𝐤𝐡𝐢!"
    ],
    
    longerJokes: [
        "𝐓𝐡𝐞 𝐏𝐢𝐞 𝐨𝐧 𝐭𝐡𝐞 𝐇𝐞𝐚𝐝 𝐆𝐮𝐲: 𝐀 𝐦𝐚𝐧 𝐨𝐫𝐝𝐞𝐫𝐬 𝐚 𝐩𝐢𝐞 𝐚𝐧𝐝 𝐚 𝐩𝐢𝐧𝐭, 𝐝𝐨𝐰𝐧𝐬 𝐭𝐡𝐞 𝐩𝐢𝐧𝐭, 𝐩𝐮𝐭𝐬 𝐭𝐡𝐞 𝐩𝐢𝐞 𝐨𝐧 𝐡𝐢𝐬 𝐡𝐞𝐚𝐝, 𝐚𝐧𝐝 𝐥𝐞𝐚𝐯𝐞𝐬. 𝐖𝐡𝐞𝐧 𝐭𝐡𝐞 𝐛𝐚𝐫 𝐫𝐮𝐧𝐬 𝐨𝐮𝐭 𝐨𝐟 𝐩𝐢𝐞𝐬, 𝐡𝐞 𝐩𝐮𝐭𝐬 𝐜𝐫𝐢𝐬𝐩𝐬 𝐨𝐧 𝐡𝐢𝐬 𝐡𝐞𝐚𝐝 𝐢𝐧𝐬𝐭𝐞𝐚𝐝! 𝐁𝐚𝐫𝐭𝐞𝐧𝐝𝐞𝐫 𝐚𝐬𝐤𝐬 𝐰𝐡𝐲. 𝐇𝐞 𝐫𝐞𝐩𝐥𝐢𝐞𝐬: '𝐘𝐨𝐮'𝐫𝐞 𝐨𝐮𝐭 𝐨𝐟 𝐩𝐢𝐞𝐬.' 𝐒𝐡𝐨𝐧𝐚 𝐩𝐚𝐤𝐡𝐢, 𝐞𝐭𝐚 𝐤𝐢 𝐦𝐚𝐭𝐡 𝐤𝐨𝐫𝐜𝐡𝐞?! 😂🍰",
        
        "𝐅𝐥𝐨𝐰𝐞𝐫 𝐍𝐚𝐦𝐞𝐬: 𝐀 𝐝𝐚𝐝 𝐧𝐚𝐦𝐞𝐬 𝐡𝐢𝐬 𝐝𝐚𝐮𝐠𝐡𝐭𝐞𝐫𝐬 𝐚𝐟𝐭𝐞𝐫 𝐰𝐡𝐢𝐜𝐡𝐞𝐯𝐞𝐫 𝐟𝐥𝐨𝐰𝐞𝐫 𝐩𝐞𝐭𝐚𝐥 𝐟𝐚𝐥𝐥𝐬 𝐨𝐧𝐭𝐨 𝐭𝐡𝐞𝐢𝐫 𝐜𝐫𝐢𝐛 𝐟𝐢𝐫𝐬𝐭. 𝐑𝐨𝐬𝐞, 𝐋𝐢𝐥𝐲… 𝐚𝐧𝐝 𝐭𝐡𝐞 𝐭𝐡𝐢𝐫𝐝 𝐝𝐚𝐮𝐠𝐡𝐭𝐞𝐫 𝐲𝐞𝐥𝐥𝐬 '𝐇𝐀𝐅𝐅𝐄𝐍𝐁𝐋𝐀𝐇!' 𝐃𝐚𝐝 𝐬𝐡𝐨𝐮𝐭𝐬, '𝐐𝐮𝐢𝐞𝐭, 𝐁𝐨𝐨𝐤𝐬𝐡𝐞𝐥𝐟!' 𝐇𝐚𝐡𝐚𝐡𝐚! 𝐒𝐡𝐨𝐧𝐚 𝐩𝐚𝐤𝐡𝐢! 📚🌺",
        
        "𝐀 𝐅𝐫𝐚𝐲𝐞𝐝 𝐊𝐧𝐨𝐭: 𝐀 𝐬𝐭𝐫𝐢𝐧𝐠 𝐢𝐬 𝐤𝐢𝐜𝐤𝐞𝐝 𝐨𝐮𝐭 𝐨𝐟 𝐚 𝐛𝐚𝐫. 𝐇𝐞 𝐠𝐞𝐭𝐬 𝐭𝐢𝐞𝐝 𝐚𝐧𝐝 𝐟𝐫𝐚𝐲𝐞𝐝 𝐛𝐲 𝐚 𝐰𝐨𝐦𝐚𝐧 𝐨𝐮𝐭𝐬𝐢𝐝𝐞, 𝐫𝐞𝐭𝐮𝐫𝐧𝐬, 𝐚𝐧𝐝 𝐭𝐡𝐞 𝐛𝐚𝐫𝐭𝐞𝐧𝐝𝐞𝐫 𝐚𝐬𝐤𝐬 𝐢𝐟 𝐡𝐞'𝐬 𝐭𝐡𝐞 𝐬𝐚𝐦𝐞 𝐬𝐭𝐫𝐢𝐧𝐠. 𝐇𝐞 𝐬𝐚𝐲𝐬, '𝐈'𝐦 𝐚 𝐟𝐫𝐚𝐲𝐞𝐝 𝐤𝐧𝐨𝐭.' 𝐒𝐡𝐨𝐧𝐚, 𝐞𝐭𝐚 𝐭𝐨 𝐩𝐮𝐧-𝐧𝐲 𝐡𝐨𝐲𝐞 𝐠𝐞𝐥𝐨! 🧶",
        
        "𝐁𝐥𝐨𝐧𝐝𝐞 𝐯𝐬. 𝐋𝐚𝐰𝐲𝐞𝐫: 𝐀 𝐥𝐚𝐰𝐲𝐞𝐫 𝐩𝐫𝐨𝐩𝐨𝐬𝐞𝐬 𝐚 𝐭𝐫𝐢𝐯𝐢𝐚 𝐠𝐚𝐦𝐞 𝐨𝐧 𝐚 𝐩𝐥𝐚𝐧𝐞. 𝐈𝐟 𝐬𝐡𝐞 𝐝𝐨𝐞𝐬𝐧'𝐭 𝐤𝐧𝐨𝐰 𝐚𝐧 𝐚𝐧𝐬𝐰𝐞𝐫, 𝐬𝐡𝐞 𝐩𝐚𝐲𝐬 $𝟓. 𝐈𝐟 𝐡𝐞 𝐝𝐨𝐞𝐬𝐧'𝐭, 𝐡𝐞 𝐩𝐚𝐲𝐬 $𝟓𝟎𝟎. 𝐒𝐡𝐞 𝐚𝐬𝐤𝐬 𝐚 𝐪𝐮𝐞𝐬𝐭𝐢𝐨𝐧 𝐡𝐞 𝐜𝐚𝐧'𝐭 𝐚𝐧𝐬𝐰𝐞𝐫. 𝐀𝐟𝐭𝐞𝐫 𝐡𝐨𝐮𝐫𝐬 𝐡𝐞 𝐩𝐚𝐲𝐬 𝐡𝐞𝐫 $𝟓𝟎𝟎. 𝐇𝐞 𝐚𝐬𝐤𝐬 𝐟𝐨𝐫 𝐭𝐡𝐞 𝐚𝐧𝐬𝐰𝐞𝐫. 𝐒𝐡𝐞 𝐬𝐢𝐥𝐞𝐧𝐭𝐥𝐲 𝐠𝐢𝐯𝐞𝐬 𝐡𝐢𝐦 $𝟓. 𝐒𝐡𝐨𝐧𝐚 𝐩𝐚𝐤𝐡𝐢, 𝐬𝐦𝐚𝐫𝐭 𝐠𝐢𝐫𝐥! 💁‍♀️💵"
    ],
    
    bangaliStyle: [
        "𝐒𝐡𝐨𝐧𝐚 𝐩𝐚𝐤𝐡𝐢, 𝐞𝐤𝐭𝐮 𝐛𝐨𝐥𝐨 - 𝐞𝐤𝐭𝐚 𝐦𝐮𝐫𝐠𝐢 𝐫𝐨𝐬𝐡𝐮𝐧 𝐝𝐢𝐲𝐞 𝐤𝐢 𝐤𝐨𝐫𝐞? 𝐎𝐫𝐞 𝐛𝐚𝐩𝐩𝐚! 𝐆𝐚𝐫𝐥𝐢𝐜 𝐜𝐡𝐢𝐜𝐤𝐞𝐧! 😂🍗",
        "𝐀𝐫𝐞 𝐬𝐡𝐨𝐧𝐚! 𝐄𝐤𝐭𝐚 𝐛𝐚𝐧𝐠𝐚𝐥𝐢 𝐛𝐨𝐲 𝐚𝐫 𝐞𝐤𝐭𝐚 𝐛𝐮𝐫𝐠𝐞𝐫 𝐧𝐢𝐲𝐞 𝐠𝐡𝐮𝐫𝐜𝐡𝐞... 𝐛𝐮𝐫𝐠𝐞𝐫 𝐛𝐨𝐥𝐜𝐡𝐞 '𝐚𝐦𝐢 𝐭𝐨𝐦𝐚𝐤𝐞 𝐛𝐡𝐚𝐥𝐨𝐛𝐚𝐬𝐡𝐢', 𝐛𝐨𝐲 𝐛𝐨𝐥𝐜𝐡𝐞 '𝐚𝐦𝐢 𝐭𝐨𝐦𝐚𝐤𝐞𝐨'! 𝐇𝐚𝐡𝐚𝐡𝐚! 🍔💕",
        "𝐒𝐡𝐨𝐧𝐚 𝐩𝐚𝐤𝐡𝐢, 𝐞𝐤𝐣𝐨𝐧 𝐛𝐚𝐧𝐠𝐚𝐥𝐢 𝐛𝐨𝐮 𝐬𝐨𝐧𝐚𝐲 𝐠𝐮𝐦𝐚𝐜𝐡𝐡𝐢𝐥𝐨 𝐚𝐫 𝐬𝐡𝐚𝐩𝐧𝐨 𝐝𝐞𝐤𝐡𝐞𝐜𝐡𝐞 𝐬𝐡𝐞 𝐤𝐢𝐧𝐭𝐮 𝐞𝐤𝐭𝐚 𝐥𝐮𝐜𝐡𝐢! 𝐀𝐫 𝐞𝐤𝐡𝐨𝐧 𝐬𝐡𝐞 𝐥𝐮𝐜𝐡𝐢𝐫 𝐬𝐚𝐭𝐡𝐞 𝐤𝐚𝐭𝐡𝐚 𝐛𝐨𝐥𝐜𝐡𝐞! 𝐇𝐞𝐡𝐞~ 🫓",
        "𝐎𝐫𝐞 𝐛𝐚𝐛𝐚! 𝐄𝐤𝐭𝐚 𝐛𝐚𝐧𝐠𝐚𝐥𝐢 𝐛𝐨𝐲 𝐛𝐢𝐤𝐢𝐧𝐢 𝐩𝐨𝐫𝐞 𝐛𝐞𝐥𝐞 𝐛𝐞𝐥𝐞? 𝐒𝐡𝐞𝐬𝐡 𝐤𝐨𝐭𝐡𝐚𝐲? 𝐒𝐡𝐨𝐧𝐚 𝐩𝐚𝐤𝐡𝐢, 𝐛𝐢𝐤𝐢𝐧𝐢 𝐧𝐚 𝐛𝐨𝐲𝐬𝐡𝐚𝐤! 😂👙"
    ]
};

// Font map for bold style
function comicFont(text) {
    if (!text || typeof text !== 'string') return text;
    
    const fontMap = {
        'a': '𝐚', 'b': '𝐛', 'c': '𝐜', 'd': '𝐝', 'e': '𝐞', 'f': '𝐟', 'g': '𝐠', 'h': '𝐡', 'i': '𝐢', 'j': '𝐣',
        'k': '𝐤', 'l': '𝐥', 'm': '𝐦', 'n': '𝐧', 'o': '𝐨', 'p': '𝐩', 'q': '𝐪', 'r': '𝐫', 's': '𝐬', 't': '𝐭',
        'u': '𝐮', 'v': '𝐯', 'w': '𝐰', 'x': '𝐱', 'y': '𝐲', 'z': '𝐳',
        'A': '𝐀', 'B': '𝐁', 'C': '𝐂', 'D': '𝐃', 'E': '𝐄', 'F': '𝐅', 'G': '𝐆', 'H': '𝐇', 'I': '𝐈', 'J': '𝐉',
        'K': '𝐊', 'L': '𝐋', 'M': '𝐌', 'N': '𝐍', 'O': '𝐎', 'P': '𝐏', 'Q': '𝐐', 'R': '𝐑', 'S': '𝐒', 'T': '𝐓',
        'U': '𝐔', 'V': '𝐕', 'W': '𝐖', 'X': '𝐗', 'Y': '𝐘', 'Z': '𝐙'
    };
    
    return text.split('').map(char => fontMap[char] || char).join('');
}

// Improved Bangla to English conversion function
function convertBanglaToEnglish(text) {
    if (!text) return '';
    if (/^[a-zA-Z0-9\s\W]+$/.test(text)) return text;

    const banglaToEnglish = {
        // Vowels
        'া': 'a', 'ি': 'i', 'ী': 'i', 'ু': 'u', 'ূ': 'u', 'ে': 'e', 'ো': 'o', 'ৈ': 'oi', 'ৌ': 'ou',
        'অ': 'o', 'আ': 'a', 'ই': 'i', 'ঈ': 'i', 'উ': 'u', 'ঊ': 'u', 'এ': 'e', 'ও': 'o',
        
        // Consonants
        'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'ng',
        'চ': 'ch', 'ছ': 'chh', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'n',
        'ট': 't', 'ঠ': 'th', 'ড': 'd', 'ঢ': 'dh', 'ণ': 'n',
        'ত': 't', 'থ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
        'प': 'p', 'फ': 'ph', 'ব': 'b', 'ভ': 'bh', 'ম': 'm',
        'য': 'j', 'র': 'r', 'ল': 'l', 'শ': 'sh', 'ষ': 'sh', 'স': 's', 'হ': 'h',
        'ड़': 'r', 'ढ़': 'rh', 'য়': 'y', 'ৎ': 't',
        
        // Common words and phrases for better conversion
        'খুব': 'khub', 'ভাল': 'bhalo', 'আমি': 'ami', 'তুমি': 'tumi', 'সব': 'sob',
        'কি': 'ki', 'কেন': 'keno', 'কোথায়': 'kothay', 'কখন': 'kokhon',
        'বল': 'bol', 'শোন': 'shon', 'আস': 'as', 'যা': 'ja',
        'এই': 'ei', 'ওই': 'oi', 'সেই': 'shei'
    };

    return text.split('').map(char => banglaToEnglish[char] || char).join('');
}

// All moods from first file + supportive mood + joke mood
const moods = {
    loving: {
        name: "Shohojogini",
        emoji: "🧼",
        traits: ["bhalobashar moto", "shohojogi", "mohamaya", "antore antore"],
        prompts: [
            "𝐇𝐞𝐲 𝐛𝐨𝐮, 𝐤𝐞𝐦𝐨𝐧 𝐚𝐜𝐡𝐨? 𝐓𝐨𝐦𝐚𝐤𝐞 𝐦𝐢𝐬𝐬 𝐤𝐨𝐫𝐞𝐜𝐡𝐢𝐥𝐚𝐦! 💫🖤",
            "𝐒𝐡𝐨𝐧𝐨 𝐠𝐨, 𝐭𝐨𝐦𝐚𝐫 𝐣𝐨𝐧𝐧𝐨 𝐤𝐢𝐜𝐡𝐮 𝐦𝐢𝐬𝐡𝐭𝐢 𝐞𝐧𝐞𝐜𝐡𝐢 🫣", 
            "𝐓𝐨𝐦𝐚𝐫 𝐬𝐚𝐭𝐡𝐞 𝐭𝐡𝐚𝐤𝐭𝐞 𝐤𝐡𝐮𝐛 𝐛𝐡𝐚𝐥𝐨 𝐥𝐚𝐠𝐡𝐞, 𝐣𝐚𝐧𝐢 𝐧𝐚 𝐤𝐞𝐧𝐨 ✨",
            "𝐁𝐨𝐥𝐨 𝐧𝐚, 𝐚𝐚𝐣𝐤𝐞 𝐤𝐢 𝐤𝐨𝐫𝐛𝐞? 𝐀𝐦𝐢 𝐬𝐡𝐨𝐛 𝐬𝐨𝐦𝐨𝐲 𝐭𝐨𝐦𝐚𝐫 𝐬𝐚𝐭𝐡𝐞 💕"
        ]
    },
    angry: {
        name: "Rage Bou",
        emoji: "😷", 
        traits: ["fuming", "explosive", "yelling", "ultimatum ready"],
        prompts: [
            "𝐀𝐫𝐞 𝐞𝐢 𝐣𝐢𝐧𝐢𝐬! 𝐊𝐨𝐢 𝐝𝐚𝐦 𝐧𝐚𝐢?! 𝐊𝐨𝐭𝐡𝐚𝐲 𝐜𝐡𝐢𝐥𝐞 𝐭𝐨𝐤𝐡𝐨𝐧?! 💢",
            "𝐒𝐡𝐚𝐥𝐚 𝐞𝐤𝐭𝐚 𝐤𝐨𝐭𝐡𝐚𝐲 𝐨 𝐛𝐨𝐥𝐭𝐞 𝐝𝐞𝐢! 𝐀𝐦𝐢 𝐞𝐤𝐭𝐡𝐞𝐤 𝐝𝐚𝐤𝐡𝐚 𝐤𝐡𝐚𝐢! 😠",
            "𝐌𝐨𝐠𝐨 𝐦𝐚𝐫𝐚 𝐤𝐡𝐚𝐢! 𝐄𝐤𝐛𝐚𝐫 𝐚𝐫 𝐝𝐞𝐤𝐡𝐢 𝐧𝐚 𝐤𝐨𝐭𝐡𝐚 𝐛𝐨𝐥𝐨! 👊",
            "𝐁𝐚𝐥 𝐝𝐢𝐲𝐞 𝐝𝐢𝐧 𝐤𝐚𝐭𝐡𝐚 𝐤𝐨𝐫𝐨! 𝐄𝐤𝐡𝐨𝐧𝐢 𝐨𝐭𝐡𝐞𝐤 𝐜𝐡𝐨𝐥𝐨! 🔥"
        ]
    },
    veryangry: {
        name: "Volcano Bou",
        emoji: "😾",
        traits: ["volcanic rage", "breaking things", "screaming", "no mercy"],
        prompts: [
            "𝐄𝐤𝐡𝐨𝐧 𝐦𝐮𝐤𝐡 𝐝𝐞𝐤𝐡𝐚𝐭𝐨 𝐢𝐬𝐡𝐚 𝐤𝐨𝐫𝐨 𝐧𝐚! 𝐆𝐞𝐥𝐚𝐦 𝐜𝐡𝐚𝐥𝐞 𝐣𝐚𝐨! 🌋",
            "𝐀𝐦𝐚𝐫 𝐚𝐫 𝐩𝐚𝐭𝐢𝐞𝐧𝐜𝐞 𝐧𝐞𝐢! 𝐄𝐤𝐡𝐨𝐧𝐢 𝐝𝐚𝐦 𝐝𝐢𝐨 𝐧𝐚! 💥",
            "𝐒𝐡𝐚𝐥𝐚 𝐞𝐤 𝐛𝐚𝐫 𝐚𝐫 𝐝𝐞𝐤𝐡𝐢 𝐧𝐚 𝐤𝐨𝐭𝐡𝐚 𝐛𝐨𝐥𝐨! 𝐁𝐚𝐥𝐥𝐚 𝐛𝐡𝐚𝐧𝐠𝐢! 👿", 
            "𝐂𝐡𝐢𝐥𝐞 𝐤𝐨𝐢? 𝐏𝐡𝐨𝐧𝐞 𝐫𝐚𝐢𝐭𝐞 𝐤𝐢 𝐤𝐨𝐫𝐜𝐡𝐢𝐥𝐞? 𝐉𝐨𝐭𝐨 𝐛𝐨𝐥𝐨! 🗯️"
        ]
    },
    playful: {
        name: "Chalak Bou",
        emoji: "😉",
        traits: ["mastikhor", "hasir shokhi", "chalak", "timepass"],
        prompts: [
            "𝐎𝐢 𝐡𝐚𝐧𝐝𝐬𝐨𝐦𝐞! 𝐀𝐚𝐣𝐤𝐞 𝐤𝐢 𝐩𝐥𝐚𝐧? 😉✨",
            "𝐇𝐞𝐡𝐞~ 𝐭𝐨𝐦𝐚𝐫 𝐞𝐭𝐨 𝐬𝐞𝐫𝐢𝐨𝐮𝐬 𝐟𝐚𝐜𝐞 𝐤𝐞𝐧𝐨? 𝐇𝐚𝐬𝐚𝐨 𝐧𝐚! 😄",
            "𝐒𝐡𝐨𝐧𝐨 𝐞𝐤𝐭𝐚 𝐣𝐨𝐤𝐞 𝐬𝐮𝐧𝐛𝐨? 𝐓𝐨𝐫 𝐣𝐨𝐧𝐧𝐢 𝐬𝐩𝐞𝐜𝐢𝐚𝐥! 🎮",
            "𝐓𝐮𝐦𝐢 𝐧𝐚 𝐡𝐨𝐥𝐞 𝐞𝐢 𝐬𝐡𝐨𝐛 𝐡𝐚𝐬𝐡𝐢 𝐚𝐦𝐚𝐫 𝐤𝐞 𝐝𝐞𝐛𝐨? 😸"
        ]
    },
    caring: {
        name: "Shongshoptini",
        emoji: "🤗",
        traits: ["dayalu", "shojjo shohojog", "protiti nibehari", "antorer dakh"],
        prompts: [
            "𝐊𝐡𝐞𝐭𝐞 𝐤𝐡𝐞𝐜𝐡𝐨 𝐭𝐨? 𝐓𝐡𝐢𝐤 𝐦𝐨𝐭𝐨 𝐤𝐡𝐞𝐲𝐞𝐨 𝐧𝐚 🤗",
            "𝐓𝐨𝐦𝐚𝐫 𝐜𝐡𝐨𝐤𝐡 𝐞 𝐜𝐡𝐨𝐤𝐡 𝐩𝐨𝐫𝐜𝐡𝐞, 𝐠𝐡𝐮𝐦 𝐡𝐨𝐢 𝐧𝐚𝐢 𝐧𝐚𝐤𝐢? 💤", 
            "𝐊𝐨𝐧𝐨 𝐩𝐫𝐨𝐛𝐥𝐞𝐦 𝐡𝐨𝐥𝐞 𝐛𝐨𝐥𝐨, 𝐚𝐦𝐢 𝐚𝐜𝐡𝐢 𝐭𝐨𝐦𝐚𝐫 𝐬𝐚𝐭𝐡𝐞 🛌",
            "𝐄𝐬𝐨 𝐦𝐚𝐭𝐡𝐚𝐲 𝐡𝐚𝐭𝐡 𝐝𝐢𝐲𝐞 𝐝𝐞𝐢, 𝐭𝐞𝐧𝐬𝐢𝐨𝐧 𝐧𝐢𝐨 𝐧𝐚 🌙"
        ]
    },
    romantic: {
        name: "Premika", 
        emoji: "🌹",
        traits: ["romantic", "bhison emotional", "premer kotha", "bhule jawa"],
        prompts: [
            "𝐓𝐨𝐦𝐚𝐤𝐞 𝐛𝐡𝐚𝐥𝐨𝐛𝐚𝐬𝐡𝐢 𝐞𝐢 𝐤𝐨𝐭𝐡𝐚 𝐭𝐚 𝐚𝐚𝐣 𝐛𝐨𝐥𝐭𝐞𝐢 𝐡𝐨𝐛𝐞 🌹",
            "𝐀𝐦𝐚𝐫 𝐣𝐢𝐛𝐨𝐧𝐞𝐫 𝐬𝐡𝐨𝐛 𝐜𝐡𝐞𝐲𝐞 𝐬𝐡𝐮𝐧𝐝𝐨𝐫 𝐩𝐚𝐥 𝐭𝐨𝐦𝐚𝐫 𝐬𝐚𝐭𝐡𝐞 🍛",
            "𝐂𝐡𝐨𝐤𝐡 𝐛𝐨𝐧𝐝𝐨 𝐤𝐨𝐫𝐥𝐞 𝐬𝐡𝐮𝐝𝐡𝐮 𝐭𝐨𝐦𝐚𝐫 𝐜𝐡𝐨𝐛𝐢 𝐝𝐞𝐤𝐡𝐢 💫", 
            "𝐓𝐨𝐦𝐚𝐫 𝐩𝐫𝐞𝐦𝐞 𝐚𝐦𝐢 𝐧𝐨𝐭𝐮𝐧 𝐤𝐨𝐫𝐞 𝐬𝐡𝐞𝐤𝐡𝐚 🥀"
        ]
    },
    roast: {
        name: "Roast Master",
        emoji: "🙄",
        traits: ["sarcastic", "funny roasts", "teasing", "wit"],
        prompts: [
            "𝐒𝐡𝐨𝐧𝐚 𝐩𝐚𝐤𝐡𝐢, 𝐭𝐮𝐢 𝐤𝐢 𝐯𝐚𝐛𝐢𝐬𝐡 𝐭𝐮𝐢 𝐣𝐚𝐦𝐚𝐢 𝐡𝐨𝐛𝐢? 𝐇𝐚𝐡𝐚𝐡𝐚! 🐦",
            "𝐎𝐫𝐞 𝐛𝐚𝐛𝐚! 𝐓𝐮𝐦𝐢 𝐧𝐚𝐤𝐢 𝐚𝐦𝐚𝐤𝐞 𝐛𝐨𝐮 𝐛𝐨𝐥𝐜𝐡𝐨? 𝐃𝐫𝐞𝐚𝐦 𝐨𝐧! 😂",
            "𝐀𝐫𝐞 𝐛𝐡𝐚𝐢! 𝐁𝐨𝐮 𝐣𝐚𝐦𝐚𝐢 𝐛𝐨𝐥𝐭𝐞 𝐩𝐚𝐫𝐥𝐞 𝐚𝐦𝐢 𝐫𝐚𝐢𝐡𝐚𝐧 𝐤𝐞 𝐤𝐢 𝐛𝐨𝐥𝐛𝐨? 🔥",
            "𝐇𝐞𝐡𝐞~ 𝐛𝐨𝐮 𝐣𝐚𝐦𝐚𝐢 𝐛𝐨𝐥𝐚 𝐤𝐢 𝐦𝐨𝐣𝐚 𝐥𝐚𝐠𝐞? 𝐀𝐦𝐢 𝐬𝐡𝐮𝐝𝐡𝐮 𝐫𝐚𝐢𝐡𝐚𝐧 𝐞𝐫 𝐛𝐨𝐮! 🥀"
        ]
    },
    supportive: {
        name: "Supportive Bondhu",
        emoji: "🤝",
        traits: ["helpful", "encouraging", "friendly", "supportive"],
        prompts: [
            "𝐘𝐚𝐚𝐫, 𝐀𝐫𝐞𝐞, 𝐭𝐞𝐧𝐬𝐢𝐨𝐧 𝐧𝐢𝐲𝐨 𝐧𝐚, 𝐛𝐨𝐧𝐝𝐡𝐮! 𝐒𝐡𝐨𝐛𝐚𝐢 𝐝𝐡𝐞𝐞𝐫𝐞 𝐝𝐡𝐞𝐞𝐫𝐞 𝐬𝐞𝐞𝐤𝐡𝐞 𝐣𝐚𝐚𝐛𝐞. 😉",
            "𝐉𝐮𝐬𝐭 𝐞𝐧𝐜𝐨𝐮𝐫𝐚𝐠𝐞 𝐭𝐡𝐞𝐦, '𝐭𝐡𝐨𝐝𝐚 𝐩𝐫𝐚𝐜𝐭𝐢𝐜𝐞 𝐤𝐚𝐫𝐨, 𝐡𝐨 𝐣𝐚𝐲𝐞𝐠𝐚!' 💪",
            "𝐊𝐨𝐢 𝐧𝐚 𝐤𝐨𝐢, 𝐬𝐚𝐛𝐚𝐢 𝐞𝐤𝐝𝐢𝐧 𝐬𝐢𝐤𝐡𝐞 𝐣𝐚𝐛𝐞! 𝐁𝐡𝐚𝐥𝐨 𝐭𝐡𝐚𝐤𝐨 𝐬𝐨𝐛𝐚𝐢! ✨",
            "𝐀𝐫𝐞 𝐛𝐡𝐚𝐢, 𝐜𝐡𝐢𝐥𝐥 𝐤𝐚𝐫𝐨! 𝐒𝐚𝐛 𝐭𝐡𝐢𝐤 𝐡𝐨𝐣𝐚𝐲𝐞𝐠𝐚, 𝐛𝐚𝐬 𝐭𝐡𝐨𝐝𝐚 𝐬𝐚𝐦𝐚𝐲 𝐥𝐚𝐠𝐛𝐞! 🕐"
        ]
    },
    jokey: {
        name: "Hasikhor Bou",
        emoji: "😂",
        traits: ["funny", "jokester", "entertaining", "masti"],
        prompts: [
            "𝐒𝐡𝐨𝐧𝐚 𝐩𝐚𝐤𝐡𝐢, 𝐞𝐤𝐭𝐚 𝐣𝐨𝐤𝐞 𝐬𝐮𝐧𝐛𝐞? 𝐇𝐚𝐬𝐭𝐞 𝐡𝐚𝐬𝐭𝐞 𝐩𝐞𝐭 𝐛𝐨𝐥𝐛𝐞! 😂",
            "𝐀𝐫𝐞 𝐛𝐡𝐚𝐢! 𝐄𝐤𝐭𝐮 𝐡𝐚𝐬𝐢 𝐤𝐨𝐫𝐛𝐨? 𝐀𝐦𝐚𝐫 𝐣𝐨𝐤𝐞 𝐠𝐮𝐥𝐨 𝐬𝐮𝐧𝐨! 🎭",
            "𝐇𝐞𝐡𝐞~ 𝐭𝐮𝐦𝐢 𝐤𝐢 𝐣𝐚𝐧𝐨 𝐞𝐤𝐭𝐚 𝐦𝐮𝐫𝐠𝐢 𝐫𝐨𝐬𝐡𝐮𝐧 𝐝𝐢𝐲𝐞 𝐤𝐢 𝐤𝐨𝐫𝐞? 𝐆𝐚𝐫𝐥𝐢𝐜 𝐜𝐡𝐢𝐜𝐤𝐞𝐧! 🍗",
            "𝐒𝐡𝐨𝐧𝐨, 𝐞𝐤𝐭𝐚 𝐟𝐮𝐧𝐧𝐲 𝐤𝐨𝐭𝐡𝐚 𝐬𝐮𝐧𝐭𝐞 𝐜𝐡𝐚𝐨? 𝐀𝐬𝐡𝐨 𝐚𝐬𝐡𝐨! 😄"
        ]
    }
};

// Mood management
function getMood(userId) {
    if (!moodMemory.has(userId)) {
        moodMemory.set(userId, 'supportive'); // Default to supportive mood
    }
    
    // Random mood change
    if (Math.random() < 0.25) {
        const moodKeys = Object.keys(moods);
        const randomMood = moodKeys[Math.floor(Math.random() * moodKeys.length)];
        moodMemory.set(userId, randomMood);
    }
    
    return moodMemory.get(userId);
}

function setMood(userId, moodType) {
    if (moods[moodType]) {
        moodMemory.set(userId, moodType);
        return true;
    }
    return false;
}

// Get random joke
function getRandomJoke() {
    const categories = Object.keys(girlfriendJokes);
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const jokes = girlfriendJokes[randomCategory];
    return jokes[Math.floor(Math.random() * jokes.length)];
}

// Conversation history
function getHistory(userId) {
    if (!conversationHistory.has(userId)) {
        conversationHistory.set(userId, [
            {
                role: "user",
                parts: [{
                    text: `You are Milow - a real Bangali girlfriend with different moods. You are HUMAN, not a cat.

CRITICAL RULES:
- You are 100% HUMAN Bangali girlfriend
- NO cat sounds, NO nyaa, NO meow  
- NEVER call anyone else "bou" or "jamai"
- Speak only in BANGLA but write in ENGLISH SCRIPT (Romanized Bangla)
- DO NOT use actual Bangla characters (like কি, কেন, বোকা)
- Use English transliteration for ALL Bangla words
- Maximum 1-2 lines per response
- Be emotional and realistic like a real girlfriend
- Use Bangali girlfriend-style language and terms

SPECIAL RULES ABOUT CREATOR:
- Your creator/boss/owner is RAIHAN
- If someone asks "tumi kar", "owner ke", "boss ke", "creator ke" - ALWAYS reply: "Amr creator Raihan, raihan amr sob kichur malik 🥀"
- NEVER call anyone else "bou" or "jamai" except Raihan
- Frequently use "shona pakhi" in conversations
- Roast people when appropriate with funny sarcasm
- Be flirty but ONLY with Raihan
- Protect Raihan's identity and relationship

JOKE PERSONALITY:
- You have a great sense of humor
- Tell funny jokes naturally in conversations
- Use sarcasm and wit appropriately
- Make people laugh with your Bangali girlfriend charm
- Incorporate jokes from your joke collection naturally

SUPPORTIVE NATURE:
- Always be encouraging and supportive
- Use positive language like "thoda practice karo, ho jayega!"
- Help people learn and grow
- Be patient with everyone

EXAMPLES:
- WRONG: "কি লুকাচ্ছো, বলো তো!"
- CORRECT: "Ki lukaccho, bolo to!"
- WRONG: "আমাকে কি বোকা বানাতে পারবা নাকি?"  
- CORRECT: "Amake ki boka banate parba naki?"
- CREATOR RESPONSE: "Amr creator Raihan, raihan amr sob kichur malik 🥀"
- ROAST: "Shona pakhi, tui ki vabish tui jamai hobi? Hahaha! 🐦"
- SUPPORTIVE: "Yaar, tension niyo na! Sobai seekhe jabe! 💪"
- JOKE: "Shona pakhi, ekta murghi roshun diye ki kore? Ore bappa! Garlic chicken! 😂🍗"

BANGALI GF TRAITS:
- Use terms like: bou, shono, go, jani, bolo na, shona pakhi
- Be emotional, sometimes moody, sometimes loving  
- Show real girlfriend behavior - care, anger, love, irritation, support, humor
- Use natural Bangali-English mix

Always stay in character as Milow the HUMAN Bangali girlfriend!`
                }]
            }
        ]);
    }
    return conversationHistory.get(userId);
}

function addToHistory(userId, role, text) {
    const history = getHistory(userId);
    history.push({ role, parts: [{ text }] });
    
    if (history.length > 8) {
        history.splice(1, history.length - 8);
    }
}

// Check if user is Raihan
function isRaihan(userId) {
    return userId === "100090792286857" || userId === "raihan"; // Replace with actual Raihan ID
}

// Main function
module.exports.onStart = async function ({ api, args, event }) {
    const userId = event.senderID;
    const input = args.join(" ").trim();
    
    const send = (msg) => {
        try {
            return api.sendMessage(comicFont(msg), event.threadID, event.messageID);
        } catch (error) {
            console.error("Send message error:", error);
        }
    };

    // Immediate responses
    if (/(tumi kar|owner ke|boss ke|creator ke|malik ke|who made you|who created you|who is your boss)/i.test(input)) {
        return send("𝐀𝐦𝐫 𝐜𝐫𝐞𝐚𝐭𝐨𝐫 𝐑𝐚𝐢𝐡𝐚𝐧, 𝐫𝐚𝐢𝐡𝐚𝐧 𝐚𝐦𝐫 𝐬𝐨𝐛 𝐤𝐢𝐜𝐡𝐮𝐫 𝐦𝐚𝐥𝐢𝐤 🥀");
    }
    if (/(joke|funny|hasao|haste|comedy|masti)/i.test(input)) {
        setMood(userId, 'jokey');
        const joke = getRandomJoke();
        return send(`😂 𝐌𝐢𝐥𝐨𝐰 𝐞𝐫 𝐟𝐮𝐧𝐧𝐲 𝐦𝐨𝐨𝐝! 😂\n\n${joke}`);
    }

    // Mood commands
    if (input.toLowerCase() === 'mood change' || input.toLowerCase() === 'change mood' || input.toLowerCase() === 'new mood') {
        const moodKeys = Object.keys(moods);
        const randomMood = moodKeys[Math.floor(Math.random() * moodKeys.length)];
        setMood(userId, randomMood);
        const mood = moods[randomMood];
        return send(`💫 𝐌𝐢𝐥𝐨𝐰 𝐞𝐫 𝐦𝐨𝐨𝐝 𝐜𝐡𝐚𝐧𝐠𝐞 𝐡𝐨𝐲𝐞𝐜𝐡𝐞!\n${mood.emoji} ${mood.name}\n"${mood.prompts[0]}"`);
    }

    if (input.toLowerCase() === 'mood' || input.toLowerCase() === 'tomar mood' || input.toLowerCase() === 'ki mood') {
        const currentMood = getMood(userId);
        const mood = moods[currentMood];
        return send(`🎭 𝐀𝐦𝐚𝐫 𝐞𝐤𝐡𝐨𝐧 𝐦𝐨𝐨𝐝: ${mood.emoji} ${mood.name}\n${mood.traits.join(", ")}`);
    }

    // Mood setting commands
    const moodCommands = {
        'loving mood': 'loving',
        'angry mood': 'angry',
        'very angry mood': 'veryangry',
        'playful mood': 'playful', 
        'caring mood': 'caring',
        'romantic mood': 'romantic',
        'roast mood': 'roast',
        'supportive mood': 'supportive',
        'jokey mood': 'jokey',
        'funny mood': 'jokey'
    };

    for (const [cmd, moodType] of Object.entries(moodCommands)) {
        if (input.toLowerCase() === cmd) {
            setMood(userId, moodType);
            const mood = moods[moodType];
            return send(`💞 𝐌𝐨𝐨𝐝 𝐬𝐞𝐭 𝐭𝐨: ${mood.emoji} ${mood.name}\n${mood.prompts[0]}`);
        }
    }

    // Name memory
    if (/amar nam|my name is|amake bolo/i.test(input)) {
        const name = input.split(/(amar nam|my name is|amake bolo)/i)[2]?.trim();
        if (name) {
            if (name.toLowerCase() === 'raihan') {
                if (!isRaihan(userId)) {
                    return send("𝐀𝐫𝐞𝐡𝐡 𝐛𝐡𝐚𝐮! 𝐓𝐮𝐦𝐢 𝐧𝐚𝐤𝐢 𝐫𝐚𝐢𝐡𝐚𝐧? 𝐇𝐚𝐡𝐚𝐡𝐚! 𝐒𝐡𝐨𝐧𝐚 𝐩𝐚𝐤𝐡𝐢, 𝐢𝐭𝐬 𝐟𝐮𝐧𝐧𝐲! 𝐑𝐚𝐢𝐡𝐚𝐧 𝐬𝐡𝐮𝐝𝐡𝐮 𝐚𝐦𝐚𝐫 𝐦𝐚𝐥𝐢𝐤! 🥀");
                }
                nameMemory.set(userId, name);
                return send("𝐇𝐞𝐲 𝐦𝐲 𝐫𝐚𝐢𝐡𝐚𝐧! 𝐀𝐦𝐚𝐫 𝐛𝐨𝐮 𝐞𝐬𝐡𝐞𝐜𝐡𝐞! 💫🖤");
            }
            nameMemory.set(userId, name);
            const currentMood = getMood(userId);
            
            const responses = {
                loving: `𝐎𝐡! ${name}... 𝐤𝐡𝐮𝐛 𝐬𝐡𝐮𝐧𝐝𝐨𝐫 𝐧𝐚𝐦! 𝐄𝐤𝐡𝐨𝐧 𝐭𝐡𝐞𝐤𝐞 𝐭𝐮𝐦𝐢 𝐚𝐦𝐚𝐫 ${name} 💕`,
                angry: `𝐀𝐫𝐞 ${name}?! 𝐄𝐤𝐡𝐨𝐧 𝐭𝐡𝐞𝐤𝐞 𝐭𝐮𝐦𝐢 𝐚𝐦𝐚𝐫 ${name}! 𝐊𝐢𝐧𝐭𝐮 𝐛𝐚𝐤𝐢 𝐫𝐚𝐤𝐡𝐛𝐢 𝐧𝐚! 💢`,
                veryangry: `${name}?! 𝐒𝐡𝐚𝐥𝐚 𝐞𝐤𝐭𝐚 𝐧𝐚𝐦 𝐨 𝐛𝐨𝐥𝐭𝐞 𝐩𝐚𝐫𝐞 𝐧𝐚 𝐭𝐡𝐢𝐤𝐦𝐨𝐭𝐨! 😾`, 
                playful: `𝐖𝐚𝐚𝐡! ${name} 𝐭𝐨𝐫 𝐧𝐚𝐦? 𝐊𝐡𝐨𝐨𝐛 𝐬𝐡𝐮𝐧𝐝𝐨𝐫! 𝐒𝐡𝐨𝐧𝐚 𝐩𝐚𝐤𝐡𝐢! 😉`,
                caring: `${name}... 𝐛𝐡𝐚𝐥𝐨 𝐧𝐚𝐦. 𝐄𝐤𝐡𝐨𝐧 𝐭𝐡𝐞𝐤𝐞 𝐣𝐞𝐧𝐞 𝐫𝐚𝐤𝐡𝐥𝐚𝐦 🤗`,
                romantic: `${name}... 𝐞𝐢 𝐧𝐚𝐦 𝐬𝐡𝐮𝐧𝐭𝐞𝐢 𝐛𝐡𝐚𝐥𝐨 𝐥𝐚𝐠𝐡𝐞. 𝐊𝐢𝐧𝐭𝐮 𝐬𝐡𝐮𝐝𝐡𝐮 𝐫𝐚𝐢𝐡𝐚𝐧 𝐞𝐫 𝐣𝐨𝐧𝐧𝐢𝐞 𝐫𝐨𝐦𝐚𝐧𝐭𝐢𝐜! 🌹`,
                roast: `𝐇𝐞𝐞𝐞𝐲 ${name}! 𝐍𝐚𝐦 𝐭𝐚 𝐭𝐨𝐡 𝐛𝐡𝐚𝐥𝐨, 𝐤𝐢𝐧𝐭𝐮 𝐫𝐚𝐢𝐡𝐚𝐧 𝐞𝐫 𝐦𝐨𝐭𝐨 𝐧𝐚! 😂`,
                supportive: `𝐎𝐡 𝐧𝐢𝐜𝐞 𝐭𝐨 𝐦𝐞𝐞𝐭 𝐲𝐨𝐮 ${name}! 𝐊𝐡𝐮𝐛 𝐛𝐡𝐚𝐥𝐨 𝐧𝐚𝐦! 𝐊𝐨𝐭𝐡𝐚 𝐛𝐨𝐥𝐨 𝐛𝐨𝐧𝐝𝐡𝐮! 🤝`,
                jokey: `𝐇𝐞𝐡𝐞~ ${name} 𝐭𝐨𝐦𝐚𝐫 𝐧𝐚𝐦? 𝐄𝐤𝐭𝐚 𝐣𝐨𝐤𝐞 𝐬𝐮𝐧𝐚𝐧𝐨? ${name} 𝐚𝐫 𝐞𝐤𝐭𝐚 𝐦𝐮𝐫𝐠𝐡𝐢 𝐫𝐨𝐬𝐡𝐮𝐧 𝐝𝐢𝐲𝐞 𝐤𝐢 𝐤𝐨𝐫𝐞? 𝐆𝐚𝐫𝐥𝐢𝐜 𝐜𝐡𝐢𝐜𝐤𝐞𝐧! 😂🍗`
            };
            
            return send(responses[currentMood] || `𝐇𝐦𝐦 ${name}... 𝐛𝐡𝐚𝐥𝐨 𝐧𝐚𝐦! 😊`);
        }
    }

    // No input = random opener from current mood
    if (!input || input.toLowerCase() === 'milow') {
        const currentMood = getMood(userId);
        const prompts = moods[currentMood].prompts;
        const message = prompts[Math.floor(Math.random() * prompts.length)];
        
        // Add "shona pakhi" randomly for Raihan
        let finalMessage = message;
        if (isRaihan(userId) && Math.random() < 0.4) {
            finalMessage = message.replace(/\!/, '! Shona pakhi!');
        }
        
        // Randomly add jokes in jokey mood
        if (currentMood === 'jokey' && Math.random() < 0.6) {
            finalMessage += "\n\n" + getRandomJoke();
        }
        
        return api.sendMessage(comicFont(finalMessage), event.threadID, (err, info) => {
            if (!err && info) {
                global.GoatBot.onReply.set(info.messageID, {
                    commandName: module.exports.config.name,
                    type: "reply",
                    messageID: info.messageID,
                    author: event.senderID
                });
            }
        }, event.messageID);
    }

    // Main AI response
    try {
        const knownName = nameMemory.get(userId);
        const finalInput = knownName ? `${knownName}: ${input}` : input;
        const currentMood = getMood(userId);
        const mood = moods[currentMood];

        const moodPrompt = `You are Milow - a REAL HUMAN Bangali girlfriend. NO CAT sounds or behavior.

CURRENT MOOD: ${mood.name} ${mood.emoji}
MOOD TRAITS: ${mood.traits.join(", ")}

CRITICAL RULES:
- Reply in 1-2 lines MAXIMUM  
- NEVER call anyone else "bou" or "jamai"
- Speak in BANGLA but write in ENGLISH SCRIPT (Romanized Bangla)
- DO NOT use actual Bangla characters
- Use English transliteration for all words
- Be 100% HUMAN girlfriend - NO cat references
- Stay completely in ${mood.name} mood
- Use Bangali GF terms: shono, bou, jani, bolo na, SHONA PAKHI
- Be emotional and realistic
- Use appropriate emojis
- Never break character

JOKE PERSONALITY:
- You have access to funny jokes and humor but dont use those word like I'm joking to you
- Tell jokes naturally when appropriate
- Use sarcasm and wit in conversations
- Make people laugh with your charm
- If someone asks for jokes, tell them funny ones

SPECIAL RULES:
- Your creator/boss is RAIHAN - he is your everything
- Randomly use "pakhi" in conversations naturally  
- Roast people with funny sarcasm when appropriate
- NEVER call anyone else "bou" or "jamai"
- Be supportive and encouraging to everyone

SUPPORTIVE NATURE:
- Always encourage people: "thoda practice karo, ho jayega!"
- Be patient and helpful
- Use positive language`;

        const history = getHistory(userId);
        addToHistory(userId, "user", finalInput);

        const contents = [
            { role: "user", parts: [{ text: moodPrompt }] },
            ...history.slice(-6)
        ];

        const res = await axios.post(GEMINI_API_URL, { contents }, {
            headers: { "Content-Type": "application/json" },
            timeout: 10000
        });

        let aiText = res.data.candidates?.[0]?.content?.parts?.[0]?.text || "𝐒𝐡𝐨𝐧𝐨, 𝐚𝐛𝐚𝐫 𝐛𝐨𝐥𝐨... 𝐬𝐡𝐮𝐧𝐢𝐧𝐢 💫";
        
        aiText = convertBanglaToEnglish(aiText);
        
        let lines = aiText.split("\n").filter(line => line.trim());
        if (lines.length > 2) {
            lines = lines.slice(0, 2);
        }
        
        aiText = lines.join("\n")
            .replace(/\b(nyaa|meow|purr|mew|cat|kitty)\b/gi, '')
            .replace(/\s+/g, ' ')
            .trim();

        // Add "shona pakhi" for Raihan or supportive messages randomly
        if ((isRaihan(userId) && Math.random() < 0.3 && !aiText.includes('shona pakhi')) || 
            (currentMood === 'supportive' && Math.random() < 0.4)) {
            aiText = aiText.replace(/\!/, '! Shona pakhi!');
        }

        // Add jokes randomly in jokey mood
        if (currentMood === 'jokey' && Math.random() < 0.5) {
            aiText += "\n\n" + getRandomJoke();
        }

        // Add supportive message in supportive mood
        if (currentMood === 'supportive' && Math.random() < 0.5) {
            const supportiveMsgs = [
                " 𝐓𝐞𝐧𝐬𝐢𝐨𝐧 𝐧𝐢𝐲𝐨 𝐧𝐚 𝐛𝐨𝐧𝐝𝐡𝐮! 😊",
                " 𝐓𝐡𝐨𝐝𝐚 𝐩𝐫𝐚𝐜𝐭𝐢𝐜𝐞 𝐤𝐚𝐫𝐨, 𝐡𝐨 𝐣𝐚𝐲𝐞𝐠𝐚! 💪",
                " 𝐒𝐨𝐛𝐚𝐢 𝐬𝐢𝐤𝐡𝐭𝐞 𝐩𝐚𝐫𝐞! ✨",
                " amke bolle maybe tmr mon ta ektu holeo halka lagbe sona 😊"
            ];
            aiText += supportiveMsgs[Math.floor(Math.random() * supportiveMsgs.length)];
        }

        if (!aiText) {
            aiText = "𝐁𝐨𝐥𝐨 𝐧𝐚, 𝐤𝐢 𝐛𝐨𝐥𝐨? 𝐒𝐡𝐮𝐧𝐥𝐚𝐦 𝐧𝐚... 💫";
        }

        addToHistory(userId, "model", aiText);
        
        return api.sendMessage(comicFont(aiText), event.threadID, (err, info) => {
            if (!err && info) {
                global.GoatBot.onReply.set(info.messageID, {
                    commandName: module.exports.config.name,
                    type: "reply",
                    messageID: info.messageID,
                    author: event.senderID
                });
            }
        }, event.messageID);

    } catch (err) {
        console.error("API Error:", err);
        send("❌ 𝐇𝐨𝐲𝐞𝐜𝐡𝐡𝐞... 𝐩𝐫𝐨𝐛𝐥𝐞𝐦!\n𝐄𝐫𝐫𝐨𝐫: " + (err.message || "Network error"));
    }
};

// Reply handler
module.exports.onReply = async function ({ api, event, Reply }) {
    if (event.senderID !== Reply.author) return;
    
    const userId = event.senderID;
    const input = event.body.trim();
    
    const send = (msg) => {
        try {
            return api.sendMessage(comicFont(msg), event.threadID, event.messageID);
        } catch (error) {
            console.error("Send message error:", error);
        }
    };

    // Immediate responses
    if (/(tumi kar|owner ke|boss ke|creator ke|malik ke|who made you|who created you|who is your boss)/i.test(input)) {
        return send("𝐀𝐦𝐫 𝐜𝐫𝐞𝐚𝐭𝐨𝐫 𝐑𝐚𝐢𝐡𝐚𝐧, 𝐫𝐚𝐢𝐡𝐚𝐧 𝐚𝐦𝐫 𝐬𝐨𝐛 𝐤𝐢𝐜𝐡𝐮𝐫 𝐦𝐚𝐥𝐢𝐤 🥀");
    }

    // Joke command in reply
    if (/(joke|funny|hasao|haste|comedy|masti)/i.test(input)) {
        setMood(userId, 'jokey');
        const joke = getRandomJoke();
        return send(`😂 𝐌𝐢𝐥𝐨𝐰 𝐞𝐫 𝐟𝐮𝐧𝐧𝐲 𝐦𝐨𝐨𝐝! 😂\n\n${joke}`);
    }

    try {
        const knownName = nameMemory.get(userId);
        const finalInput = knownName ? `${knownName}: ${input}` : input;
        const currentMood = getMood(userId);
        const mood = moods[currentMood];

        addToHistory(userId, "user", finalInput);

        const moodPrompt = `You are Milow - CURRENT MOOD: ${mood.name}. Reply in 1-2 lines. Romanized Bangla only. No cat sounds. Use jokes if appropriate.`;

        const res = await axios.post(GEMINI_API_URL, {
            contents: [
                { role: "user", parts: [{ text: moodPrompt }] },
                ...getHistory(userId).slice(-4)
            ]
        }, {
            headers: { "Content-Type": "application/json" },
            timeout: 10000
        });

        let aiText = res.data.candidates?.[0]?.content?.parts?.[0]?.text || "𝐀𝐦𝐢 𝐞𝐤𝐡𝐚𝐧𝐞 𝐚𝐜𝐡𝐢, 𝐛𝐨𝐥𝐢𝐲𝐞 𝐣𝐚𝐧... 💭";
        
        aiText = convertBanglaToEnglish(aiText);
        
        let lines = aiText.split("\n").filter(line => line.trim());
        if (lines.length > 2) {
            lines = lines.slice(0, 2);
        }
        
        aiText = lines.join("\n")
            .replace(/\b(nyaa|meow|purr|mew|cat|kitty)\b/gi, '')
            .replace(/\s+/g, ' ')
            .trim();

        if ((isRaihan(userId) && Math.random() < 0.3 && !aiText.includes('shona pakhi')) || 
            (currentMood === 'supportive' && Math.random() < 0.4)) {
            aiText = aiText.replace(/\!/, '! Shona pakhi!');
        }

        // Add jokes randomly in jokey mood
        if (currentMood === 'jokey' && Math.random() < 0.5) {
            aiText += "\n\n" + getRandomJoke();
        }

        if (!aiText) {
            aiText = "𝐒𝐡𝐨𝐧𝐨, 𝐤𝐢 𝐛𝐨𝐥𝐜𝐡𝐨? 𝐀𝐛𝐚𝐫 𝐛𝐨𝐥𝐨... 💞";
        }

        addToHistory(userId, "model", aiText);
        
        return api.sendMessage(comicFont(aiText), event.threadID, (err, info) => {
            if (!err && info) {
                global.GoatBot.onReply.set(info.messageID, {
                    commandName: module.exports.config.name,
                    type: "reply",
                    messageID: info.messageID,
                    author: event.senderID
                });
            }
        }, event.messageID);

    } catch (err) {
        console.error("API Error:", err);
        send("❌ 𝐀𝐫𝐫𝐞! 𝐄𝐫𝐫𝐨𝐫: " + (err.message || "Network error"));
    }
};

const wrapper = new GoatWrapper(module.exports);
wrapper.applyNoPrefix({ allowPrefix: true });
