const axios = require("axios");
const fs = require("fs");

module.exports = {
  config: {
    name: "pending",
    aliases: ["pen", "pend", "pe"],
    version: "1.6.9",
    author: "♡ Nazrul ♡",
    countDown: 5,
    role: 1,
    shortDescription: "handle pending requests",
    longDescription: "Approve orreject pending users or group requests",
    category: "utility",
  },

  onReply: async function ({ message, api, event, Reply }) {
    const { author, pending, messageID } = Reply;
    if (String(event.senderID) !== String(author)) return;

    const { body, threadID } = event;

    if (body.trim().toLowerCase() === "c") {
      try {
        await api.unsendMessage(messageID);
        return api.sendMessage(
          ` Operation has been canceled!`,
          threadID
        );
      } catch {
        return;
      }
    }

    const indexes = body.split(/\s+/).map(Number);

    if (isNaN(indexes[0])) {
      return api.sendMessage(`⚠ Invalid input! Please try again.`, threadID);
    }

    let count = 0;

    for (const idx of indexes) {
 
      if (idx <= 0 || idx > pending.length) continue;

      const group = pending[idx - 1];

      try {
        await api.sendMessage(
          `✅ 𝐆𝐑𝐎𝐔𝐏  𝐇𝐀𝐒  𝐁𝐄𝐄𝐍  𝐒𝐔𝐂𝐂𝐄𝐒𝐒𝐅𝐔𝐋𝐋𝐘  𝐀𝐏𝐏𝐑𝐎𝐕𝐄𝐃  𝐁𝐘  - 𝐀𝐒𝐈𝐅  ✈︎ 🎀\n\n📜 𝐓𝐘𝐏𝐄 ✈︎ ${global.GoatBot.config.prefix}𝐇𝐄𝐋𝐏  𝐓𝐎  𝐒𝐄𝐄  𝐂𝐌𝐃𝐒..!`,
          group.threadID
        );

        await api.changeNickname(
          `${global.GoatBot.config.nickNameBot || "- 𝐀𝐒𝐈𝐅  ✈︎  𝐁𝐎𝐓"}`,
          group.threadID,
          api.getCurrentUserID()
        );

        count++;
      } catch {
  
        count++;
      }
    }

    for (const idx of indexes.sort((a, b) => b - a)) {
      if (idx > 0 && idx <= pending.length) {
        pending.splice(idx - 1, 1);
      }
    }

    return api.sendMessage(
      `✅ | [ 𝐒𝐔𝐂𝐂𝐄𝐒𝐒𝐅𝐔𝐋𝐋𝐘  𝐁𝐎𝐓 ] 🎉 𝐀𝐏𝐑𝐎𝐕𝐄𝐃 ${count} 𝐆𝐑𝐎𝐔𝐏..!🚮`,
      threadID
    );
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { threadID, messageID } = event;
    const adminBot = global.GoatBot.config.adminBot;

    if (!adminBot.includes(event.senderID)) {
      return api.sendMessage(
        `⚠ you have no permission to use this command!`,
        threadID
      );
    }

    const type = args[0]?.toLowerCase();
    if (!type) {
      return api.sendMessage(
        `Usage: pending [user/thread/all]`,
        threadID
      );
    }

    let msg = "",
      index = 1;
    try {
      const spam = (await api.getThreadList(100, null, ["OTHER"])) || [];
      const pending = (await api.getThreadList(100, null, ["PENDING"])) || [];
      const list = [...spam, ...pending];

      let filteredList = [];
      if (type.startsWith("u")) filteredList = list.filter((t) => !t.isGroup);
      if (type.startsWith("t")) filteredList = list.filter((t) => t.isGroup);
      if (type === "all") filteredList = list;

      for (const single of filteredList) {
        const name =
          single.name || (await usersData.getName(single.threadID)) || "Unknown";

        msg += `[ ${index} ]  ${name}\n`;
        index++;
      }

      msg += `🦋 𝐑𝐞𝐩𝐥𝐲 𝐰𝐢𝐭𝐡 𝐭𝐡𝐞 𝐜𝐨𝐫𝐫𝐞𝐜𝐭 𝐠𝐫𝐨𝐮𝐩 𝐧𝐮𝐦𝐛𝐞𝐫 𝐭𝐨 𝐚𝐩𝐩𝐫𝐨𝐯𝐞..!\n`;
      msg += `✨ 𝐑𝐞𝐩𝐥𝐲 𝐰𝐢𝐭𝐡 "𝐜" 𝐭𝐨 𝐂𝐚𝐧𝐜𝐞𝐥.\n`;

      return api.sendMessage(
        `✨ | [ 𝐏𝐄𝐍𝐃𝐈𝐍𝐆  𝐀𝐒𝐈𝐅  𝐁𝐎𝐓  𝐆𝐑𝐎𝐔𝐏'𝐒  &  𝐔𝐒𝐄𝐑 ${type
          .charAt(0)
          .toUpperCase()}${type.slice(1)} 𝐋𝐈𝐒𝐓 ✨ ]\n\n${msg}`,
        threadID,
        (error, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: this.config.name,
            messageID: info.messageID,
            author: event.senderID,
            pending: filteredList,
          });
        },
        messageID
      );
    } catch (error) {
      return api.sendMessage(
        `⚠ Failed to retrieve pending list. Please try again later.`,
        threadID
      );
    }
  },
};
