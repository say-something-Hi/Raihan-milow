const fs = require("fs-extra");
const nullAndUndefined = [undefined, null];

// ✅ HELPER FUNCTIONS (ORIGINAL STRUCTURE)

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

async function checkGroupAuthorization(isGroup, config, senderID, commandName, threadData, message) {
	const adminBot = config?.adminBot || [];
	if (isGroup && !adminBot.includes(senderID)) {
		if (commandName !== "approve" && threadData?.data?.groupApproved !== true) {
			const supportUrl = config?.supportGroup || "https://m.me/your-bot-support";
			await message.reply(
				"⚠️ This group is not authorized to use the bot. Contact a bot administrator for approval.\n\n" +
				`Or join the bot support group to request approval:\n https://m.me/j/AbZmEwsQE6rgqPQy/`
			);
			return true;
		}
	}
	return false;
}

function isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, lang) {
	const config = global.GoatBot.config || {};
	const { adminBot, hideNotiMessage } = config;

	const infoBannedUser = userData.banned;
	if (infoBannedUser.status == true) {
		const { reason, date } = infoBannedUser;
		if (hideNotiMessage?.userBanned == false)
			message.reply(getText("userBanned", reason, date, senderID, lang));
		return true;
	}

	if (
		config.adminOnly?.enable == true
		&& !(adminBot || []).includes(senderID)
		&& !(config.adminOnly?.ignoreCommand || []).includes(commandName)
	) {
		if (hideNotiMessage?.adminOnly == false)
			message.reply(getText("onlyAdminBot", null, null, null, lang));
		return true;
	}

	if (isGroup == true) {
		if (
			threadData.data.onlyAdminBox === true
			&& !threadData.adminIDs.includes(senderID)
			&& !(threadData.data.ignoreCommanToOnlyAdminBox || []).includes(commandName)
		) {
			if (!threadData.data.hideNotiMessageOnlyAdminBox)
				message.reply(getText("onlyAdminBox", null, null, null, lang));
			return true;
		}

		const infoBannedThread = threadData.banned;
		if (infoBannedThread.status == true) {
			const { reason, date } = infoBannedThread;
			if (hideNotiMessage?.threadBanned == false)
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

// ✅ NEW HUMAN-LIKE AUTOMATION HELPERS (CLEANLY ADDED)
function randomDelay(minMilliseconds, maxMilliseconds) {
    const delay = Math.floor(Math.random() * (maxMilliseconds - minMilliseconds + 1)) + minMilliseconds;
    return new Promise(resolve => setTimeout(resolve, delay));
}

function getTypingDelay(message) {
    const averageWPM = 150;
    const averageCharsPerWord = 5;
    const charsPerMinute = averageWPM * averageCharsPerWord;
    const charsPerSecond = charsPerMinute / 60;
    const messageLength = String(message).length;
    const estimatedTime = (messageLength / charsPerSecond) * 1000;
    const randomFactor = Math.random() * 0.5 + 0.75;
    return Math.min(Math.max(estimatedTime * randomFactor, 500), 4000);
}


// ✅ MAIN EXPORTED FUNCTION (ORIGINAL STRUCTURE)
module.exports = function (api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData) {
	return async function (event, message) {

		const { utils, client, GoatBot } = global;
		const { config } = GoatBot;

		// ✅ FEATURE: BOT SLEEP CYCLE
		// This checks if the bot should be "sleeping" before processing anything.
		const now = new Date();
		const currentHour = now.getHours();
		const activeFrom = config.activeHours?.from ?? 0;
		const activeUntil = config.activeHours?.until ?? 24;

		if (currentHour < activeFrom || currentHour >= activeUntil) {
			return; // Stop all processing if outside active hours
		}

		// ✅ FEATURE: HUMAN-LIKE REPLY (CLEAN INTEGRATION)
		// We save the original reply function...
		const originalReply = message.reply;
		// ...and replace it with our new, safer version.
		message.reply = async (body) => {
			try {
				api.sendTypingIndicator(event.threadID);
				await randomDelay(getTypingDelay(body), getTypingDelay(body) + 300);
				api.sendTypingIndicator(event.threadID, (err) => { // Stop typing
					if (err) return;
					originalReply(body);
				});
			} catch (e) {
				originalReply(body); // Fallback to original if anything fails
			}
		};


		const { getPrefix, removeHomeDir, log, getTime } = utils;
		const { configCommands: { envGlobal, envCommands, envEvents } } = GoatBot;
		const { autoRefreshThreadInfoFirstTime } = config.database || {};
		let { hideNotiMessage = {} } = config;

		const { body, messageID, threadID, isGroup } = event;

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
			if (!body || !body.startsWith(prefix))
				return;

			if (body.trim() === prefix.trim()) {
				const prefixOnlyResponses = [
					"That's just my prefix. Try -help to see all available commands",
					"Try a command like -help",
					"Looking for something? Try -gpt",
					"Need help? Use /help for commands!",
					"This is my prefix only, try -i create a beautifull cat",
					"Just the prefix won't do! Try -help",
					"⚠️ Add a command after the prefix!"
				];
				const randomResponse = prefixOnlyResponses[Math.floor(Math.random() * prefixOnlyResponses.length)];
				return await message.reply(randomResponse);
			}

			const dateNow = Date.now();
			const args = body.slice(prefix.length).trim().split(/ +/);
			let commandName = args.shift().toLowerCase();
			let command = GoatBot.commands.get(commandName) || GoatBot.commands.get(GoatBot.aliases.get(commandName));

			const aliasesData = threadData.data.aliases || {};
			for (const cmdName in aliasesData) {
				if (aliasesData[cmdName].includes(commandName)) {
					command = GoatBot.commands.get(cmdName);
					break;
				}
			}

			if (command)
				commandName = command.config.name;

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

			if (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, langCode))
				return;

			if (!command) {
				if (commandName && !hideNotiMessage.commandNotFound) {
					const allCommands = Array.from(GoatBot.commands.keys());
					const allAliases = Array.from(GoatBot.aliases.keys());
					const allAvailableCommands = [...allCommands, ...allAliases];

					function levenshteinDistance(str1, str2) {
						const matrix = [];
						for (let i = 0; i <= str2.length; i++) matrix[i] = [i];
						for (let j = 0; j <= str1.length; j++) matrix[0][j] = j;
						for (let i = 1; i <= str2.length; i++) {
							for (let j = 1; j <= str1.length; j++) {
								const cost = str1[j - 1] === str2[i - 1] ? 0 : 1;
								matrix[i][j] = Math.min(
									matrix[i - 1][j] + 1,
									matrix[i][j - 1] + 1,
									matrix[i - 1][j - 1] + cost
								);
							}
						}
						return matrix[str2.length][str1.length];
					}

					let bestMatch = null;
					let minDistance = Infinity;

					for (const availableCommand of allAvailableCommands) {
						const distance = levenshteinDistance(commandName, availableCommand);
						if (distance < minDistance) {
							minDistance = distance;
							bestMatch = availableCommand;
						}
					}

					if (bestMatch && minDistance <= 2) {
						const suggestions = [
							`⚠️ **Invalid Command**\n> You entered: \`${commandName}\`\n> Did you mean: \`${prefix}${bestMatch}\`?`,
							`Oops! 🧐\nI couldn't find the command \`${commandName}\`.\nMaybe you meant \`${prefix}${bestMatch}\`? Let's try that! ✨`,
							`404: Command Not Found! 🤖\nMy programming doesn't include \`${commandName}\`.\nDid you mean to type \`${prefix}${bestMatch}\`?`,
							`Hmm, that's not quite right. 🤔\nNo command named \`${commandName}\` found. How about we try \`${prefix}${bestMatch}\` instead? 😊`,
							`[SYSTEM ALERT] ❗\nCommand \`${commandName}\` failed to execute. \n[SUGGESTION] Try: \`${prefix}${bestMatch}\``,
							`Hey there! 👋\nThe command \`${commandName}\` seems to be hiding. Is it possible you were looking for \`${prefix}${bestMatch}\`?`,
							`❌ **Command Not Found**\n- Input: \`${commandName}\`\n- Suggestion: \`${prefix}${bestMatch}\``,
							`Are you a wizard? 🧙‍♂️ Because \`${commandName}\` is a spell I don't know yet! Perhaps you meant the magic word \`${prefix}${bestMatch}\`?`,
							`Looks like a typo! 📝\nI didn't find \`${commandName}\`, but \`${prefix}${bestMatch}\` is very close!`,
							`Bleep bloop! 🤖 Malfunction!\nCannot compute \`${commandName}\`. \nRecommendation Engine suggests: \`${prefix}${bestMatch}\`.`,
							`Whoopsie-daisy! 🌼\nMy circuits got a little tangled looking for \`${commandName}\`. Did you mean the super cool command \`${prefix}${bestMatch}\`?`,
							`🎯 Almost there!\nI think you might have misspelled. Instead of \`${commandName}\`, try \`${prefix}${bestMatch}\`.`,
							`My apologies. 🙏\nThe command \`${commandName}\` is not in my list. Did you perhaps mean \`${prefix}${bestMatch}\`?`,
							`// Command Error\nFunction \`${commandName}\` is undefined.\nDid you mean: \`return "${prefix}${bestMatch}"\`?`,
							`That's a new one for me! 🤯\nI don't know \`${commandName}\`. Maybe you wanted to use \`${prefix}${bestMatch}\`?`,
							`One moment... ⏳ Search for \`${commandName}\` returned no results. Did you mean \`${prefix}${bestMatch}\`?`,
							`Houston, we have a problem! 🚀\nCommand \`${commandName}\` is lost in space! Maybe you meant to launch \`${prefix}${bestMatch}\`?`,
							`Error: The command entered is not valid.\n- You entered: \`${commandName}\`\n- Please check if you meant: \`${prefix}${bestMatch}\``,
							`A swing and a miss! ⚾\nBut you were close! Try \`${prefix}${bestMatch}\` instead of \`${commandName}\`.`,
							`Sorry, I couldn't understand \`${commandName}\`. 💬\nBut I think you might be looking for this: \`${prefix}${bestMatch}\`.`
						];
						const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
						return await message.reply(randomSuggestion);
					}
				}
				if (!hideNotiMessage.commandNotFound) {
					return await message.reply(
						commandName ?
							utils.getText({ lang: langCode, head: "handlerEvents" }, "commandNotFound", commandName, prefix) :
							utils.getText({ lang: langCode, head: "handlerEvents" }, "commandNotFound2", prefix)
					);
				}
				return true;
			}

			if (await checkGroupAuthorization(isGroup, config, senderID, commandName, threadData, message)) return;

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

			const time = getTime("DD/MM/YYYY HH:mm:ss");
			isUserCallCommand = true;
			try {
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
					args,
					commandName,
					getLang: getText2,
					removeCommandNameFromBody
				});
				timestamps[senderID] = dateNow;
				log.info("CALL COMMAND", `${commandName} | ${userData.name} | ${senderID} | ${threadID} | ${args.join(" ")}`);
			}
			catch (err) {
				log.err("CALL COMMAND", `An error occurred when calling the command ${commandName}`, err);
				const errStr = err && (err.stack ? removeHomeDir(err.stack.split("\n").slice(0, 5).join("\n")) : JSON.stringify(err, null, 2));
				return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred", time, commandName, errStr));
			}
		}

		/*
		 +------------------------------------------------+
		 |                     ON CHAT                    |
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
								log.info("onChat", `${commandName} | ${userData.name} | ${senderID} | ${threadID} | ${args.join(" ")}`);
							}
							catch (err) {
								const errStr = err && (err.stack ? removeHomeDir(err.stack.split("\n").slice(0, 5).join("\n")) : JSON.stringify(err, null, 2));
								await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred2", time, commandName, errStr));
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
								const errStr = err && (err.stack ? removeHomeDir(err.stack.split("\n").slice(0, 5).join("\n")) : JSON.stringify(err, null, 2));
								message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred7", time, commandName, errStr));
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
								const errStr = err && (err.stack ? removeHomeDir(err.stack.split("\n").slice(0, 5).join("\n")) : JSON.stringify(err, null, 2));
								await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred2", time, commandName, errStr));
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
		 |                     ON REPLY                   |
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

			if (await checkGroupAuthorization(isGroup, config, senderID, commandName, threadData, message)) return;

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
				const errStr = err && (err.stack ? removeHomeDir(err.stack.split("\n").slice(0, 5).join("\n")) : JSON.stringify(err, null, 2));
				await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred3", time, commandName, errStr));
			}
		}


		/*
		 +------------------------------------------------+
		 |                   ON REACTION                  |
		 +------------------------------------------------+
		*/
		async function onReaction() {
			if (event.reaction === "😠" && role >= 1) {
				try {
					await api.unsendMessage(messageID);
					log.info("ADMIN UNSEND", `Message ${messageID} unsent by admin ${senderID}`);
					return;
				} catch (err) {
					log.err("ADMIN UNSEND", `Failed to unsend message ${messageID}`, err);
				}
			}

			const { onReaction } = GoatBot;
			const Reaction = onReaction.get(messageID);
			if (!Reaction)
				return;
			Reaction.delete = () => onReaction.delete(messageID);
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

			if (await checkGroupAuthorization(isGroup, config, senderID, commandName, threadData, message)) return;

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
			
			// ✅ FEATURE: ADD DELAY BEFORE PROCESSING REACTION
			await randomDelay(300, 800);

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
				const errStr = err && (err.stack ? removeHomeDir(err.stack.split("\n").slice(0, 5).join("\n")) : JSON.stringify(err, null, 2));
				await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred4", time, commandName, errStr));
			}
		}


		/*
		 +------------------------------------------------+
		 |                  EVENT COMMAND                 |
		 +------------------------------------------------+
		*/
		async function handlerEvent() {
			const { author } = event;
			const entries = GoatBot.eventCommands && typeof GoatBot.eventCommands.entries === 'function'
				? GoatBot.eventCommands.entries()
				: [];

			for (const pair of entries) {
				const key = Array.isArray(pair) ? pair[0] : pair;
				const getEvent = GoatBot.eventCommands.get ? GoatBot.eventCommands.get(key) : (Array.isArray(pair) ? pair[1] : undefined);
				if (!getEvent)
					continue;

				const commandName = getEvent.config?.name || key;
				if (typeof getEvent.onStart !== 'function')
					continue;

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
					const errStr = err && (err.stack ? removeHomeDir(err.stack.split("\n").slice(0, 5).join("\n")) : JSON.stringify(err, null, 2));
					try {
						await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred5", time, commandName, errStr));
					} catch (sendErr) {
						log.err("EVENT COMMAND", `Failed to send errorOccurred5 reply for ${commandName}`, sendErr);
					}
				}
			}
		}


		/*
		 +------------------------------------------------+
		 |                     ON EVENT                   |
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
								const errStr = err && (err.stack ? removeHomeDir(err.stack.split("\n").slice(0, 5).join("\n")) : JSON.stringify(err, null, 2));
								message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred6", time, commandName, errStr));
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
		 |                 OTHER HANDLERS                 |
		 +------------------------------------------------+
		*/
		async function presence() { }
		async function read_receipt() { }
		async function typ() { }

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
