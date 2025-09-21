const LIMIT_INTERVAL_HOURS = 12;
const MAX_PLAYS = 20;
const MAX_BET = 6_000_000;

// Function to convert numbers to fancy superscript
function toFancyNumber(num) {
  const superscripts = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];
  return num.toString().split('').map(digit => 
    superscripts[parseInt(digit)] || digit
  ).join('');
}

// Function to format numbers with commas and superscript
function formatFancyNumber(num) {
  return toFancyNumber(num.toLocaleString());
}

module.exports = {
  config: {
    name: "slots",
    aliases: ["slot", "spin"],
    version: "2.4",
    author: "Raihan Upgrade",
    countDown: 3,
    role: 0,
    description: "🎰 Dynamic Slot Machine with coins & stylish headers",
    category: "game",
    guide: {
      en: "{pn} [bet] | {pn} stats | {pn} leaderboard"
    }
  },

  onStart: async function ({ message, event, args, usersData, api }) {
    const { senderID } = event;
    const command = args[0]?.toLowerCase();

    // Check for subcommands
    if (command === 'stats') {
      return await showSlotStats(api, event, usersData);
    }
    
    if (command === 'leaderboard') {
      return await showSlotLeaderboard(api, event, usersData);
    }

    // Original slot functionality
    const bet = parseInt(args[0]);

    // Format money
    const formatMoney = (amount) => {
      if (isNaN(amount)) return "💲0";
      amount = Number(amount);
      const scales = [
        { value: 1e15, suffix: 'Q', color: '🌈' },
        { value: 1e12, suffix: 'T', color: '✨' },
        { value: 1e9,  suffix: 'B', color: '💎' },
        { value: 1e6,  suffix: 'M', color: '💰' },
        { value: 1e3,  suffix: 'k', color: '💵' }
      ];
      const scale = scales.find(s => amount >= s.value);
      if (scale) {
        const scaledValue = (amount / scale.value).toFixed(2).replace(/\.00$/, "");
        return `${scale.color}${scaledValue}${scale.suffix}`;
      }
      return `💲${amount.toLocaleString()}`;
    };

    // Validate
    if (isNaN(bet) || bet <= 0) return message.reply("❌ Please enter a valid bet!");
    
    // Maximum bet limit
    if (bet > MAX_BET) {
      return message.reply(`❌ Maximum bet is ${MAX_BET.toLocaleString()}.`);
    }
    
    const user = await usersData.get(senderID);
    const userData = user.data || {};
    
    if (user.money < bet) return message.reply(`❌ You need ${formatMoney(bet - user.money)} more to play!`);

    // Cooldown check (12 hours)
    const now = Date.now();
    const lastPlays = userData.lastSlotTimes || [];

    // Filter old plays
    const validPlays = lastPlays.filter(time => now - time < LIMIT_INTERVAL_HOURS * 3600 * 1000);

    if (validPlays.length >= MAX_PLAYS) {
      return message.reply(
        `⛔ You've used all ${MAX_PLAYS} spins in the last ${LIMIT_INTERVAL_HOURS} hours.`
      );
    }

    // Headers with jackpot winner style
    const headers = [
      "╔══════════════╗\n    🏆 JACKPOT 🏆\n╚═══════════════╝",
      "🎰━━🏆JACKPOT 🏆━━🎰",
      "★彡[ 🏆JACKPOT🏆 ]彡★",
      "✪✪🏆 JACKPOT 🏆✪✪",
      "[ 🏆 JACKPOT 🏆 ]"
    ];
    const header = headers[Math.floor(Math.random() * headers.length)];

    // Check for lucky hour bonus (random 2-hour window with 1.5x multiplier)
    const LUCKY_HOUR_START = 18; // 6 PM
    const isLuckyHour = new Date().getHours() >= LUCKY_HOUR_START && 
                        new Date().getHours() < LUCKY_HOUR_START + 2;
    
    // Check for consecutive day bonus
    const lastPlayDate = userData.lastSlotDate ? new Date(userData.lastSlotDate) : null;
    const today = new Date().toDateString();
    const consecutiveDays = lastPlayDate && lastPlayDate.toDateString() === today ? 
                            userData.consecutiveSlotDays || 0 : 
                            (lastPlayDate && (new Date() - lastPlayDate) < 86400000 * 2 ? 
                            userData.consecutiveSlotDays || 0 : 0);

    // Deduct bet and update play log
    const updatedMoney = user.money - bet;
    validPlays.push(now);
    
    const updateData = {
      money: updatedMoney,
      data: {
        ...userData,
        lastSlotTimes: validPlays,
        lastSlotDate: now,
        consecutiveSlotDays: lastPlayDate && (new Date() - lastPlayDate) < 86400000 * 2 ? 
                         consecutiveDays + 1 : 1
      }
    };

    await usersData.set(senderID, updateData);

    // Symbols with weights
    const symbols = [
      { emoji: "🍒", weight: 30 },
      { emoji: "🍋", weight: 25 },
      { emoji: "🍇", weight: 20 },
      { emoji: "🍉", weight: 15 },
      { emoji: "⭐",  weight: 7 },
      { emoji: "7️⃣", weight: 3 }
    ];

    const roll = () => {
      const totalWeight = symbols.reduce((sum, s) => sum + s.weight, 0);
      let random = Math.random() * totalWeight;
      for (const s of symbols) {
        if (random < s.weight) return s.emoji;
        random -= s.weight;
      }
      return symbols[0].emoji;
    };

    const slot1 = roll(), slot2 = roll(), slot3 = roll();

    // Apply consecutive day bonus (up to 20% for 7+ days)
    const consecutiveBonus = Math.min(consecutiveDays, 7) * 0.03;
    
    // Apply lucky hour bonus if applicable
    const luckyBonus = isLuckyHour ? 0.5 : 0;

    // Win calc
    let winnings = 0, outcome, winType = "", bonus = "", coinsEarned = 0;
    if (slot1 === "7️⃣" && slot2 === "7️⃣" && slot3 === "7️⃣") {
      winnings = bet * 10;
      coinsEarned = bet * 5;
      outcome = "🔥 MEGA JACKPOT! TRIPLE 7️⃣!";
      winType = "💎 MAX WIN";
      bonus = "🎆 BONUS: +3% boost!";
    } 
    else if (slot1 === slot2 && slot2 === slot3) {
      winnings = bet * 5;
      coinsEarned = bet * 3;
      outcome = "💰 JACKPOT! 3 matching!";
      winType = "💫 BIG WIN";
    } 
    else if (slot1 === slot2 || slot2 === slot3 || slot1 === slot3) {
      winnings = bet * 2;
      coinsEarned = bet * 1;
      outcome = "✨ NICE! 2 matching!";
      winType = "🌟 WIN";
    } 
    else if (Math.random() < 0.5) {
      winnings = bet * 1.5;
      coinsEarned = Math.floor(bet * 0.5);
      outcome = "🎯 LUCKY SPIN! Bonus!";
      winType = "🍀 SMALL WIN";
    } 
    else {
      winnings = -bet;
      coinsEarned = 0;
      outcome = "💸 Better luck next time!";
      winType = "☠️ LOSS";
    }

    // Apply bonuses to winnings
    if (winnings > 0) {
      winnings = Math.floor(winnings * (1 + consecutiveBonus + luckyBonus));
    }

    let newBalance = updatedMoney + winnings;
    if (slot1 === "7️⃣" && slot2 === "7️⃣" && slot3 === "7️⃣") newBalance *= 1.03;
    if (newBalance < 0) newBalance = 0;

    // Update achievements
    if (winnings > 0) {
      const bigWinCount = userData.bigSlotWins || 0;
      if (winnings >= bet * 5) {
        updateData.data.bigSlotWins = bigWinCount + 1;
      }
      
      // Update total winnings
      updateData.data.totalSlotWinnings = (userData.totalSlotWinnings || 0) + winnings;
    }

    // save both money & coins and update last play time
    updateData.money = newBalance;
    updateData.data.totalSlotSpins = (userData.totalSlotSpins || 0) + 1;
    updateData.coins = (user.coins || 0) + coinsEarned;
    
    await usersData.set(senderID, updateData);

    const resultText = winnings >= 0 
      ? `💌 WON: ${formatMoney(winnings)}` 
      : `😥 LOST: ${formatMoney(bet)}`;

    // First "spinning" message
    const spinMsg = await message.reply(`${header}\n\n\n🎰 [ ⏳ | ⏳ | ⏳ ] 🎰\n\nSpinning...`);

    // Build result message
    const resultMessage = [
      `${header}`,
      ``,
      `🎰 [ ${slot1} | ${slot2} | ${slot3} ] 🎰`,
      ``,
      `${outcome}`,
      `${winType}`,
      `${bonus ? bonus + "\n" : ""}`,
      `${resultText}`,
      `💰 Balance: ${formatMoney(newBalance)}`,
      `🪙 Coins Earned: ${coinsEarned}`,
      consecutiveBonus > 0 ? `▢ ᴄᴏɴsᴇᴄᴜᴛɪᴠᴇ ᴅᴀʏ ʙᴏɴᴜs: +${Math.round(consecutiveBonus * 100)}%` : '',
      isLuckyHour ? `▢ 🍀 ʟᴜᴄᴋʏ ʜᴏᴜʀ ʙᴏɴᴜs: +50%` : '',
      ``,
      `⏰ Spins used: ${validPlays.length}/${MAX_PLAYS} (resets in ${LIMIT_INTERVAL_HOURS}h)`,
      `💡 TIP: Higher bets = higher jackpot chance!`
    ].filter(line => line !== '').join("\n");

    // After 2s → show result
    setTimeout(() => {
      api.editMessage(
        resultMessage,
        spinMsg.messageID
      );
    }, 2000);
  }
};

// Helper function to show slot statistics
async function showSlotStats(api, event, usersData) {
  const { senderID, threadID } = event;
  const user = await usersData.get(senderID);
  const userData = user.data || {};
  
  function formatMoney(amount) {
    if (isNaN(amount)) return "💲0";
    amount = Number(amount);
    const scales = [
      { value: 1e15, suffix: 'Q', color: '🌈' },
      { value: 1e12, suffix: 'T', color: '✨' },
      { value: 1e9,  suffix: 'B', color: '💎' },
      { value: 1e6,  suffix: 'M', color: '💰' },
      { value: 1e3,  suffix: 'k', color: '💵' }
    ];
    const scale = scales.find(s => amount >= s.value);
    if (scale) {
      const scaledValue = (amount / scale.value).toFixed(2).replace(/\.00$/, "");
      return `${scale.color}${scaledValue}${scale.suffix}`;
    }
    return `💲${amount.toLocaleString()}`;
  }
  
  const statsMessage = [
    "🎰 ━━━ ʏᴏᴜʀ sʟᴏᴛ sᴛᴀᴛs ━━━ 🎰",
    ``,
    `▢ ᴛᴏᴛᴀʟ sᴘɪɴs: ${userData.totalSlotSpins || 0}`,
    `▢ ʙɪɢ ᴡɪɴs (5x+): ${userData.bigSlotWins || 0}`,
 
    `▢ ᴊᴀᴄᴋᴘᴏᴛs: ${userData.slotJackpots || 0}`,
    `▢ ᴛᴏᴛᴀʟ ᴡɪɴɴɪɴɢs: ${formatMoney(userData.totalSlotWinnings || 0)}`,
    `▢ ᴄᴜʀʀᴇɴᴛ ʙᴀʟᴀɴᴄᴇ: ${formatMoney(user.money)}`,
    `▢ ᴄᴜʀʀᴇɴᴛ ᴄᴏɪɴs: ${user.coins || 0}`,
    `▢ ᴄᴏɴsᴇᴄᴜᴛɪᴠᴇ ᴅᴀʏs: ${userData.consecutiveSlotDays || 0}`,
    "",
    "💡 ᴛɪᴘ: Play during lucky hours (6PM-8PM) for bonus rewards!"
  ].join("\n");
  
  return api.sendMessage(statsMessage, threadID);
}

// Helper function to show slot leaderboard
async function showSlotLeaderboard(api, event, usersData) {
  const { threadID } = event;
  const allUsers = await usersData.getAll();
  
  function formatMoney(amount) {
    if (isNaN(amount)) return "💲0";
    amount = Number(amount);
    const scales = [
      { value: 1e15, suffix: 'Q', color: '🌈' },
      { value: 1e12, suffix: 'T', color: '✨' },
      { value: 1e9,  suffix: 'B', color: '💎' },
      { value: 1e6,  suffix: 'M', color: '💰' },
      { value: 1e3,  suffix: 'k', color: '💵' }
    ];
    const scale = scales.find(s => amount >= s.value);
    if (scale) {
      const scaledValue = (amount / scale.value).toFixed(2).replace(/\.00$/, "");
      return `${scale.color}${scaledValue}${scale.suffix}`;
    }
    return `💲${amount.toLocaleString()}`;
  }
  
  // Filter users with slot stats and sort by total winnings
  const slotPlayers = allUsers.filter(user => user.data?.totalSlotWinnings)
                              .sort((a, b) => (b.data.totalSlotWinnings || 0) - (a.data.totalSlotWinnings || 0))
                              .slice(0, 10);
  
  let leaderboardMessage = [
    "🏆 ━━━ sʟᴏᴛ ʟᴇᴀᴅᴇʀʙᴏᴀʀᴅ ━━━ 🏆",
    ``
  ].join("\n");
  
  if (slotPlayers.length === 0) {
    leaderboardMessage += "ɴᴏ ᴘʟᴀʏᴇʀs ʏᴇᴛ! ʙᴇ ᴛʜᴇ ғɪʀsᴛ ᴛᴏ sᴘɪɴ ᴛʜᴇ sʟᴏᴛs!";
  } else {
    slotPlayers.forEach((user, index) => {
      const rank = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`;
      leaderboardMessage += `${rank} ${user.name || `ᴜsᴇʀ${user.id}`}: ${formatMoney(user.data.totalSlotWinnings || 0)}\n`;
    });
  }
  
  return api.sendMessage(leaderboardMessage, threadID);
      }
