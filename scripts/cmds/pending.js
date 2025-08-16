module.exports = {
  config: {
    name: "pending",
    version: "1.0",
    author: "ArYan 🐔",
    countDown: 5,
    role: 2,
    shortDescription: {
      vi: "",
      en: ""
    },
    longDescription: {
      vi: "",
      en: ""
    },
    category: "ArYan"
  },

  langs: {
    en: {
      invaildNumber: "%1 is not a valid number!",
      approveSuccess: "✅ Approved %1 thread(s) successfully!",
      cantGetPendingList: "⚠️ Can't get the pending list!",
      returnListPending: "»「PENDING」«\n❮ Total pending threads: %1 ❯\n\n%2",
      returnListClean: "✅ No threads in the pending list.",
      approveAllSuccess: "✅ Approved all %1 pending threads!"
    }
  },

  onReply: async function ({ api, event, Reply, getLang }) {
    if (String(event.senderID) !== String(Reply.author)) return;
    const { body, threadID, messageID } = event;
    let count = 0;

    // Approve all
    if (body.toLowerCase() === "all") {
      for (const group of Reply.pending) {
        const prefix =
          (global.GoatBot.config.prefix && global.GoatBot.config.prefix[group.threadID]) ||
          global.GoatBot.config.prefix?.default ||
          "!";

        const msg = `╭━「 ✅ 𝐆𝐫𝐨𝐮𝐩 𝐀𝐩𝐩𝐫𝐨𝐯𝐞𝐝 」
┃📍 𝐆𝐥𝐨𝐛𝐚𝐥 𝐏𝐫𝐞𝐟𝐢𝐱: ! 
┃👥 𝐓𝐡𝐫𝐞𝐚𝐝 𝐏𝐫𝐞𝐟𝐢𝐱: ${prefix}
┃🧸 𝐒𝐭𝐚𝐭𝐮𝐬: Connected 🎉
╰━━━━━━━━━━━━━╮
╭─❍ 𝐁𝐨𝐭 𝐁𝐲: 𝗔𝗦𝗜𝗙
┃🌐 FB: A17.AS1F
╰━━━━━━━━━━━━━╯`;

        await api.sendMessage(msg, group.threadID);
        count++;
      }
      return api.sendMessage(getLang("approveAllSuccess", count), threadID, messageID);
    }

    // Approve selected indexes
    const index = body.split(/\s+/);
    for (const ArYanIndex of index) {
      if (isNaN(ArYanIndex) || ArYanIndex <= 0 || ArYanIndex > Reply.pending.length)
        return api.sendMessage(getLang("invaildNumber", ArYanIndex), threadID, messageID);

      const group = Reply.pending[ArYanIndex - 1];
      const prefix =
        (global.GoatBot.config.prefix && global.GoatBot.config.prefix[group.threadID]) ||
        global.GoatBot.config.prefix?.default ||
        "!";

      const msg = `╭━「 ✅ 𝐆𝐫𝐨𝐮𝐩 𝐀𝐩𝐩𝐫𝐨𝐯𝐞𝐝 」
┃📍 𝐆𝐥𝐨𝐛𝐚𝐥 𝐏𝐫𝐞𝐟𝐢𝐱: ! 
┃👥 𝐓𝐡𝐫𝐞𝐚𝐝 𝐏𝐫𝐞𝐟𝐢𝐱: ${prefix}
┃🧸 𝐒𝐭𝐚𝐭𝐮𝐬: Connected 🎉
╰━━━━━━━━━━━━━╮
╭─❍ 𝐁𝐨𝐭 𝐁𝐲: 𝗔𝗦𝗜𝗙
┃🌐 FB: A17.AS1F
╰━━━━━━━━━━━━━╯`;

      await api.sendMessage(msg, group.threadID);
      count++;
    }

    return api.sendMessage(getLang("approveSuccess", count), threadID, messageID);
  },

  onStart: async function ({ api, event, getLang, commandName }) {
    const { threadID, messageID } = event;
    let msg = "", index = 1;

    try {
      var spam = await api.getThreadList(100, null, ["OTHER"]) || [];
      var pending = await api.getThreadList(100, null, ["PENDING"]) || [];
    } catch (e) {
      return api.sendMessage(getLang("cantGetPendingList"), threadID, messageID);
    }

    const list = [...spam, ...pending].filter(group => group.isSubscribed && group.isGroup);
    for (const ArYan of list) msg += `${index++}/ ${ArYan.name} (${ArYan.threadID})\n`;

    if (list.length !== 0) {
      return api.sendMessage(getLang("returnListPending", list.length, msg), threadID, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName,
          messageID: info.messageID,
          author: event.senderID,
          pending: list
        });
      }, messageID);
    } else {
      return api.sendMessage(getLang("returnListClean"), threadID, messageID);
    }
  }
};
