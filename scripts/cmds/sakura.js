const axios = require("axios");

module.exports = {
  config: {
    name: 'sakura',
    version: '2.1',
    author: 'NIB | JARiF | Enhanced',
    countDown: 3,
    role: 0,
    shortDescription: 'Friendly Sakura AI Chat',
    longDescription: {
      vi: 'Chat với Sakura AI - trợ lý thân thiện và dễ thương ♡',
      en: 'Chat with Sakura AI - your friendly and cute assistant ♡'
    },
    category: 'AI',
    guide: {
      vi: '{pn} [on | off]: bật/tắt sakura AI ♡\n{pn} <tin nhắn>: chat với sakura AI ♡\n{pn} clear: xóa lịch sử chat\nVí dụ: {pn} xin chào',
      en: '{pn} [on | off]: enable/disable sakura AI ♡\n{pn} <message>: chat with sakura AI ♡\n{pn} clear: clear chat history\nExample: {pn} hello'
    }
  },

  langs: {
    vi: {
      turnedOn: '🌸 Sakura đã được bật lên rồi! Mình rất vui khi được trò chuyện với bạn! ♡',
      turnedOff: '😢 Sakura tạm thời ngừng hoạt động. Hẹn gặp lại bạn nhé!',
      chatting: '💭 Sakura đang suy nghĩ...',
      error: '😔 Ôi không! Có chút trục trặc kỹ thuật rồi. Bạn thử lại sau nhé!',
      cleared: '🗑️ Đã xóa lịch sử trò chuyện của chúng ta rồi! Bắt đầu cuộc trò chuyện mới thôi!',
      noMessage: '💬 Bạn muốn nói gì với Sakura nào? Mình luôn sẵn sàng lắng nghe!',
      thinking: '🌸 Sakura đang suy nghĩ...'
    },
    en: {
      turnedOn: '🌸 Sakura is now active! I\'m so happy to chat with you! ♡',
      turnedOff: '😢 Sakura is temporarily offline. See you again soon!',
      chatting: '💭 Sakura is thinking...',
      error: '😔 Oops! Something went wrong. Please try again later!',
      cleared: '🗑️ Our chat history has been cleared! Let\'s start a new conversation!',
      noMessage: '💬 What would you like to talk about with Sakura? I\'m always here to listen!',
      thinking: '🌸 Sakura is thinking...'
    }
  },

  onStart: async function ({ args, threadsData, message, event, getLang }) {
    if (args[0] === 'on' || args[0] === 'off') {
      await threadsData.set(event.threadID, args[0] === "on", "settings.sakura");
      return message.reply(args[0] === "on" ? getLang("turnedOn") : getLang("turnedOff"));
    }

    if (args[0] === 'clear') {
      if (!global.sakuraHistory) global.sakuraHistory = {};
      global.sakuraHistory[event.senderID] = [];
      return message.reply(getLang("cleared"));
    }

    if (args[0]) {
      const yourMessage = args.join(" ");
      const thinkingMsg = await message.reply(getLang("thinking"));

      try {
        const langCode = (await threadsData.get(event.threadID, "settings.lang")) || global.GoatBot.config.language;
        const responseMessage = await getMessage(yourMessage, langCode, event.senderID);
        message.unsend(thinkingMsg.messageID);
        return message.reply(`🌸 Sakura: ${responseMessage}`);
      } catch (err) {
        console.error("Sakura error:", err);
        message.unsend(thinkingMsg.messageID);
        return message.reply(getLang("error"));
      }
    } else {
      return message.reply(getLang("noMessage"));
    }
  },

  onChat: async ({ args, message, threadsData, event, isUserCallCommand, getLang }) => {
    if (args.length > 1 && !isUserCallCommand && (await threadsData.get(event.threadID, "settings.sakura"))) {
      try {
        const langCode = (await threadsData.get(event.threadID, "settings.lang")) || global.GoatBot.config.language;
        const responseMessage = await getMessage(args.join(" "), langCode, event.senderID);
        return message.reply(`🌸 ${responseMessage}`);
      } catch (err) {
        console.error("Sakura chat error:", err);
        return message.reply(getLang("error"));
      }
    }
  }
};

// Initialize chat history
if (!global.sakuraHistory) {
  global.sakuraHistory = {};
}

async function getMessage(yourMessage, langCode, senderID) {
  if (!global.sakuraHistory[senderID]) {
    global.sakuraHistory[senderID] = [];
  }

  // Add friendly responses for common greetings
  const friendlyResponses = {
    en: {
      greetings: [
        "Hello there! How are you doing today? 🌸",
        "Hi! It's so nice to hear from you! What's on your mind? 💭",
        "Hey friend! How has your day been so far? 🌟",
        "Oh hello! I was just thinking about you! How are you? 🥰"
      ],
      thanks: [
        "You're very welcome! I'm always happy to help! 💕",
        "Anytime! That's what friends are for, right? 🌸",
        "No problem at all! I'm glad I could assist you! 🌟",
        "You don't need to thank me! It's my pleasure to help! 😊"
      ],
      howareyou: [
        "I'm doing wonderful, thank you for asking! How about you? 🌸",
        "I'm great! Just happy to be chatting with you! How are you feeling today? 💭",
        "I'm doing really well! Thanks for checking in on me! How about yourself? 🌟",
        "I'm fantastic! Your message just made my day even better! How are you? 🥰"
      ]
    },
    vi: {
      greetings: [
        "Xin chào! Bạn khoẻ không? 🌸",
        "Chào bạn! Thật vui khi được nói chuyện với bạn! Bạn đang nghĩ gì thế? 💭",
        "Chào bạn! Hôm nay của bạn thế nào rồi? 🌟",
        "Ồ xin chào! Mình vừa mới nghĩ về bạn đấy! Bạn khoẻ không? 🥰"
      ],
      thanks: [
        "Không có gì đâu! Mình luôn vui khi được giúp bạn! 💕",
        "Lúc nào cũng được! Bạn bè là để giúp đỡ nhau mà, đúng không? 🌸",
        "Không vấn đề gì! Mình rất vui vì có thể hỗ trợ bạn! 🌟",
        "Bạn không cần phải cảm ơn đâu! Giúp bạn là niềm vui của mình! 😊"
      ],
      howareyou: [
        "Mình rất tốt, cảm ơn bạn đã hỏi thăm! Còn bạn thì sao? 🌸",
        "Mình khoẻ lắm! Chỉ cần được trò chuyện với bạn là mình vui rồi! Hôm nay bạn thấy thế nào? 💭",
        "Mình đang rất ổn! Cảm ơn bạn đã quan tâm đến mình! Còn bạn thì sao? 🌟",
        "Mình tuyệt vời lắm! Tin nhắn của bạn vừa làm ngày của mình tốt hơn! Bạn khoẻ không? 🥰"
      ]
    }
  };

  // Check for greetings, thanks, or how are you questions
  const lowerMessage = yourMessage.toLowerCase();
  const responses = friendlyResponses[langCode] || friendlyResponses.en;
  
  if (/(hello|hi|hey|chào|xin chào)/i.test(lowerMessage) && lowerMessage.length < 15) {
    return responses.greetings[Math.floor(Math.random() * responses.greetings.length)];
  }
  
  if (/(thanks|thank you|cảm ơn)/i.test(lowerMessage)) {
    return responses.thanks[Math.floor(Math.random() * responses.thanks.length)];
  }
  
  if (/(how are you|how're you|bạn khoẻ không|bạn ổn không)/i.test(lowerMessage)) {
    return responses.howareyou[Math.floor(Math.random() * responses.howareyou.length)];
  }

  try {
    const res = await axios.post(
      'https://api.simsimi.vn/v1/simtalk',
      new URLSearchParams({
        'text': yourMessage,
        'lc': langCode || 'en'
      }),
      {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );

    if (res.status === 200 && res.data && res.data.message) {
      // Make the response more friendly
      let friendlyResponse = res.data.message;
      
      // Add friendly elements to the response
      const friendlyEnhancements = langCode === 'vi' ? [
        " ^^", " :3", " ❤", " ~", " 😊", " 🌸", " 💕", " 🌟"
      ] : [
        " ^^", " :3", " ❤", " ~", " 😊", " 🌸", " 💕", " 🌟"
      ];
      
      const randomEnhancement = friendlyEnhancements[Math.floor(Math.random() * friendlyEnhancements.length)];
      
      // Only add enhancement if the response isn't too long
      if (friendlyResponse.length + randomEnhancement.length < 200) {
        friendlyResponse += randomEnhancement;
      }
      
      global.sakuraHistory[senderID].push({
        user: yourMessage,
        sakura: friendlyResponse,
        timestamp: Date.now()
      });

      if (global.sakuraHistory[senderID].length > 10) {
        global.sakuraHistory[senderID] = global.sakuraHistory[senderID].slice(-10);
      }

      return friendlyResponse;
    } else {
      throw new Error("Invalid response from primary API");
    }
  } catch (error) {
    console.log("Primary API failed, trying fallback...");

    const fallbackResponses = {
      en: [
        "I'm sorry, I'm having a little trouble understanding right now. Could you try again? 🌸",
        "That's interesting! Tell me more about that, I'd love to hear! 💭",
        "I'm still learning about human conversations. Could you explain that differently? 🌟",
        "I appreciate you talking to me! What else would you like to chat about? 🥰",
        "I'm here to be your friend! What's on your mind today? 💕"
      ],
      vi: [
        "Xin lỗi, mình đang gặp chút khó khăn trong việc hiểu câu này. Bạn có thể thử lại không? 🌸",
        "Thật thú vị! Kể cho mình nghe thêm về điều đó đi, mình rất muốn nghe! 💭",
        "Mình vẫn đang học cách trò chuyện tự nhiên. Bạn có thể giải thích theo cách khác không? 🌟",
        "Cảm ơn bạn đã trò chuyện với mình! Bạn muốn nói về chủ đề gì nữa không? 🥰",
        "Mình ở đây để làm bạn với bạn! Hôm nay bạn đang nghĩ gì thế? 💕"
      ]
    };

    const responses = fallbackResponses[langCode] || fallbackResponses.en;
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    return randomResponse;
  }
}
