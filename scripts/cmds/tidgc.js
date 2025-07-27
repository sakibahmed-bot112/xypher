module.exports = {
  config: {
    name: "tidgc",
    version: "1.2",
    author: "_ANIK 🐢",
    role: 2,
    shortDescription: "Get group TIDs",
    longDescription: "List groups with TIDs, reply number to get only TID and remove the list message.",
    category: "admin",
    guide: {
      en: "{p}tidgc → Reply with number to get TID (list will be unsent)"
    }
  },

  allowedUIDs: [
    "61572589774495", // 1st UID
    "61558166309783"  // 2nd UID
  ],

  onStart: async function ({ api, event }) {
    if (!this.allowedUIDs.includes(event.senderID.toString()))
      return api.sendMessage("⛔ 𝐍𝐨 𝐏𝐞𝐫𝐦𝐢𝐬𝐬𝐢𝐨𝐧 𝐨𝐧𝐥𝐲 𝐜𝐚𝐧 𝐮𝐬𝐞 𝐨𝐰𝐧𝐞𝐫 𝐀𝐒𝐈𝐅..!", event.threadID);

    try {
      const threads = await api.getThreadList(100, null, ["INBOX"]);
      const groupThreads = threads.filter(t => t.isGroup && t.name !== null);

      if (groupThreads.length === 0)
        return api.sendMessage("❌ 𝐒𝐨𝐫𝐫𝐲 𝐟𝐨𝐫 𝐭𝐡𝐚𝐭 𝐛𝐨𝐬𝐬..!", event.threadID);

      const list = groupThreads.map((g, i) =>
        `${i + 1}. ${g.name}\nTID_${g.threadID}`
      ).join("\n\n");

      const msg = `📋 𝐆𝐑𝐎𝐔𝐏 𝐓𝐈𝐃 𝐋𝐈𝐒𝐓 𝐒𝐓𝐀𝐓𝐔𝐒:\n\n${list}\n\n📩 𝐑𝐏𝐋𝐘 𝐖𝐈𝐓𝐇 𝐍𝐔𝐌𝐁𝐄𝐑 𝐓𝐎 𝐆𝐄𝐓 𝐎𝐍𝐋𝐘 𝐓𝐇𝐄 𝐓𝐈𝐃...`;

      const sent = await api.sendMessage(msg, event.threadID);

      global.GoatBot.onReply.set(sent.messageID, {
        commandName: "tidgc",
        author: event.senderID,
        groupThreads,
        listMsgID: sent.messageID
      });
    } catch (err) {
      console.error(err);
      api.sendMessage("⚠️ Error getting group list.", event.threadID);
    }
  },

  onReply: async function ({ api, event, Reply }) {
    const { author, groupThreads, listMsgID } = Reply;

    if (event.senderID !== author)
      return api.sendMessage("⛔ 𝐎𝐍𝐋𝐘 𝐓𝐇𝐄 𝐂𝐎𝐌𝐀𝐍𝐃 𝐎𝐖𝐍𝐄𝐑 𝐀𝐒𝐈𝐅 𝐂𝐀𝐍 𝐑𝐄𝐏𝐋𝐘..✅", event.threadID);

    const index = parseInt(event.body.trim());
    if (isNaN(index) || index < 1 || index > groupThreads.length)
      return api.sendMessage("❌ 𝐈𝐧𝐯𝐚𝐥𝐢𝐝 𝐧𝐮𝐦𝐛𝐞𝐫..", event.threadID);

    const selectedGroup = groupThreads[index - 1];

    try {
      await api.unsendMessage(listMsgID);
    } catch {
      // fail silently
    }

    return api.sendMessage(`🆔 ${selectedGroup.threadID}`, event.threadID);
  }
};
