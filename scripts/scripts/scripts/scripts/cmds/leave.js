module.exports = {
  config: {
    name: "bhag",
    aliases: ["leave", "exitgroup"],
    version: "1.0",
    author: "nexo_here + modified by ChatGPT",
    shortDescription: "Force bot to leave group",
    longDescription: "Simple command to make the bot leave the current group or a specified group by tid",
    category: "owner",
    guide: "{pn} [tid]"
  },

  onStart: async function ({ message, args, api, event }) {
    const tid = args[0];
    const threadID = event.threadID;
    const targetThreadId = tid || threadID;

    try {
      await api.removeUserFromGroup(api.getCurrentUserID(), targetThreadId);
      message.reply(`✅ Bot has left the group (tid: ${targetThreadId})`);
    } catch (error) {
      console.error("Leave error:", error);
      message.reply(`❌ Failed to leave. Make sure the bot is in the group and has permission.`);
    }
  }
};
