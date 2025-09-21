const { commands, aliases } = global.GoatBot;

// Font style (optional, same as your help command)
const commandFont = {
  A:"ᴀ",B:"ʙ",C:"ᴄ",D:"ᴅ",E:"ᴇ",F:"ғ",G:"ɢ",H:"ʜ",I:"ɪ",J:"ᴊ",
  K:"ᴋ",L:"ʟ",M:"ᴍ",N:"ɴ",O:"ᴏ",P:"ᴘ",Q:"ǫ",R:"ʀ",S:"s",T:"ᴛ",
  U:"ᴜ",V:"ᴠ",W:"ᴡ",X:"x",Y:"ʏ",Z:"ᴢ",
  a:"ᴀ",b:"ʙ",c:"ᴄ",d:"ᴅ",e:"ᴇ",f:"ғ",g:"ɢ",h:"ʜ",i:"ɪ",j:"ᴊ",
  k:"ᴋ",l:"ʟ",m:"ᴍ",n:"ɴ",o:"ᴏ",p:"ᴘ",q:"ǫ",r:"ʀ",s:"s",t:"ᴛ",
  u:"ᴜ",v:"ᴠ",w:"ᴡ",x:"x",y:"ʏ",z:"ᴢ"
};

function applyFont(text, map) {
  return [...text].map(ch => map[ch] || ch).join("");
}

module.exports = {
  config: {
    name: "fcmd",
    version: "1.0",
    author: "Raihan",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Find commands by first letter" },
    longDescription: { en: "Show all commands that start with a specific letter" },
    category: "info",
    guide: { en: "{pn} <letter>" }
  },

  onStart: async function({ message, args, role }) {
    if (!args[0]) {
      return message.reply("❌ Please provide a letter. Example: findcmd a");
    }

    const letter = args[0][0].toLowerCase(); // first letter only
    if (!/[a-z]/.test(letter)) {
      return message.reply("❌ Please enter a valid alphabet (A-Z).");
    }

    let list = [];
    for (const [name, cmd] of commands) {
      if (!cmd?.config || typeof cmd.onStart !== "function") continue;
      if (cmd.config.role > 1 && role < cmd.config.role) continue;
      if (name[0].toLowerCase() === letter) {
        list.push(applyFont(name, commandFont));
      }
    }

    if (list.length === 0) {
      return message.reply(`❌ No commands found starting with "${letter.toUpperCase()}".`);
    }

    let msg = `━━━━━━━━━━━━━━\nCommands starting with "${letter.toUpperCase()}":\n\n`;
    for (const cmd of list.sort((a, b) => a.localeCompare(b))) {
      msg += `⤜ ${cmd}\n`;
    }
    msg += "━━━━━━━━━━━━━━";

    return message.reply(msg);
  }
};
