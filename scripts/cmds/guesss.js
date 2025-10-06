const guessOptions = ["🐣", "🔮", "🪄", "🍂", "🐥", "🙂", "🍀", "🌸", "🌼", "🐟", "🍎", "🍪", "🦄", "💎", "🎁", "🎉", "🚀", "⭐", "🌟", "🌠", "🤖", "👾", "🛰️", "🧭", "🔍", "🎥", "📺", "💿", "🖱️", "🖨️", "📞", "☎️", "📟", "📡", "⏱️", "⏰", "💡", "🔋", "🔌", "🧮", "📀", "💾", "🔦", "📷", "🎸", "🎧", "🎯", "🕹️", "🎮", "⌚", "💻", "📱"];
const animalOptions = ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🐛", "🦋", "🐌", "🐞", "🐜", "🦗", "🕷️", "🐢", "🐍", "🦎", "🦂", "🦀", "🦑", "🦐", "🐠", "🐡", "🐬", "🦈", "🐳", "🐋", "🐊", "🐅", "🐆", "🦓", "🦍", "🐘", "🦏", "🐪", "🦒", "🐃", "🐂", "🐄", "🐎", "🐖", "🐏", "🐑", "🐐", "🦌", "🐕", "🐩", "🐈", "🐓", "🦃", "🕊️", "🐇", "🐁", "🐀", "🐿️"];
const fs = require("fs");

// --- UTILITY ---
// New text formatter to apply the requested style
const formatText = (text) => {
    const charMap = {
        'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ꜰ', 'g': 'ɢ', 'h': 'ʜ', 'i': 'ɪ', 'j': 'ᴊ', 'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ',
        'n': 'ɴ', 'o': 'ᴏ', 'p': 'ᴘ', 'q': 'ǫ', 'r': 'ʀ', 's': 's', 't': 'ᴛ', 'u': 'ᴜ', 'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x', 'y': 'ʏ', 'z': 'ᴢ'
    };
    return ` ${text.toString().toLowerCase().split('').map(char => charMap[char] || char).join('')} `;
};

// --- GAME CONFIGURATION ---
const ADMIN_UIDS = ["YOUR_ADMIN_UID_HERE"]; // Add admin User IDs here
const LIMIT_INTERVAL_HOURS = 12;
const MAX_PLAYS = 20;
const MIN_BET = 50;
const PRESTIGE_COST_WINS = 250; // Wins required to prestige

// --- REWARDS & MULTIPLIERS ---
const NORMAL_REWARD_MULTIPLIER = 3;
const STREAK_BONUS_MULTIPLIER = 5;
const HARD_MODE_REWARD_MULTIPLIER = 6;
const HARD_MODE_STREAK_MULTIPLIER = 10;
const PRESTIGE_BONUS_PER_LEVEL = 0.1; // 10% bonus per prestige level

// --- JACKPOT CONFIG ---
const JACKPOT_TAX_RATE = 0.01; // 1% of every bet goes to the jackpot
const BASE_JACKPOT_WIN_CHANCE = 0.001; // 0.1% base chance to win jackpot on a correct guess
const HARD_MODE_JACKPOT_MULTIPLIER = 2; // Hard mode doubles the chance

// --- DYNAMIC ECONOMY ---
const SHOP_ITEMS = {
  hint: { basePrice: 1500, description: "Removes one incorrect option.", sellable: true },
  shield: { basePrice: 3000, description: "Protects your win streak on a loss.", sellable: true },
  insurance: { basePrice: 4000, description: "Returns 50% of your bet on a loss.", sellable: true },
  secondchance: { basePrice: 7500, description: "Gives you a second guess if you're wrong.", sellable: true },
  luckpotion: { basePrice: 2000, description: "Boosts win multiplier for one game.", sellable: true }
};
const GAME_EPOCH = 1728249600000;
const DAILY_INFLATION_AMOUNT = 500;
const PERSONAL_SURCHARGE_AMOUNT = 1000;
const ITEM_SELL_RATE = 0.4; // Sell items for 40% of their base price

// --- DAILY & WEEKLY REWARDS ---
const DAILY_REWARD = { coins: 1000, hints: 1 };
const LOGIN_STREAK_BONUS = { 3: { coins: 2500 }, 7: { coins: 10000, shields: 1 } };
const WEEKLY_QUESTS = {
    winGames: { goal: 15, reward: { coins: 20000, hints: 2 }, text: "Win 15 games" },
    playHard: { goal: 5, reward: { coins: 15000, shields: 1 }, text: "Win 5 hard mode games" }
};

// --- ACHIEVEMENTS & TITLES ---
const ACHIEVEMENTS = {
  WIN_10: { name: "Novice Guesser", requirement: (d) => d.wins >= 10, reward: 2000, title: "Novice" },
  WIN_50: { name: "Skilled Guesser", requirement: (d) => d.wins >= 50, reward: 10000, title: "Skilled" },
  WIN_100: { name: "Master Guesser", requirement: (d) => d.wins >= 100, reward: 50000, title: "Master" },
  STREAK_5: { name: "On Fire!", requirement: (d) => d.maxStreak >= 5, reward: 7500, title: "On Fire" },
  STREAK_10: { name: "Unstoppable!", requirement: (d) => d.maxStreak >= 10, reward: 25000, title: "Unstoppable" },
  PLAY_100: { name: "Veteran Player", requirement: (d) => d.totalPlays >= 100, reward: 10000, title: "Veteran" },
  PRESTIGE_1: { name: "Ascended", requirement: (d) => d.prestige >= 1, reward: 100000, title: "Ascended" },
  HIGH_ROLLER: { name: "High Roller", requirement: (d) => d.personalBests.highestWin >= 100000, reward: 50000, title: "High Roller" },
  JACKPOT_WINNER: { name: "Lucky One", requirement: (d) => d.jackpotWins > 0, reward: 25000, title: "Lucky" },
  ZEN_MASTER: { name: "Zen Master", requirement: (d) => d.zenWins >= 50, reward: 10000, title: "Zen" }
};

// Global data (emulates a simple DB)
let globalData = {
    jackpot: 100000,
    totalBets: 0,
    totalGamesPlayed: 0,
    dailyDeal: { item: 'hint', discount: 0.2, timestamp: 0 } // 20% off
};

module.exports = {
  config: {
    name: "guess",
    version: "4.0",
    author: "XNil (Upgraded by Coding Partner)",
    countDown: 5,
    role: 0,
    category: "game",
    shortDescription: { en: "Guess the emoji with a deep economy and multiple game modes!" },
    guide: {
        en: "{pn} <amount|allin> [--use <item>]\n" +
            "{pn} hard <amount|allin> [--use <item>]\n" +
            "{pn} zen - Play for fun, no bets\n" +
            "{pn} stats [@mention] - Check stats\n" +
            "{pn} top [wins|streak|winrate|winnings] - Leaderboards\n" +
            "{pn} shop [buy|sell|info <item>] - Dynamic shop\n" +
            "{pn} daily - Claim daily reward\n" +
            "{pn} gift <@mention> <amount|item> <quantity>\n" +
            "{pn} prestige - Reset stats for permanent perks\n" +
            "{pn} title [set|list] <title> - Set your display title\n" +
            "{pn} quest - Check your weekly quests\n" +
            "{pn} history - View your last 5 games\n" +
            "{pn} globalstats - View bot-wide game stats\n" +
            "{pn} help - Detailed command info"
    }
  },

  async getUserData(usersData, senderID) {
    const user = await usersData.get(senderID);
    if (!user.data) user.data = {};
    const now = new Date();
    const startOfWeek = now.getDate() - now.getDay();
    const weekTimestamp = new Date(now.setDate(startOfWeek)).setHours(0,0,0,0);

    const defaultData = {
        wins: 0, losses: 0, totalPlays: 0, streak: 0, maxStreak: 0,
        totalWon: 0, totalLost: 0, zenWins: 0, jackpotWins: 0,
        inventory: { hints: 0, shields: 0, insurances: 0, secondchances: 0, luckpotions: 0 },
        achievements: [], lastReset: 0, playHistory: [], lastDaily: 0,
        dailyPurchases: { timestamp: 0, hint: 0, shield: 0, insurance: 0, secondchance: 0, luckpotion: 0 },
        prestige: 0, title: null, theme: "🎯",
        loginStreak: 0, lastLoginDay: 0,
        mercyCount: 0, // For mercy system
        personalBests: { highestWin: 0, highestStreak: 0 },
        weeklyQuest: { timestamp: 0, winGames: 0, playHard: 0 }
    };
    
    if (!user.data.guessData) {
        user.data.guessData = defaultData;
    } else {
        // This loop adds any new properties from defaultData if they are missing
        for (const key in defaultData) {
            if (user.data.guessData[key] === undefined) {
                user.data.guessData[key] = defaultData[key];
            }
        }
        if(user.data.guessData.weeklyQuest.timestamp < weekTimestamp) {
            user.data.guessData.weeklyQuest = { timestamp: weekTimestamp, winGames: 0, playHard: 0 };
        }
    }
    return user;
  },
  
  async checkAndAwardAchievements(message, usersData, senderID, userData) {
    const guessData = userData.data.guessData;
    let newAchievements = false;
    let achievementMessage = "🏆 ACHIEVEMENT UNLOCKED! 🏆\n\n";
    let totalReward = 0;

    for (const achID in ACHIEVEMENTS) {
      if (!guessData.achievements.includes(achID)) {
        const ach = ACHIEVEMENTS[achID];
        if (ach.requirement(guessData)) {
          guessData.achievements.push(achID);
          userData.money += ach.reward;
          totalReward += ach.reward;
          achievementMessage += `✨ ${ach.name} - *${ach.description}*\nReward: ${ach.reward} coins\n`;
          newAchievements = true;
        }
      }
    }

    if (newAchievements) {
      await usersData.set(senderID, userData);
      message.reply(formatText(achievementMessage + `\n💰 Total bonus: ${totalReward} coins have been added to your balance.`));
    }
  },

  // --- DYNAMIC ECONOMY & SHOP HELPERS ---
  getDaysPassed: () => Math.floor((Date.now() - GAME_EPOCH) / (24 * 60 * 60 * 1000)),
  
  checkAndResetDailyData: function(guessData) {
      const startOfToday = new Date().setHours(0, 0, 0, 0);
      if (guessData.dailyPurchases.timestamp < startOfToday) {
          guessData.dailyPurchases = { timestamp: startOfToday, hint: 0, shield: 0, insurance: 0, secondchance: 0, luckpotion: 0 };
      }
      if (globalData.dailyDeal.timestamp < startOfToday) {
          const items = Object.keys(SHOP_ITEMS).filter(i => SHOP_ITEMS[i].sellable);
          globalData.dailyDeal = {
              item: items[Math.floor(Math.random() * items.length)],
              discount: Math.round((Math.random() * (0.4 - 0.15) + 0.15) * 100) / 100, // 15-40% discount
              timestamp: startOfToday
          };
      }
      return guessData;
  },

  calculatePrice: function(itemName, guessData) {
      const inflation = this.getDaysPassed() * DAILY_INFLATION_AMOUNT;
      const surcharge = (guessData.dailyPurchases[itemName] || 0) * PERSONAL_SURCHARGE_AMOUNT;
      const basePrice = SHOP_ITEMS[itemName].basePrice;
      let finalPrice = basePrice + inflation + surcharge;
      if(itemName === globalData.dailyDeal.item){
          finalPrice *= (1 - globalData.dailyDeal.discount);
      }
      return Math.round(finalPrice);
  },

  onStart: async function ({ args, event, message, usersData, commandName, api }) {
    const senderID = event.senderID;
    let user = await this.getUserData(usersData, senderID);
    let guessData = user.data.guessData;
    guessData = this.checkAndResetDailyData(guessData);
    const subCmd = args[0]?.toLowerCase();

    // --- NEW COMMANDS ---
    switch(subCmd) {
        case "stats": {
            let targetID = senderID;
            let targetName = "YOUR";
            if (Object.keys(event.mentions).length > 0) {
                targetID = Object.keys(event.mentions)[0];
                targetName = event.mentions[targetID].toUpperCase() + "'S";
            }
            const targetUser = await this.getUserData(usersData, targetID);
            const data = targetUser.data.guessData;
            const winRate = data.totalPlays > 0 ? ((data.wins / data.totalPlays) * 100).toFixed(1) : 0;
            const prestigeBonus = (data.prestige * PRESTIGE_BONUS_PER_LEVEL * 100).toFixed(0);

            let statsMessage = `📊 ${targetName} GUESS STATS 📊\n` +
                (data.title ? `👑 Title: ${data.title}\n` : '') +
                `🎖️ Prestige Level: ${data.prestige} (+${prestigeBonus}% Rewards)\n\n` +
                `✅ Wins: ${data.wins}\n` +
                `❌ Losses: ${data.losses}\n` +
                `🧘 Zen Wins: ${data.zenWins}\n` +
                `📈 Win Rate: ${winRate}%\n` +
                `🔥 Current Streak: ${data.streak}\n` +
                `🏆 Max Streak: ${data.maxStreak}\n` +
                `💰 Total Won: ${data.totalWon.toLocaleString()} coins\n` +
                `💸 Total Lost: ${data.totalLost.toLocaleString()} coins\n` +
                `🎰 Jackpot Wins: ${data.jackpotWins}\n\n` +
                `🎒 INVENTORY:\n` +
                Object.entries(data.inventory).map(([key, value]) => `  - ${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`).join('\n') + `\n\n` +
                `📜 ACHIEVEMENTS: ${data.achievements.length > 0 ? data.achievements.join(', ') : 'None yet!'}`;
            return message.reply(formatText(statsMessage));
        }
        case "top": {
            const allUsers = await usersData.getAll();
            const filter = args[1]?.toLowerCase() || 'winrate';
            let sortFunc;
            let title = '🏆 TOP 10 GUESS PLAYERS 🏆\n';

            switch (filter) {
                case 'wins':
                    sortFunc = (a, b) => (b.data.guessData.wins || 0) - (a.data.guessData.wins || 0);
                    title += '(Ranked by Total Wins)';
                    break;
                case 'streak':
                    sortFunc = (a, b) => (b.data.guessData.maxStreak || 0) - (a.data.guessData.maxStreak || 0);
                    title += '(Ranked by Max Streak)';
                    break;
                case 'winnings':
                    sortFunc = (a, b) => (b.data.guessData.totalWon || 0) - (a.data.guessData.totalWon || 0);
                    title += '(Ranked by Total Winnings)';
                    break;
                default: // winrate
                    sortFunc = (a, b) => {
                        const aRate = ((a.data.guessData.wins || 0) / (a.data.guessData.totalPlays || 1));
                        const bRate = ((b.data.guessData.wins || 0) / (b.data.guessData.totalPlays || 1));
                        return bRate - aRate;
                    };
                    title += '(Ranked by Win Rate)';
                    break;
            }

            const topList = allUsers
                .filter(u => u.data?.guessData?.totalPlays > 0)
                .sort(sortFunc)
                .slice(0, 10)
                .map((u, i) => {
                    const d = u.data.guessData;
                    const wr = ((d.wins || 0) / (d.totalPlays || 1) * 100).toFixed(1);
                    return `${i + 1}. ${u.name} - ${d.wins} W / ${wr}% WR / ${d.maxStreak}🔥 / ${d.totalWon.toLocaleString()}💰`;
                }).join("\n");
            
            return message.reply(formatText(topList.length > 0 ? `${title}\n\n${topList}` : "No players on the leaderboard yet!"));
        }
        case "help": {
             const helpMessage = `❓ GUESS GAME HELP ❓\n\n` +
                `▶️ {pn} <amount|allin>: Start a normal game.\n` +
                `▶️ {pn} hard <amount|allin>: Start a hard game.\n` +
                `▶️ {pn} zen: Play a relaxing, no-bet game.\n\n` +
                `📊 {pn} stats [@mention]: View stats.\n` +
                `🏆 {pn} top [filter]: View leaderboards (wins, streak, winrate, winnings).\n` +
                `📜 {pn} history: See your last 5 game results.\n` +
                `🌍 {pn} globalstats: View server-wide game stats.\n\n` +
                `🛒 {pn} shop [buy|sell|info]: Access the item shop.\n` +
                `🎁 {pn} gift <@mention> <amount|item> [quantity]: Give coins or items.\n` +
                `📅 {pn} daily: Claim your daily reward.\n` +
                `📝 {pn} quest: Check weekly quests.\n\n` +
                `✨ {pn} prestige: Reset stats for a permanent reward boost.\n` +
                `👑 {pn} title [set|list]: Manage your unlocked titles.\n\n` +
                `💡 Use items with '--use <item>' after your bet.`;
            return message.reply(formatText(helpMessage));
        }
        case "shop": {
            const action = args[1]?.toLowerCase();
            const itemName = args[2]?.toLowerCase();
            
            if(action === 'buy') {
                if (!itemName || !SHOP_ITEMS[itemName]) return message.reply(formatText(`Invalid item. Available: ${Object.keys(SHOP_ITEMS).join(', ')}.`));
                const price = this.calculatePrice(itemName, guessData);
                if (user.money < price) return message.reply(formatText(`You need ${price.toLocaleString()} coins to buy a ${itemName}, but you only have ${user.money.toLocaleString()}.`));
                
                user.money -= price;
                guessData.inventory[itemName + 's'] = (guessData.inventory[itemName + 's'] || 0) + 1;
                guessData.dailyPurchases[itemName]++;
                await usersData.set(senderID, user);
                return message.reply(formatText(`Successfully bought 1 ${itemName} for ${price.toLocaleString()} coins!`));
            }
            if (action === 'sell') {
                if (!itemName || !SHOP_ITEMS[itemName] || !SHOP_ITEMS[itemName].sellable) return message.reply(formatText(`You can't sell that item.`));
                if (!guessData.inventory[itemName + 's'] || guessData.inventory[itemName + 's'] <= 0) return message.reply(formatText(`You don't have any ${itemName}s to sell.`));

                const sellPrice = Math.round(SHOP_ITEMS[itemName].basePrice * ITEM_SELL_RATE);
                user.money += sellPrice;
                guessData.inventory[itemName + 's']--;
                await usersData.set(senderID, user);
                return message.reply(formatText(`You sold 1 ${itemName} for ${sellPrice.toLocaleString()} coins.`));
            }
            if (action === 'info') {
                if (!itemName || !SHOP_ITEMS[itemName]) return message.reply(formatText(`Invalid item.`));
                const price = this.calculatePrice(itemName, guessData);
                const desc = SHOP_ITEMS[itemName].description;
                return message.reply(formatText(`-- ${itemName.toUpperCase()} --\nDescription: ${desc}\nToday's Buy Price: ${price.toLocaleString()} coins.`));
            }

            // Default shop view
            let shopMessage = `🛒 DYNAMIC ITEM SHOP 🛒\n*Prices increase with demand.*\n\n` +
                              `Today's Deal: ${globalData.dailyDeal.item.toUpperCase()} is ${globalData.dailyDeal.discount * 100}% off!\n\n`;
            for (const item in SHOP_ITEMS) {
                const price = this.calculatePrice(item, guessData);
                const dealText = item === globalData.dailyDeal.item ? ' (DEAL!)' : '';
                shopMessage += `🔹 ${item.charAt(0).toUpperCase() + item.slice(1)}${dealText} - Price: ${price.toLocaleString()} coins\n*${SHOP_ITEMS[item].description}*\n\n`;
            }
            shopMessage += `To buy: {pn} shop buy <item>\nTo sell: {pn} shop sell <item>`;
            return message.reply(formatText(shopMessage));
        }
        case "daily": {
            const now = new Date();
            const today = now.setHours(0,0,0,0);
            const cooldown = 22 * 60 * 60 * 1000;
            if (Date.now() - guessData.lastDaily < cooldown) {
                const remainingTime = new Date(guessData.lastDaily + cooldown);
                return message.reply(formatText(`You've already claimed your daily reward. Please come back after ${remainingTime.toLocaleTimeString()}.`));
            }

            let replyMsg = `🎉 DAILY REWARD CLAIMED! 🎉\n\nYou received ${DAILY_REWARD.coins.toLocaleString()} coins and ${DAILY_REWARD.hints} hint(s)!`;
            user.money += DAILY_REWARD.coins;
            guessData.inventory.hints += DAILY_REWARD.hints;
            guessData.lastDaily = Date.now();
            
            const lastLoginDate = new Date(guessData.lastLoginDay).setHours(0,0,0,0);
            const yesterday = new Date(today).setDate(new Date(today).getDate() - 1);

            if(lastLoginDate === yesterday) {
                guessData.loginStreak++;
                replyMsg += `\n🔥 You've logged in for ${guessData.loginStreak} days in a row!`
                if(LOGIN_STREAK_BONUS[guessData.loginStreak]) {
                    const bonus = LOGIN_STREAK_BONUS[guessData.loginStreak];
                    const coinBonus = bonus.coins || 0;
                    const shieldBonus = bonus.shields || 0;
                    user.money += coinBonus;
                    guessData.inventory.shields += shieldBonus;
                    replyMsg += `\n✨ Streak Bonus! You get an extra ${coinBonus > 0 ? `${coinBonus} coins` : ''} ${shieldBonus > 0 ? `${shieldBonus} shields` : ''}!`;
                }
            } else if (lastLoginDate < yesterday) {
                guessData.loginStreak = 1; // Reset streak
            }
            guessData.lastLoginDay = today;
            
            await usersData.set(senderID, user);
            return message.reply(formatText(replyMsg));
        }
        case "prestige": {
            if(guessData.wins < PRESTIGE_COST_WINS) {
                return message.reply(formatText(`You need at least ${PRESTIGE_COST_WINS} total wins to prestige. You have ${guessData.wins}.`));
            }
            
            guessData.prestige += 1;
            guessData.wins = 0;
            guessData.losses = 0;
            guessData.totalPlays = 0;
            guessData.streak = 0;
            guessData.maxStreak = 0;
            guessData.totalWon = 0;
            guessData.totalLost = 0;
            user.money += 50000; // Bonus for prestiging

            await usersData.set(senderID, user);
            await this.checkAndAwardAchievements(message, usersData, senderID, user);
            return message.reply(formatText(`🌟 PRESTIGE LEVEL UP! 🌟\nYou are now Prestige ${guessData.prestige}!\nYour stats have been reset, but you now gain a permanent ${(guessData.prestige * PRESTIGE_BONUS_PER_LEVEL * 100)}% bonus to all winnings! You also received 50,000 coins.`));
        }
        case "title": {
            const action = args[1]?.toLowerCase();
            const unlockedTitles = guessData.achievements.map(a => ACHIEVEMENTS[a].title).filter(Boolean);

            if(action === 'list' || !action) {
                if(unlockedTitles.length === 0) return message.reply(formatText("You have not unlocked any titles yet. Earn achievements to get them!"));
                return message.reply(formatText(`-- UNLOCKED TITLES --\n${unlockedTitles.join('\n')}\n\nYour current title: ${guessData.title || 'None'}`));
            }
            if(action === 'set') {
                const titleToSet = args[2];
                if(!titleToSet) return message.reply(formatText("Please specify a title to set."));
                if(!unlockedTitles.find(t => t.toLowerCase() === titleToSet.toLowerCase())) return message.reply(formatText("You have not unlocked that title."));
                
                guessData.title = unlockedTitles.find(t => t.toLowerCase() === titleToSet.toLowerCase());
                await usersData.set(senderID, user);
                return message.reply(formatText(`Your title has been set to: ${guessData.title}`));
            }
            if(action === 'clear') {
                guessData.title = null;
                await usersData.set(senderID, user);
                return message.reply(formatText(`Your title has been cleared.`));
            }
            return message.reply(formatText("Invalid action. Use 'set', 'list', or 'clear'."));
        }
        case "gift": {
            if (Object.keys(event.mentions).length === 0) return message.reply(formatText("You must mention a user to gift to."));
            const targetID = Object.keys(event.mentions)[0];
            if(targetID === senderID) return message.reply(formatText("You cannot gift yourself."));
            
            const targetUser = await usersData.get(targetID);
            if(!targetUser) return message.reply(formatText("Could not find the user you want to gift."));

            const gift = args[2]?.toLowerCase();
            const amount = parseInt(args[3]) || 1;

            if(!gift || amount <= 0) return message.reply(formatText("Invalid gift or amount."));
            
            if(!isNaN(gift)){ // Gifting coins
                const coinAmount = parseInt(gift);
                if(user.money < coinAmount) return message.reply(formatText(`You don't have ${coinAmount} coins to gift.`));
                user.money -= coinAmount;
                targetUser.money += coinAmount;
                await usersData.set(senderID, user);
                await usersData.set(targetID, targetUser);
                return message.reply(formatText(`You have gifted ${coinAmount.toLocaleString()} coins to ${event.mentions[targetID]}.`));
            } else { // Gifting items
                const itemName = gift;
                if(!SHOP_ITEMS[itemName]) return message.reply(formatText("That is not a valid item."));
                const itemKey = itemName + 's';
                if(!guessData.inventory[itemKey] || guessData.inventory[itemKey] < amount) return message.reply(formatText(`You do not have ${amount} ${itemName}(s) to gift.`));
                
                if(!targetUser.data.guessData) targetUser.data.guessData = (await this.getUserData(usersData, targetID)).data.guessData; // Initialize if new
                
                guessData.inventory[itemKey] -= amount;
                targetUser.data.guessData.inventory[itemKey] = (targetUser.data.guessData.inventory[itemKey] || 0) + amount;
                await usersData.set(senderID, user);
                await usersData.set(targetID, targetUser);
                return message.reply(formatText(`You have gifted ${amount} ${itemName}(s) to ${event.mentions[targetID]}.`));
            }
        }
        case "history": {
            if(guessData.playHistory.length === 0) return message.reply(formatText("You haven't played any games yet."));
            let historyMsg = "📜 YOUR LAST 5 GAMES 📜\n\n";
            const recentGames = guessData.playHistory.slice(-5).reverse();
            recentGames.forEach((game, i) => {
                historyMsg += `${i + 1}. ${game.result === 'win' ? '✅ Win' : '❌ Loss'} | Bet: ${game.bet.toLocaleString()} | Outcome: ${game.change.toLocaleString()} coins\n`;
            });
            return message.reply(formatText(historyMsg));
        }
        case "globalstats": {
            return message.reply(formatText(`🌍 GLOBAL GUESS STATS 🌍\n\n` +
                `💰 Current Jackpot: ${globalData.jackpot.toLocaleString()} coins\n` +
                `🎲 Total Games Played: ${globalData.totalGamesPlayed.toLocaleString()}\n` +
                `💸 Total Coins Bet: ${globalData.totalBets.toLocaleString()}`
            ));
        }
        case "quest": {
            const q = guessData.weeklyQuest;
            let questMsg = `📝 YOUR WEEKLY QUESTS 📝\n\n`;
            questMsg += `1. ${WEEKLY_QUESTS.winGames.text}: ${q.winGames}/${WEEKLY_QUESTS.winGames.goal}\n`;
            questMsg += `2. ${WEEKLY_QUESTS.playHard.text}: ${q.playHard}/${WEEKLY_QUESTS.playHard.goal}\n\n`;
            questMsg += `Quests reset weekly.`;
            return message.reply(formatText(questMsg));
        }
        case "admin": {
            if (!ADMIN_UIDS.includes(senderID)) return message.reply(formatText("You are not authorized to use this command."));
            const adminAction = args[1]?.toLowerCase();
            const targetMention = Object.keys(event.mentions)[0];
            const value = args[3];

            if(!adminAction || !targetMention || !value) return message.reply(formatText("Usage: {pn} admin <setmoney|giveitem|reset> @mention <value>"));
            let targetUser = await this.getUserData(usersData, targetMention);
            
            switch(adminAction) {
                case "setmoney":
                    targetUser.money = parseInt(value);
                    await usersData.set(targetMention, targetUser);
                    return message.reply(formatText(`Set ${event.mentions[targetMention]}'s money to ${value}.`));
                case "giveitem":
                    const item = value.toLowerCase();
                    const amount = parseInt(args[4]) || 1;
                    if(!SHOP_ITEMS[item]) return message.reply(formatText("Invalid item."));
                    targetUser.data.guessData.inventory[item + 's'] += amount;
                    await usersData.set(targetMention, targetUser);
                    return message.reply(formatText(`Gave ${amount} ${item}(s) to ${event.mentions[targetMention]}.`));
                case "reset":
                    targetUser.data.guessData = undefined; // will be reset on next command
                    await usersData.set(targetMention, targetUser);
                    return message.reply(formatText(`Reset all guess data for ${event.mentions[targetMention]}.`));
                default:
                    return message.reply(formatText("Invalid admin action."));
            }
        }
        
        // --- GAME MODES ---
        case "zen": {
            const options = [];
            while (options.length < 3) {
                const emoji = guessOptions[Math.floor(Math.random() * guessOptions.length)];
                if (!options.includes(emoji)) options.push(emoji);
            }
            const correctIndex = Math.floor(Math.random() * 3);
            const promptMessage = `🧘 ZEN MODE 🧘\n\n` +
                `Guess the emoji for fun! No bets, no streaks.\n\n` +
                options.map((opt, i) => `${i + 1}️⃣ ${opt}`).join('    ') + `\n\n` +
                `Reply with a number (1-3).`;
            
            const msg = await message.reply(formatText(promptMessage));
            global.GoatBot.onReply.set(msg.messageID, {
                commandName: this.config.name, author: senderID, correct: correctIndex + 1,
                emoji: options[correctIndex], messageID: msg.messageID, isZen: true
            });
            return;
        }
        default: { // Main game logic
            const isHardMode = subCmd === 'hard';
            let amountIndex = isHardMode ? 1 : 0;
            let amountArg = args[amountIndex]?.toLowerCase();

            if (!amountArg) return message.reply(formatText("Please enter an amount to bet."));
            
            let amount;
            if(amountArg === 'allin') {
                amount = user.money;
            } else {
                amount = parseInt(amountArg);
            }

            if (isNaN(amount) || amount <= 0) return message.reply(formatText("Please enter a valid positive amount to bet."));
            if (amount < MIN_BET) return message.reply(formatText(`Minimum bet is ${MIN_BET} coins.`));
            if (user.money < amount) return message.reply(formatText("You don't have enough money to play."));
            
            const now = Date.now();
            const playHistoryInWindow = guessData.playHistory.filter(p => now - p.timestamp < LIMIT_INTERVAL_HOURS * 60 * 60 * 1000);
            if (playHistoryInWindow.length >= MAX_PLAYS) {
              return message.reply(formatText(`You've reached the limit of ${MAX_PLAYS} plays in ${LIMIT_INTERVAL_HOURS} hours.`));
            }
            
            // Item usage
            let usedItem = null;
            const useIndex = args.indexOf('--use');
            if (useIndex > -1 && args[useIndex + 1]) {
                const item = args[useIndex + 1].toLowerCase();
                const itemKey = item + 's';
                if (SHOP_ITEMS[item] && guessData.inventory[itemKey] > 0) {
                    usedItem = item;
                } else {
                    return message.reply(formatText(`You tried to use '${item}', but you either don't own it or it's invalid.`));
                }
            }
            
            let numOptions = isHardMode ? 5 : 3;
            if (guessData.mercyCount >= 5) numOptions = 2; // Mercy system

            const currentEmojiSet = animalOptions; // Could be a user setting later
            const options = [];
            while (options.length < numOptions) {
                const emoji = currentEmojiSet[Math.floor(Math.random() * currentEmojiSet.length)];
                if (!options.includes(emoji)) options.push(emoji);
            }

            const correctIndex = Math.floor(Math.random() * numOptions);
            const correctEmoji = options[correctIndex];
            let promptMessage = `${guessData.theme} GUESS THE EMOJI (${isHardMode ? 'HARD' : 'NORMAL'}) ${guessData.theme}\n\n`;
            
            if (guessData.mercyCount >= 5) promptMessage += `🍀 Mercy Mode Active! You have fewer choices this round.\n\n`;

            if (usedItem === 'hint') {
                let removedIndex;
                do { removedIndex = Math.floor(Math.random() * numOptions); } while (removedIndex === correctIndex);
                promptMessage += options.map((opt, i) => `${i + 1}️⃣ ${i === removedIndex ? '❓' : opt}`).join('    ');
                promptMessage += `\n\n💡 A hint was used, removing one wrong answer!`;
                guessData.inventory.hints--;
            } else {
                promptMessage += options.map((opt, i) => `${i + 1}️⃣ ${opt}`).join('    ');
            }

            promptMessage += `\n\n💰 Bet: ${amount.toLocaleString()} coins\n🔥 Streak: ${guessData.streak}\n\n` +
                             `Reply with a number (1-${numOptions}).`;

            if (usedItem) promptMessage += `\n\n✨ Using: ${usedItem.charAt(0).toUpperCase() + usedItem.slice(1)}`;
            
            const msg = await message.reply(formatText(promptMessage));
            global.GoatBot.onReply.set(msg.messageID, {
                commandName: this.config.name, author: senderID, correct: correctIndex + 1,
                bet: amount, emoji: correctEmoji, messageID: msg.messageID,
                isHardMode, usedItem, numOptions, options
            });
          }
      }
  },

  onReply: async function ({ event, message, Reply, usersData }) {
    const senderID = event.senderID;
    if (senderID !== Reply.author) return;

    global.GoatBot.onReply.delete(Reply.messageID);
    let user = await this.getUserData(usersData, senderID);
    let guessData = user.data.guessData;
    
    // Zen Mode Reply
    if(Reply.isZen) {
        const guess = parseInt(event.body.trim());
        if (guess === Reply.correct) {
            guessData.zenWins++;
            await usersData.set(senderID, user);
            await this.checkAndAwardAchievements(message, usersData, senderID, user);
            return message.reply(formatText(`Correct! The emoji was ${Reply.emoji}. You now have ${guessData.zenWins} Zen wins.`));
        } else {
            return message.reply(formatText(`Incorrect. The right emoji was ${Reply.correct} → ${Reply.emoji}. Keep practicing!`));
        }
    }
    
    // Double or Nothing Reply
    if(Reply.isDoubleOrNothing) {
        const choice = event.body.trim().toLowerCase();
        if(choice === 'double') {
            const numOptions = 5; // Always hard for double or nothing
            const options = [];
            while (options.length < numOptions) {
                const emoji = guessOptions[Math.floor(Math.random() * guessOptions.length)];
                if (!options.includes(emoji)) options.push(emoji);
            }
            const correctIndex = Math.floor(Math.random() * numOptions);

            const prompt = `💥 DOUBLE OR NOTHING 💥\n\n` +
                           `Your ${Reply.winnings.toLocaleString()} coins are on the line!\n` +
                           `Guess correctly to win ${ (Reply.winnings * 2).toLocaleString() } coins. Guess wrong and lose it all.\n\n` +
                           options.map((opt, i) => `${i + 1}️⃣ ${opt}`).join('    ') + `\n\n` +
                           `Reply with a number (1-5).`;
            const msg = await message.reply(formatText(prompt));
            global.GoatBot.onReply.set(msg.messageID, {
                commandName: this.config.name, author: senderID,
                correct: correctIndex + 1, emoji: options[correctIndex],
                winnings: Reply.winnings, messageID: msg.messageID, isFinalDouble: true
            });

        } else {
             user.money += Reply.winnings;
             guessData.totalWon += Reply.winnings;
             guessData.playHistory.push({ result: 'win', bet: Reply.bet, change: Reply.winnings, timestamp: Date.now() });
             await usersData.set(senderID, user);
             return message.reply(formatText(`You wisely cashed out ${Reply.winnings.toLocaleString()} coins.`));
        }
        return;
    }
    
    if(Reply.isFinalDouble) {
        const guess = parseInt(event.body.trim());
        if(guess === Reply.correct) {
            const finalWinnings = Reply.winnings * 2;
            user.money += finalWinnings;
            guessData.totalWon += finalWinnings;
            guessData.playHistory.push({ result: 'win', bet: Reply.winnings, change: finalWinnings, timestamp: Date.now() });
            if (finalWinnings > guessData.personalBests.highestWin) guessData.personalBests.highestWin = finalWinnings;
            await usersData.set(senderID, user);
            await this.checkAndAwardAchievements(message, usersData, senderID, user);
            return message.reply(formatText(`🎉 UNBELIEVABLE! You won the double or nothing! You get ${finalWinnings.toLocaleString()} coins!`));
        } else {
            guessData.playHistory.push({ result: 'loss', bet: Reply.winnings, change: -Reply.winnings, timestamp: Date.now() });
            await usersData.set(senderID, user);
            return message.reply(formatText(`😭 Oh no! The correct emoji was ${Reply.correct} → ${Reply.emoji}. You lost the ${Reply.winnings.toLocaleString()} coins.`));
        }
    }
    
    // Second Chance Reply
    if(Reply.isSecondChance) {
        const guess = parseInt(event.body.trim());
        if(guess === Reply.correct) {
            // They won on the second try, treat as a normal win but don't offer double or nothing.
            const { bet, isHardMode } = Reply;
            const prestigeBonus = 1 + (guessData.prestige * PRESTIGE_BONUS_PER_LEVEL);
            const luckBonus = Reply.usedItem === 'luckpotion' ? 1.5 : 1;
            const isStreakBonus = guessData.streak >= 2;
            let multiplier;
            if (isHardMode) multiplier = isStreakBonus ? HARD_MODE_STREAK_MULTIPLIER : HARD_MODE_REWARD_MULTIPLIER;
            else multiplier = isStreakBonus ? STREAK_BONUS_MULTIPLIER : NORMAL_REWARD_MULTIPLIER;
            const winnings = Math.round(bet * multiplier * prestigeBonus * luckBonus);

            user.money += winnings;
            guessData.wins++;
            guessData.streak++;
            if (guessData.streak > guessData.maxStreak) guessData.maxStreak = guessData.streak;
            guessData.totalWon += winnings;
            if (winnings > guessData.personalBests.highestWin) guessData.personalBests.highestWin = winnings;
            guessData.mercyCount = 0; // Reset mercy
            
            await usersData.set(senderID, user);
            await this.checkAndAwardAchievements(message, usersData, senderID, user);
            return message.reply(formatText(`Phew! You got it on the second try! The emoji was ${Reply.emoji}.\nYou won ${winnings.toLocaleString()} coins!`));

        } else {
            // They lost even with a second chance
            const lostAmount = Reply.bet;
            user.money -= lostAmount;
            guessData.losses++;
            guessData.totalLost += lostAmount;
            guessData.playHistory.push({ result: 'loss', bet: lostAmount, change: -lostAmount, timestamp: Date.now() });

            let resultMessage = `❌ Wrong again! The correct answer was ${Reply.correct} → ${Reply.emoji}\n\n` +
                                `💸 You lost: ${lostAmount.toLocaleString()} coins.`;
            if (Reply.usedItem === 'shield') {
                guessData.inventory.shields--;
                resultMessage += `\n🛡️ Your Shield was used! Your streak of ${guessData.streak} is safe!`;
            } else {
                resultMessage += `\n😭 Your streak of ${guessData.streak} has been reset.`;
                guessData.streak = 0;
            }
            await usersData.set(senderID, user);
            return message.reply(formatText(resultMessage));
        }
    }


    // --- MAIN GAME REPLY LOGIC ---
    const guess = parseInt(event.body.trim());
    if (isNaN(guess) || guess < 1 || guess > Reply.numOptions) {
      return message.reply(formatText(`Please reply with a number between 1 and ${Reply.numOptions}.`));
    }
    
    globalData.totalGamesPlayed++;
    globalData.totalBets += Reply.bet;
    const jackpotTax = Math.ceil(Reply.bet * JACKPOT_TAX_RATE);
    globalData.jackpot += jackpotTax;
    user.money -= jackpotTax;

    guessData.totalPlays++;
    
    let resultMessage;
    
    if (guess === Reply.correct) {
      const prestigeBonus = 1 + (guessData.prestige * PRESTIGE_BONUS_PER_LEVEL);
      const luckBonus = Reply.usedItem === 'luckpotion' ? 1.5 : 1;
      const isStreakBonus = guessData.streak >= 2;
      let multiplier;
      if (Reply.isHardMode) multiplier = isStreakBonus ? HARD_MODE_STREAK_MULTIPLIER : HARD_MODE_REWARD_MULTIPLIER;
      else multiplier = isStreakBonus ? STREAK_BONUS_MULTIPLIER : NORMAL_REWARD_MULTIPLIER;
      const winnings = Math.round(Reply.bet * multiplier * prestigeBonus * luckBonus);

      guessData.wins++;
      guessData.streak++;
      if(guessData.streak > guessData.maxStreak) guessData.maxStreak = guessData.streak;
      if (winnings > guessData.personalBests.highestWin) guessData.personalBests.highestWin = winnings;
      guessData.mercyCount = 0;
      
      // Update Quests
      guessData.weeklyQuest.winGames++;
      if (Reply.isHardMode) guessData.weeklyQuest.playHard++;
      
      resultMessage = `✅ Correct! The emoji was ${Reply.emoji}\n\n` +
          `🎉 You won a base of: ${winnings.toLocaleString()} coins!\n` +
          `(Bet x${multiplier}${isStreakBonus ? ' Streak!' : ''}${prestigeBonus > 1 ? ` x${prestigeBonus.toFixed(1)} Prestige!` : ''}${luckBonus > 1 ? ' x1.5 Luck!' : ''})\n` +
          `🔥 Your win streak is now ${guessData.streak}!`;
          
      // Jackpot Logic
      let jackpotChance = BASE_JACKPOT_WIN_CHANCE * (Reply.isHardMode ? HARD_MODE_JACKPOT_MULTIPLIER : 1);
      if(Math.random() < jackpotChance) {
          resultMessage += `\n\n💰💰💰 JACKPOT! 💰💰💰\nYOU WON THE GLOBAL JACKPOT OF ${globalData.jackpot.toLocaleString()} COINS!`;
          user.money += globalData.jackpot;
          guessData.jackpotWins++;
          globalData.jackpot = 100000; // Reset jackpot
      }
      
      await usersData.set(senderID, user); // Save money before asking for double
      await this.checkAndAwardAchievements(message, usersData, senderID, user);

      // Double or Nothing Offer
      const msg = await message.reply(formatText(resultMessage + `\n\nWould you like to risk it all and DOUBLE your winnings? Reply 'double' or 'cashout'.`));
      global.GoatBot.onReply.set(msg.messageID, {
          commandName: this.config.name, author: senderID, messageID: msg.messageID,
          isDoubleOrNothing: true, winnings: winnings, bet: Reply.bet
      });

    } else { // WRONG GUESS
        if(Reply.usedItem === 'secondchance') {
            guessData.inventory.secondchances--;
            const remainingOptions = Reply.options.filter((_, i) => i !== guess - 1);
            let prompt = `😬 Not quite! But you have a Second Chance!\n\n` +
                         `One wrong option has been removed. Guess again from the following:\n\n` +
                         remainingOptions.join('    ') + `\n\nReply with one of the remaining emojis.`;
            const msg = await message.reply(formatText(prompt));
            global.GoatBot.onReply.set(msg.messageID, {
                ...Reply, // carry over original reply data
                isSecondChance: true
            });
            await usersData.set(senderID, user);
            return;
        }

        const lostAmount = Reply.bet;
        let returnedAmount = 0;
        
        if(Reply.usedItem === 'insurance') {
            guessData.inventory.insurances--;
            returnedAmount = Math.round(lostAmount * 0.5);
            user.money -= (lostAmount - returnedAmount);
        } else {
            user.money -= lostAmount;
        }

        guessData.losses++;
        guessData.totalLost += lostAmount;
        guessData.mercyCount++;
        guessData.playHistory.push({ result: 'loss', bet: lostAmount, change: -(lostAmount - returnedAmount), timestamp: Date.now() });
        
        resultMessage = `❌ Wrong! The correct answer was ${Reply.correct} → ${Reply.emoji}\n\n` +
            `💸 You lost: ${(lostAmount - returnedAmount).toLocaleString()} coins.`;
            
        if(returnedAmount > 0) resultMessage += `\n📋 Your insurance returned ${returnedAmount.toLocaleString()} coins!`;

        if (Reply.usedItem === 'shield') {
            guessData.inventory.shields--;
            resultMessage += `\n🛡️ Your Shield was used! Your streak of ${guessData.streak} is safe!`;
        } else {
            resultMessage += `\n😭 Your streak of ${guessData.streak} has been reset.`;
            guessData.streak = 0;
        }
        
        await usersData.set(senderID, user);
        await message.reply(formatText(resultMessage));
        await this.checkAndAwardAchievements(message, usersData, senderID, user);
    }
  }
};
