module.exports = {
  config: {
    name: "autoreact",
    version: "1.0",
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
      // Love & Affection
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
      "miss na kita": "💜",
      "namiss": "💛",
      "crush": "😍",
      "baby": "👶",
      "honey": "🍯",
      "sweetheart": "💕",
      "darling": "💖",
      "babe": "😘",
      "hubby": "👨",
      "wifey": "👩",

      // Greetings
      "good morning": "💗",
      "morning": "🌅",
      "magandang umaga": "☀️",
      "gm": "🌄",
      "buenos dias": "🌞",

      "good afternoon": "❤",
      "afternoon": "🌤️",
      "magandang hapon": "🌇",
      "ga": "🌆",

      "good evening": "❤",
      "evening": "🌙",
      "magandang gabi": "🌃",
      "ge": "🌉",

      "good night": "💗",
      "goodnight": "🌙",
      "gn": "😴",
      "night": "🌛",
      "tulog na": "💤",
      "sleep tight": "😪",
      "sweet dreams": "💭",

      "hi": "💗",
      "hello": "💗",
      "hey": "👋",
      "hola": "🤗",
      "kumusta": "😊",
      "kamusta": "😄",
      "how are you": "🤔",
      "wassup": "😎",
      "what's up": "🤙",
      "sup": "😏",

      // Positive Emotions
      "happy": "😊",
      "joy": "😄",
      "excited": "🤩",
      "amazing": "🤩",
      "awesome": "😎",
      "great": "👍",
      "fantastic": "🌟",
      "wonderful": "✨",
      "perfect": "💯",
      "excellent": "👌",
      "brilliant": "💡",
      "outstanding": "🏆",

      // Sad Emotions
      "sad": "😔",
      "cry": "😭",
      "crying": "😢",
      "tears": "💧",
      "depressed": "😞",
      "lonely": "😔",
      "heartbroken": "💔",
      "broken": "💔",
      "hurt": "😣",
      "pain": "😖",
      "malungkot": "😢",
      "iyak": "😭",

      // Anger & Frustration
      "tangina": "😡",
      "gago": "😡",
      "pakyo": "😠",
      "pakyu": "🤬",
      "fuck you": "🤬",
      "fuck": "😤",
      "shit": "💩",
      "damn": "😠",
      "angry": "😡",
      "mad": "😠",
      "furious": "🤬",
      "annoyed": "😒",
      "irritated": "😤",
      "pissed": "😡",
      "galit": "😠",
      "inis": "😒",

      // Insults
      "pangit": "😠",
      "ugly": "😤",
      "stupid": "🙄",
      "tanga": "🤦",
      "bobo": "🤦‍♂️",
      "idiot": "🙄",
      "dumb": "🤦‍♀️",
      "loser": "😒",
      "useless": "😓",
      "worthless": "😞",
      "i hate you": "😞",
      "hate": "💔",
      "ayoko": "😤",
      "kadiri": "🤢",

      // Adult/Inappropriate
      "bastos": "😳",
      "bas2s": "😳",
      "bastog": "😳",
      "redroom": "😏",
      "shoti": "😏",
      "sexy": "😍",
      "hot": "🔥",
      "libog": "😏",
      "horny": "😈",

      // Compliments
      "pogi": "😎",
      "ganda": "💗",
      "maganda": "😍",
      "guwapo": "😎",
      "handsome": "😍",
      "beautiful": "😍",
      "pretty": "💖",
      "cute": "🥰",
      "adorable": "🥺",
      "charming": "😘",
      "attractive": "😍",
      "gorgeous": "🤩",
      "stunning": "😍",

      // Age
      "bata": "👧",
      "kid": "👧",
      "child": "👶",
      "adult": "👨",
      "matanda": "👴",

      // Surprise
      "omg": "😮",
      "oh my god": "😱",
      "wow": "😲",
      "whoa": "😯",
      "shocked": "😱",
      "surprised": "😲",
      "gulat": "😱",
      "grabe": "😮",
      "wtf": "😳",
      "what the fuck": "😱",

      // Laughter
      "haha": "😂",
      "hehe": "😄",
      "hihi": "😊",
      "lol": "😂",
      "lmao": "🤣",
      "rofl": "🤣",
      "funny": "😄",
      "hilarious": "🤣",
      "nakakatawa": "😂",
      "tawa": "😄",

      // Food & Drink
      "food": "🍽️",
      "eat": "🍴",
      "kain": "🍽️",
      "pagkain": "🍕",
      "hungry": "😋",
      "gutom": "🤤",
      "pizza": "🍕",
      "burger": "🍔",
      "rice": "🍚",
      "kanin": "🍚",
      "adobo": "🍖",
      "lechon": "🐷",
      "sinigang": "🍲",
      "coffee": "☕",
      "kape": "☕",
      "tea": "🍵",
      "water": "💧",
      "tubig": "💧",
      "beer": "🍺",
      "wine": "🍷",
      "juice": "🧃",
      "milk": "🥛",
      "gatas": "🥛",

      // Weather
      "rain": "🌧️",
      "ulan": "☔",
      "sunny": "☀️",
      "araw": "🌞",
      "cloudy": "☁️",
      "storm": "⛈️",
      "bagyo": "🌪️",
      "init": "🥵",
      "cold": "🥶",
      "lamig": "❄️",

      // Time
      "time": "⏰",
      "oras": "🕐",
      "late": "⏰",
      "nahuli": "⏱️",
      "early": "⏰",
      "maaga": "🕐",
      "wait": "⏳",
      "antay": "⏳",
      "hintay": "⏳",
      "zope": "⏳",

      // Work & School
      "work": "💼",
      "trabaho": "👔",
      "school": "🏫",
      "eskwela": "📚",
      "study": "📖",
      "aral": "✏️",
      "exam": "📝",
      "test": "📋"
    };

    // Check and react
    for (const keyword in reactions) {
      if (body.includes(keyword)) {
        return api.setMessageReaction(reactions[keyword], event.messageID, event.threadID);
      }
    }
  }
};
