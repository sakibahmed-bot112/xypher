module.exports = {
  config: {
    name: "gcnoti",
    aliases: ["msg", "sendgc"], // 'noti' removed
    version: "1.0",
    author: "_ANIK 🐢",
    countDown: 3,
    role: 0,
    shortDescription: "🔁 Send msg to any GC by TID (Only Anik)",
    longDescription: "Use: ,gcnoti [tid] [message] — Sends message to selected group. Only Anik can use.",
    category: "group"
  },

  onStart: async function ({ api, event, args }) {
    const senderID = event.senderID;

    // ✅ Only Anik Boss
    if (senderID !== "100027116303378") {
      return api.sendMessage(`- দূরে থাক, ইগনুর..! 😅`, event.threadID);
    }

    // ✅ args[0] = tid, rest = message
    const tid = args[0];
    const message = args.slice(1).join(" ");

    if (!tid || !message) {
      return api.sendMessage(`📌 Usage: ,gcnoti [tid] [message]`, event.threadID);
    }

    try {
      await api.sendMessage(`📨 ${message}`, tid);
      return api.sendMessage(`✅ Message delivered to ➤ ${tid}`, event.threadID);
    } catch (err) {
      return api.sendMessage(`❌ Could not send message.\n⚠️ Invalid TID or permission issue.`, event.threadID);
    }
  }
};
