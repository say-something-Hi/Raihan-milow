const fs = require("fs-extra");
const nullAndUndefined = [undefined, null];

function getType(obj) {
	return Object.prototype.toString.call(obj).slice(8, -1);
}

function getRole(threadData, senderID) {
	const adminBot = global.GoatBot.config.adminBot || [];
	if (!senderID)
		return 0;
	const adminBox = threadData ? threadData.adminIDs || [] : [];
	return adminBot.includes(senderID) ? 2 : adminBox.includes(senderID) ? 1 : 0;
}

function getText(type, reason, time, targetID, lang) {
	const utils = global.utils;
	if (type == "userBanned")
		return utils.getText({ lang, head: "handlerEvents" }, "userBanned", reason, time, targetID);
	else if (type == "threadBanned")
		return utils.getText({ lang, head: "handlerEvents" }, "threadBanned", reason, time, targetID);
	else if (type == "onlyAdminBox")
		return utils.getText({ lang, head: "handlerEvents" }, "onlyAdminBox");
	else if (type == "onlyAdminBot")
		return utils.getText({ lang, head: "handlerEvents" }, "onlyAdminBot");
}

function replaceShortcutInLang(text, prefix, commandName) {
	return text
		.replace(/\{(?:p|prefix)\}/g, prefix)
		.replace(/\{(?:n|name)\}/g, commandName)
		.replace(/\{pn\}/g, `${prefix}${commandName}`);
}

function getRoleConfig(utils, command, isGroup, threadData, commandName) {
	let roleConfig;
	if (utils.isNumber(command.config.role)) {
		roleConfig = {
			onStart: command.config.role
		};
	}
	else if (typeof command.config.role == "object" && !Array.isArray(command.config.role)) {
		if (!command.config.role.onStart)
			command.config.role.onStart = 0;
		roleConfig = command.config.role;
	}
	else {
		roleConfig = {
			onStart: 0
		};
	}

	if (isGroup)
		roleConfig.onStart = threadData.data.setRole?.[commandName] ?? roleConfig.onStart;

	for (const key of ["onChat", "onStart", "onReaction", "onReply"]) {
		if (roleConfig[key] == undefined)
			roleConfig[key] = roleConfig.onStart;
	}

	return roleConfig;
}

function isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, lang) {
	const config = global.GoatBot.config;
	const { adminBot, hideNotiMessage } = config;

	// check if user banned
	const infoBannedUser = userData.banned;
	if (infoBannedUser.status == true) {
		const { reason, date } = infoBannedUser;
		if (hideNotiMessage.userBanned == false)
			message.reply(getText("userBanned", reason, date, senderID, lang));
		return true;
	}

	// check if only admin bot
	if (
		config.adminOnly.enable == true
		&& !adminBot.includes(senderID)
		&& !config.adminOnly.ignoreCommand.includes(commandName)
	) {
		if (hideNotiMessage.adminOnly == false)
			message.reply(getText("onlyAdminBot", null, null, null, lang));
		return true;
	}

	// ==========    Check Thread    ========== //
	if (isGroup == true) {
		if (
			threadData.data.onlyAdminBox === true
			&& !threadData.adminIDs.includes(senderID)
			&& !(threadData.data.ignoreCommanToOnlyAdminBox || []).includes(commandName)
		) {
			// check if only admin box
			if (!threadData.data.hideNotiMessageOnlyAdminBox)
				message.reply(getText("onlyAdminBox", null, null, null, lang));
			return true;
		}

		// check if thread banned
		const infoBannedThread = threadData.banned;
		if (infoBannedThread.status == true) {
			const { reason, date } = infoBannedThread;
			if (hideNotiMessage.threadBanned == false)
				message.reply(getText("threadBanned", reason, date, threadID, lang));
			return true;
		}
	}
	return false;
}

function createGetText2(langCode, pathCustomLang, prefix, command) {
	const commandType = command.config.countDown ? "command" : "command event";
	const commandName = command.config.name;
	let customLang = {};
	let getText2 = () => { };
	if (fs.existsSync(pathCustomLang))
		customLang = require(pathCustomLang)[commandName]?.text || {};
	if (command.langs || customLang || {}) {
		getText2 = function (key, ...args) {
			let lang = command.langs?.[langCode]?.[key] || customLang[key] || "";
			lang = replaceShortcutInLang(lang, prefix, commandName);
			for (let i = args.length - 1; i >= 0; i--)
				lang = lang.replace(new RegExp(`%${i + 1}`, "g"), args[i]);
			return lang || `❌ Can't find text on language "${langCode}" for ${commandType} "${commandName}" with key "${key}"`;
		};
	}
	return getText2;
}

// Levenshtein distance function for string similarity
function levenshteinDistance(str1, str2) {
	const matrix = [];
	for (let i = 0; i <= str2.length; i++) {
		matrix[i] = [i];
	}
	for (let j = 0; j <= str1.length; j++) {
		matrix[0][j] = j;
	}
	for (let i = 1; i <= str2.length; i++) {
		for (let j = 1; j <= str1.length; j++) {
			if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
				matrix[i][j] = matrix[i - 1][j - 1];
			} else {
				matrix[i][j] = Math.min(
					matrix[i - 1][j - 1] + 1,
					matrix[i][j - 1] + 1,
					matrix[i - 1][j] + 1
				);
			}
		}
	}
	return matrix[str2.length][str1.length];
}

// Find best matching command
function findBestMatch(inputCommand, allCommands) {
	let bestMatch = null;
	let bestDistance = Infinity;
	const maxDistance = Math.ceil(inputCommand.length * 0.6);

	for (const availableCommand of allCommands) {
		const distance = levenshteinDistance(inputCommand.toLowerCase(), availableCommand.toLowerCase());
		if (distance < bestDistance && distance <= maxDistance) {
			bestDistance = distance;
			bestMatch = availableCommand;
		}
	}

	return { bestMatch, bestDistance };
}

// Premium wrong command suggestions
function getWrongCommandSuggestion(prefix, bestMatch) {
	const wrongCommandSuggestions = [
		`💘 Oops cutie~ did you mean ${prefix}${bestMatch}?`,
		`😉 Arre cutie~ try ${prefix}${bestMatch}?`,
		`🥰 Aha! Could it be ${prefix}${bestMatch}?`,
		`😎 Ooh la la! Maybe ${prefix}${bestMatch}?`,
		`💖 Thik ache~ try ${prefix}${bestMatch}?`,
		`😻 Purr~ did you type ${prefix}${bestMatch}?`,
		`💞 Babe~ little typo? ${prefix}${bestMatch}?`,
		`💫 Oopsie! Try ${prefix}${bestMatch}?`,
		`😏 Hmm… maybe ${prefix}${bestMatch}?`,
		`💌 Sweet typo… try ${prefix}${bestMatch}?`,
		`🥳 Almost there! Maybe ${prefix}${bestMatch}?`,
		`😚 Hey you… maybe ${prefix}${bestMatch}?`,
		`💫 That sparkles! Try ${prefix}${bestMatch}?`,
		`🫣 Hmm… looks like ${prefix}${bestMatch}?`,
		`😻 Purr~ did you mean ${prefix}${bestMatch}?`,
		`💘 Cutie alert! Try ${prefix}${bestMatch}?`,
		`🥳 Fun vibes! Maybe ${prefix}${bestMatch}?`,
		`😎 Almost right… try ${prefix}${bestMatch}?`,
		`💫 Sparkly! Could it be ${prefix}${bestMatch}?`,
		`🫰 Little typo? Perhaps ${prefix}${bestMatch}?`,
		`🌸 Cherry blossom~ maybe ${prefix}${bestMatch}?`,
		`✨ Starlight guess~ ${prefix}${bestMatch}?`,
		`🦋 Butterfly wings~ try ${prefix}${bestMatch}?`,
		`🍯 Honey sweet~ did you mean ${prefix}${bestMatch}?`,
		`🎀 Ribbon tied~ perhaps ${prefix}${bestMatch}?`,
		`🐾 Paw prints lead to ${prefix}${bestMatch}?`,
		`🌈 After rain~ maybe ${prefix}${bestMatch}?`,
		`🦄 Magic says~ ${prefix}${bestMatch}?`,
		`🍩 Donut worry~ try ${prefix}${bestMatch}?`,
		`🎵 Melody suggests ${prefix}${bestMatch}?`,
		`💕 Sweetheart~ typo? ${prefix}${bestMatch}?`,
		`🌟 Shining star~ maybe ${prefix}${bestMatch}?`,
		`🐣 Peep peep~ try ${prefix}${bestMatch}?`,
		`🎉 Party time! ${prefix}${bestMatch}?`,
		`🛸 UFO sighting~ ${prefix}${bestMatch}?`,
		`🧸 Teddy bear hug~ ${prefix}${bestMatch}?`,
		`🍦 Ice cream dream~ ${prefix}${bestMatch}?`,
		`🎈 Balloon floats to ${prefix}${bestMatch}?`,
		`🦁 Roar-some! Try ${prefix}${bestMatch}?`,
		`🏮 Lantern light~ ${prefix}${bestMatch}?`,
		`💝 Gift for you~ ${prefix}${bestMatch}?`,
		`🦊 Foxy guess~ ${prefix}${bestMatch}?`,
		`🍄 Mushroom circle~ ${prefix}${bestMatch}?`,
		`🎸 Rock on! Try ${prefix}${bestMatch}?`,
		`🦉 Wise owl says ${prefix}${bestMatch}?`,
		`🍉 Watermelon sugar~ ${prefix}${bestMatch}?`,
		`🎯 Bullseye! Maybe ${prefix}${bestMatch}?`,
		`🦋 Flutter by~ ${prefix}${bestMatch}?`,
		`🧁 Cupcake sweet~ ${prefix}${bestMatch}?`,
		`⚡ Lightning strike~ ${prefix}${bestMatch}?`
	];
	return wrongCommandSuggestions[Math.floor(Math.random() * wrongCommandSuggestions.length)];
}

// Premium prefix only responses
const prefixOnlyResponses = [
	"✨ That's just my prefix darling~ Try -help to see all available commands!",
	"🎀 Just the prefix won't do cutie! Try -help for commands~",
	"💫 Oopsie~ That's only my prefix! Try -gpt or /help babe!",
	"🌸 Prefix detected! Need help sweetie? Try -help for commands~",
	"🦋 That's my prefix honey~ Try adding a command like -help",
	"💞 Just the prefix? Try -i create a beautiful car or /help for fun commands cutie!",
	"🎵 Melodic prefix~ but try -help for the real symphony!",
	"🍯 Sweet prefix! Now try -help for the honey commands~",
	"🌟 Sparkly prefix! Add a command like -gpt for magic!",
	"💌 Love the prefix! Now try -help for love commands~"
];

// Premium admin reaction emojis for unsend
const adminUnsendEmojis = ["😠", "🗑️", "❌", "🚫", "💥", "🧹", "📛", "⛔", "🔞", "💢"];

// Premium welcome features
const welcomeMessages = [
	`🌸 Welcome {userName} to {boxName}! We're so happy to have you here cutie~ 💖`,
	`✨ {userName} just joined the party! Let's give them a warm welcome everyone~ 🎉`,
	`💫 A wild {userName} appeared! Welcome to {boxName} sweetie~ 🥰`,
	`🎀 Look who's here! Welcome {userName} to our lovely group~ 💕`,
	`🦋 Welcome {userName}! May your stay in {boxName} be filled with joy and laughter~ 💝`,
	`🍯 Sweet! {userName} just joined {boxName}! Welcome honey~ 🐝`,
	`🌟 New star alert! Welcome {userName} to {boxName}~ Shine bright! ✨`,
	`💞 Love is in the air! Welcome {userName} to our family~ 💘`,
	`🎵 Welcome {userName} to {boxName}! Let's make beautiful memories together~ 🎶`,
	`🍩 Donut worry, be happy! Welcome {userName} to {boxName}~ 🍪`
];

// Premium anti-spam system
class AntiSpamSystem {
	constructor() {
		this.userMessages = new Map();
		this.floodThreshold = 8; // messages
		this.timeWindow = 5000; // 5 seconds
		this.muteDuration = 60000; // 1 minute
	}

	checkSpam(userID) {
		const now = Date.now();
		if (!this.userMessages.has(userID)) {
			this.userMessages.set(userID, []);
		}

		const userMessages = this.userMessages.get(userID);
		
		// Clean old messages
		const recentMessages = userMessages.filter(time => now - time < this.timeWindow);
		recentMessages.push(now);
		
		this.userMessages.set(userID, recentMessages);

		// Check if user is spamming
		if (recentMessages.length >= this.floodThreshold) {
			return true;
		}
		
		return false;
	}

	clearOldMessages() {
		const now = Date.now();
		for (const [userID, messages] of this.userMessages.entries()) {
			const recentMessages = messages.filter(time => now - time < this.timeWindow * 2);
			if (recentMessages.length === 0) {
				this.userMessages.delete(userID);
			} else {
				this.userMessages.set(userID, recentMessages);
			}
		}
	}
}

const antiSpam = new AntiSpamSystem();

// Premium auto-cleaner for spam system
setInterval(() => {
	antiSpam.clearOldMessages();
}, 30000);

module.exports = function (api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData) {
	return async function (event, message) {

		const { utils, client, GoatBot } = global;
		const { getPrefix, removeHomeDir, log, getTime } = utils;
		const { config, configCommands: { envGlobal, envCommands, envEvents } } = GoatBot;
		const { autoRefreshThreadInfoFirstTime } = config.database;
		let { hideNotiMessage = {} } = config;

		const { body, messageID, threadID, isGroup, type, logMessageType, logMessageData } = event;

		// Check if has threadID
		if (!threadID)
			return;

		const senderID = event.userID || event.senderID || event.author;

		let threadData = global.db.allThreadData.find(t => t.threadID == threadID);
		let userData = global.db.allUserData.find(u => u.userID == senderID);

		if (!userData && !isNaN(senderID))
			userData = await usersData.create(senderID);

		if (!threadData && !isNaN(threadID)) {
			if (global.temp.createThreadDataError.includes(threadID))
				return;
			threadData = await threadsData.create(threadID);
			global.db.receivedTheFirstMessage[threadID] = true;
		}
		else {
			if (
				autoRefreshThreadInfoFirstTime === true
				&& !global.db.receivedTheFirstMessage[threadID]
			) {
				global.db.receivedTheFirstMessage[threadID] = true;
				await threadsData.refreshInfo(threadID);
			}
		}

		if (typeof threadData.settings.hideNotiMessage == "object")
			hideNotiMessage = threadData.settings.hideNotiMessage;

		const prefix = getPrefix(threadID);
		const role = getRole(threadData, senderID);
		const parameters = {
			api, usersData, threadsData, message, event,
			userModel, threadModel, prefix, dashBoardModel,
			globalModel, dashBoardData, globalData, envCommands,
			envEvents, envGlobal, role,
			removeCommandNameFromBody: function removeCommandNameFromBody(body_, prefix_, commandName_) {
				if ([body_, prefix_, commandName_].every(x => nullAndUndefined.includes(x)))
					throw new Error("Please provide body, prefix and commandName to use this function, this function without parameters only support for onStart");
				for (let i = 0; i < arguments.length; i++)
					if (typeof arguments[i] != "string")
						throw new Error(`The parameter "${i + 1}" must be a string, but got "${getType(arguments[i])}"`);

				return body_.replace(new RegExp(`^${prefix_}(\\s+|)${commandName_}`, "i"), "").trim();
			}
		};
		const langCode = threadData.data.lang || config.language || "en";

		function createMessageSyntaxError(commandName) {
			message.SyntaxError = async function () {
				return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "commandSyntaxError", prefix, commandName));
			};
		}

		// ✅ PREMIUM FEATURE: Handle welcome messages
		async function handleWelcomeMessage() {
			if (isGroup && type === "event" && logMessageType === "log:subscribe") {
				const addedParticipants = logMessageData.addedParticipants || [];
				for (const user of addedParticipants) {
					const userName = user.fullName || "New Member";
					const boxName = threadData.threadName || "the group";
					
					const welcomeMsg = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)]
						.replace(/{userName}/g, userName)
						.replace(/{boxName}/g, boxName);
					
					await message.reply(welcomeMsg);
					log.info("WELCOME", `Welcomed ${userName} to ${boxName}`);
				}
			}
		}

		// ✅ PREMIUM FEATURE: Anti-spam protection
		async function checkAntiSpam() {
			if (body && body.startsWith(prefix)) {
				if (antiSpam.checkSpam(senderID)) {
					if (!config.adminBot.includes(senderID)) {
						const spamMsg = `🚫 *Anti-Spam System*\n\n${userData.name}, you're sending commands too fast! Please wait a moment cutie~ 💖`;
						await message.reply(spamMsg);
						log.warn("ANTI-SPAM", `User ${senderID} flagged for spam in ${threadID}`);
						return true;
					}
				}
			}
			return false;
		}

		// ✅ PREMIUM FEATURE: Smart command logger
		function logCommandUsage(commandName, args, success = true) {
			const status = success ? "✅" : "❌";
			const argsStr = args.length > 0 ? ` | Args: ${args.join(" ")}` : "";
			log.command(`${status} ${commandName} | User: ${userData.name} (${senderID}) | Thread: ${threadID}${argsStr}`);
		}

		/*
			+-----------------------------------------------+
			|							 WHEN CALL COMMAND								|
			+-----------------------------------------------+
		*/
		let isUserCallCommand = false;
		async function onStart() {
			// —————————————— CHECK USE BOT —————————————— //
			if (!body || !body.startsWith(prefix))
				return;

			// ✅ PREMIUM FEATURE: Anti-spam check
			if (await checkAntiSpam()) {
				return;
			}

			// ✅ PREMIUM FEATURE: Prefix Only Text Response
			if (body.trim() === prefix.trim()) {
				const randomResponse = prefixOnlyResponses[Math.floor(Math.random() * prefixOnlyResponses.length)];
				return await message.reply(randomResponse);
			}

			const dateNow = Date.now();
			const args = body.slice(prefix.length).trim().split(/ +/);
			// ————————————  CHECK HAS COMMAND ——————————— //
			let commandName = args.shift().toLowerCase();
			let command = GoatBot.commands.get(commandName) || GoatBot.commands.get(GoatBot.aliases.get(commandName));
			// ———————— CHECK ALIASES SET BY GROUP ———————— //
			const aliasesData = threadData.data.aliases || {};
			for (const cmdName in aliasesData) {
				if (aliasesData[cmdName].includes(commandName)) {
					command = GoatBot.commands.get(cmdName);
					break;
				}
			}
			// ————————————— SET COMMAND NAME ————————————— //
			if (command)
				commandName = command.config.name;
			// ——————— FUNCTION REMOVE COMMAND NAME ———————— //
			function removeCommandNameFromBody(body_, prefix_, commandName_) {
				if (arguments.length) {
					if (typeof body_ != "string")
						throw new Error(`The first argument (body) must be a string, but got "${getType(body_)}"`);
					if (typeof prefix_ != "string")
						throw new Error(`The second argument (prefix) must be a string, but got "${getType(prefix_)}"`);
					if (typeof commandName_ != "string")
						throw new Error(`The third argument (commandName) must be a string, but got "${getType(commandName_)}"`);

					return body_.replace(new RegExp(`^${prefix_}(\\s+|)${commandName_}`, "i"), "").trim();
				}
				else {
					return body.replace(new RegExp(`^${prefix}(\\s+|)${commandName}`, "i"), "").trim();
				}
			}
			// —————  CHECK BANNED OR ONLY ADMIN BOX  ————— //
			if (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, langCode))
				return;
			
			// —————  CHECK GROUP AUTHORIZATION  ————— //
			if (isGroup && !config.adminBot.includes(senderID)) {
				if (commandName !== "approve" && threadData.data.groupApproved !== true) {
					const unauthorizedMsg = `⚠️ *Group Authorization Required*\n\nThis group is not authorized to use this bot cutie~ 💖\n\nPlease join our support group for approval:\nhttps://m.me/j/AbZX5he4yIFsgui_/\n\nThen contact admin with:\n${prefix}approve <groupID>\n\nYour Group ID: ${threadID}`;
					return await message.reply(unauthorizedMsg);
				}
			}

			if (!command) {
				// ✅ PREMIUM FEATURE: Smart Command Suggestion
				if (commandName && !hideNotiMessage.commandNotFound) {
					const allCommands = Array.from(GoatBot.commands.keys());
					const allAliases = Array.from(GoatBot.aliases.keys());
					const allAvailableCommands = [...allCommands, ...allAliases];

					const { bestMatch, bestDistance } = findBestMatch(commandName, allAvailableCommands);

					if (bestMatch && bestDistance <= 3) {
						const suggestionMessage = getWrongCommandSuggestion(prefix, bestMatch);
						return await message.reply(suggestionMessage);
					}

					// Premium error message for no match found
					const errorMsg = `❌ *Command Not Found*\n\n\"${commandName}\" doesn't exist cutie~ 💔\n\n💡 Try: ${prefix}help\n🌸 Or check spelling sweetie!`;
					return await message.reply(errorMsg);
				}
				else if (!hideNotiMessage.commandNotFound) {
					return await message.reply(
						utils.getText({ lang: langCode, head: "handlerEvents" }, "commandNotFound2", prefix)
					);
				}
				else {
					return true;
				}
			}
			// ————————————— CHECK PERMISSION ———————————— //
			const roleConfig = getRoleConfig(utils, command, isGroup, threadData, commandName);
			const needRole = roleConfig.onStart;

			if (needRole > role) {
				if (!hideNotiMessage.needRoleToUseCmd) {
					if (needRole == 1)
						return await message.reply(`🚫 *Admin Only*\n\n\"${commandName}\" can only be used by group admins cutie~ 💖\n\nAsk your group admin to enable this command!`);
					else if (needRole == 2)
						return await message.reply(`🔒 *Bot Admin Only*\n\n\"${commandName}\" is restricted to bot admins only sweetie~ 💝\n\nContact bot owner for access!`);
				}
				else {
					return true;
				}
			}
			// ———————————————— countDown ———————————————— //
			if (!client.countDown[commandName])
				client.countDown[commandName] = {};
			const timestamps = client.countDown[commandName];
			let getCoolDown = command.config.countDown;
			if (!getCoolDown && getCoolDown != 0 || isNaN(getCoolDown))
				getCoolDown = 1;
			const cooldownCommand = getCoolDown * 1000;
			if (timestamps[senderID]) {
				const expirationTime = timestamps[senderID] + cooldownCommand;
				if (dateNow < expirationTime) {
					const remainingTime = ((expirationTime - dateNow) / 1000).toFixed(1);
					return await message.reply(`⏰ *Command Cooldown*\n\nPlease wait ${remainingTime}s before using \"${commandName}\" again cutie~ 💖\n\nTake a deep breath! 🌸`);
				}
			}
			// ——————————————— RUN COMMAND ——————————————— //
			const time = getTime("DD/MM/YYYY HH:mm:ss");
			isUserCallCommand = true;
			try {
				// ✅ PREMIUM FEATURE: Enhanced analytics
				(async () => {
					const analytics = await globalData.get("analytics", "data", {});
					if (!analytics[commandName]) {
						analytics[commandName] = {
							count: 0,
							lastUsed: time,
							users: new Set(),
							groups: new Set()
						};
					}
					analytics[commandName].count++;
					analytics[commandName].lastUsed = time;
					analytics[commandName].users.add(senderID);
					if (isGroup) analytics[commandName].groups.add(threadID);
					
					await globalData.set("analytics", analytics, "data");
				})();

				createMessageSyntaxError(commandName);
				const getText2 = createGetText2(langCode, `${process.cwd()}/languages/cmds/${langCode}.js`, prefix, command);
				
				// ✅ PREMIUM FEATURE: Command execution with timing
				const startTime = Date.now();
				await command.onStart({
					...parameters,
					args,
					commandName,
					getLang: getText2,
					removeCommandNameFromBody
				});
				const executionTime = Date.now() - startTime;
				
				timestamps[senderID] = dateNow;
				
				// ✅ PREMIUM FEATURE: Enhanced logging
				logCommandUsage(commandName, args, true);
				log.info("COMMAND EXECUTION", `${commandName} executed in ${executionTime}ms by ${userData.name} in ${threadID}`);
				
			}
			catch (err) {
				logCommandUsage(commandName, args, false);
				log.err("COMMAND ERROR", `Error in ${commandName}: ${err.message}`, err);
				
				// ✅ PREMIUM FEATURE: Enhanced error messages
				const errorMsg = `💥 *Command Error*\n\nOops! Something went wrong with \"${commandName}\" cutie~ 💔\n\n🕒 Time: ${time}\n🔧 Error: ${err.message}\n\nDon't worry, our devs will fix it soon! 🌸`;
				return await message.reply(errorMsg);
			}
		}

		/*
		 +------------------------------------------------+
		 |                    ON CHAT                     |
		 +------------------------------------------------+
		*/
		async function onChat() {
			const allOnChat = GoatBot.onChat || [];
			const args = body ? body.split(/ +/) : [];
			for (const key of allOnChat) {
				const command = GoatBot.commands.get(key);
				if (!command)
					continue;
				const commandName = command.config.name;

				// —————————————— CHECK PERMISSION —————————————— //
				const roleConfig = getRoleConfig(utils, command, isGroup, threadData, commandName);
				const needRole = roleConfig.onChat;
				if (needRole > role)
					continue;

				const getText2 = createGetText2(langCode, `${process.cwd()}/languages/cmds/${langCode}.js`, prefix, command);
				const time = getTime("DD/MM/YYYY HH:mm:ss");
				createMessageSyntaxError(commandName);

				if (getType(command.onChat) == "Function") {
					const defaultOnChat = command.onChat;
					command.onChat = async function () {
						return defaultOnChat(...arguments);
					};
				}

				command.onChat({
					...parameters,
					isUserCallCommand,
					args,
					commandName,
					getLang: getText2
				})
					.then(async (handler) => {
						if (typeof handler == "function") {
							if (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, langCode))
								return;
							try {
								await handler();
								log.info("ON_CHAT", `${commandName} | ${userData.name} | ${threadID}`);
							}
							catch (err) {
								await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred2", time, commandName, removeHomeDir(err.stack ? err.stack.split("\n").slice(0, 5).join("\n") : JSON.stringify(err, null, 2))));
							}
						}
					})
					.catch(err => {
						log.err("ON_CHAT_ERROR", `Error in onChat ${commandName}`, err);
					});
			}
		}

		/*
		 +------------------------------------------------+
		 |                   ON ANY EVENT                 |
		 +------------------------------------------------+
		*/
		async function onAnyEvent() {
			const allOnAnyEvent = GoatBot.onAnyEvent || [];
			let args = [];
			if (typeof event.body == "string" && event.body.startsWith(prefix))
				args = event.body.split(/ +/);

			for (const key of allOnAnyEvent) {
				if (typeof key !== "string")
					continue;
				const command = GoatBot.commands.get(key);
				if (!command)
					continue;
				const commandName = command.config.name;
				const time = getTime("DD/MM/YYYY HH:mm:ss");
				createMessageSyntaxError(commandName);

				const getText2 = createGetText2(langCode, `${process.cwd()}/languages/events/${langCode}.js`, prefix, command);

				if (getType(command.onAnyEvent) == "Function") {
					const defaultOnAnyEvent = command.onAnyEvent;
					command.onAnyEvent = async function () {
						return defaultOnAnyEvent(...arguments);
					};
				}

				command.onAnyEvent({
					...parameters,
					args,
					commandName,
					getLang: getText2
				})
					.then(async (handler) => {
						if (typeof handler == "function") {
							try {
								await handler();
								log.info("ON_ANY_EVENT", `${commandName} | ${senderID} | ${threadID}`);
							}
							catch (err) {
								message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred7", time, commandName, removeHomeDir(err.stack ? err.stack.split("\n").slice(0, 5).join("\n") : JSON.stringify(err, null, 2))));
								log.err("ON_ANY_EVENT_ERROR", `Error in onAnyEvent ${commandName}`, err);
							}
						}
					})
					.catch(err => {
						log.err("ON_ANY_EVENT_ERROR", `Error in onAnyEvent ${commandName}`, err);
					});
			}
		}

		/*
		 +------------------------------------------------+
		 |                  ON FIRST CHAT                 |
		 +------------------------------------------------+
		*/
		async function onFirstChat() {
			const allOnFirstChat = GoatBot.onFirstChat || [];
			const args = body ? body.split(/ +/) : [];

			for (const itemOnFirstChat of allOnFirstChat) {
				const { commandName, threadIDsChattedFirstTime } = itemOnFirstChat;
				if (threadIDsChattedFirstTime.includes(threadID))
					continue;
				const command = GoatBot.commands.get(commandName);
				if (!command)
					continue;

				itemOnFirstChat.threadIDsChattedFirstTime.push(threadID);
				const getText2 = createGetText2(langCode, `${process.cwd()}/languages/cmds/${langCode}.js`, prefix, command);
				const time = getTime("DD/MM/YYYY HH:mm:ss");
				createMessageSyntaxError(commandName);

				if (getType(command.onFirstChat) == "Function") {
					const defaultOnFirstChat = command.onFirstChat;
					command.onFirstChat = async function () {
						return defaultOnFirstChat(...arguments);
					};
				}

				command.onFirstChat({
					...parameters,
					isUserCallCommand,
					args,
					commandName,
					getLang: getText2
				})
					.then(async (handler) => {
						if (typeof handler == "function") {
							if (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, langCode))
								return;
							try {
								await handler();
								log.info("ON_FIRST_CHAT", `${commandName} | ${userData.name} | ${threadID}`);
							}
							catch (err) {
								await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred2", time, commandName, removeHomeDir(err.stack ? err.stack.split("\n").slice(0, 5).join("\n") : JSON.stringify(err, null, 2))));
							}
						}
					})
					.catch(err => {
						log.err("ON_FIRST_CHAT_ERROR", `Error in onFirstChat ${commandName}`, err);
					});
		}
