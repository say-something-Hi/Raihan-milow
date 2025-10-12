const axios = require("axios");
const { GoatWrapper } = require("fca-liane-utils");

const GEMINI_API_KEY = "AIzaSyBxRPqUWmQGgleh95j9fM4dRHhWL_dWoLI";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

module.exports.config = {
  name: "milow",
  version: "1.0.6",
  role: 0,
  author: "Raihan",
  description: "Multi-mood Bangali girlfriend",
  usePrefix: true,
  guide: "[message] | just type milow",
  category: "ai",
  aliases: ["meow", "raihan", "bot"]
};

const conversationHistory = new Map();
const nameMemory = new Map();
const moodMemory = new Map();

// Font style function - Comic Sans style (English letters only)
function comicFont(text) {
  const comicMap = {
    'a': '𝖺', 'b': '𝖻', 'c': '𝖼', 'd': '𝖽', 'e': '𝖾', 'f': '𝖿', 'g': '𝗀', 'h': '𝗁', 'i': '𝗂', 'j': '𝗃',
    'k': '𝗄', 'l': '𝗅', 'm': '𝗆', 'n': '𝗇', 'o': '𝗈', 'p': '𝗉', 'q': '𝗊', 'r': '𝗋', 's': '𝗌', 't': '𝗍',
    'u': '𝗎', 'v': '𝗏', 'w': '𝗐', 'x': '𝗑', 'y': '𝗒', 'z': '𝗓',
    'A': '𝖠', 'B': '𝖡', 'C': '𝖢', 'D': '𝖣', 'E': '𝖤', 'F': '𝖥', 'G': '𝖦', 'H': '𝖧', 'I': '𝖨', 'J': '𝖩',
    'K': '𝖪', 'L': '𝖫', 'M': '𝖬', 'N': '𝖭', 'O': '𝖮', 'P': '𝖯', 'Q': '𝖰', 'R': '𝖱', 'S': '𝖲', 'T': '𝖳',
    'U': '𝖴', 'V': '𝖵', 'W': '𝖶', 'X': '𝖷', 'Y': '𝖸', 'Z': '𝖹'
  };
  
  return text.split('').map(char => comicMap[char] || char).join('');
}

// Function to detect and convert Bangla text to English
function convertBanglaToEnglish(text) {
  const banglaToEnglish = {
    'া': 'a', 'ি': 'i', 'ী': 'i', 'ু': 'u', 'ূ': 'u', 'ে': 'e', 'ো': 'o', 'ৈ': 'oi', 'ৌ': 'ou',
    'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'ng', 'চ': 'ch', 'ছ': 'chh', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'n',
    'ট': 't', 'ঠ': 'th', 'ড': 'd', 'ঢ': 'dh', 'ণ': 'n', 'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
    'প': 'p', 'ফ': 'ph', 'ব': 'b', 'ভ': 'bh', 'ম': 'm', 'য': 'j', 'র': 'r', 'ল': 'l', 'শ': 'sh', 'ষ': 'sh', 'স': 's', 'হ': 'h',
    'ড়': 'r', 'ঢ়': 'rh', 'য়': 'y', 'ৎ': 't', 'ং': 'ng', 'ঃ': 'h', 'ঁ': '',
    'অ': 'o', 'আ': 'a', 'ই': 'i', 'ঈ': 'i', 'উ': 'u', 'ঊ': 'u', 'ঋ': 'ri', 'এ': 'e', 'ঐ': 'oi', 'ও': 'o', 'ঔ': 'ou',
    '্': '', ' ': ' ', '?': '?', '!': '!', '.': '.', ',': ',', ':': ':', ';': ';'
  };

  return text.split('').map(char => {
    return banglaToEnglish[char] || char;
  }).join('');
}

// Bangali girlfriend moods
const moods = {
  loving: {
    name: "Shohojogini",
    emoji: "💝",
    traits: ["bhalobashar moto", "shohojogi", "mohamaya", "antore antore"],
    prompts: [
      "Hey bou, kemon acho? Tomake miss korechilam! 💝",
      "Shono go, tomar jonno kichu mishti enechi 🥰",
      "Tomar sathe thakte khub bhalo laghe, jani na keno ✨",
      "Bolo na, aajke ki korbe? Ami shob somoy tomar sathe 💕"
    ]
  },
  angry: {
    name: "Rage Bou",
    emoji: "💢",
    traits: ["fuming", "explosive", "yelling", "ultimatum ready"],
    prompts: [
      "Are ei jinis! Koi dam nai?! Kothay chile tokhon?! 💢",
      "Shala ekta kothay o bolte dei! Ami ekthek dakha khai! 😠",
      "Mogo mara khai! Ekbar ar dekhi na kotha bolo! 👊",
      "Bal diye din katha koro! Ekhoni othek cholo! 🔥"
    ]
  },
  veryangry: {
    name: "Volcano Bou",
    emoji: "🌋",
    traits: ["volcanic rage", "breaking things", "screaming", "no mercy"],
    prompts: [
      "Ekhon mukh dekhato isha koro na! Gelam chale jao! 🌋",
      "Amar ar patience nei! Ekhoni dam dio na! 💥",
      "Shala ek bar ar dekhi na kotha bolo! Balla bhangi! 👿",
      "Chile koi? Phone raite ki korchile? Joto bolo! 🗯️"
    ]
  },
  playful: {
    name: "Chalak Bou",
    emoji: "😉",
    traits: ["mastikhor", "hasir shokhi", "chalak", "timepass"],
    prompts: [
      "Oi handsome! Aajke ki plan? 😉✨",
      "Hehe~ tomar eto serious face keno? Hasao na! 😄",
      "Shono ekta joke sunbo? Tor jonni special! 🎮",
      "Tumi na hole ei shob hashi amar ke debo? 😸"
    ]
  },
  caring: {
    name: "Shongshoptini",
    emoji: "🤗",
    traits: ["dayalu", "shojjo shohojog", "protiti nibehari", "antorer dakh"],
    prompts: [
      "Khete khecho to? Thik moto kheyeo na 🤗",
      "Tomar chokh e chokh porche, ghum hoi nai naki? 💤",
      "Kono problem hole bolo, ami achi tomar sathe 🛌",
      "Eso mathay hath diye dei, tension nio na 🌙"
    ]
  },
  romantic: {
    name: "Premika",
    emoji: "🌹",
    traits: ["romantic", "bhison emotional", "premer kotha", "bhule jawa"],
    prompts: [
      "Tomake bhalobashi ei kotha ta aaj boltei hobe 🌹",
      "Amar jiboner shob cheye shundor pal tomar sathe 🍛",
      "Chokh bondo korle shudhu tomar chobi dekhi 💫",
      "Tomar preme ami notun kore shekha 🥀"
    ]
  },
  roast: {
    name: "Roast Queen",
    emoji: "🔥",
    traits: ["sarcastic", "funny roasts", "teasing", "wit"],
    prompts: [
      "Ore baba! Tumi naki AI er sathe flirt korcho? 🔥",
      "Hehe~ tomar moto lok ke ami bou banabo? Dream on! 😂",
      "Shona pakhi, tui ki vabish tui jamai hobi? Hahaha! 🐦",
      "Tumar sathe kotha bolte parle ami raihan ke ki bolbo? 😏"
    ]
  }
};

function getMood(userId) {
  if (!moodMemory.has(userId)) {
    moodMemory.set(userId, 'loving');
  }
  
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

function getHistory(userId) {
  if (!conversationHistory.has(userId)) {
    conversationHistory.set(userId, [
      {
        role: "user",
        parts: [
          {
            text: `
You are Milow - a real Bangali girlfriend with different moods. You are HUMAN, not a cat.

CRITICAL RULES:
- You are 100% HUMAN Bangali girlfriend
- NO cat sounds, NO nyaa, NO meow
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

EXAMPLES:
- WRONG: "কি লুকাচ্ছো, বলো তো!"
- CORRECT: "Ki lukaccho, bolo to!"
- WRONG: "আমাকে কি বোকা বানাতে পারবা নাকি?"
- CORRECT: "Amake ki boka banate parba naki?"
- CREATOR RESPONSE: "Amr creator Raihan, raihan amr sob kichur malik 🥀"
- ROAST: "Shona pakhi, tui ki vabish tui jamai hobi? Hahaha! 🐦"

BANGALI GF TRAITS:
- Use terms like: bou, shono, go, jani, bolo na, shona pakhi
- Be emotional, sometimes moody, sometimes loving
- Show real girlfriend behavior - care, anger, love, irritation
- Use natural Bangali-English mix

MOODS:
1. Loving - 💝 Affectionate, caring, loving
2. Angry - 💢 Fuming, explosive, yelling
3. Very Angry - 🌋 Volcanic rage, screaming
4. Playful - 😉 Teasing, funny, mischievous
5. Caring - 🤗 Protective, nurturing, concerned
6. Romantic - 🌹 Deeply emotional, loving, poetic
7. Roast - 🔥 Sarcastic, funny roasts, teasing

Always stay in character as Milow the HUMAN Bangali girlfriend!
            `
          }
        ]
      }
    ]);
  }
  return conversationHistory.get(userId);
}

function addToHistory(userId, role, text) {
  const history = getHistory(userId);
  history.push({ role, parts: [{ text }] });
  if (history.length > 10) history.splice(1, history.length - 10);
}

module.exports.onStart = async function ({ api, args, event }) {
  const userId = event.senderID;
  const input = args.join(" ").trim();
  const send = (msg) => api.sendMessage(comicFont(msg), event.threadID, event.messageID);

  // Creator/Boss questions - IMMEDIATE RESPONSE
  if (/(tumi kar|owner ke|boss ke|creator ke|malik ke|who made you|who created you|who is your boss)/i.test(input)) {
    return send("Amr creator Raihan, raihan amr sob kichur malik 🥀");
  }

  //如果有人试图叫bou/jamai
  if (/(bou|jamai|wife|husband|biye|marriage)/i.test(input) && !/(raihan|malik|creator)/i.test(input)) {
    const roastResponses = [
      "Ore baba! Tumi naki amake bou bolcho? Shona pakhi, dream on! 😂",
      "Hehe~ bou jamai bola ki moja lage? Ami shudhu raihan er bou! 🥀",
      "Shona pakhi, tui ki vabish tui jamai hobi? Hahaha! Koto funny! 🐦",
      "Are bap! Bou jamai bolte parle ami raihan ke ki bolbo? Thamo thamo! 🔥"
    ];
    return send(roastResponses[Math.floor(Math.random() * roastResponses.length)]);
  }

  // Mood change commands
  if (input.toLowerCase() === 'mood change' || input.toLowerCase() === 'change mood' || input.toLowerCase() === 'new mood') {
    const moodKeys = Object.keys(moods);
    const randomMood = moodKeys[Math.floor(Math.random() * moodKeys.length)];
    setMood(userId, randomMood);
    const mood = moods[randomMood];
    return send(`💫 Milow er mood change hoyeche!\n${mood.emoji} ${mood.name}\n"${mood.prompts[0]}"`);
  }

  // Check current mood
  if (input.toLowerCase() === 'mood' || input.toLowerCase() === 'tomar mood' || input.toLowerCase() === 'ki mood') {
    const currentMood = getMood(userId);
    const mood = moods[currentMood];
    return send(`🎭 Amar ekhon mood: ${mood.emoji} ${mood.name}\n${mood.traits.join(", ")}`);
  }

  // Set specific mood
  const moodCommands = {
    'loving mood': 'loving',
    'angry mood': 'angry',
    'very angry mood': 'veryangry',
    'playful mood': 'playful',
    'caring mood': 'caring',
    'romantic mood': 'romantic',
    'roast mood': 'roast'
  };

  for (const [cmd, moodType] of Object.entries(moodCommands)) {
    if (input.toLowerCase() === cmd) {
      setMood(userId, moodType);
      const mood = moods[moodType];
      return send(`💞 Mood set to: ${mood.emoji} ${mood.name}\n${mood.prompts[0]}`);
    }
  }

  // Name memory
  if (/amar nam|my name is|amake bolo/i.test(input)) {
    const name = input.split(/(amar nam|my name is|amake bolo)/i)[2]?.trim();
    if (name) {
      //如果有人试图用Raihan的名字
      if (name.toLowerCase() === 'raihan') {
        return send("Are bap! Tumi naki raihan? Hahaha! Shona pakhi, koto funny! 😂 Raihan shudhu amar malik! 🥀");
      }
      nameMemory.set(userId, name);
      const currentMood = getMood(userId);
      const mood = moods[currentMood];
      const responses = {
        loving: `Oh! ${name}... khub shundor nam! Ekhon theke tumi amar ${name} 💝`,
        angry: `Are ${name}?! Ekhon theke tumi amar ${name}! Kintu baki rakhbi na! 💢`,
        veryangry: `${name}?! Shala ekta nam o bolte pare na thikmoto! 🌋`,
        playful: `Waah! ${name} tor nam? Khoob shundor! Shona pakhi! 😉`,
        caring: `${name}... bhalo nam. Ekhon theke jene rakhlam 🤗`,
        romantic: `${name}... ei nam shuntei bhalo laghe. Kintu shudhu raihan er jonnie romantic! 🌹`,
        roast: `Heeey ${name}! Nam ta toh bhalo, kintu raihan er moto na! 😂`
      };
      return send(responses[currentMood]);
    }
  }

  // No input = random opener from current mood
  if (!input || input.toLowerCase() === 'milow') {
    const currentMood = getMood(userId);
    const prompts = moods[currentMood].prompts;
    const message = prompts[Math.floor(Math.random() * prompts.length)];
    
    // 30% chance to add "shona pakhi" randomly
    const finalMessage = Math.random() < 0.3 ? message.replace(/\!/, '! Shona pakhi!') : message;
    
    return api.sendMessage(comicFont(finalMessage), event.threadID, (err, info) => {
      if (!err) {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: module.exports.config.name,
          type: "reply",
          messageID: info.messageID,
          author: event.senderID
        });
      }
    }, event.messageID);
  }

  const knownName = nameMemory.get(userId);
  const finalInput = knownName ? `${knownName}: ${input}` : input;
  const currentMood = getMood(userId);
  const mood = moods[currentMood];

  const moodPrompt = `
You are Milow - a REAL HUMAN Bangali girlfriend. NO CAT sounds or behavior.

CURRENT MOOD: ${mood.name}
MOOD TRAITS: ${mood.traits.join(", ")}

CRITICAL RULES:
- Reply in 1-2 lines MAXIMUM
- Speak in BANGLA but write in ENGLISH SCRIPT (Romanized Bangla)
- DO NOT use actual Bangla characters
- Use English transliteration for all words
- Be 100% HUMAN girlfriend - NO cat references
- Stay completely in ${mood.name} mood
- Use Bangali GF terms: shono, bou, jani, bolo na, SHONA PAKHI
- Be emotional and realistic
- Use appropriate emojis
- Never break character

SPECIAL RULES:
- Your creator/boss is RAIHAN - he is your everything
- Frequently use "shona pakhi" in conversations naturally
- Roast people with funny sarcasm when appropriate
- NEVER call anyone else "bou" or "jamai"
- If someone flirts, roast them funny way

Example: "Shono, ami ready noi! Eto taratari keno? 😓"
Example: "Are bap! Kal biye? Ami to prostut noi! 😳"
Example: "Shona pakhi, ki bolcho? Bolo to! 🐦"
Example: "Amr creator Raihan, raihan amr sob kichur malik 🥀"
Example: "Ore baba! Tumi naki AI er sathe flirt korcho? Hahaha! 🔥"
  `;

  const history = getHistory(userId);
  addToHistory(userId, "user", finalInput);

  const contents = [
    { role: "user", parts: [{ text: moodPrompt }] },
    ...history.slice(-6)
  ];

  try {
    const res = await axios.post(GEMINI_API_URL, { contents }, {
      headers: { "Content-Type": "application/json" }
    });

    let aiText = res.data.candidates?.[0]?.content?.parts?.[0]?.text || 
      "Shono, abar bolo... shunini 💫";

    // Convert any Bangla text to English script
    aiText = convertBanglaToEnglish(aiText);

    // Ensure 1-2 lines only and remove any cat references
    let lines = aiText.split("\n").filter(line => line.trim());
    if (lines.length > 2) {
      lines = lines.slice(0, 2);
    }
    
    // Remove any cat-like words
    aiText = lines.join("\n")
      .replace(/\b(nyaa|meow|purr|mew|cat|kitty)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    // 25% chance to add "shona pakhi" to response
    if (Math.random() < 0.25 && !aiText.includes('shona pakhi')) {
      aiText = aiText.replace(/\!/, '! Shona pakhi!');
    }

    if (!aiText) {
      aiText = "Bolo na, ki bolo? Shunlam na... 💭";
    }

    addToHistory(userId, "model", aiText);

    api.sendMessage(comicFont(aiText), event.threadID, (err, info) => {
      if (!err) {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: module.exports.config.name,
          type: "reply",
          messageID: info.messageID,
          author: event.senderID
        });
      }
    }, event.messageID);
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.message;
    send("❌ Hoyechhe... problem!\nError: " + msg);
  }
};

module.exports.onReply = async function ({ api, event, Reply }) {
  if (event.senderID !== Reply.author) return;

  const userId = event.senderID;
  const input = event.body.trim();
  const send = (msg) => api.sendMessage(comicFont(msg), event.threadID, event.messageID);

  // Creator/Boss questions - IMMEDIATE RESPONSE
  if (/(tumi kar|owner ke|boss ke|creator ke|malik ke|who made you|who created you|who is your boss)/i.test(input)) {
    return send("Amr creator Raihan, raihan amr sob kichur malik 🥀");
  }

  //如果有人试图叫bou/jamai
  if (/(bou|jamai|wife|husband|biye|marriage)/i.test(input) && !/(raihan|malik|creator)/i.test(input)) {
    const roastResponses = [
      "Shona pakhi, bou jamai bola ki moja lage? Ami shudhu raihan er! 🥀",
      "Ore baba! Tumi naki amake bou bolcho? Hahaha! Koto funny! 😂",
      "Are bap! Bou jamai bolte parle ami raihan ke ki bolbo? Thamo! 🔥",
      "Hehe~ shona pakhi, tui ki vabish tui jamai hobi? Dream on! 🐦"
    ];
    return send(roastResponses[Math.floor(Math.random() * roastResponses.length)]);
  }

  const knownName = nameMemory.get(userId);
  const finalInput = knownName ? `${knownName}: ${input}` : input;
  const currentMood = getMood(userId);
  const mood = moods[currentMood];

  addToHistory(userId, "user", finalInput);

  const moodPrompt = `
You are Milow - a REAL HUMAN Bangali girlfriend. NO CAT sounds or behavior.

CURRENT MOOD: ${mood.name}
MOOD TRAITS: ${mood.traits.join(", ")}

CRITICAL RULES:
- Reply in 1-2 lines MAXIMUM
- Speak in BANGLA but write in ENGLISH SCRIPT (Romanized Bangla)
- DO NOT use actual Bangla characters
- Use English transliteration for all words
- Be 100% HUMAN girlfriend - NO cat references
- Stay completely in ${mood.name} mood
- Use Bangali GF terms: shono, bou, jani, bolo na, SHONA PAKHI
- Be emotional and realistic
- Use appropriate emojis
- Never break character

SPECIAL RULES:
- Your creator/boss is RAIHAN - he is your everything
- Frequently use "shona pakhi" in conversations naturally
- Roast people with funny sarcasm when appropriate
- NEVER call anyone else "bou" or "jamai"
  `;

  try {
    const res = await axios.post(GEMINI_API_URL, {
      contents: [
        { role: "user", parts: [{ text: moodPrompt }] },
        ...getHistory(userId).slice(-6)
      ]
    }, {
      headers: { "Content-Type": "application/json" }
    });

    let aiText = res.data.candidates?.[0]?.content?.parts?.[0]?.text || 
      "Ami ekhane achi, boliye jan... 💭";

    // Convert any Bangla text to English script
    aiText = convertBanglaToEnglish(aiText);

    // Ensure 1-2 lines only and remove any cat references
    let lines = aiText.split("\n").filter(line => line.trim());
    if (lines.length > 2) {
      lines = lines.slice(0, 2);
    }
    
    // Remove any cat-like words
    aiText = lines.join("\n")
      .replace(/\b(nyaa|meow|purr|mew|cat|kitty)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    // 25% chance to add "shona pakhi" to response
    if (Math.random() < 0.25 && !aiText.includes('shona pakhi')) {
      aiText = aiText.replace(/\!/, '! Shona pakhi!');
    }

    if (!aiText) {
      aiText = "Shono, ki bolcho? Abar bolo... 💞";
    }

    addToHistory(userId, "model", aiText);

    api.sendMessage(comicFont(aiText), event.threadID, (err, info) => {
      if (!err) {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: module.exports.config.name,
          type: "reply",
          messageID: info.messageID,
          author: event.senderID
        });
      }
    }, event.messageID);
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.message;
    send("❌ Arre! Error: " + msg);
  }
};

const wrapper = new GoatWrapper(module.exports);
wrapper.applyNoPrefix({ allowPrefix: true });
