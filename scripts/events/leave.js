const { getTime, drive } = global.utils;
const axios = require("axios");

module.exports = {
    config: {
        name: "leave",
        version: "3.2",
        author: "NTKhang + Copilot Enhanced + Gemini",
        category: "events",
        command: "leave",
        description: "Sends a notification when a member leaves. Also used to turn the notification on/off.",
        usage: "{p}leave <on|off>",
        permissions: [1]
    },

    langs: {
        vi: {
            session1: "sáng",
            session2: "trưa",
            session3: "chiều",
            session4: "tối",
            leaveType1: "tự rời",
            leaveType2: "bị kick",
            defaultLeaveMessage: "{userName} đã {type} khỏi nhóm",
            leaveMessageOn: "» Đã bật thông báo khi có thành viên rời nhóm.",
            leaveMessageOff: "» Đã tắt thông báo khi có thành viên rời nhóm.",
            noPermission: "» Chỉ quản trị viên nhóm mới có thể sử dụng lệnh này.",
            syntaxError: "» Cú pháp không hợp lệ. Vui lòng sử dụng: {p}leave <on|off>"
        },
        en: {
            session1: "morning",
            session2: "noon",
            session3: "afternoon",
            session4: "evening",
            leaveType1: "left",
            leaveType2: "was kicked from",
            defaultLeaveMessage: "{userName} {type} the group",
            leaveMessageOn: "» Turned on leave notifications for this group.",
            leaveMessageOff: "» Turned off leave notifications for this group.",
            noPermission: "» Only group administrators can use this command.",
            syntaxError: "» Invalid syntax. Please use: {p}leave <on|off>"
        }
    },

    onStart: async ({ threadsData, message, event, api, usersData, getLang }) => {
        if (event.logMessageType !== "log:unsubscribe") return;

        const { threadID } = event;
        const threadData = await threadsData.get(threadID);

        // Default fallback: enable leave messages unless explicitly disabled
        if (typeof threadData.settings.sendLeaveMessage === "undefined") {
            await threadsData.set(threadID, true, "settings.sendLeaveMessage");
        }
        if (threadData.settings.sendLeaveMessage === false) return;

        const { leftParticipantFbId } = event.logMessageData;
        if (leftParticipantFbId === api.getCurrentUserID()) return;

        const hours = parseInt(getTime("HH"));
        if (hours >= 0 && hours < 6 && threadData.settings.silentLeaveMode) return;

        const threadName = threadData.threadName;
        const userName = await usersData.getName(leftParticipantFbId);
        const leaveType = leftParticipantFbId === event.author ? getLang("leaveType1") : getLang("leaveType2");

        const session = hours <= 10 ? getLang("session1") :
                        hours <= 12 ? getLang("session2") :
                        hours <= 18 ? getLang("session3") :
                                      getLang("session4");

        const emojiStyle = threadData.settings.emojiStyle || "playful";
        const emojiSet = {
            playful: {
                [getLang("session1")]: "🌅",
                [getLang("session2")]: "🌞",
                [getLang("session3")]: "🌤️",
                [getLang("session4")]: "🌙"
            },
            professional: {
                [getLang("session1")]: "🚪",
                [getLang("session2")]: "📉",
                [getLang("session3")]: "🕒",
                [getLang("session4")]: "🔔"
            }
        };

        const emoji = emojiSet[emojiStyle][session];

        const customMessages = threadData.data.customLeaveMessages || {};
        let leaveMessage = customMessages[leftParticipantFbId] || threadData.data.leaveMessage || getLang("defaultLeaveMessage");

        leaveMessage = leaveMessage
            .replace(/\{userName\}|\{userNameTag\}/g, userName)
            .replace(/\{type\}/g, leaveType)
            .replace(/\{threadName\}|\{boxName\}/g, threadName)
            .replace(/\{time\}/g, hours)
            .replace(/\{session\}/g, session)
            + ` ${emoji}`;

        const form = {
            body: leaveMessage,
            mentions: leaveMessage.includes("{userNameTag}") ? [{
                id: leftParticipantFbId,
                tag: userName
            }] : null
        };

        if (threadData.data.leaveAttachment) {
            const files = threadData.data.leaveAttachment;
            const attachments = files.map(file => drive.getFile(file, "stream"));
            form.attachment = (await Promise.allSettled(attachments))
                .filter(({ status }) => status === "fulfilled")
                .map(({ value }) => value);
        }

        message.send(form);

        await threadsData.update(threadID, {
            logs: {
                leaveEvents: [
                    ...(threadData.logs?.leaveEvents || []),
                    {
                        userId: leftParticipantFbId,
                        userName,
                        time: new Date().toISOString(),
                        type: leaveType
                    }
             ]
            },
            stats: {
                leaveCount: (threadData.stats?.leaveCount || 0) + 1
            }
        });

        const adminIDs = threadData.adminIDs || [];
        for (const adminID of adminIDs) {
            api.sendMessage({
                body: `[Leave Alert] ${userName} ${leaveType} the group.\nTime: ${hours}:00 (${session})`,
                threadID: adminID
            });
        }

        if (threadData.settings.webhookURL) {
            axios.post(threadData.settings.webhookURL, {
                event: "leave",
                userId: leftParticipantFbId,
                threadId,
                userName,
                threadName,
                time: new Date().toISOString(),
                type: leaveType
            }).catch(() => {});
        }
    },

    onCall: async ({ message, args, threadsData, getLang, prefix }) => {
        const { threadID, senderID } = message;
        const threadData = await threadsData.get(threadID);

        if (!threadData.adminIDs.includes(senderID)) {
            return message.reply(getLang("noPermission"));
        }

        const option = args[0]?.toLowerCase();
        if (option === "on") {
            await threadsData.set(threadID, true, "settings.sendLeaveMessage");
            return message.reply(getLang("leaveMessageOn"));
        } else if (option === "off") {
            await threadsData.set(threadID, false, "settings.sendLeaveMessage");
            return message.reply(getLang("leaveMessageOff"));
        } else {
            return message.reply(getLang("syntaxError").replace("{p}", prefix));
        }
    }
};
