const fs = require("fs-extra");
const nullAndUndefined = [undefined, null];
// const { config } = global.GoatBot;
// const { utils } = global;

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
	// {
	// 	onChat,
	// 	onStart,
	// 	onReaction,
	// 	onReply
	// }
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
// Sequential command suggestions with better text
let suggestionIndex = 0;
function getWrongCommandSuggestion(prefix, bestMatch) {
	const wrongCommandSuggestions = [
		`💖 Oopsie! Did you mean "${bestMatch}" darling? 💕`,
		`😘 Close but no cigar! Try "${bestMatch}" sweetie~ ✨`,
		`🌟 Looking for "${bestMatch}" perhaps, my love? 💫`,
		`💋 Command not found, but "${bestMatch}" might be what you need honey~ 🍯`,
		`🥰 "${bestMatch}" could be your soulmate command! 💞`,
		`💝 Not sure about that command, try "${bestMatch}" babe~ 💋`,
		`✨ I think you meant "${bestMatch}", my dear~ 💫`,
		`🌹 That command doesn't exist, but "${bestMatch}" is waiting for you! 💐`,
		`💕 Hmm, not familiar with that. Want "${bestMatch}" instead? 😉`,
		`🔥 Unrecognized command! How about "${bestMatch}" to spice things up? 🌶️`,
		`🎀 No such command, but "${bestMatch}" is available cutie~ 💝`,
		`💫 Command not available, "${bestMatch}" could work magic! ✨`,
		`🍭 Not found in my list, maybe "${bestMatch}" will satisfy your sweet tooth? 🍬`,
		`💘 That one's not here, but "${bestMatch}" is ready to steal your heart! 💖`,
		`🌟 I don't have that command, but "${bestMatch}" is shining bright for you! ⭐`,
		`💋 Unknown command! Did you mean "${bestMatch}" sweetheart? 💋`,
		`💕 Can't find that, but "${bestMatch}" might be your perfect match! 💑`,
		`✨ Not in my commands, try "${bestMatch}" for some sparkle! 💎`,
		`🥰 That doesn't ring a bell, maybe "${bestMatch}" will make you smile? 😊`,
		`💖 Command not recognized, but "${bestMatch}" is valid and lovely! 🌸`,
		`💫 Seems like a typo! Did you mean "${bestMatch}" my love? 💕`,
		`🌟 Close but not quite! Try "${bestMatch}" for stellar results! 🚀`,
		`💝 Almost got it! The command is "${bestMatch}" darling~ 💋`,
		`✨ That's not in my vocabulary, maybe "${bestMatch}" will speak to your heart? 💗`,
		`🥰 Command not in dictionary, but "${bestMatch}" is poetry in motion! 📝`,
		`💖 Invalid command detected! Similar: "${bestMatch}" sweetie~ 🍬`,
		`🌟 No match found! Closest: "${bestMatch}" shining star! ⭐`,
		`💕 That command isn't registered, but "${bestMatch}" is ready to love! 💑`,
		`✨ Unknown input! Did you intend "${bestMatch}" my dear? 💫`,
		`💝 Command not recognized! Similar command: "${bestMatch}" honey~ 🍯`,
		`🌟 Not quite right! The correct one might be "${bestMatch}" shining bright! 💡`,
		`💖 That's not a valid command! How about "${bestMatch}" to make things right? 💕`,
		`✨ Command not in system! Nearest match: "${bestMatch}" magical! 🎩`,
		`💫 Invalid entry! Perhaps you meant "${bestMatch}" my star? 🌟`,
		`💝 No such command exists! Try "${bestMatch}" instead sweetheart~ 💋`,
		`🌟 Command not available in database, but "${bestMatch}" is ready to serve! 💼`,
		`💖 That's not on the menu! We have "${bestMatch}" though, delicious! 🍽️`,
		`✨ Command not in inventory! Similar item: "${bestMatch}" precious! 💎`,
		`💫 Not found in command library! Try "${bestMatch}" for a good read! 📚`,
		`💝 That command is missing, but "${bestMatch}" is present and accounted for! ✅`
	];
	
	// Get current suggestion and move to next one
	const suggestion = wrongCommandSuggestions[suggestionIndex];
	suggestionIndex = (suggestionIndex + 1) % wrongCommandSuggestions.length;
	return suggestion;
}

// Prefix only responses
const prefixOnlyResponses = [
	"💖 That's just my prefix darling! Try 'help' to see all available commands 💕",
	"✨ Try a command like 'help' sweetie~ 💫",
	"🌟 Looking for something? Try 'gpt' my love 💖",
	"💝 Need help? Use 'help' for commands honey! 🍯",
	"💫 This is my prefix only, try commands without prefix cutie~ 💋",
	"✨ Just the prefix won't do! Try 'help' babe 💕",
	"💖 ⚠️ Add a command after the prefix sweetheart! 💝"
];

// Detect command without prefix from ALL available commands
function detectNoPrefixCommand(body, commands) {
	if (!body || typeof body !== 'string') return null;
	
	const cleanBody = body.trim().toLowerCase();
	const firstWord = cleanBody.split(/ +/)[0];
	
	// Get ALL commands and aliases
	const allCommands = Array.from(commands.keys());
	const allAliases = Array.from(commands.aliases?.keys() || []);
	const allAvailable = [...allCommands, ...allAliases];
	
	// Exact match first
	for (const cmd of allAvailable) {
		if (firstWord === cmd.toLowerCase()) {
			// Get the actual command name (not alias)
			const actualCommand = commands.get(cmd) || commands.get(commands.aliases?.get(cmd));
			return actualCommand?.config?.name || cmd;
		}
	}
	
	// Partial match for convenience
	for (const cmd of allAvailable) {
		if (cleanBody.startsWith(cmd.toLowerCase() + ' ') || cleanBody === cmd.toLowerCase()) {
			const actualCommand = commands.get(cmd) || commands.get(commands.aliases?.get(cmd));
			return actualCommand?.config?.name || cmd;
		}
	}
	
	return null;
}

module.exports = function (api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData) {
	return async function (event, message) {

		const { utils, client, GoatBot } = global;
		const { getPrefix, removeHomeDir, log, getTime } = utils;
		const { config, configCommands: { envGlobal, envCommands, envEvents } } = GoatBot;
		const { autoRefreshThreadInfoFirstTime } = config.database;
		let { hideNotiMessage = {} } = config;

		const { body, messageID, threadID, isGroup } = event;

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

		/*
			+-----------------------------------------------+
			|							 WHEN CALL COMMAND								|
			+-----------------------------------------------+
		*/
		let isUserCallCommand = false;
		async function onStart() {
			// —————————————— CHECK USE BOT —————————————— //
			const dateNow = Date.now();
			let commandName, command, args;
			let usedPrefix = false;
			
			// Check for prefix commands first (for backward compatibility)
			if (body && body.startsWith(prefix)) {
				usedPrefix = true;
				args = body.slice(prefix.length).trim().split(/ +/);
				commandName = args.shift().toLowerCase();
				command = GoatBot.commands.get(commandName) || GoatBot.commands.get(GoatBot.aliases.get(commandName));
			} 
			// ✅ NO-PREFIX SYSTEM: Check for commands without any prefix
			else if (body && body.trim()) {
				const noPrefixCommand = detectNoPrefixCommand(body, GoatBot.commands);
				if (noPrefixCommand) {
					commandName = noPrefixCommand;
					command = GoatBot.commands.get(commandName);
					// Remove command name from body for args
					const bodyWithoutCommand = body.trim().toLowerCase();
					const commandPattern = new RegExp(`^${commandName}\\s*`, 'i');
					args = bodyWithoutCommand.replace(commandPattern, '').trim().split(/ +/);
				}
			}

			// If no command detected yet, return
			if (!commandName) return;

			// ✅ Feature 2: Prefix Only Text Response
			if (usedPrefix && body.trim() === prefix.trim()) {
				const randomResponse = prefixOnlyResponses[Math.floor(Math.random() * prefixOnlyResponses.length)];
				return await message.reply(randomResponse);
			}

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
					// For no-prefix commands, just remove the command name
					if (!usedPrefix) {
						return body.replace(new RegExp(`^${commandName}(\\s+|)`, "i"), "").trim();
					}
					return body.replace(new RegExp(`^${prefix}(\\s+|)${commandName}`, "i"), "").trim();
				}
			}
			// —————  CHECK BANNED OR ONLY ADMIN BOX  ————— //
			if (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, langCode))
				return;
			
			// —————  CHECK GROUP AUTHORIZATION  ————— //
			if (isGroup && !config.adminBot.includes(senderID)) {
				// Skip authorization check for approve command (admins only anyway)
				if (commandName !== "approve" && threadData.data.groupApproved !== true) {
					const unauthorizedMsg = "⚠️ This group is not authorized to use this bot. Please join bot supportgc: https://m.me/j/AbZmEwsQE6rgqPQy/\n\n to join and get approval from admin.";
					return await message.reply(unauthorizedMsg);
				}
			}
			if (!command) {
				// ✅ Feature 3: Wrong Command Suggestion with Sequential Messages
				if (commandName && !hideNotiMessage.commandNotFound) {
					// Get all available command names and aliases
					const allCommands = Array.from(GoatBot.commands.keys());
					const allAliases = Array.from(GoatBot.aliases.keys());
					const allAvailableCommands = [...allCommands, ...allAliases];

					// Find the closest match
					const { bestMatch, bestDistance } = findBestMatch(commandName, allAvailableCommands);

					// If we found a good match, suggest it with sequential message
					if (bestMatch && bestDistance <= 3) {
						const suggestionMessage = getWrongCommandSuggestion(prefix, bestMatch);
						return await message.reply(suggestionMessage);
					}

					// If no good match found, use original error message
					return await message.reply(
						utils.getText({ lang: langCode, head: "handlerEvents" }, "commandNotFound", commandName, prefix)
					);
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
						return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "onlyAdmin", commandName));
					else if (needRole == 2)
						return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "onlyAdminBot2", commandName));
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
				if (dateNow < expirationTime)
					return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "waitingForCommand", ((expirationTime - dateNow) / 1000).toString().slice(0, 3)));
			}
			// ——————————————— RUN COMMAND ——————————————— //
			const time = getTime("DD/MM/YYYY HH:mm:ss");
			isUserCallCommand = true;
			try {
				// analytics command call
				(async () => {
					const analytics = await globalData.get("analytics", "data", {});
					if (!analytics[commandName])
						analytics[commandName] = 0;
					analytics[commandName]++;
					await globalData.set("analytics", analytics, "data");
				})();

				createMessageSyntaxError(commandName);
				const getText2 = createGetText2(langCode, `${process.cwd()}/languages/cmds/${langCode}.js`, prefix, command);
				await command.onStart({
					...parameters,
					args: args || [],
					commandName,
					getLang: getText2,
					removeCommandNameFromBody
				});
				timestamps[senderID] = dateNow;
				log.info("CALL COMMAND", `${commandName} | ${userData.name} | ${senderID} | ${threadID} | ${usedPrefix ? 'with-prefix' : 'NO-PREFIX'} | ${args ? args.join(" ") : ''}`);
			}
			catch (err) {
				log.err("CALL COMMAND", `An error occurred when calling the command ${commandName}`, err);
				return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred", time, commandName, removeHomeDir(err.stack ? err.stack.split("\n").slice(0, 5).join("\n") : JSON.stringify(err, null, 2))));
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
					// convert to AsyncFunction
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
								log.info("onChat", `${commandName} | ${userData.name} | ${senderID} | ${threadID} | ${args.join(" ")}`);
							}
							catch (err) {
								await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred2", time, commandName, removeHomeDir(err.stack ? err.stack.split("\n").slice(0, 5).join("\n") : JSON.stringify(err, null, 2))));
							}
						}
					})
					.catch(err => {
						log.err("onChat", `An error occurred when calling the command onChat ${commandName}`, err);
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
					// convert to AsyncFunction
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
								log.info("onAnyEvent", `${commandName} | ${senderID} | ${userData.name} | ${threadID}`);
							}
							catch (err) {
								message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred7", time, commandName, removeHomeDir(err.stack ? err.stack.split("\n").slice(0, 5).join("\n") : JSON.stringify(err, null, 2))));
								log.err("onAnyEvent", `An error occurred when calling the command onAnyEvent ${commandName}`, err);
							}
						}
					})
					.catch(err => {
						log.err("onAnyEvent", `An error occurred when calling the command onAnyEvent ${commandName}`, err);
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
					// convert to AsyncFunction
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
								log.info("onFirstChat", `${commandName} | ${userData.name} | ${senderID} | ${threadID} | ${args.join(" ")}`);
							}
							catch (err) {
								await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred2", time, commandName, removeHomeDir(err.stack ? err.stack.split("\n").slice(0, 5).join("\n") : JSON.stringify(err, null, 2))));
							}
						}
					})
					.catch(err => {
						log.err("onFirstChat", `An error occurred when calling the command onFirstChat ${commandName}`, err);
					});
			}
		}


		/* 
		 +------------------------------------------------+
		 |                    ON REPLY                    |
		 +------------------------------------------------+
		*/
		async function onReply() {
			if (!event.messageReply)
				return;
			const { onReply } = GoatBot;
			const Reply = onReply.get(event.messageReply.messageID);
			if (!Reply)
				return;
			Reply.delete = () => onReply.delete(messageID);
			const commandName = Reply.commandName;
			if (!commandName) {
				message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "cannotFindCommandName"));
				return log.err("onReply", `Can't find command name to execute this reply!`, Reply);
			}
			const command = GoatBot.commands.get(commandName);
			if (!command) {
				message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "cannotFindCommand", commandName));
				return log.err("onReply", `Command "${commandName}" not found`, Reply);
			}

			// —————————————— CHECK PERMISSION —————————————— //
			const roleConfig = getRoleConfig(utils, command, isGroup, threadData, commandName);
			const needRole = roleConfig.onReply;
			if (needRole > role) {
				if (!hideNotiMessage.needRoleToUseCmdOnReply) {
					if (needRole == 1)
						return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "onlyAdminToUseOnReply", commandName));
					else if (needRole == 2)
						return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "onlyAdminBot2ToUseOnReply", commandName));
				}
				else {
					return true;
				}
			}

			const getText2 = createGetText2(langCode, `${process.cwd()}/languages/cmds/${langCode}.js`, prefix, command);
			const time = getTime("DD/MM/YYYY HH:mm:ss");
			try {
				if (!command)
					throw new Error(`Cannot find command with commandName: ${commandName}`);
				const args = body ? body.split(/ +/) : [];
				createMessageSyntaxError(commandName);
				if (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, langCode))
					return;
				await command.onReply({
					...parameters,
					Reply,
					args,
					commandName,
					getLang: getText2
				});
				log.info("onReply", `${commandName} | ${userData.name} | ${senderID} | ${threadID} | ${args.join(" ")}`);
			}
			catch (err) {
				log.err("onReply", `An error occurred when calling the command onReply ${commandName}`, err);
				await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred3", time, commandName, removeHomeDir(err.stack ? err.stack.split("\n").slice(0, 5).join("\n") : JSON.stringify(err, null, 2))));
			}
		}


		/*
		 +------------------------------------------------+
		 |                   ON REACTION                  |
		 +------------------------------------------------+
		*/
		async function onReaction() {
			// ✅ Feature 1: Admin Reaction Unsend
			// Check if admin reacts with 😠 emoji to unsend message
			if (event.reaction === "😠") {
				// Check if user is admin (role 1 = box admin, role 2 = bot admin)
				if (role >= 1) {
					try {
						await api.unsendMessage(event.messageID);
						log.info("ADMIN UNSEND", `Message ${event.messageID} unsent by admin ${senderID}`);
						return; // Exit early after unsending
					} catch (err) {
						log.err("ADMIN UNSEND", `Failed to unsend message ${event.messageID}`, err);
					}
				}
			}

			const { onReaction } = GoatBot;
			const Reaction = onReaction.get(event.messageID);
			if (!Reaction)
				return;
			Reaction.delete = () => onReaction.delete(event.messageID);
			const commandName = Reaction.commandName;
			if (!commandName) {
				message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "cannotFindCommandName"));
				return log.err("onReaction", `Can't find command name to execute this reaction!`, Reaction);
			}
			const command = GoatBot.commands.get(commandName);
			if (!command) {
				message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "cannotFindCommand", commandName));
				return log.err("onReaction", `Command "${commandName}" not found`, Reaction);
			}

			// —————————————— CHECK PERMISSION —————————————— //
			const roleConfig = getRoleConfig(utils, command, isGroup, threadData, commandName);
			const needRole = roleConfig.onReaction;
			if (needRole > role) {
				if (!hideNotiMessage.needRoleToUseCmdOnReaction) {
					if (needRole == 1)
						return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "onlyAdminToUseOnReaction", commandName));
					else if (needRole == 2)
						return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "onlyAdminBot2ToUseOnReaction", commandName));
				}
				else {
					return true;
				}
			}
			// —————————————————————————————————————————————— //

			const time = getTime("DD/MM/YYYY HH:mm:ss");
			try {
				if (!command)
					throw new Error(`Cannot find command with commandName: ${commandName}`);
				const getText2 = createGetText2(langCode, `${process.cwd()}/languages/cmds/${langCode}.js`, prefix, command);
				const args = [];
				createMessageSyntaxError(commandName);
				if (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, langCode))
					return;
				await command.onReaction({
					...parameters,
					Reaction,
					args,
					commandName,
					getLang: getText2
				});
				log.info("onReaction", `${commandName} | ${userData.name} | ${senderID} | ${threadID} | ${event.reaction}`);
			}
			catch (err) {
				log.err("onReaction", `An error occurred when calling the command onReaction ${commandName}`, err);
				await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred4", time, commandName, removeHomeDir(err.stack ? err.stack.split("\n").slice(0, 5).join("\n") : JSON.stringify(err, null, 2))));
			}
		}


		/*
		 +------------------------------------------------+
		 |                 EVENT COMMAND                  |
		 +------------------------------------------------+
		*/
		async function handlerEvent() {
			const { author } = event;
			const allEventCommand = GoatBot.eventCommands.entries();
			for (const [key] of allEventCommand) {
				const getEvent = GoatBot.eventCommands.get(key);
				if (!getEvent)
					continue;
				const commandName = getEvent.config.name;
				const getText2 = createGetText2(langCode, `${process.cwd()}/languages/events/${langCode}.js`, prefix, getEvent);
				const time = getTime("DD/MM/YYYY HH:mm:ss");
				try {
					const handler = await getEvent.onStart({
						...parameters,
						commandName,
						getLang: getText2
					});
					if (typeof handler == "function") {
						await handler();
						log.info("EVENT COMMAND", `Event: ${commandName} | ${author} | ${userData.name} | ${threadID}`);
					}
				}
				catch (err) {
					log.err("EVENT COMMAND", `An error occurred when calling the command event ${commandName}`, err);
					await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred5", time, commandName, removeHomeDir(err.stack ? err.stack.split("\n").slice(0, 5).join("\n") : JSON.stringify(err, null, 2))));
				}
			}
		}


		/*
		 +------------------------------------------------+
		 |                    ON EVENT                    |
		 +------------------------------------------------+
		*/
		async function onEvent() {
			const allOnEvent = GoatBot.onEvent || [];
			const args = [];
			const { author } = event;
			for (const key of allOnEvent) {
				if (typeof key !== "string")
					continue;
				const command = GoatBot.commands.get(key);
				if (!command)
					continue;
				const commandName = command.config.name;
				const time = getTime("DD/MM/YYYY HH:mm:ss");
				createMessageSyntaxError(commandName);

				const getText2 = createGetText2(langCode, `${process.cwd()}/languages/events/${langCode}.js`, prefix, command);

				if (getType(command.onEvent) == "Function") {
					const defaultOnEvent = command.onEvent;
					// convert to AsyncFunction
					command.onEvent = async function () {
						return defaultOnEvent(...arguments);
					};
				}

				command.onEvent({
					...parameters,
					args,
					commandName,
					getLang: getText2
				})
					.then(async (handler) => {
						if (typeof handler == "function") {
							try {
								await handler();
								log.info("onEvent", `${commandName} | ${author} | ${userData.name} | ${threadID}`);
							}
							catch (err) {
								message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred6", time, commandName, removeHomeDir(err.stack ? err.stack.split("\n").slice(0, 5).join("\n") : JSON.stringify(err, null, 2))));
								log.err("onEvent", `An error occurred when calling the command onEvent ${commandName}`, err);
							}
						}
					})
					.catch(err => {
						log.err("onEvent", `An error occurred when calling the command onEvent ${commandName}`, err);
					});
			}
		}

		/*
		 +------------------------------------------------+
		 |                    PRESENCE                    |
		 +------------------------------------------------+
		*/
		async function presence() {
			// Your code here
		}

		/*
		 +------------------------------------------------+
		 |                  READ RECEIPT                  |
		 +------------------------------------------------+
		*/
		async function read_receipt() {
			// Your code here
		}

		/*
		 +------------------------------------------------+
		 |                   		 TYP                    	|
		 +------------------------------------------------+
		*/
		async function typ() {
			// Your code here
		}

		return {
			onAnyEvent,
			onFirstChat,
			onChat,
			onStart,
			onReaction,
			onReply,
			onEvent,
			handlerEvent,
			presence,
			read_receipt,
			typ
		};
	};
};

// Apply GoatWrapper for no-prefix functionality
const wrapper = new GoatWrapper(module.exports);
wrapper.applyNoPrefix({ allowPrefix: true });
