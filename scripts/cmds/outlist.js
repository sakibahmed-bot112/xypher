module.exports = {
  config: {
    name: "outlist",
    version: "1.2",
    author: "asif",
    countDown: 5,
    role: 2,
    shortDescription: "Bot leave groups by choosing from list",
    longDescription: "List all groups where the bot is in, and leave based on selected number.",
    category: "admin",
    guide: {
      en: "{p}out → reply with number to leave",
    },
  },

  // 📤 Command start
  onStart: async function ({ api, event }) {
    try {
      const threads = await api.getThreadList(50, null, ["INBOX"]);
      const groupThreads = threads.filter(t => t.isGroup && t.name !== null);

      if (groupThreads.length === 0)
        return api.sendMessage("🤖 Bot is not in any group chat.", event.threadID);

      const list = groupThreads.map((g, i) =>
        `${i + 1}. ${g.name}\nTID: ${g.threadID}`
      ).join("\n\n");

      const msg = `📂 𝐆𝐫𝐨𝐮𝐩𝐬 𝐭𝐡𝐞 𝐛𝐨𝐭 𝐢𝐬 𝐢𝐧:\n\n${list}\n\n📌 Reply with the number to remove the bot from that group.`;

      const sent = await api.sendMessage(msg, event.threadID);

      global.GoatBot = global.GoatBot || {};
      global.GoatBot.onReply = global.GoatBot.onReply || new Map();

      global.GoatBot.onReply.set(sent.messageID, {
        commandName: "outlist",
        author: event.senderID,
        messageID: sent.messageID,
        groupThreads
      });
    } catch (err) {
      console.error("Error in outlist:", err);
      api.sendMessage("❌ Something went wrong while fetching group list.", event.threadID);
    }
  },

  // 🔁 Reply Handler
  onReply: async function ({ api, event, Reply }) {
    const { author, groupThreads, messageID } = Reply;

    if (event.senderID !== "61558166309783")
      return api.sendMessage("⛔ |- আমাকে বের করার তুই কে..!🙄", event.threadID);

    const index = parseInt(event.body);

    if (isNaN(index) || index < 1 || index > groupThreads.length) {
      return api.sendMessage("❌ Invalid number. Please try again with a valid one.", event.threadID);
    }

    const targetThread = groupThreads[index - 1];
    const botID = api.getCurrentUserID();

    try {
      // 🎤 বিদায় মেসেজ পাঠানো
      await api.sendMessage("- আমার বস আসিফ বলছে বের হতে, সবাই ভালো থেকো..!😊", targetThread.threadID);

      // ⛔ বট নিজেকে রিমুভ করছে
      await api.removeUserFromGroup(botID, targetThread.threadID);

      // ✅ কনফার্মেশন
      api.sendMessage(`✅ | 𝗕𝗼𝘁 𝗟𝗲𝗳𝘁 𝗧𝗵𝗲 𝗚𝗿𝗼𝘂𝗽 : ${targetThread.name}`, event.threadID);
    } catch (err) {
      console.error("Failed to leave group:", err);
      api.sendMessage("❌ Failed to leave the group. Make sure the bot is an admin in that group.", event.threadID);
    }

    global.GoatBot.onReply.delete(messageID);
  }
};
