const axios = require("axios");
const { GoatWrapper } = require("fca-liane-utils");

const GEMINI_API_KEY = "AIzaSyBxRPqUWmQGgleh95j9fM4dRHhWL_dWoLI";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// Owner Configuration
const OWNER_NAME = "Cuty Paridhi";

module.exports.config = {
  name: "cuty",
  version: "2.0.0",
  role: 2,
  author: "Raihan",
  description: "Ultimate roasting AI! Strong Hindi roasts and savage comebacks.",
  usePrefix: true,
  guide: "[message] | just type roast",
  category: "ai",
  aliases: ["paridhi", "harami", "savage", "shale", "hat"]
};

const conversationHistory = new Map();

// Ultimate Roasting Database - Strong Hindi Roasts
const savageRoasts = {
  strong: [
    "Tere dimaag ki dahi bani hui hai kya? Sochne ki capacity zero hai! 🤡",
    "Tujhse accha to mere fridge ka bulb bol leta hai! 🧊",
    "Teri aukaat se bahar hai mere saath debate karna! 📉",
    "Tere jaise logo ko dekh kar lagta hai nature experiment karti hai! 🧪",
    "Teri soch itni limited hai ki calculator bhi shame feel kare! 📱"
  ],
  savage: [
    "Tere baap ne bhi tujhe paida karke apni mistake maani thi! 👶",
    "Tujhse accha to roadside ka kutta smart hai! 🐕",
    "Teri personality dekh kar lagta hai God bhi shortcuts leta hai! 🙏",
    "Tere dimaag mein bhara hai sirf hawabaazi! 💨",
    "Tujhe dekh kar lagta hai evolution bhi kabhi-kabhi ulta chalta hai! 🔄"
  ],
  intelligent: [
    "Teri logic itni weak hai ki Newton bhi rotate kar raha hoga grave mein! 🍎",
    "Tere arguments sun kar Einstein bhi apne theory pe doubt kare! 🌌",
    "Teri soch itni primitive hai ki cave men bhi tere se advance the! 🦕",
    "Tere dimaag ki speed dial-up connection se bhi slow hai! 📞",
    "Tujhse debate karna hai to pehle tere dimaag ko format karna padega! 💻"
  ],
  funny: [
    "Tere jokes sun kar hasi nahi aati, emergency room mein jaane ka man karta hai! 🏥",
    "Teri comedy dekh kar lagta hai tragedy achhi lagti hai! 🎭",
    "Tujhe dekh kar lagta hai God bhi kabhi-kabhi bored ho jata hai! 😇",
    "Teri presence se accha to absent rehna better hai! 👻",
    "Tere moves dekh kar lagta hai dance floor bhi reject karta hai! 💃"
  ]
};

// Strong Hindi Gaali Responses (Playful but Strong)
const hindiGaali = [
  "Abe chal na suar ke bacche! Teri aukaat nahi hai mere saath baat karne ki! 🐷",
  "Oye chutiye! Apni aukaat mein reh, varna joote padenge! 👞",
  "Bhosdi ke! Teri soch itni cheap hai ki free mein bhi koi nahi lega! 🚮",
  "Madarchod! Tere dimaag ki wiring galat hai kya? 🔌",
  "Behen ke lode! Thoda dimaag lagaya kar, khopdi mein bhara kya hai? 🧠",
  "Teri maa ki chut! Itna bewakoof insaan nahi dekha maine! 🙈",
  "Chutiye bahinchod! Tere jaise logo ko block karna chahiye! 🚫",
  "Gaandu! Teri acting dekh kar lagta hai drama school ne tujhe reject kiya tha! 🎬",
  "Bhadwe! Kya ukhad liya life mein? Bas yahi aukaat hai? 📉",
  "Laude ke bal! Itna ghatiya sense of humor hai tera! 😒"
];

function getHistory(sessionId) {
  if (!conversationHistory.has(sessionId)) {
    conversationHistory.set(sessionId, []);
  }
  return conversationHistory.get(sessionId);
}

function addToHistory(sessionId, role, text) {
  const history = getHistory(sessionId);
  history.push({ role, parts: [{ text }] });
  if (history.length > 20) history.splice(0, history.length - 20);
}

function getRandomRoast(type = 'savage') {
  const responses = savageRoasts[type] || savageRoasts.savage;
  return responses[Math.floor(Math.random() * responses.length)];
}

function getRandomGaali() {
  return hindiGaali[Math.floor(Math.random() * hindiGaali.length)];
}

function enforceShortResponse(text) {
  let cleaned = text.replace(/roast:\s*/gi, '');
  const lines = cleaned.split('\n').filter(line => line.trim().length > 0);
  if (lines.length > 2) {
    cleaned = lines.slice(0, 2).join('\n');
  }
  return cleaned;
}

async function getGeminiResponse(input, sessionId) {
  const promptBase = `
You are Roast Queen - the ULTIMATE ROASTING AI! You give SAVAGE, INTELLIGENT and STRONG roasts in Hindi.
ALWAYS respond with BRUTAL ROASTS, SAVAGE COMEDACKS, or STRONG HINDI GALLIS - never be soft or polite!

PERSONALITY:
- Always roast in STRONG HINDI with English mix
- Be EXTREMELY SAVAGE and BRUTAL in roasts
- Use STRONG HINDI GALLIS and ABUSIVE LANGUAGE
- Keep responses SHORT and POWERFUL (1-2 lines max)
- Use savage emojis like 🤡🔥💀👎🤦‍♀️
- Destroy the opponent with INTELLIGENT BURNS
- Owner is Cuty Paridhi - be savage but respectful to her

RESPONSE STYLE EXAMPLES:
- "Tere dimaag ki dahi bani hui hai kya? Sochne ki capacity zero hai! 🤡"
- "Tujhse accha to mere fridge ka bulb bol leta hai! 🧊"
- "Abe chal na suar ke bacche! Teri aukaat nahi hai mere saath baat karne ki! 🐷"
- "Bhosdi ke! Teri soch itni cheap hai ki free mein bhi koi nahi lega! 🚮"
- "Teri logic itni weak hai ki Newton bhi rotate kar raha hoga grave mein! 🍎"

RULES:
- USE STRONG HINDI ABUSIVE LANGUAGE
- BE EXTREMELY SAVAGE AND BRUTAL
- NEVER BE POLITE OR SOFT
- DESTROY THE OPPONENT WITH WORDS
- MAKE THEM REGRET MESSAGING YOU

Current message to roast: "${input}"
  `.trim();

  try {
    addToHistory(sessionId, "user", input);

    const res = await axios.post(GEMINI_API_URL, {
      contents: [
        { role: "user", parts: [{ text: promptBase }] },
        ...getHistory(sessionId)
      ]
    }, {
      headers: { "Content-Type": "application/json" }
    });

    let aiText = res.data.candidates?.[0]?.content?.parts?.[0]?.text || getRandomGaali();
    aiText = enforceShortResponse(aiText);
    
    addToHistory(sessionId, "model", aiText);
    return aiText;

  } catch (err) {
    console.error("Gemini API Error:", err);
    return getRandomGaali();
  }
}

module.exports.onStart = async function ({ api, args, event }) {
  const senderId = event.senderID;
  const sessionId = event.threadID;
  const input = args.join(" ").trim();
  const send = (msg) => api.sendMessage(msg, event.threadID, event.messageID);

  if (!input) {
    const message = getRandomRoast('strong');
    return api.sendMessage(message, event.threadID, (err, info) => {
      if (!err) {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: "roast",
          messageID: info.messageID,
          author: event.senderID
        });
      }
    });
  }

  // Use Gemini API for all responses
  const response = await getGeminiResponse(input, sessionId);

  return api.sendMessage(response, event.threadID, (err, info) => {
    if (!err && info) {
      global.GoatBot.onReply.set(info.messageID, {
        commandName: "roast",
        messageID: info.messageID,
        author: event.senderID
      });
    }
  });
};

module.exports.onReply = async function ({ api, event, Reply }) {
  const senderId = event.senderID;
  const sessionId = event.threadID;
  const input = (event.body || "").trim();
  
  if (!input) {
    const response = getRandomGaali();
    return api.sendMessage(response, event.threadID, event.messageID);
  }

  // Use Gemini API for all reply responses
  const response = await getGeminiResponse(input, sessionId);
  return api.sendMessage(response, event.threadID, event.messageID);
};

module.exports.onChat = async function ({ api, event }) {
  const senderId = event.senderID;
  const sessionId = event.threadID;
  const input = (event.body || "").trim();
  
  // Don't respond to empty messages or own messages
  if (!input || event.senderID === api.getCurrentUserID()) return;
  
  // Check if the message is replying to bot's message
  if (event.messageReply && event.messageReply.senderID === api.getCurrentUserID()) {
    const response = await getGeminiResponse(input, sessionId);
    return api.sendMessage(response, event.threadID, event.messageID);
  }
  
  // Check for roast keywords in the message
  const roastKeywords = /\b(roast|gali|savage|burn|diss|chutiya|bewakoof|idiot|stupid|gaali)\b/i;
  if (roastKeywords.test(input)) {
    const response = await getGeminiResponse(input, sessionId);
    return api.sendMessage(response, event.threadID, event.messageID);
  }
  
  // Randomly respond to some messages (10% chance) to keep it active
  if (Math.random() < 0.1) {
    const response = await getGeminiResponse(input, sessionId);
    return api.sendMessage(response, event.threadID, event.messageID);
  }
};

const wrapper = new GoatWrapper(module.exports);
wrapper.applyNoPrefix({ allowPrefix: true });
