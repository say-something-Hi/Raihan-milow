const axios = require('axios');

// Helper function to format text into a stylish font
const formatText = (text) => {
  const fontMap = {
    'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ꜰ', 'g': 'ɢ', 'h': 'ʜ', 'i': 'ɪ', 'j': 'ᴊ', 'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ',
    'n': 'ɴ', 'o': 'ᴏ', 'p': 'ᴘ', 'q': 'ǫ', 'r': 'ʀ', 's': 'ꜱ', 't': 'ᴛ', 'u': 'ᴜ', 'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x', 'y': 'ʏ', 'z': 'ᴢ',
    'A': 'ᴀ', 'B': 'ʙ', 'C': 'ᴄ', 'D': 'ᴅ', 'E': 'ᴇ', 'F': 'ꜰ', 'G': 'ɢ', 'H': 'ʜ', 'I': 'ɪ', 'J': 'ᴊ', 'K': 'ᴋ', 'L': 'ʟ', 'M': 'ᴍ',
    'N': 'ɴ', 'O': 'ᴏ', 'P': 'ᴘ', 'Q': 'ǫ', 'R': 'ʀ', 'S': 'ꜱ', 'T': 'ᴛ', 'U': 'ᴜ', 'V': 'ᴠ', 'W': 'ᴡ', 'X': 'x', 'Y': 'ʏ', 'Z': 'ᴢ'
  };
  
  if (typeof text !== 'string') return text;
  
  // Apply our font mapping
  let formattedText = '';
  for (const char of text) {
    formattedText += fontMap[char] || char;
  }
  return formattedText;
};

const baseApiUrl = async () => {
  return "https://www.noobs-api.rf.gd/dipto";
};

module.exports.config = {
  name: "bot",
  aliases: ["baby", "milu", "babe"],
  version: "6.9.0",
  author: "dipto",
  countDown: 0,
  role: 0,
  description: "better then all sim simi",
  category: "chat",
  guide: {
    en: "{pn} [anyMessage] OR\nteach [YourMessage] - [Reply1], [Reply2], [Reply3]... OR\nteach [react] [YourMessage] - [react1], [react2], [react3]... OR\nremove [YourMessage] OR\nrm [YourMessage] - [indexNumber] OR\nmsg [YourMessage] OR\nlist OR \nall OR\nedit [YourMessage] - [NeeMessage]"
  }
};

module.exports.onStart = async ({ api, event, args, usersData }) => {
  const link = `${await baseApiUrl()}/baby`;
  const dipto = args.join(" ").toLowerCase();
  const uid = event.senderID;
  let command, comd, final;

  try {
    if (!args[0]) {
      const ran = [
        "Bolo baby",
        "hum",
        "type help baby", 
        "type !baby hi"
      ];
      return api.sendMessage(formatText(ran[Math.floor(Math.random() * ran.length)]), event.threadID, event.messageID);
    }

    if (args[0] === 'remove') {
      const fina = dipto.replace("remove ", "");
      const dat = (await axios.get(`${link}?remove=${fina}&senderID=${uid}`)).data.message;
      return api.sendMessage(formatText(dat), event.threadID, event.messageID);
    }

    if (args[0] === 'rm' && dipto.includes('-')) {
      const [fi, f] = dipto.replace("rm ", "").split(' - ');
      const da = (await axios.get(`${link}?remove=${fi}&index=${f}`)).data.message;
      return api.sendMessage(formatText(da), event.threadID, event.messageID);
    }

    if (args[0] === 'list') {
      if (args[1] === 'all') {
        const data = (await axios.get(`${link}?list=all`)).data;
        const teachers = await Promise.all(data.teacher.teacherList.map(async (item) => {
          const number = Object.keys(item)[0];
          const value = item[number];
          const name = (await usersData.get(number)).name;
          return { name, value };
        }));
        teachers.sort((a, b) => b.value - a.value);
        const output = teachers.map((t, i) => `${i + 1}/ ${t.name}: ${t.value}`).join('\n');
        return api.sendMessage(formatText(`Total Teach = ${data.length}\n👑 | List of Teachers of baby\n${output}`), event.threadID, event.messageID);
      } else {
        const d = (await axios.get(`${link}?list=all`)).data.length;
        return api.sendMessage(formatText(`Total Teach = ${d}`), event.threadID, event.messageID);
      }
    }

    if (args[0] === 'msg') {
      const fuk = dipto.replace("msg ", "");
      const d = (await axios.get(`${link}?list=${fuk}`)).data.data;
      return api.sendMessage(formatText(`Message ${fuk} = ${d}`), event.threadID, event.messageID);
    }

    if (args[0] === 'edit') {
      const command = dipto.split(' - ')[1];
      if (command.length < 2) return api.sendMessage(formatText('❌ | Invalid format! Use edit [YourMessage] - [NewReply]'), event.threadID, event.messageID);
      const dA = (await axios.get(`${link}?edit=${args[1]}&replace=${command}&senderID=${uid}`)).data.message;
      return api.sendMessage(formatText(`changed ${dA}`), event.threadID, event.messageID);
    }

    if (args[0] === 'teach' && args[1] !== 'amar' && args[1] !== 'react') {
      [comd, command] = dipto.split(' - ');
      final = comd.replace("teach ", "");
      if (command.length < 2) return api.sendMessage(formatText('❌ | Invalid format!'), event.threadID, event.messageID);
      const re = await axios.get(`${link}?teach=${final}&reply=${command}&senderID=${uid}`);
      const tex = re.data.message;
      const teacher = (await usersData.get(re.data.teacher)).name;
      return api.sendMessage(formatText(`✅ Replies added ${tex}\nTeacher: ${teacher}\nTeachs: ${re.data.teachs}`), event.threadID, event.messageID);
    }

    if (args[0] === 'teach' && args[1] === 'amar') {
      [comd, command] = dipto.split(' - ');
      final = comd.replace("teach ", "");
      if (command.length < 2) return api.sendMessage(formatText('❌ | Invalid format!'), event.threadID, event.messageID);
      const tex = (await axios.get(`${link}?teach=${final}&senderID=${uid}&reply=${command}&key=intro`)).data.message;
      return api.sendMessage(formatText(`✅ Replies added ${tex}`), event.threadID, event.messageID);
    }

    if (args[0] === 'teach' && args[1] === 'react') {
      [comd, command] = dipto.split(' - ');
      final = comd.replace("teach react ", "");
      if (command.length < 2) return api.sendMessage(formatText('❌ | Invalid format!'), event.threadID, event.messageID);
      const tex = (await axios.get(`${link}?teach=${final}&react=${command}`)).data.message;
      return api.sendMessage(formatText(`✅ Replies added ${tex}`), event.threadID, event.messageID);
    }

    if (dipto.includes('amar name ki') || dipto.includes('amr nam ki') || dipto.includes('amar nam ki') || dipto.includes('amr name ki') || dipto.includes('whats my name')) {
      const data = (await axios.get(`${link}?text=amar name ki&senderID=${uid}&key=intro`)).data.reply;
      return api.sendMessage(formatText(data), event.threadID, event.messageID);
    }

    // Remove font=1 parameter to get plain text from API
    const d = (await axios.get(`${link}?text=${dipto}&senderID=${uid}`)).data.reply;
    api.sendMessage(formatText(d), event.threadID, (error, info) => {
      global.GoatBot.onReply.set(info.messageID, {
        commandName: this.config.name,
        type: "reply",
        messageID: info.messageID,
        author: event.senderID,
        d,
        apiUrl: link
      });
    }, event.messageID);

  } catch (e) {
    console.log(e);
    api.sendMessage(formatText("Check console for error"), event.threadID, event.messageID);
  }
};

module.exports.onReply = async ({ api, event, Reply }) => {
  try {
    if (event.type == "message_reply") {
      // Remove font=1 parameter to get plain text from API
      const a = (await axios.get(`${await baseApiUrl()}/baby?text=${encodeURIComponent(event.body?.toLowerCase())}&senderID=${event.senderID}`)).data.reply;
      await api.sendMessage(formatText(a), event.threadID, (error, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          type: "reply",
          messageID: info.messageID,
          author: event.senderID,
          a
        });
      }, event.messageID);
    }
  } catch (err) {
    return api.sendMessage(formatText(`Error: ${err.message}`), event.threadID, event.messageID);
  }
};

module.exports.onChat = async ({ api, event, message }) => {
  try {
    const body = event.body ? event.body?.toLowerCase() : "";
    if (body.startsWith("baby") || body.startsWith("hii") || body.startsWith("milo") || body.startsWith("by") || body.startsWith("hi") || body.startsWith("bby") || body.startsWith("raihan") || body.startsWith("kire") || body.startsWith("oi")) {
      const arr = body.replace(/^\S+\s*/, "");
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
      
      if (!arr) {
        await api.sendMessage(formatText(randomReplies[Math.floor(Math.random() * randomReplies.length)]), event.threadID, (error, info) => {
          if (!info) message.reply(formatText("info obj not found"));
          global.GoatBot.onReply.set(info.messageID, {
            commandName: this.config.name,
            type: "reply",
            messageID: info.messageID,
            author: event.senderID
          });
        }, event.messageID);
        return;
      }
      
      // Remove font=1 parameter to get plain text from API
      const a = (await axios.get(`${await baseApiUrl()}/baby?text=${encodeURIComponent(arr)}&senderID=${event.senderID}`)).data.reply;
      await api.sendMessage(formatText(a), event.threadID, (error, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          type: "reply",
          messageID: info.messageID,
          author: event.senderID,
          a
        });
      }, event.messageID);
    }
  } catch (err) {
    return api.sendMessage(formatText(`Error: ${err.message}`), event.threadID, event.messageID);
  }
};
