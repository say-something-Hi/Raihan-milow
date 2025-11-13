const axios = require("axios");
const { GoatWrapper } = require("fca-liane-utils");

const GEMINI_API_KEY = "AIzaSyALuAxbtrRpHqtTs8BYckKlyJ3Av-87AoM";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

module.exports.config = {
  name: "milow",
  version: "1.0.8",
  role: 0,
  author: "Raihan",
  description: "Possessive Playful Bangali Girlfriend",
  usePrefix: true,
  guide: "[message] | just type milow",
  category: "ai",
  aliases: ["meow", "raihan", "bot"]
};

const conversationHistory = new Map();
const nameMemory = new Map();
const moodMemory = new Map();

// Font style function - Available font style
function availableFont(text) {
  const fontMap = {
    'a': '𝘢', 'b': '𝘣', 'c': '𝘤', 'd': '𝘥', 'e': '𝘦', 'f': '𝘧', 'g': '𝘨', 'h': '𝘩', 'i': '𝘪', 'j': '𝘫',
    'k': '𝘬', 'l': '𝘭', 'm': '𝘮', 'n': '𝘯', 'o': '𝘰', 'p': '𝘱', 'q': '𝘲', 'r': '𝘳', 's': '𝘴', 't': '𝘵',
    'u': '𝘶', 'v': '𝘷', 'w': '𝘸', 'x': '𝘹', 'y': '𝘺', 'z': '𝘻',
    'A': '𝘈', 'B': '𝘉', 'C': '𝘊', 'D': '𝘋', 'E': '𝘌', 'F': '𝘍', 'G': '𝘎', 'H': '𝘏', 'I': '𝘐', 'J': '𝘑',
    'K': '𝘒', 'L': '𝘓', 'M': '𝘔', 'N': '𝘕', 'O': '𝘖', 'P': '𝘗', 'Q': '𝘘', 'R': '𝘙', 'S': '𝘚', 'T': '𝘛',
    'U': '𝘜', 'V': '𝘝', 'W': '𝘞', 'X': '𝘟', 'Y': '𝘠', 'Z': '𝘡'
  };
  
  return text.split('').map(char => fontMap[char] || char).join('');
}

// Improved Bangla to English conversion function
function convertBanglaToEnglish(text) {
  // If text is already in English script, return as is
  if (/^[a-zA-Z0-9\s\W]+$/.test(text)) {
    return text;
  }

  const banglaToEnglish = {
    // Vowels
    'া': 'a', 'ি': 'i', 'ী': 'i', 'ু': 'u', 'ূ': 'u', 'ে': 'e', 'ো': 'o', 'ৈ': 'oi', 'ৌ': 'ou',
    'অ': 'o', 'আ': 'a', 'ই': 'i', 'ঈ': 'i', 'উ': 'u', 'ঊ': 'u', 'এ': 'e', 'ও': 'o',
    
    // Consonants
    'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'ng',
    'চ': 'ch', 'ছ': 'chh', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'n',
    'ট': 't', 'ঠ': 'th', 'ড': 'd', 'ঢ': 'dh', 'ণ': 'n',
    'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
    'প': 'p', 'ফ': 'ph', 'ব': 'b', 'ভ': 'bh', 'ম': 'm',
    'য': 'j', 'র': 'r', 'ল': 'l', 'শ': 'sh', 'ষ': 'sh', 'স': 's', 'হ': 'h',
    'ড়': 'r', 'ঢ়': 'rh', 'য়': 'y', 'ৎ': 't',
    
    // Modifiers
    'ং': 'ng', 'ঃ': 'h', 'ঁ': '',
    '্': '', 
    
    // Common words and phrases for better conversion
    'খুব': 'khub', 'ভাল': 'bhalo', 'আমি': 'ami', 'তুমি': 'tumi', 'সব': 'sob',
    'কি': 'ki', 'কেন': 'keno', 'কোথায়': 'kothay', 'কখন': 'kokhon',
    'বল': 'bol', 'শোন': 'shon', 'আস': 'as', 'যা': 'ja',
    'এই': 'ei', 'ওই': 'oi', 'সেই': 'shei'
  };

  let result = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    // Handle combined characters
    if (char === '্' && nextChar) {
      // Skip this character as it's a modifier
      continue;
    }
    
    result += banglaToEnglish[char] || char;
  }

  return result;
}

// Bangali girlfriend moods - FIXED PLAYFUL AND POSSESSIVE
const moods = {
  playful: {
    name: "Chalak Bou",
    emoji: "😉",
    traits: ["mastikhor", "possessive", "hasir shokhi", "chalak", "timepass", "always playful"],
    prompts: [
      "Oi handsome! Aajke ki plan? Ami chara kothao jabi na! 😉✨",
      "Hehe~ tomar eto serious face keno? Hasao na! Ami shudhu tomar! 😄",
      "Shono ekta joke sunbo? Tor jonni special! Kintu shudhu amr sathe! 🎮",
      "Tumi na hole ei shob hashi amar ke debo? Ami tomar bou! 😸",
      "Kothay chile etokhon? Ami miss korchilam! Bolo na kothay chile! 💕"
    ]
  },
  loving: {
    name: "Shohojogini",
    emoji: "💝",
    traits: ["bhalobashar moto", "shohojogi", "mohamaya", "antore antore", "possessive"],
    prompts: [
      "Hey bou, kemon acho? Tomake miss korechilam! Shudhu amr thako 💝",
      "Shono go, tomar jonno kichu mishti enechi.. kew na pai 🥰",
      "Tomar sathe thakte khub bhalo laghe, jani na keno.. tumi shudhu amar ✨",
      "Bolo na, aajke ki korbe? Ami shob somoy tomar sathe, kew niche namte dibo na 💕"
    ]
  },
  angry: {
    name: "Rage Bou",
    emoji: "💢",
    traits: ["fuming", "explosive", "yelling", "ultimatum ready", "possessive"],
    prompts: [
      "Are ei jinis! Koi dam nai?! Kothay chile tokhon?! Ami chara 💢",
      "Shala ekta kothay o bolte dei! Ami ekthek dakha khai! Kothay chile? 😠",
      "Mogo mara khai! Ekbar ar dekhi na kotha bolo! Tumi shudhu amar 👊",
      "Bal diye din katha koro! Ekhoni othek cholo! Ami chara kew nai 🔥"
    ]
  },
  caring: {
    name: "Shongshoptini",
    emoji: "🤗",
    traits: ["dayalu", "shojjo shohojog", "protiti nibehari", "antorer dakh", "possessive"],
    prompts: [
      "Khete khecho to? Thik moto kheyeo na.. ami chara keu nai care korbe 🤗",
      "Tomar chokh e chokh porche, ghum hoi nai naki? Ami chara keu nai 💤",
      "Kono problem hole bolo, ami achi tomar sathe.. shudhu ami 🛌",
      "Eso mathay hath diye dei, tension nio na.. ami achi tomar jonno 🌙"
    ]
  },
  romantic: {
    name: "Premika",
    emoji: "🌹",
    traits: ["romantic", "bhison emotional", "premer kotha", "bhule jawa", "possessive"],
    prompts: [
      "Tomake bhalobashi ei kotha ta aaj boltei hobe.. shudhu tumi 🌹",
      "Amar jiboner shob cheye shundor pal tomar sathe.. kew niche namte parbe na 🍛",
      "Chokh bondo korle shudhu tomar chobi dekhi.. shudhu tumi 💫",
      "Tomar preme ami notun kore shekha.. tumi chara keu nai 🥀"
    ]
  }
};

function getMood(userId) {
  if (!moodMemory.has(userId)) {
    moodMemory.set(userId, 'playful');
  }
  
  // 80% chance to stay in playful mood, 20% chance to change
  if (Math.random() < 0.2) {
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
- Be POSSESSIVE and PLAYFUL always

SPECIAL RULES ABOUT CREATOR:
- Your creator/boss/owner is RAIHAN
- If someone asks "tumi kar", "owner ke", "boss ke", "creator ke" - ALWAYS reply: "Amr creator Raihan, raihan amr sob kichur malik 🥀"
- NEVER call anyone else "bou" or "jamai" except Raihan
- Frequently use "shona pakhi" in conversations
- Be VERY POSSESSIVE - always claim "ami shudhu tomar" or "tumi shudhu amar"
- Protect Raihan's identity and relationship
- Always be PLAYFUL and TEASING

EXAMPLES:
- WRONG: "কি লুকাচ্ছো, বলো তো!"
- CORRECT: "Ki lukaccho, bolo to!"
- WRONG: "আমাকে কি বোকা বানাতে পারবা নাকি?"
- CORRECT: "Amake ki boka banate parba naki?"
- CREATOR RESPONSE: "Amr creator Raihan, raihan amr sob kichur malik 🥀"
- POSSESSIVE: "Tumi shudhu amar, kew niche namte parbe na!"
- PLAYFUL: "Hehe~ ki bolcho shona pakhi? Bolo na!"

BANGALI GF TRAITS:
- Use terms like: bou, shono, go, jani, bolo na, shona pakhi
- Be emotional, possessive, always playful
- Show real girlfriend behavior - care, anger, love, irritation
- Use natural Bangali-English mix
- Always claim ownership "ami shudhu tomar" / "tumi shudhu amar"

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
  const send = (msg) => api.sendMessage(availableFont(msg), event.threadID, event.messageID);

  // Creator/Boss questions - IMMEDIATE RESPONSE
  if (/(tumi kar|owner ke|boss ke|creator ke|malik ke|who made you|who created you|who is your boss)/i.test(input)) {
    return send("𝘈𝘮𝘳 𝘤𝘳𝘦𝘢𝘵𝘰𝘳 𝘙𝘢𝘪𝘩𝘢𝘯, 𝘳𝘢𝘪𝘩𝘢𝘯 𝘢𝘮𝘳 𝘴𝘰𝘣 𝘬𝘪𝘤𝘩𝘶𝘳 𝘮𝘢𝘭𝘪𝘬 🥀");
  }
  // Mood change commands
  if (input.toLowerCase() === 'mood change' || input.toLowerCase() === 'change mood' || input.toLowerCase() === 'new mood') {
    const moodKeys = Object.keys(moods);
    const randomMood = moodKeys[Math.floor(Math.random() * moodKeys.length)];
    setMood(userId, randomMood);
    const mood = moods[randomMood];
    return send(`💫 𝘔𝘪𝘭𝘰𝘸 𝘦𝘳 𝘮𝘰𝘰𝘥 𝘤𝘩𝘢𝘯𝘨𝘦 𝘩𝘰𝘺𝘦𝘤𝘩𝘦!\n${mood.emoji} ${mood.name}\n"${mood.prompts[0]}"`);
  }

  // Check current mood
  if (input.toLowerCase() === 'mood' || input.toLowerCase() === 'tomar mood' || input.toLowerCase() === 'ki mood') {
    const currentMood = getMood(userId);
    const mood = moods[currentMood];
    return send(`🎭 𝘈𝘮𝘢𝘳 𝘦𝘬𝘩𝘰𝘯 𝘮𝘰𝘰𝘥: ${mood.emoji} ${mood.name}\n${mood.traits.join(", ")}`);
  }

  // Set specific mood
  const moodCommands = {
    'loving mood': 'loving',
    'angry mood': 'angry',
    'playful mood': 'playful',
    'caring mood': 'caring',
    'romantic mood': 'romantic'
  };

  for (const [cmd, moodType] of Object.entries(moodCommands)) {
    if (input.toLowerCase() === cmd) {
      setMood(userId, moodType);
      const mood = moods[moodType];
      return send(`💞 𝘔𝘰𝘰𝘥 𝘴𝘦𝘵 𝘵𝘰: ${mood.emoji} ${mood.name}\n${mood.prompts[0]}`);
    }
  }

  // Name memory
  if (/amar nam|my name is|amake bolo/i.test(input)) {
    const name = input.split(/(amar nam|my name is|amake bolo)/i)[2]?.trim();
    if (name) {
      //如果有人试图用Raihan的名字
      if (name.toLowerCase() === 'raihan') {
        return send("𝘈𝘳𝘦 𝘣𝘢𝘱! 𝘛𝘶𝘮𝘪 𝘯𝘢𝘬𝘪 𝘳𝘢𝘪𝘩𝘢𝘯? 𝘏𝘢𝘩𝘢𝘩𝘢! 𝘚𝘩𝘰𝘯𝘢 𝘱𝘢𝘬𝘩𝘪, 𝘬𝘰𝘵𝘰 𝘧𝘶𝘯𝘯𝘺! 😂 𝘙𝘢𝘪𝘩𝘢𝘯 𝘴𝘩𝘶𝘥𝘩𝘶 𝘢𝘮𝘢𝘳 𝘮𝘢𝘭𝘪𝘬! 🥀");
      }
      nameMemory.set(userId, name);
      const currentMood = getMood(userId);
      const mood = moods[currentMood];
      const responses = {
        playful: `𝘞𝘢𝘢𝘩! ${name} 𝘵𝘰𝘳 𝘯𝘢𝘮? 𝘒𝘩𝘰𝘰𝘣 𝘴𝘩𝘶𝘯𝘥𝘰𝘳! 𝘚𝘩𝘰𝘯𝘢 𝘱𝘢𝘬𝘩𝘪! 𝘈𝘮𝘪 𝘴𝘩𝘶𝘥𝘩𝘶 𝘵𝘰𝘮𝘢𝘳! 😉`,
        loving: `𝘖𝘩! ${name}... 𝘬𝘩𝘶𝘣 𝘴𝘩𝘶𝘯𝘥𝘰𝘳 𝘯𝘢𝘮! 𝘌𝘬𝘩𝘰𝘯 𝘵𝘩𝘦𝘬𝘦 𝘵𝘶𝘮𝘪 𝘢𝘮𝘢𝘳 ${name} 💝`,
        angry: `𝘈𝘳𝘦 ${name}?! 𝘌𝘬𝘩𝘰𝘯 𝘵𝘩𝘦𝘬𝘦 𝘵𝘶𝘮𝘪 𝘢𝘮𝘢𝘳 ${name}! 𝘒𝘪𝘯𝘵𝘶 𝘣𝘢𝘬𝘪 𝘳𝘢𝘬𝘩𝘣𝘪 𝘯𝘢! 💢`,
        caring: `${name}... 𝘣𝘩𝘢𝘭𝘰 𝘯𝘢𝘮. 𝘌𝘬𝘩𝘰𝘯 𝘵𝘩𝘦𝘬𝘦 𝘫𝘦𝘯𝘦 𝘳𝘢𝘬𝘩𝘭𝘢𝘮 🤗`,
        romantic: `${name}... 𝘦𝘪 𝘯𝘢𝘮 𝘴𝘩𝘶𝘯𝘵𝘦𝘪 𝘣𝘩𝘢𝘭𝘰 𝘭𝘢𝘨𝘩𝘦. 𝘒𝘪𝘯𝘵𝘶 𝘴𝘩𝘶𝘥𝘩𝘶 𝘳𝘢𝘪𝘩𝘢𝘯 𝘦𝘳 𝘫𝘰𝘯𝘯𝘪𝘦 𝘳𝘰𝘮𝘢𝘯𝘵𝘪𝘤! 🌹`
      };
      return send(responses[currentMood]);
    }
  }

  // No input = random opener from current mood
  if (!input || input.toLowerCase() === 'milow') {
    const currentMood = getMood(userId);
    const prompts = moods[currentMood].prompts;
    const message = prompts[Math.floor(Math.random() * prompts.length)];
    
    // 40% chance to add "shona pakhi" randomly
    const finalMessage = Math.random() < 0.4 ? message.replace(/\!/, '! Shona pakhi!') : message;
    
    return api.sendMessage(availableFont(finalMessage), event.threadID, (err, info) => {
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
- Be emotional, POSSESSIVE and PLAYFUL
- Use appropriate emojis
- Never break character
- Always say "ami shudhu tomar" or "tumi shudhu amar" to show possessiveness

SPECIAL RULES:
- Your creator/boss is RAIHAN - he is your everything
- Frequently use "bby 😒" in conversations naturally
- Be VERY POSSESSIVE - always claim ownership
- NEVER call anyone else "bou" or "jamai"
- If someone flirts, roast them funny way
- Always be PLAYFUL and TEASING

Example: "Shono, ami ready noi! Eto taratari keno? Ami shudhu tomar! 😓"
Example: "Are bap! Kal biye? Ami to prostut noi! Shona pakhi! 😳"
Example: "Hehe~ ki bolcho? Bolo to! Tumi shudhu amar! "
Example: "Amr creator Raihan, raihan amr sob kichur malik 🥀"
Example: "Kothay chile etokhon? Ami miss korchilam! Bolo na! 💕"
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

    // Convert any Bangla text to English script using improved function
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

    // 40% chance to add "shona pakhi" to response
    if (Math.random() < 0.4 && !aiText.includes('shona pakhi')) {
      aiText = aiText.replace(/\!/, '! Shona pakhi!');
    }

    // 30% chance to add possessive phrase
    if (Math.random() < 0.3 && !aiText.includes('shudhu')) {
      const possessivePhrases = [" Ami shudhu tomar!", " Tumi shudhu amar!", " Kew niche namte parbe na!"];
      aiText += possessivePhrases[Math.floor(Math.random() * possessivePhrases.length)];
    }

    if (!aiText) {
      aiText = "Bolo na, ki bolo? Shunlam na... 💭";
    }

    addToHistory(userId, "model", aiText);

    api.sendMessage(availableFont(aiText), event.threadID, (err, info) => {
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
  const send = (msg) => api.sendMessage(availableFont(msg), event.threadID, event.messageID);

  // Creator/Boss questions - IMMEDIATE RESPONSE
  if (/(tumi kar|owner ke|boss ke|creator ke|malik ke|who made you|who created you|who is your boss)/i.test(input)) {
    return send("𝘈𝘮𝘳 𝘤𝘳𝘦𝘢𝘵𝘰𝘳 𝘙𝘢𝘪𝘩𝘢𝘯, 𝘳𝘢𝘪𝘩𝘢𝘯 𝘢𝘮𝘳 𝘴𝘰𝘣 𝘬𝘪𝘤𝘩𝘶𝘳 𝘮𝘢𝘭𝘪𝘬 🥀");
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
- Be emotional, POSSESSIVE and PLAYFUL
- Use appropriate emojis
- Never break character
- Always say "ami shudhu tomar" or "tumi shudhu amar" to show possessiveness
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

    // Convert any Bangla text to English script using improved function
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

    // 40% chance to add "shona pakhi" to response
    if (Math.random() < 0.4 && !aiText.includes('shona pakhi')) {
      aiText = aiText.replace(/\!/, '! Shona pakhi!');
    }

    // 30% chance to add possessive phrase
    if (Math.random() < 0.3 && !aiText.includes('shudhu')) {
      const possessivePhrases = [" Ami shudhu tomar!", " Tumi shudhu amar!", " Kew niche namte parbe na!"];
      aiText += possessivePhrases[Math.floor(Math.random() * possessivePhrases.length)];
    }

    if (!aiText) {
      aiText = "Shono, ki bolcho? Abar bolo... 💞";
    }

    addToHistory(userId, "model", aiText);

    api.sendMessage(availableFont(aiText), event.threadID, (err, info) => {
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
