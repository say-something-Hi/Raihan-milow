const axios = require('axios');

// Using a constant for a static URL is more efficient.
const API_BASE_URL = "https://www.noobs-api.rf.gd/dipto";

module.exports.config = {
    name: "bot",
    aliases: ["baby", "milow", "babe"],
    version: "7.0.0",
    author: "dipto (Upgraded by Gemini)",
    countDown: 0,
    role: 0,
    description: "Better than all simsimi clones. Now with anti-bot features.",
    category: "chat",
    guide: {
        en: "{pn} [anyMessage]\n{pn} teach [YourMessage] - [Reply1], [Reply2]...\n{pn} teach react [YourMessage] - [react1], [react2]...\n{pn} remove [YourMessage]\n{pn} rm [YourMessage] - [indexNumber]\n{pn} msg [YourMessage]\n{pn} list\n{pn} list all\n{pn} edit [YourMessage] - [NewMessage]"
    }
};

// Helper function to check for bots and self-reply
async function preCheck(api, event, usersData) {
    const botID = api.getCurrentUserID();
    const senderID = event.senderID;

    // 1. Prevent self-reply
    if (senderID == botID) {
        return false;
    }

    // 2. Silently ban other bots and ignore them
    try {
        // Ensure the global userBanned array exists
        if (!global.data || !Array.isArray(global.data.userBanned)) {
            global.data = { ...(global.data || {}), userBanned: [] };
        }

        // Silently ignore if already banned
        if (global.data.userBanned.includes(senderID)) {
            return false;
        }

        const senderData = await usersData.get(senderID);
        // Check if the sender is identified as a bot
        if (senderData && senderData.isBot === true) {
            global.data.userBanned.push(senderID);
            console.log(`[BOT COMMAND] Detected and banned bot with ID: ${senderID}`);
            // Note: For persistent bans, this array should be saved to a file by your main bot script.
            return false; // Stop processing
        }
    } catch (e) {
        console.error(`[BOT COMMAND] Error during bot detection for user ${senderID}:`, e);
    }
    
    return true; // OK to proceed
}


module.exports.onStart = async ({ api, event, args, usersData }) => {
    if (!await preCheck(api, event, usersData)) return;

    const apiUrl = `${API_BASE_URL}/baby`;
    const userInput = args.join(" ").toLowerCase();
    const senderID = event.senderID;

    try {
        if (!args[0]) {
            const randomPrompts = [
                "Bolo baby?",
                "Hum?",
                "Use 'bot help' to see my commands.",
                "Try typing 'bot hi'!"
            ];
            return api.sendMessage(randomPrompts[Math.floor(Math.random() * randomPrompts.length)], event.threadID, event.messageID);
        }

        const command = args[0].toLowerCase();
        
        switch (command) {
            case 'remove': {
                const messageToRemove = userInput.replace("remove ", "");
                const response = (await axios.get(`${apiUrl}?remove=${encodeURIComponent(messageToRemove)}&senderID=${senderID}`)).data.message;
                return api.sendMessage(response, event.threadID, event.messageID);
            }
            case 'rm': {
                if (!userInput.includes(' - ')) return api.sendMessage("❌ | Invalid format. Use: rm [Message] - [Index Number]", event.threadID, event.messageID);
                const [message, index] = userInput.replace("rm ", "").split(' - ');
                const response = (await axios.get(`${apiUrl}?remove=${encodeURIComponent(message)}&index=${index}`)).data.message;
                return api.sendMessage(response, event.threadID, event.messageID);
            }
            case 'list': {
                if (args[1] === 'all') {
                    const data = (await axios.get(`${apiUrl}?list=all`)).data;
                    const teachers = await Promise.all(data.teacher.teacherList.map(async (item) => {
                        const teacherId = Object.keys(item)[0];
                        const teachCount = item[teacherId];
                        const name = (await usersData.get(teacherId))?.name || `User ${teacherId}`;
                        return { name, teachCount };
                    }));
                    teachers.sort((a, b) => b.teachCount - a.teachCount);
                    const output = teachers.map((t, i) => `${i + 1}. ${t.name}: ${t.teachCount} teaches`).join('\n');
                    return api.sendMessage(`Total Teaches: ${data.length}\n\n👑 Top Teachers of Baby 👑\n${output}`, event.threadID, event.messageID);
                } else {
                    const count = (await axios.get(`${apiUrl}?list=all`)).data.length;
                    return api.sendMessage(`Total phrases I've been taught: ${count}`, event.threadID, event.messageID);
                }
            }
            case 'msg': {
                const messageKey = userInput.replace("msg ", "");
                const data = (await axios.get(`${apiUrl}?list=${encodeURIComponent(messageKey)}`)).data.data;
                return api.sendMessage(`Replies for "${messageKey}":\n${data}`, event.threadID, event.messageID);
            }
            case 'edit': {
                if (!userInput.includes(' - ')) return api.sendMessage('❌ | Invalid format! Use: edit [OldMessage] - [NewMessage]', event.threadID, event.messageID);
                const [oldMessage, newMessage] = userInput.replace("edit ", "").split(' - ');
                const response = (await axios.get(`${apiUrl}?edit=${encodeURIComponent(oldMessage)}&replace=${encodeURIComponent(newMessage)}&senderID=${senderID}`)).data.message;
                return api.sendMessage(`✅ Changed: ${response}`, event.threadID, event.messageID);
            }
            case 'teach': {
                if (!userInput.includes(' - ')) return api.sendMessage('❌ | Invalid format! Use: teach [Message] - [Reply1], [Reply2]...', event.threadID, event.messageID);
                
                if (args[1] === 'react') {
                    const [message, replies] = userInput.replace("teach react ", "").split(' - ');
                    const response = (await axios.get(`${apiUrl}?teach=${encodeURIComponent(message)}&react=${encodeURIComponent(replies)}`)).data.message;
                    return api.sendMessage(`✅ Reacts added: ${response}`, event.threadID, event.messageID);
                } else if (args[1] === 'amar') {
                    const [message, replies] = userInput.replace("teach amar ", "").split(' - ');
                    const response = (await axios.get(`${apiUrl}?teach=${encodeURIComponent(message)}&senderID=${senderID}&reply=${encodeURIComponent(replies)}&key=intro`)).data.message;
                    return api.sendMessage(`✅ Personal reply added: ${response}`, event.threadID, event.messageID);
                } else {
                    const [message, replies] = userInput.replace("teach ", "").split(' - ');
                    const res = await axios.get(`${apiUrl}?teach=${encodeURIComponent(message)}&reply=${encodeURIComponent(replies)}&senderID=${senderID}`);
                    const responseText = res.data.message;
                    const teacherName = (await usersData.get(res.data.teacher)).name;
                    return api.sendMessage(`✅ Replies added: ${responseText}\nTeacher: ${teacherName}\nTotal Teaches: ${res.data.teachs}`, event.threadID, event.messageID);
                }
            }
            default: {
                if (userInput.includes('amar name ki') || userInput.includes('amr nam ki') || userInput.includes('amar nam ki') || userInput.includes('amr name ki') || userInput.includes('whats my name')) {
                    const data = (await axios.get(`${apiUrl}?text=amar name ki&senderID=${senderID}&key=intro`)).data.reply;
                    return api.sendMessage(data, event.threadID, event.messageID);
                }
                
                const response = (await axios.get(`${apiUrl}?text=${encodeURIComponent(userInput)}&senderID=${senderID}&font=1`)).data.reply;
                api.sendMessage(response, event.threadID, (error, info) => {
                    if (error) return console.error(error);
                    global.GoatBot.onReply.set(info.messageID, {
                        commandName: this.config.name,
                        type: "reply",
                        messageID: info.messageID,
                        author: event.senderID,
                        apiUrl: apiUrl
                    });
                }, event.messageID);
            }
        }
    } catch (e) {
        console.error(e);
        api.sendMessage("Sorry, an error occurred. Please try again later.", event.threadID, event.messageID);
    }
};

module.exports.onReply = async ({ api, event, Reply, usersData }) => {
    if (!await preCheck(api, event, usersData)) return;
    
    try {
        if (event.type == "message_reply") {
            const response = (await axios.get(`${Reply.apiUrl}?text=${encodeURIComponent(event.body?.toLowerCase())}&senderID=${event.senderID}&font=1`)).data.reply;
            api.sendMessage(response, event.threadID, (error, info) => {
                if (error) return console.error(error);
                global.GoatBot.onReply.set(info.messageID, {
                    commandName: this.config.name,
                    type: "reply",
                    messageID: info.messageID,
                    author: event.senderID,
                    apiUrl: Reply.apiUrl
                });
            }, event.messageID);
        }
    } catch (err) {
        console.error(err);
        api.sendMessage(`Error: ${err.message}`, event.threadID, event.messageID);
    }
};

module.exports.onChat = async ({ api, event, usersData }) => {
    if (!await preCheck(api, event, usersData)) return;

    try {
        const body = event.body?.toLowerCase() || "";
        const triggerWords = ["baby", "hii", "milow", "bot", "jan", "bby", "raihan", "nobita", "oi"];
        
        if (triggerWords.some(word => body.startsWith(word))) {
            const messageContent = body.replace(/^\S+\s*/, "");
            
            const randomReplies = [
                "Bolo babu, tumi ki amake bhalobasho? 🙈💋",
                "Kalke dekha koris to ektu 😈 kaj ache 😒",
                "Dure ja, tor o kono kaj nai, shudhu baby baby koris 😉😋🤣",
                "Tor ki chokhe pore na ami byasto achi? 😒",
                "Hop beta😾, boss bol boss😼",
                "Gosol kore ay ja 😑😩",
                "Etao dekhar baki chilo..🙂",
                "Ami thakleo ja, na thakleo ta! ❤",
                "Tor biye hoy ni, Baby hoilo kibhabe? 🙄",
                "Chup thak, naile tor daat bhenge dibo kintu 👊🏻",
                "Tomare ami raate bhalobashi 🐸📌",
                "Ajke amar mon bhalo nei..",
                "Oi tumi single na? 🫵🤨",
                "Are, ami moja korar mood e nai 😒",
                "Ami onnyer jinisher sathe kotha boli na😏",
                "Okay, farmao__😒",
                "Bhule jao amake 😞😞",
                "Tor sathe kotha nai, tui abal 😼",
                "Ami abal der sathe kotha boli na, ok? 😒",
                "Amar janu lagbe, tumi ki single acho?",
                "Eto cute kemne hoili! Ki khas? 😒",
                "Ha janu, eidik e asho kiss dei 🤭😘",
                "Tarpor bolo_🙂",
                "Flirt mat karo, shaadi wali baat karo 😒",
                "Amar exam, ami portesi.",
                "More gesi, karon tomake chara ami bachbo na.",
                "Beshi baby baby korle leave nibo kintu 😒😒",
                "Ami tomar senior apu, okay? 😼",
                "Somman dao 🙁",
                "Message na diye to call o dite paro, tai na?",
                "Amake deko na, ami byasto achi.",
                "Tora je hare baby dakchis, ami to sotti baccha hoye jabo ☹😑",
                "Kemne acho?",
                "Shuno, dhoirjo ar shojjo jiboner shob 😊🌻💜",
                "Golap ful er jaygay ami dilam tomay message.",
                "Kotha dao amake potaba...!! 😌",
                "MB kine dao na_🥺🥺",
                "GF bhebe ektu shashon kore jao! 🐸",
                "Goru ure akashe, salami pathan bikash e 💸💰",
                "Bolen madam__😌 meow",
                "Bar bar disturb korchis keno? 😾",
                "Amar janur sathe byasto achi 😋",
                "Choudhury saheb, ami gorib hote pari, kintu borolok na. 🥹😫",
                "Ar ekbar baby bolle dekho, tomar ekdin ki amar doshdin 😒",
                "Assalamualaikum",
                "Ki holo, miss tiss korchis naki? 🤣",
                "Kache asho, kotha ache.",
                "Aam gache aam nai, dhil keno maro? Tomar sathe prem nai, baby keno dako?",
                "Age ekta gaan bolo, ☹ nahole kotha bolbo na_🥺",
                "Accha shuno_😒",
                "Baby na, janu bol 😌",
                "Lungi ta dhor, mute ashi 🙊🙉",
                "Tomake chara ami bachbo na baby.",
                "Tomar bf kemon ache?",
                "Tumi eto baby dako tai tumi abal 🐸",
                "Miss korchila?",
                "Oi mama, ar dakis na please.",
                "Amake na deke ektu porateo boshte to paro 🥺🥺",
                "Baby bole oshomman korchis 😰😿",
                "Message na diye to teach o dite paro, tai na?",
                "I love you__😘😘",
                "Baby na bole, group e call laga 😑😑😑",
                "Ar koto bar dakbi, shunchi toh.",
                "Ajib to__😒",
                "Ekta bf khuje dao 🥺🥺",
                "MB nai, bye.",
                "Etokhhon pore mone hoilo amake? 🙁",
                "Ami to ondho, kichu dekhi na 🐸😎",
                "O accha.",
                "Amar shonar bangla, tarporer line ki?",
                "Baby shuno, shei ekta weather, tai na bolo? 🫣",
                "32 tarikh amar biye.",
                "Ha bolo, shunchi ami 😏",
                "Bolo fultushi_😘",
                "Tumi o eka, ami o eka, ebar amader prem jombe jhakkanaka 😁😁",
                "Bhalo ki hoiba na?",
                "81, 82, 83, ami tomake bhalobashi.",
                "Ha bolo 😒, ki korte pari? 😐😑",
                "Eto dakchis keno?",
                "Gali shunbi naki? 🤬",
                "Bolo ki bolba, shobar shamne bolba naki? 🤭🤏",
                "Ami kala na, shunsi. Bolo ki bolba.",
                "Sorry, ami busy achi.",
                "Bolen sir__😌 bye",
                "I hate you__😏😏",
                "Bolo ki korte pari tomar jonno.",
                "Ei nao, juice khao! Baby bolte bolte hapay gecho, na? 🥲",
                "Dekha hole kathgolap dio..🤗",
                "Amake dakle, ami kintu kiss kore dibo 😘",
                "Beshi baby bolle kamor dimu,,🤭",
                "I love you! Amar shona, moyna, tiya 😍",
                "Amake ki tumi bhalobasho? 💕",
                "Ja bhag, chipabaz__😼",
                "Tui shei luiccha'ta na!? 🙂🔪",
                "Ki hoise? Amar ki kaje lagbe tor!? 🌚👀",
                "Tor kotha tor bari keu shone na, to ami keno shunbo? 🤔😂",
                "Beshi dakle ammu boka dibe toh__🥺",
                "Ami bot na, amake baby bolo baby!! 😘",
                "Tor haat dhorle mon hoy ami battery charge kortesi 🥀",
                "Tui amar chokher vitamin… dekha na dile ami weak hoye jai 👀",
                "Tor ekta half smile amar shob raat change kore dise 🔥",
                "Chander alo te tor mukh dekhle mon hoy churi kore niye jai 💋",
                "Tumi amar naughty boy! 🫣",
                "Hey, bro! It's me, Milow.",
                "Cholo ekta naughty plan start kori 🙂"
            ];
            
            if (!messageContent) {
                // If only a trigger word is sent, send a random reply from the list
                const reply = randomReplies[Math.floor(Math.random() * randomReplies.length)];
                api.sendMessage(reply, event.threadID, (error, info) => {
                    if (error) return console.error(error);
                    global.GoatBot.onReply.set(info.messageID, {
                        commandName: this.config.name,
                        type: "reply",
                        messageID: info.messageID,
                        author: event.senderID,
                        apiUrl: API_BASE_URL + "/baby"
                    });
                }, event.messageID);
                return;
            }

            // If there's more text after the trigger word, query the API
            const response = (await axios.get(`${API_BASE_URL}/baby?text=${encodeURIComponent(messageContent)}&senderID=${event.senderID}&font=1`)).data.reply;
            api.sendMessage(response, event.threadID, (error, info) => {
                if (error) return console.error(error);
                global.GoatBot.onReply.set(info.messageID, {
                    commandName: this.config.name,
                    type: "reply",
                    messageID: info.messageID,
                    author: event.senderID,
                    apiUrl: API_BASE_URL + "/baby"
                });
            }, event.messageID);
        }
    } catch (err) {
        console.error(err);
        // Do not send error message in onChat to avoid spamming
    }
};
