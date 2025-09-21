const axios = require('axios');

module.exports = {
  config: {
    name: "dice",
    aliases: [],
    version: "1.3",
    author: "itz Aryan",
    countDown: 2,
    role: 0,
    longDescription: {
      en: "Roll a dice and try your luck against the bot to win money!",
    },
    category: "games",
    guide: {
      en: "{pn} <bet_amount> - Place a bet and roll a dice against the bot."
    }
  },

  onStart: async function ({ message, event, usersData, api, args }) {
    try {
      const betAmount = parseInt(args[0], 10);
      const diceSymbols = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

      // Input validation
      if (isNaN(betAmount) || betAmount <= 0 || !Number.isInteger(betAmount)) {
        return api.sendMessage("❌ Please enter a valid positive whole number as your bet.", event.threadID, event.messageID);
      }

      // Get user data
      const userData = await usersData.get(event.senderID);
      const userMoney = userData.money || 0;

      if (betAmount > userMoney) {
        return api.sendMessage("💸 You don't have enough money to place this bet.", event.threadID, event.messageID);
      }

      // Get user name safely
      let userName = "Player";
      try {
        const userInfo = await api.getUserInfo(event.senderID);
        if (userInfo[event.senderID] && userInfo[event.senderID].name) {
          userName = userInfo[event.senderID].name;
        }
      } catch {}

      // Function to roll dice
      const rollDice = () => Math.floor(Math.random() * 6) + 1;

      const userRoll = rollDice();
      const botRoll = rollDice();

      const userDiceSymbol = diceSymbols[userRoll - 1];
      const botDiceSymbol = diceSymbols[botRoll - 1];

      let resultMessage = '';
      let resultEmoji = '';

      if (userRoll > botRoll) {
        userData.money += betAmount * 2; // Win double the bet amount
        resultEmoji = "🎉";
        resultMessage = `${resultEmoji} Congratulations ${userName}! You won ${betAmount * 2} money.\n\nYour roll: ${userDiceSymbol} (${userRoll})\nBot roll: ${botDiceSymbol} (${botRoll})`;
      } else if (userRoll < botRoll) {
        userData.money -= betAmount;
        resultEmoji = "😢";
        resultMessage = `${resultEmoji} Sorry ${userName}, you lost ${betAmount} money.\n\nYour roll: ${userDiceSymbol} (${userRoll})\nBot roll: ${botDiceSymbol} (${botRoll})`;
      } else {
        resultEmoji = "🤝";
        resultMessage = `${resultEmoji} It's a tie!\n\nYour roll: ${userDiceSymbol} (${userRoll})\nBot roll: ${botDiceSymbol} (${botRoll})\nNo money was won or lost.`;
      }

      // Save updated user data first
      await usersData.set(event.senderID, userData);

      // Send result
      api.sendMessage(resultMessage, event.threadID, event.messageID);

    } catch (error) {
      console.error("Error processing dice command:", error);
      api.sendMessage("⚠️ There was an error processing your request. Please try again later.", event.threadID, event.messageID);
    }
  }
};
