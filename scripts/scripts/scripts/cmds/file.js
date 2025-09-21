const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "filecmd",
    aliases: ["file"],
    version: "1.1", // Updated version
    author: "nexo_here", // As per your request
    countDown: 5,
    role: 0, // Role is set to 0, but access is controlled by ownerIDs check
    shortDescription: "View code of a command",
    longDescription: "View the raw source code of any command in the commands folder",
    category: "owner", // Kept as owner category
    guide: "{pn} <commandName>"
  },

  onStart: async function ({ api, event, args, message }) {
    // Define the allowed owner UIDs
    const ownerIDs = ["100084228500089"]; // Only this UID can use the command

    // Check if the sender's UID is in the ownerIDs array
    if (!ownerIDs.includes(event.senderID)) {
      console.log(`[FILECMD_DEBUG] Unauthorized access attempt by UID: ${event.senderID}`);
      return message.reply("❌ | You are not authorized to use this command.");
    }

    const cmdName = args[0];
    if (!cmdName) {
      console.log("[FILECMD_DEBUG] No command name provided.");
      return message.reply("❌ | Please provide the command name.\nExample: filecmd fluxsnell");
    }

    const cmdPath = path.join(__dirname, `${cmdName}.js`);
    console.log(`[FILECMD_DEBUG] Attempting to read file: ${cmdPath}`);

    // Check if the file exists
    if (!fs.existsSync(cmdPath)) {
      console.log(`[FILECMD_DEBUG] Command file "${cmdName}.js" not found at ${cmdPath}.`);
      return message.reply(`❌ | Command "${cmdName}" not found in this folder.`);
    }

    try {
      const code = fs.readFileSync(cmdPath, "utf8");
      console.log(`[FILECMD_DEBUG] File "${cmdName}.js" read successfully. Length: ${code.length}`);

      // Check for file size limit
      if (code.length > 19000) {
        console.log(`[FILECMD_DEBUG] File "${cmdName}.js" too large to display.`);
        return message.reply("⚠️ | This file is too large to display.");
      }

      // Reply with the code
      return message.reply({
        body: `📄 | Source code of "${cmdName}.js":\n\n${code}`
      });
    } catch (err) {
      console.error(`[FILECMD_DEBUG] Error reading file "${cmdName}.js":`, err);
      return message.reply("❌ | Error reading the file.");
    }
  }
};
