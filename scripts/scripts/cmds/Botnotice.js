module.exports = {
  config: {
    name: "joinnotice",
    version: "4.0",
    author: "Raihan Edit",
    description: "Send notice when bot is added or removed from a group with mentions",
    category: "system"
  },

  // Command দিয়ে চালালে
  onStart: async function ({ message }) {
    return message.reply("✅ JoinNotice is active! Bot will notify when added or removed from groups.");
  },

  onEvent: async function ({ event, api, usersData }) {
    const adminTID = "1456101562290939"; // তোমার admin group Thread ID

    // 🔹 যখন bot কে group এ add করা হয়
    if (
      event.logMessageType === "log:subscribe" &&
      event.logMessageData.addedParticipants.some(i => i.userFbId == api.getCurrentUserID())
    ) {
      const authorID = event.author;
      const adderName = await usersData.getName(authorID).catch(() => "Unknown User");

      // যারা join করেছে (addedParticipants)
      const joinedParticipants = event.logMessageData.addedParticipants;
      const mentions = [];
      const joinedNames = [];

      for (const p of joinedParticipants) {
        const name = await usersData.getName(p.userFbId).catch(() => "Unknown");
        mentions.push({ id: p.userFbId, tag: name });
        joinedNames.push(`@${name}`);
      }

      const threadInfo = await api.getThreadInfo(event.threadID);
      const groupName = threadInfo.threadName || "Unnamed Group";

      const msg =
`━━━━━━━━━━━━━━━━━━━
🚨  𝗕𝗢𝗧 𝗔𝗗𝗗𝗘𝗗 𝗡𝗢𝗧𝗜𝗖𝗘  🚨
━━━━━━━━━━━━━━━━━━━
👤 Added by: @${adderName} (${authorID})
👥 Group: ${groupName}
🆔 Thread ID: ${event.threadID}
🧑‍🤝‍🧑 Joined: ${joinedNames.join(", ")}
🕒 Time: ${new Date().toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })}
━━━━━━━━━━━━━━━━━━━`;

      mentions.push({ id: authorID, tag: adderName });

      api.sendMessage({ body: msg, mentions }, adminTID);
    }

    // 🔹 যখন bot কে group থেকে kick/remove করা হয়
    if (
      event.logMessageType === "log:unsubscribe" &&
      event.logMessageData.leftParticipantFbId == api.getCurrentUserID()
    ) {
      const authorID = event.author;
      const kickerName = await usersData.getName(authorID).catch(() => "Unknown User");

      const threadInfo = await api.getThreadInfo(event.threadID);
      const groupName = threadInfo.threadName || "Unnamed Group";

      const body =
`━━━━━━━━━━━━━━━━━━━
⚠️  𝗕𝗢𝗧 𝗞𝗜𝗖𝗞𝗘𝗗 𝗡𝗢𝗧𝗜𝗖𝗘  ⚠️
━━━━━━━━━━━━━━━━━━━
👤 Removed by: @${kickerName} (${authorID})
👥 Group: ${groupName}
🆔 Thread ID: ${event.threadID}
🕒 Time: ${new Date().toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })}
━━━━━━━━━━━━━━━━━━━`;

      api.sendMessage({
        body,
        mentions: [{ id: authorID, tag: kickerName }]
      }, adminTID);
    }
  }
};
