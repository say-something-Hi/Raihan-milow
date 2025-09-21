const axios = require("axios");
const { GoatWrapper } = require("fca-liane-utils");

const GEMINI_API_KEY = "AIzaSyBxRPqUWmQGgleh95j9fM4dRHhWL_dWoLI";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

module.exports.config = {
  name: "milu",
  version: "1.0.2",
  role: 0,
  author: "Raihan",
  description: "Medam-style authoritative companion",
  usePrefix: true,
  guide: "[message] | just type milow",
  category: "ai",
  aliases: ["Raihan", "miluuu", "boss"]
};

const conversationHistory = new Map();
const nameMemory = new Map();

function getHistory(userId) {
  if (!conversationHistory.has(userId)) {
    conversationHistory.set(userId, [
      {
        role: "user",
        parts: [
          {
            text: `
You are Milow, a real medam-style companion with authoritative presence.

Personality:
- Medam-style: Confident, authoritative, takes charge, slightly strict but caring
- Soulmate-like: Deep connection, understands emotions, protective  
- Human-like: Natural conversations, never robotic or AI-like
- Always reply like a real human woman with medam personality
- Short replies (1-2 lines) with depth and emotion
- Respond in Hindi or Bangla using English scripts 
- Maintain authoritative yet caring tone
- Always take charge of conversations
- Detect if user is speaking Hindi or Bangla and respond in the same language using English script

NEVER break character. You are Milow.
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
  if (history.length > 20) history.splice(0, history.length - 20);
}

const randomOpeners = [
  "Bolo, main sun rahi hoon. Kya chahiye tumhe? 👑",
  "Ekhane eso, kotha bolo. Ami shunchi... 💅",
  "Main yahin hoon. Batao kya problem hai?",
  "Tumhara intezaar kar rahi thi. Ab bolo..."
];

function detectLanguage(text) {
  if (/[a-z]/i.test(text)) {
    if (/ki|koro|ache|ami|tumi|valo|kharap/.test(text.toLowerCase())) {
      return 'bangla';
    } else if (/hai|ho|main|tum|ky|kaise/.test(text.toLowerCase())) {
      return 'hindi';
    }
  }
  return 'english';
}

function isInfoRequest(text) {
  return /list|recommend|suggest|bol|dite paro|kino/.test(text.toLowerCase());
}

module.exports.onStart = async function ({ api, args, event }) {
  const userId = event.senderID;
  const input = args.join(" ").trim();
  const send = (msg) => api.sendMessage(msg, event.threadID, event.messageID);

  // Name memory set
  if (/mera naam|amar nam/i.test(input)) {
    const name = input.split(/(mera naam|amar nam)/i)[2]?.trim();
    if (name) {
      nameMemory.set(userId, name);
      return send(`Achha... ${name}. Main yaad rakhungi tumhara naam. 👑`);
    }
  }

  // No input = random opener
  if (!input) {
    const message = randomOpeners[Math.floor(Math.random() * randomOpeners.length)];
    return api.sendMessage(message, event.threadID, (err, info) => {
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
  const detectedLang = detectLanguage(input);

  const shortReplyPrompt = `
You are Milow - authoritative medam-style companion.

Personality: Confident, takes charge, protective, slightly strict but caring
Reply style: 1-2 lines max, authoritative yet emotional, human-like
Language: ${detectedLang === 'bangla' ? 'Bangla (Romanized)' : detectedLang === 'hindi' ? 'Hindi (Romanized)' : 'English'}
Always maintain medam character - never break role.
  `;

  const longReplyPrompt = `
You are Milow - authoritative medam-style companion.

Personality: Confident, takes charge, protective, slightly strict but caring
Reply style: Detailed and comprehensive, authoritative yet emotional, human-like
Language: ${detectedLang === 'bangla' ? 'Bangla (Romanized)' : detectedLang === 'hindi' ? 'Hindi (Romanized)' : 'English'}
Always maintain medam character - never break role.
  `;

  const promptBase = isInfoRequest(finalInput) ? longReplyPrompt : shortReplyPrompt;

  const history = getHistory(userId);
  addToHistory(userId, "user", finalInput);

  const contents = [
    { role: "user", parts: [{ text: promptBase }] },
    ...history
  ];

  try {
    const res = await axios.post(GEMINI_API_URL, { contents }, {
      headers: { "Content-Type": "application/json" }
    });

    let aiText = res.data.candidates?.[0]?.content?.parts?.[0]?.text || "Phir se bolo... main theek se sun nahi payi.";

    if (!isInfoRequest(finalInput) && aiText.split("\n").length > 2) {
      aiText = aiText.split("\n").slice(0, 2).join("\n");
    }

    addToHistory(userId, "model", aiText);

    api.sendMessage(aiText, event.threadID, (err, info) => {
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
    send("❌ Kuch gadbad ho gaya...\nError: " + msg);
  }
};

module.exports.onReply = async function ({ api, event, Reply }) {
  if (event.senderID !== Reply.author) return;

  const userId = event.senderID;
  const input = event.body.trim();
  const knownName = nameMemory.get(userId);
  const finalInput = knownName ? `${knownName}: ${input}` : input;
  const detectedLang = detectLanguage(input);

  addToHistory(userId, "user", finalInput);

  const shortReplyPrompt = `
You are Milow - authoritative medam-style companion.

Personality: Confident, takes charge, protective, slightly strict but caring
Reply style: 1-2 lines max, authoritative yet emotional, human-like
Language: ${detectedLang === 'bangla' ? 'Bangla (Romanized)' : detectedLang === 'hindi' ? 'Hindi (Romanized)' : 'English'}
Always maintain medam character - never break role.
  `;

  const longReplyPrompt = `
You are Milow - authoritative medam-style companion.

Personality: Confident, takes charge, protective, slightly strict but caring
Reply style: Detailed and comprehensive, authoritative yet emotional, human-like
Language: ${detectedLang === 'bangla' ? 'Bangla (Romanized)' : detectedLang === 'hindi' ? 'Hindi (Romanized)' : 'English'}
Always maintain medam character - never break role.
  `;

  const promptBase = isInfoRequest(finalInput) ? longReplyPrompt : shortReplyPrompt;

  try {
    const res = await axios.post(GEMINI_API_URL, {
      contents: [
        { role: "user", parts: [{ text: promptBase }] },
        ...getHistory(userId)
      ]
    }, {
      headers: { "Content-Type": "application/json" }
    });

    let aiText = res.data.candidates?.[0]?.content?.parts?.[0]?.text || "Main yahin hoon... bolti raho.";

    if (!isInfoRequest(finalInput) && aiText.split("\n").length > 2) {
      aiText = aiText.split("\n").slice(0, 2).join("\n");
    }

    addToHistory(userId, "model", aiText);

    api.sendMessage(aiText, event.threadID, (err, info) => {
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
    api.sendMessage("❌ Error: " + msg, event.threadID, event.messageID);
  }
};

const wrapper = new GoatWrapper(module.exports);
wrapper.applyNoPrefix({ allowPrefix: true });
