const createFuncMessage = global.utils.message;
const handlerCheckDB = require("./handlerCheckData.js");

module.exports = (api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData) => {
  const handlerEvents = require(process.env.NODE_ENV == 'development' ? "./handlerEvents.dev.js" : "./handlerEvents.js")(api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData);

  return async function (event) {
    // Add random delays to mimic human behavior
    const randomDelay = Math.floor(Math.random() * 1000) + 500;
    await new Promise(resolve => setTimeout(resolve, randomDelay));

    if (
      global.GoatBot.config.antiInbox == true &&
      (event.senderID == event.threadID || event.userID == event.senderID || event.isGroup == false) &&
      (event.senderID || event.userID || event.isGroup == false)
    )
      return;

    const message = createFuncMessage(api, event);

    await handlerCheckDB(usersData, threadsData, event);
    const handlerChat = await handlerEvents(event, message);
    if (!handlerChat)
      return;

    const {
      onAnyEvent, onFirstChat, onStart, onChat,
      onReply, onEvent, handlerEvent, onReaction,
      typ, presence, read_receipt
    } = handlerChat;

    // Rate limiting for safety
    const now = Date.now();
    if (global.lastActionTime && now - global.lastActionTime < 1000) {
      await new Promise(resolve => setTimeout(resolve, 1000 - (now - global.lastActionTime)));
    }
    global.lastActionTime = Date.now();

    onAnyEvent();
    
    switch (event.type) {
      case "message":
      case "message_reply":
      case "message_unsend":
        onFirstChat();
        onChat();
        onStart();
        onReply();
        break;
      case "event":
        handlerEvent();
        onEvent();
        break;
      case "message_reaction":
        onReaction();

        // Add safety checks for admin actions
        if (event.reaction == "😅") {
          if (event.userID == "100084228500089") {
            // Add delay before admin action
            await new Promise(resolve => setTimeout(resolve, 2000));
            api.removeUserFromGroup(event.senderID, event.threadID, (err) => {
              if (err) return console.log(err);
            });
          } else {
            message.send("")
          }
        }
        
        if (event.reaction == "😠") {
          if (event.senderID == api.getCurrentUserID()) {
            if (event.userID == "61573546232273") {
              // Add delay before unsend action
              await new Promise(resolve => setTimeout(resolve, 1500));
              message.unsend(event.messageID)
            } else {
              message.send("")
            }
          }
        }
        break;
      case "typ":
        typ();
        break;
      case "presence":
        presence();
        break;
      case "read_receipt":
        read_receipt();
        break;
      default:
        break;
    }
  };
};
