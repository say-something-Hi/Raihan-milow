const { getPrefix } = global.utils;
const { commands } = global.GoatBot;

// Levenshtein distance for suggestions
function levenshteinDistance(a, b) {
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  return matrix[b.length][a.length];
}

// Find closest command for suggestion
function getClosestCommand(name) {
  const lowerName = name.toLowerCase();
  let closest = null;
  let minDist = Infinity;

  for (const cmdName of commands.keys()) {
    const dist = levenshteinDistance(lowerName, cmdName.toLowerCase());
    if (dist < minDist) {
      minDist = dist;
      closest = cmdName;
    }
  }

  if (minDist <= 3) return closest;
  return null;
}

module.exports = {
  config: {
    name: "help2",
    version: "2.3",
    author: "raihan",
    countDown: 5,
    role: 0,
    shortDescription: { en: "View command usage and list all commands" },
    longDescription: { en: "View command usage and list all commands directly with categories" },
    category: "info",
    guide: { en: "{pn} /help2 [category] or /help2 commandName" },
    priority: 1,
  },

  onStart: async function ({ message, args, event, role }) {
    const { threadID } = event;
    const prefix = getPrefix(threadID);
    const categories = {};

    // Group commands by category
    for (const [name, value] of commands) {
      if (!value?.config || typeof value.onStart !== "function") continue;
      if (value.config.role > 1 && role < value.config.role) continue;

      const category = value.config.category?.toLowerCase() || "uncategorized";
      if (!categories[category]) categories[category] = [];
      categories[category].push(name);
    }

    const rawInput = args.join(" ").trim();

    // Show full list if no argument
    if (!rawInput) {
      let allCategories = Object.keys(categories).sort();

      // Move image/gen categories to bottom
      allCategories = allCategories.sort((a, b) => {
        if (a.includes("image") || a.includes("gen")) return 1;
        if (b.includes("image") || b.includes("gen")) return -1;
        return a.localeCompare(b);
      });

      // Collage-style box
      let msg = "╔════════════╗\n";
      msg += "    𝐌𝐢𝐥𝐨𝐰 𝐇𝐄𝐋𝐏 2\n";
      msg += "╚════════════╝\n";

      for (const category of allCategories) {
        const cmdList = categories[category].sort((a, b) => a.localeCompare(b));
        msg += `┊ [ ${category.toUpperCase()} ]\n`;
        // Command names in simple dark style
        msg += `┊ ${cmdList.join(" | ")}\n`;
      }

      msg += "╔════════════════╗\n";
      msg += `┊ TOTAL CMD: [${commands.size}]\n`;
      msg += `┊ PREFIX   : ${prefix}\n`;
      msg += `┊ OWNER    : RaiHan\n`;
      msg += "╚════════════════╝";

      return message.reply(msg); // No timeout
    }

    // Command-specific info
    const commandName = rawInput.toLowerCase();
    const command = commands.get(commandName);

    if (!command || !command?.config) {
      const suggestion = getClosestCommand(commandName);
      if (suggestion) {
        return message.reply(`❌ Command "${commandName}" not found.\n👉 Did you mean: "${suggestion}"?`);
      } else {
        return message.reply(`❌ Command "${commandName}" not found.\nTry: /help2 or /help2 [category]`);
      }
    }

    const configCommand = command.config;
    const roleText = roleTextToString(configCommand.role);
    const longDescription = configCommand.longDescription?.en || "No description available.";
    const guideBody = configCommand.guide?.en || "No guide available.";
    const usage = guideBody.replace(/{pn}/g, `${prefix}${configCommand.name}`);

    const msg = `
╔══ [ COMMAND INFO ] ══╗
┋🧩 Name       : ${configCommand.name}
┋🗂️ Category   : ${configCommand.category || "Uncategorized"}
┋📜 Description: ${longDescription}
┋⚙️ Version    : ${configCommand.version || "1.0"}
┋🔐 Permission : ${configCommand.role} (${roleText})
┋⏱️ Cooldown   : ${configCommand.countDown || 5}s
┋👑 Author     : raihan
┋📖 Usage      : ${usage}
╚═══════════════╝`;

    return message.reply(msg); // No timeout
  },
};

// Convert role number to string
function roleTextToString(role) {
  switch (role) {
    case 0: return "All users";
    case 1: return "Group Admins";
    case 2: return "Bot Admins";
    default: return "Unknown";
  }
}
