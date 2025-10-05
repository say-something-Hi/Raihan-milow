const { getStreamsFromAttachment } = global.utils;
const mediaTypes = ["photo", "png", "animated_image", "video", "audio"];

module.exports = {
  config: {
    name: "callad",
    version: "3.0",
    author: "Raihan Edit",
    countDown: 5,
    role: 0,
    description: {
      en: "Send report/feedback/bug to admin group"
    },
    category: "contacts admin",
    guide: {
      en: "{pn} <message>"
    }
  },

  onStart: async function ({ args, message, event, usersData, threadsData, api, commandName }) {
    const targetTID = "1456101562290939"; // তোমার এডমিন গ্রুপের Thread ID

    if (!args[0])
      return message.reply("⚠️ Please enter the message you want to send to admin group.");

    const { senderID, threadID, isGroup } = event;
    const senderName = await usersData.getName(senderID);

    const msg = "==📨️ CALL ADMIN 📨️=="
      + `\n- User Name: ${senderName}`
      + `\n- User ID: ${senderID}`
      + (isGroup ? `\n- Sent from group: ${(await threadsData.get(threadID)).threadName}\n- Thread ID: ${threadID}` : "\n- Sent from user");

    const formMessage = {
      body: msg + `\n\nContent:\n─────────────────\n${args.join(" ")}\n─────────────────\nReply this message to respond`,
      mentions: [{ id: senderID, tag: senderName }],
      attachment: await getStreamsFromAttachment(
        [...event.attachments, ...(event.messageReply?.attachments || [])]
          .filter(item => mediaTypes.includes(item.type))
      )
    };

    const messageSend = await api.sendMessage(formMessage, targetTID);
    message.reply("✅ Your message has been sent to admin group successfully!");

    global.GoatBot.onReply.set(messageSend.messageID, {
      commandName,
      messageID: messageSend.messageID,
      threadID,
      messageIDSender: event.messageID,
      type: "userCallAdmin"
    });
  },

  onReply: async ({ args, event, api, message, Reply, usersData, commandName, role }) => {
    const { type, threadID, messageIDSender } = Reply;
    const senderName = await usersData.getName(event.senderID);

    // ✅ শুধু এডমিনরা রিপ্লাই দিতে পারবে
    if (role < 1) {
      return message.reply("❌ You are not allowed to reply to user reports.");
    }

    switch (type) {
      case "userCallAdmin": {
        const formMessage = {
          body: `📍 Reply from admin ${senderName}:\n─────────────────\n${args.join(" ")}\n─────────────────`,
          mentions: [{ id: event.senderID, tag: senderName }],
          attachment: await getStreamsFromAttachment(
            event.attachments.filter(item => mediaTypes.includes(item.type))
          )
        };

        api.sendMessage(formMessage, threadID, (err, info) => {
          if (err) return message.err(err);
          message.reply("✅ Reply sent to user successfully!");
          global.GoatBot.onReply.set(info.messageID, {
            commandName,
            messageID: info.messageID,
            messageIDSender: event.messageID,
            threadID: event.threadID,
            type: "adminReply"
          });
        }, messageIDSender);
        break;
      }

      case "adminReply": {
        const formMessage = {
          body: `📝 Feedback from user ${senderName}:\n- User ID: ${event.senderID}\n\nContent:\n─────────────────\n${args.join(" ")}\n─────────────────`,
          mentions: [{ id: event.senderID, tag: senderName }],
          attachment: await getStreamsFromAttachment(
            event.attachments.filter(item => mediaTypes.includes(item.type))
          )
        };

        api.sendMessage(formMessage, threadID, (err, info) => {
          if (err) return message.err(err);
          message.reply("✅ Reply sent back to admin group!");
          global.GoatBot.onReply.set(info.messageID, {
            commandName,
            messageID: info.messageID,
            messageIDSender: event.messageID,
            threadID: event.threadID,
            type: "userCallAdmin"
          });
        }, messageIDSender);
        break;
      }
    }
  }
};
