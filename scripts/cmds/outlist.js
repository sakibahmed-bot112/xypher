const GROUPS_PER_PAGE = 10;
const allowedUIDs = ["61558166309783", "100027116303378", "61572589774495"];

module.exports = {
  config: {
    name: "out",
    version: "2.3",
    author: "Asif",
    countDown: 5,
    role: 2,
    shortDescription: "Bot leave groups by list or leave all",
    longDescription: "Use 'out list' to show groups page by page and leave by number(s), or 'out all' to leave all groups at once.",
    category: "admin",
    guide: {
      en: "{p}out list → show group list (10 per page)\n{p}out all → leave all groups"
    },
  },

  onStart: async function ({ api, event, args }) {
    if (!allowedUIDs.includes(event.senderID))
      return api.sendMessage("⛔ |- Permission নাই তর..!🙄", event.threadID);

    const input = args[0];
    if (!input)
      return api.sendMessage("❓ 𝗨𝘀𝗲:\n• out list\n• out all", event.threadID);

    const botID = api.getCurrentUserID();

    if (input.toLowerCase() === "list") {
      try {
        const threads = await getAllThreads(api);
        const groupThreads = threads.filter(t => t.isGroup);

        if (groupThreads.length === 0)
          return api.sendMessage("🤖 Bot is not in any group chat.", event.threadID);

        sendGroupListPage(api, event, groupThreads, 0);
      } catch (err) {
        console.error("Error in out list:", err);
        api.sendMessage("❌ Error while getting group list.", event.threadID);
      }

    } else if (input.toLowerCase() === "all") {
      try {
        const threads = await getAllThreads(api);
        const groupThreads = threads.filter(t => t.isGroup);

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
    const { groupThreads, page } = Reply;
    const input = event.body.trim().toUpperCase();

    if (!allowedUIDs.includes(event.senderID))
      return api.sendMessage("⛔ |- Permission নাই তর..!🙄", event.threadID);

    if (/^[A-Z]$/.test(input)) {
      const nextPage = input.charCodeAt(0) - 65;
      sendGroupListPage(api, event, groupThreads, nextPage);
      return;
    }

    const indices = input.split(/[\s,]+/)
      .map(n => parseInt(n))
      .filter(n => !isNaN(n));

    if (indices.length === 0)
      return api.sendMessage("❌ Invalid input. Use numbers like 1,3,12", event.threadID);

    const botID = api.getCurrentUserID();
    let success = 0, failed = 0;

    for (const index of indices) {
      if (index < 1 || index > groupThreads.length) {
        failed++;
        continue;
      }

      const target = groupThreads[index - 1];

      try {
        await api.sendMessage("- বালের গ্রুপ এ থাকলাম না..!😔", target.threadID);
        await api.removeUserFromGroup(botID, target.threadID);
        success++;
      } catch (err) {
        console.error(`❌ Failed to leave ${target.name}`, err);
        failed++;
      }
    }

    api.sendMessage(`✅ Finished\n➡️ Left: ${success} group(s)\n❌ Failed: ${failed}`, event.threadID);
  }
};

async function getAllThreads(api) {
  let allThreads = [];
  let limit = 100;
  let timestamp = null;

  while (true) {
    const threads = await api.getThreadList(limit, timestamp, []);
    if (!threads.length) break;

    allThreads = allThreads.concat(threads);
    timestamp = threads[threads.length - 1].timestamp;

    if (threads.length < limit) break;
  }

  return allThreads;
}

function sendGroupListPage(api, event, groupThreads, pageIndex) {
  const start = pageIndex * GROUPS_PER_PAGE;
  const end = start + GROUPS_PER_PAGE;
  const pageThreads = groupThreads.slice(start, end);

  if (pageThreads.length === 0)
    return api.sendMessage("❌ No moree 👺", event.threadID);

  const list = pageThreads.map((g, i) =>
    `${start + i + 1}. ${g.name || "Unnamed Group"}\nTID: ${g.threadID}`
  ).join("\n\n");

  const nextHint = `\n\n➡️ Reply with A, B, C... to see next pages.\n📌 Or reply with number(s) like '1,3,12' to remove bot from those groups.`;

  api.sendMessage(`📂 Group List (Page ${String.fromCharCode(65 + pageIndex)}):\n\n${list}${nextHint}`, event.threadID)
    .then(sent => {
      global.GoatBot = global.GoatBot || {};
      global.GoatBot.onReply = global.GoatBot.onReply || new Map();

      global.GoatBot.onReply.set(sent.messageID, {
        commandName: "out",
        type: "list",
        author: event.senderID,
        messageID: sent.messageID,
        groupThreads,
        page: pageIndex
      });
    });
}
