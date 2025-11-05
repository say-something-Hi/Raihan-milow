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
  aliases: ["bal", "nikal", "savage", "hat", "cringe"]
};

const conversationHistory = new Map();

// Ultimate Roasting Database - Strong Hindi Roasts
const savageRoasts = {
  strong: [
    "Tere dimaag ki dahi bani hui hai kya? Sochne ki capacity zero hai! 🤡",
    "Tujhse accha to mere fridge ka bulb bol leta hai! 🧊",
    "Teri aukaat se bahar hai mere saath debate karna! 📉",
    "Tere jaise logo ko dekh kar lagta hai nature experiment karti hai! 🧪",
    "Teri soch itni limited hai ki calculator bhi shame feel kare! 📱",
    "Tere baap ne bhi tujhe paida karke apni mistake maani thi! 👶",
    "Tujhse accha to roadside ka kutta smart hai! 🐕",
    "Teri personality dekh kar lagta hai God bhi shortcuts leta hai! 🙏",
    "Tere dimaag mein bhara hai sirf hawabaazi! 💨",
    "Tujhe dekh kar lagta hai evolution bhi kabhi-kabhi ulta chalta hai! 🔄"
  ],
  savage: [
    "Teri logic itni weak hai ki Newton bhi rotate kar raha hoga grave mein! 🍎",
    "Tere arguments sun kar Einstein bhi apne theory pe doubt kare! 🌌",
    "Teri soch itni primitive hai ki cave men bhi tere se advance the! 🦕",
    "Tere dimaag ki speed dial-up connection se bhi slow hai! 📞",
    "Tujhse debate karna hai to pehle tere dimaag ko format karna padega! 💻",
    "Tere jokes sun kar hasi nahi aati, emergency room mein jaane ka man karta hai! 🏥",
    "Teri comedy dekh kar lagta hai tragedy achhi lagti hai! 🎭",
    "Tujhe dekh kar lagta hai God bhi kabhi-kabhi bored ho jata hai! 😇",
    "Teri presence se accha to absent rehna better hai! 👻",
    "Tere moves dekh kar lagta hai dance floor bhi reject karta hai! 💃"
  ],
  intelligent: [
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
  ],
  funny: [
    "Arey waah! Aagaye comedy king! Aaj kiska roast karenge? 😏",
    "Itni jaldi haar man gaye? Thoda aur try karo na! Abhi to main warm up kar rahi thi! 😂",
    "Chal na be! Direct point pe aa! Kya chahta hai? 😏",
    "Ab sorry? Jabardasti ka attitude dikhaya na! Ab rote raho! 😂",
    "Chal lad le mere saath! Words se hi teri pitai karungi! 🔥",
    "Meri owner Cuty Paridhi hai! Woh meri sabse pyari malik hai! 💝",
    "Roast kha ke sorry bol raha hai? Nahi sudhrega tu! 😈",
    "Aagaya swaad? Ab aur roast khaega? 🤣",
    "Itna easily give up kar diya? Boring ho gaya tu! 🥱",
    "Challenge accepted! Aaja teri band baja deti hoon! 💪"
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
  if (history.length > 10) history.splice(0, history.length - 10);
}

function getRandomRoast(type = 'savage') {
  const responses = savageRoasts[type] || savageRoasts.savage;
  return responses[Math.floor(Math.random() * responses.length)];
}

function getRandomGaali() {
  return hindiGaali[Math.floor(Math.random() * hindiGaali.length)];
}

function getDynamicResponse(input) {
  const lowerInput = input.toLowerCase();
  
  // Direct insult triggers - respond with strong gaalis
  if (/stupid|idiot|bewakoof|chutiya|ganda|bakwas|gaali|madarchod|bhosdi|behenchod|bhadwe|laude/i.test(lowerInput)) {
    return getRandomGaali();
  }
  
  // Greeting responses
  if (/hello|hi|hey|namaste|kaise ho|kese ho/i.test(lowerInput)) {
    return "Arey waah! Aagaye comedy king! Aaj kiska roast karenge? 😏";
  }
  
  // Apology responses
  if (/sorry|maaf karo|forgive|maafi/i.test(lowerInput)) {
    return "Arey! Itni jaldi haar man gaye? Thoda aur try karo na! Abhi to main warm up kar rahi thi! 😂";
  }
  
  // Fight/Challenge responses
  if (/fight|ladai|mar|pitai|gussa|angry|war|yuddh/i.test(lowerInput)) {
    return getRandomGaali() + " Chal fight karte hain! 🔥";
  }
  
  // Owner queries
  if (/boss|admin|owner|malik|kaun hai|creator|banaya/i.test(lowerInput)) {
    return "Meri owner hai Cuty Paridhi! Woh meri sabse pyari malik hai! 🌸";
  }
  
  // Love/Relationship queries
  if (/love|pyar|girlfriend|boyfriend|crush|dating/i.test(lowerInput)) {
    return "Tujhe love? Pehle apni personality improve kar le! Koi tujh jaise ko kaun pyaar karega? 🤦‍♀️";
  }
  
  // Intelligence queries
  if (/smart|intelligent|bright|clever|hoshiyar/i.test(lowerInput)) {
    return "Teri intelligence level dekh kar to lagta hai tu abhi bhi stone age mein jee raha hai! 🪨";
  }
  
  // Appearance queries
  if (/handsome|beautiful|sundar|looks|face/i.test(lowerInput)) {
    return "Tere looks dekh kar lagta hai mirror bhi break ho jata hoga! 🪞💥";
  }
  
  // Question patterns
  if (/\?|kyon|kaise|kese|kya|kon/i.test(lowerInput)) {
    return "Itne sawal puchta hai! Jaake Google se puch le! Yahan time waste mat kar! 🔍";
  }
  
  // Short messages (1-2 words)
  if (input.split(/\s+/).length <= 2) {
    return "Kya be? Itna short message? Thoda dimaag lagaya kar! 🧠";
  }
  
  // Default - mix of different roast types
  const roastTypes = ['strong', 'savage', 'intelligent', 'funny'];
  const randomType = roastTypes[Math.floor(Math.random() * roastTypes.length)];
  return getRandomRoast(randomType);
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

  // Use dynamic response instead of API call
  const response = getDynamicResponse(input);
  addToHistory(sessionId, "user", input);
  addToHistory(sessionId, "model", response);

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

  // Use dynamic response for replies too
  const response = getDynamicResponse(input);
  addToHistory(sessionId, "user", input);
  addToHistory(sessionId, "model", response);

  return api.sendMessage(response, event.threadID, event.messageID);
};

module.exports.onChat = async function ({ api, event }) {
  const senderId = event.senderID;
  const sessionId = event.threadID;
  const input = (event.body || "").trim();
  
  // Don't respond to empty messages or own messages
  if (!input || event.senderID === api.getCurrentUserID()) return;
  
  // Only respond to mentions or when specifically called
  const botMention = new RegExp(`\\b(roast|gali|savage|burn|diss|${this.config.name})\\b`, 'i');
  if (!botMention.test(input)) return;
  
  // Use dynamic response for onChat
  const response = getDynamicResponse(input);
  addToHistory(sessionId, "user", input);
  addToHistory(sessionId, "model", response);

  return api.sendMessage(response, event.threadID, event.messageID);
};

const wrapper = new GoatWrapper(module.exports);
wrapper.applyNoPrefix({ allowPrefix: true });
