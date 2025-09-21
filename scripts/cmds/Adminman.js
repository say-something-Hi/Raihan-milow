module.exports = {
  config: {
    name: "adminmention",
    version: "1.0.1",
    hasPermssion: 0,
    credits: "Raihan",
    description: "Bot will reply when someone tags any of the admins",
    commandCategory: "Other",
    usages: "@",
    cooldowns: 1
  },

  // Runs once when the command is loaded
  onStart: async function({ api }) {
    console.log("✅ adminmention command loaded successfully!");
    // You can also notify the bot owner here if you want
    // api.sendMessage("✅ adminmention command is now active!", YOUR_UID);
  },

  handleEvent: function({ api, event }) {
    const adminIDs = ["100084228500089"].map(String); // Put your Admin UIDs here

    // If the sender is an admin, ignore
    if (adminIDs.includes(String(event.senderID))) return;

    const mentionedIDs = event.mentions ? Object.keys(event.mentions).map(String) : [];
    const isMentioningAdmin = adminIDs.some(adminID => mentionedIDs.includes(adminID));

    if (isMentioningAdmin) {
      const replies = [
        "Stop tagging the boss, he's busy right now 😒",
        "Someone just mentioned the boss unnecessarily 😑",
        "Why are you tagging the boss like he's your girlfriend? 😏",
        "The boss is being called out by a random person 🐸",
        "Don't tag, go find yourself a girlfriend instead 🙃",
        "Boss is busy, if you need something DM him.",
        "Boss is in a meeting with me, don’t disturb 🙂",
        "How dare you tag my boss like that? 😾",
        "Tagging the boss means you're asking for trouble 😩🚨",
        "Do you even know tagging the boss is a risk to your life? ⚠️",
        "Boss is drinking tea right now, wait patiently 🍵",
        "You keep tagging but the boss won’t marry you 😒💔",
        "Boss is charging his phone, wait till it's full 🔋",
        "Tagging the boss requires a license 😎📛",
        "Boss saw your tag and just laughed 😌",
        "Boss is sleeping now, when he wakes up you’ll be the first to get roasted 😴",
        "You think boss is waiting for you? Keep dreaming 😆",
        "Boss is too busy listening to my stories 📖",
        "Congrats, you’re officially boss’s fan number one 🥇",
        "Boss is now regretting letting you join the group 😑",
        "You must be an attention seeker targeting the boss 🤡",
        "Secretly crushing on the boss? You’ve been caught 😏❤️",
        "Boss doesn’t even want to reply to you 📩",
        "Mentioning the boss means you’re brave… salute 🫡",
        "Boss is angry now, better hide 🔥",
        "Your mention raised boss’s blood pressure 😤",
        "Boss is VIP, come later 😎",
        "Boss is now looking at your profile picture enlarged 🔍",
        "Tagging like this makes it obvious you’re in love 😼❤️"
      ];

      return api.sendMessage(
        replies[Math.floor(Math.random() * replies.length)],
        event.threadID,
        event.messageID
      );
    }
  },

  run: async function() {}
};
