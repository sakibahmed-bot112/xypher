module.exports = {
  config: {
    name: "out",
    version: "2.0",
    author: "Asif",
    countDown: 5,
    role: 2,
    shortDescription: "Bot leave groups by list or leave all",
    longDescription: "Use 'out list' to show groups and leave by number(s), or 'out all' to leave all groups at once.",
    category: "admin",
    guide: {
      en: "{p}out list → show group list\n{p}out all → leave all groups"
    },
  },

  onStart: async function ({ api, event, args }) {
    const input = args[0];

    if (!input)
      return api.sendMessage("❓ 𝗨𝘀𝗲:\n• 𝗢𝘂𝘁 𝗟𝗶𝘀𝘁 → 𝐒𝐡𝐨𝐰 𝐠𝐫𝐨𝐮𝐩 𝐥𝐢𝐬𝐭\n• 𝗢𝘂𝘁 𝗔𝗹𝗹 → 𝐋𝐞𝐚𝐯𝐞 𝐚𝐥𝐥 𝐠𝐫𝐨𝐮𝐩𝐬", event.threadID);

    const botID = api.getCurrentUserID();

    if (input.toLowerCase() === "list") {
      // === out list ===
      try {
        const threads = await api.getThreadList(50, null, ["INBOX"]);
        const groupThreads = threads.filter(t => t.isGroup && t.name !== null);

        if (groupThreads.length === 0)
          return api.sendMessage("🤖 Bot is not in any group chat.", event.threadID);

        const list = groupThreads.map((g, i) =>
          `${i + 1}. ${g.name}\nTID: ${g.threadID}`
        ).join("\n\n");

        const msg = `📂 𝐆𝐫𝐨𝐮𝐩𝐬 𝐛𝐨𝐭 𝐢𝐬 𝐢𝐧:\n\n${list}\n\n📌 Reply with number(s) (e.g. 1,3,5) to remove bot from those groups.`;

        const sent = await api.sendMessage(msg, event.threadID);

        global.GoatBot = global.GoatBot || {};
        global.GoatBot.onReply = global.GoatBot.onReply || new Map();

        global.GoatBot.onReply.set(sent.messageID, {
          commandName: "outlist",
          type: "list",
          author: event.senderID,
          messageID: sent.messageID,
          groupThreads
        });

      } catch (err) {
        console.error("Error in out list:", err);
        api.sendMessage("❌ Error while getting group list.", event.threadID);
      }

    } else if (input.toLowerCase() === "all") {
      // === out all ===
      try {
        const threads = await api.getThreadList(100, null, ["INBOX"]);
        const groupThreads = threads.filter(t => t.isGroup && t.name !== null);

        if (groupThreads.length === 0)
          return api.sendMessage("🤖 Bot is not in any group chat.", event.threadID);

        let success = 0, failed = 0;

        for (const thread of groupThreads) {
          try {
            await api.sendMessage("- সবাই ভালো থেকো, আমার বস আসিফ বলছে বের হয়ে যেতে..!😔", thread.threadID);
            await api.removeUserFromGroup(botID, thread.threadID);
            success++;
          } catch (err) {
            console.error(`❌ Failed on ${thread.name}`, err);
            failed++;
          }
        }

        api.sendMessage(`✅ Done\n➡️ Left: ${success} group(s)\n❌ Failed: ${failed}`, event.threadID);

      } catch (err) {
        console.error("Error in out all:", err);
        api.sendMessage("❌ Failed to leave all groups.", event.threadID);
      }

    } else {
      return api.sendMessage("❌ Invalid argument.\nUse:\n• out list\n• out all", event.threadID);
    }
  },

  onReply: async function ({ api, event, Reply }) {
    const { author, groupThreads } = Reply;
    if (event.senderID !== "61558166309783")
      return api.sendMessage("⛔ |- আমাকে বের করার তুই কে..!🙄", event.threadID);

    const input = event.body.replace(/\s+/g, '');
    const digits = input.split('').map(d => parseInt(d)).filter(n => !isNaN(n));

    if (digits.length === 0)
      return api.sendMessage("❌ Invalid input. Use numbers like 1,3,5.", event.threadID);

    const botID = api.getCurrentUserID();
    let success = 0, failed = 0;

    for (const index of digits) {
      if (index < 1 || index > groupThreads.length) {
        failed++;
        continue;
      }

      const target = groupThreads[index - 1];

      try {
        await api.sendMessage("- সবাই ভালো থেকো, আমার বস আসিফ বলছে বের হয়ে যেতে..!😔", target.threadID);
        await api.removeUserFromGroup(botID, target.threadID);
        success++;
      } catch (err) {
        console.error(`❌ Failed to leave ${target.name}`, err);
        failed++;
      }
    }

    api.sendMessage(
      `✅ Finished\n➡️ Left: ${success} group(s)\n❌ Failed: ${failed}`,
      event.threadID
    );
  }
};
