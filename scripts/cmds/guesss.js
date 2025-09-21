const guessOptions = ["🐣", "🔮", "🪄", "🍂", "🐥", "🙂", "🍀", "🌸", "🌼", "🐟", "🍎", "🍪", "🦄", 
                     "📱", "💻", "⌚", "🎮", "🕹️", "🎯", "🎧", "🎸", "📷", "🔦", "💾", "📀", "🧮", 
                     "🔌", "🔋", "💡", "⏰", "⏱️", "📡", "📟", "☎️", "📞", "🖨️", "🖱️", "💿", "📺", 
                     "🎥", "🔍", "🛰️", "🧭", "🤖", "👾", "💎", "🎁", "🎉", "🚀", "⭐", "🌟", "🌠"];
const fs = require("fs");

const LIMIT_INTERVAL_HOURS = 12;
const MAX_PLAYS = 20;
const WIN_RATE_THRESHOLD = 0.7; // 70% win rate to get bonus
const LOSS_LIMIT_RATE = 0.3; // If loss rate exceeds 30%, reduce bet requirements

module.exports = {
  config: {
    name: "guess",
    version: "2.1",
    author: "XNil",
    countDown: 5,
    role: 0,
    category: "game",
    shortDescription: {
      en: "Guess the emoji with win/loss tracking!"
    },
    guide: {
      en: "{pn} [amount] - Play guessing game\n{pn} top - See leaderboard\n{pn} stats - Check your stats"
    }
  },

  onStart: async function ({ args, event, message, usersData, commandName }) {
    const senderID = event.senderID;
    const user = await usersData.get(senderID);

    if (args[0] === "top") {
      const allUsers = await usersData.getAll();
      const filtered = allUsers
        .filter(u => u.data?.guessWin || u.data?.guessTotalPlays)
        .sort((a, b) => {
          const aWinRate = (a.data.guessWin || 0) / (a.data.guessTotalPlays || 1);
          const bWinRate = (b.data.guessWin || 0) / (b.data.guessTotalPlays || 1);
          return bWinRate - aWinRate;
        })
        .slice(0, 15);

      if (filtered.length === 0)
        return message.reply("🚫 No players yet!");

      const topList = filtered.map((u, i) => {
        const wins = u.data.guessWin || 0;
        const total = u.data.guessTotalPlays || 0;
        const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : 0;
        return `${i + 1}. ${u.name} - 🏆 ${wins} wins (${winRate}% win rate)`;
      }).join("\n");

      return message.reply(`🏆 TOP 15 GUESS PLAYERS 🏆\n\n${topList}`);
    }

    if (args[0] === "stats") {
      const wins = user.data?.guessWin || 0;
      const losses = user.data?.guessLoss || 0;
      const total = wins + losses;
      const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : 0;
      const lossRate = total > 0 ? ((losses / total) * 100).toFixed(1) : 0;
      const streak = user.data?.guessStreak || 0;
      const maxStreak = user.data?.guessMaxStreak || 0;
      
      const statsMessage = 
        `📊 YOUR GUESS STATS:\n\n` +
        `✅ Wins: ${wins}\n` +
        `❌ Losses: ${losses}\n` +
        `📈 Win Rate: ${winRate}%\n` +
        `📉 Loss Rate: ${lossRate}%\n` +
        `🔥 Current Streak: ${streak}\n` +
        `🏆 Max Streak: ${maxStreak}`;
      
      return message.reply(statsMessage);
    }

    const amount = parseInt(args[0]);
    const userBalance = user.money;

    if (isNaN(amount) || amount <= 0)
      return message.reply("⚠️ Please enter a valid positive amount to bet.");

    // Calculate user's win rate to determine if they qualify for lower minimum bet
    const wins = user.data?.guessWin || 0;
    const losses = user.data?.guessLoss || 0;
    const totalPlays = wins + losses;
    const winRate = totalPlays > 0 ? wins / totalPlays : 0;
    
    // High win rate players can bet smaller amounts
    const minBet = winRate > WIN_RATE_THRESHOLD ? 10 : 50;
    
    if (amount < minBet)
      return message.reply(`⚠️ Minimum bet is ${minBet} coins. ${winRate > WIN_RATE_THRESHOLD ? "You qualify for reduced minimum bet due to your high win rate!" : ""}`);

    if (userBalance < amount)
      return message.reply("💸 You don't have enough money to play.");
    const now = Date.now();
    const lastReset = user.data?.guessLastReset || 0;
    const playHistory = user.data?.guessPlayHistory || [];

    // If last reset was over 12 hours ago, reset the play history
    if (now - lastReset > LIMIT_INTERVAL_HOURS * 60 * 60 * 1000) {
      playHistory.length = 0;
      await usersData.set(senderID, {
        "data.guessLastReset": now,
        "data.guessPlayHistory": []
      });
    }

    if (playHistory.length >= MAX_PLAYS) {
      return message.reply(`⛔ You've reached the limit of ${MAX_PLAYS} plays in ${LIMIT_INTERVAL_HOURS} hours.\n⏳ Please wait and try again later.`);
    }

    // Generate options - ensure no duplicates
    const options = [];
    const usedIndices = new Set();
    
    while (options.length < 3) {
      const randomIndex = Math.floor(Math.random() * guessOptions.length);
      if (!usedIndices.has(randomIndex)) {
        options.push(guessOptions[randomIndex]);
        usedIndices.add(randomIndex);
      }
    }

    const correctIndex = Math.floor(Math.random() * 3);
    const correctEmoji = options[correctIndex];

    const msg = await message.reply(
      `🎯 GUESS THE EMOJI!\n\n` +
      `1️⃣ ${options[0]}    2️⃣ ${options[1]}    3️⃣ ${options[2]}\n\n` +
      `💰 Bet: ${amount} coins\n` +
      `📊 Your win rate: ${(winRate * 100).toFixed(1)}%\n\n` +
      `Reply with 1, 2, or 3 within 30 seconds to guess.`
    );

    const timeout = setTimeout(() => {
      message.reply("⌛ Time's up! You didn't guess in time.");
      global.GoatBot.onReply.delete(msg.messageID);
    }, 30 * 1000);

    global.GoatBot.onReply.set(msg.messageID, {
      commandName: this.config.name,
      author: senderID,
      correct: correctIndex + 1,
      bet: amount,
      emoji: correctEmoji,
      messageID: msg.messageID,
      timeout,
      playHistory,
      currentStreak: user.data?.guessStreak || 0
    });

    const remaining = MAX_PLAYS - playHistory.length - 1;
    if (remaining <= 3) {
      message.reply(`⚠️ You have ${remaining} play(s) left in the current ${LIMIT_INTERVAL_HOURS}-hour period.`);
    }
  },

  onReply: async function ({ event, message, Reply, usersData }) {
    const senderID = event.senderID;

    if (!["1", "2", "3"].includes(event.body.trim()))
      return message.reply("⚠️ Please reply with 1, 2, or 3 only.");

    if (senderID !== Reply.author)
      return message.reply("❌ This is not your game!");

    clearTimeout(Reply.timeout);
    global.GoatBot.onReply.delete(Reply.messageID);

    const user = await usersData.get(senderID);
    const guess = parseInt(event.body.trim());

    const now = Date.now();
    const playHistory = user.data?.guessPlayHistory || [];

    // Add current time to history
    playHistory.push(now);
    
    const wins = user.data?.guessWin || 0;
    const losses = user.data?.guessLoss || 0;
    const totalPlays = wins + losses + 1;
    const currentStreak = Reply.currentStreak;
    const maxStreak = user.data?.guessMaxStreak || 0;

    let resultMessage = "";
    let updatedData = {
      "data.guessPlayHistory": playHistory,
      "data.guessTotalPlays": totalPlays
    };

    if (guess === Reply.correct) {
      // Win logic
      const winMultiplier = currentStreak >= 3 ? 5 : 4; // Bonus for streaks
      const newMoney = user.money + Reply.bet * winMultiplier;
      const newWins = wins + 1;
      const newStreak = currentStreak + 1;
      const newMaxStreak = Math.max(maxStreak, newStreak);
      
      updatedData = {
        ...updatedData,
        money: newMoney,
        "data.guessWin": newWins,
        "data.guessStreak": newStreak,
        "data.guessMaxStreak": newMaxStreak
      };

      resultMessage =
        `✅ Correct! The emoji was ${Reply.emoji}\n\n` +
        `💰 You won: ${Reply.bet * winMultiplier} coins${currentStreak >= 3 ? ` (streak bonus!)` : ""}\n` +
        `💵 Your new balance: ${newMoney} coins\n` +
        `😊🔥 Win streak: ${newStreak}\n\n` +
        `🎉 Congratulations!`;
    } else {
      // Loss logic
      const newMoney = user.money - Reply.bet;
      const newLosses = losses + 1;
      
      updatedData = {
        ...updatedData,
        money: newMoney,
        "data.guessLoss": newLosses,
        "data.guessStreak": 0 // Reset streak on loss
      };

      resultMessage =
        `❌ Wrong! The correct answer was ${Reply.correct} → ${Reply.emoji}\n\n` +
        `💸 You lost: ${Reply.bet} coins\n` +
        `💵 Your new balance: ${newMoney} coins\n` +
        `😥 Better luck next time!`;
    }

    await usersData.set(senderID, updatedData);

    const remaining = MAX_PLAYS - playHistory.length;
    const limitInfo =
      `🎮 You've played ${playHistory.length}/${MAX_PLAYS} times in the last ${LIMIT_INTERVAL_HOURS} hours.\n` +
      `${remaining > 0 ? `🕹️ You can play ${remaining} more time(s).` : `⛔ No more plays left.`}`;

    return message.reply(`${resultMessage}\n\n${limitInfo}`);
  }
};
