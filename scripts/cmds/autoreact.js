module.exports = {
  config: {
    name: "autoreact",
    version: "1.1",
    author: "raihan",
    countDown: 5,
    role: 0,
    shortDescription: "Automatically reacts with emojis",
    longDescription: "Reacts to messages based on keywords with emojis",
    category: "Fun",
  },

  onStart: async function () {},

  onChat: async function ({ event, api }) {
    if (!event.body) return;

    const body = event.body.toLowerCase();

    // Map of keywords to emojis
    const reactions = {
      "iloveyou": "😙",
      "i love you": "💕",
      "love you": "💖",
      "mahal": "💗",
      "mahal kita": "💝",
      "mwa": "💗",
      "muah": "😘",
      "kiss": "💋",
      "halik": "💋",
      "i miss you": "💗",
      "miss you": "💙",
      "crush": "😍",
      "baby": "👶",
      "honey": "🍯",
      "good morning": "💗",
      "morning": "🌅",
      "hi": "💗",
      "hello": "💗",
      "hey": "👋",
      "happy": "😊",
      "sad": "😔",
      "angry": "😡",
      "wow": "😲",
      "lol": "😂",
      // Add more keywords as needed
    };

    // Check and react
    for (const keyword in reactions) {
      if (body.includes(keyword)) {
        api.setMessageReaction(
          reactions[keyword],    // emoji
          event.messageID,       // messageID
          event.threadID,        // threadID
          (err) => {             // callback function
            if (err) console.error("Reaction Error:", err);
          }
        );
        break; // Stop after first match
      }
    }
  }
};
