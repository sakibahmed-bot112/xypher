const axios = require("axios");

const availableCmdsUrl = "https://raw.githubusercontent.com/prime-eren99/EREN/refs/heads/main/availableCmds.json";
const cmdUrlsJson = "https://raw.githubusercontent.com/prime-eren99/EREN/refs/heads/main/cmdUrls.json";
const ITEMS_PER_PAGE = 10;

async function runCommand({ api, event, args }) {
  const query = args.join(" ").trim().toLowerCase();

  try {
    const res = await axios.get(availableCmdsUrl);
    let commands = res.data.cmdName;
    let filtered = commands;
    let page = 1;

    if (query) {
      if (!isNaN(query)) {
        page = parseInt(query);
      } else if (query.length === 1) {
        filtered = commands.filter(cmd => cmd.cmd.startsWith(query));
        if (filtered.length === 0) {
          return api.sendMessage(`✘ "${query}" diye kono command khuje paoa jayna!`, event.threadID, event.messageID);
        }
      } else {
        filtered = commands.filter(cmd => cmd.cmd.includes(query));
        if (filtered.length === 0) {
          return api.sendMessage(`✘ "${query}" command ta khuje paoya jayna!`, event.threadID, event.messageID);
        }
      }
    }

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    if (page < 1 || page > totalPages) {
      return api.sendMessage(`✘ Page number 1 theke ${totalPages} er moddhe din.`, event.threadID, event.messageID);
    }

    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const listToShow = filtered.slice(start, end);

    let msg = `╭─────「 store 」─────╮\n`;
    msg += `│ 📖 Page: ${page} / ${totalPages}\n│ 📦 Total: ${filtered.length} commands\n`;

    listToShow.forEach((cmd, i) => {
      msg += `│\n│ ${start + i + 1}. ${cmd.cmd}\n│ 👤 Author: ${cmd.author}\n│ 🔄 Update: ${cmd.update || "N/A"}\n`;
    });

    msg += `╰─────────────────╯`;
    if (page < totalPages) {
      msg += `\n\n➡️ "xmdstore ${page + 1}" type to go next page.`;
    }

    api.sendMessage(
      msg,
      event.threadID,
      (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: "xmdstore",
          type: "reply",
          messageID: info.messageID,
          author: event.senderID,
          cmdName: filtered,
          page
        });
      },
      event.messageID
    );

  } catch (err) {
    api.sendMessage("✘ Command list load korte somossa hocche!", event.threadID, event.messageID);
  }
}

module.exports = {
  config: {
    name: "xmdstore",
    aliases: ["xs", "xmds"],
    author: "ArYan //  xmd hijack By EREN",
    version: "1.0",
    role: 2,
    description: {
      en: "Browse and get command URLs easily."
    },
    countDown: 3,
    category: "goatbot",
    guide: {
      en: "{pn} [command name | first letter | page number]"
    }
  },

  onStart: async function ({ api, event, args }) {
    runCommand({ api, event, args });
  },

  onChat: async function ({ api, event }) {
    const body = event.body || "";
    const args = body.trim().split(/\s+/);
    const command = args.shift().toLowerCase();
    if (["xmdstore", "xs", "xmds"].includes(command)) {
      runCommand({ api, event, args });
    }
  },

  onReply: async function ({ api, event, Reply }) {
    if (Reply.author !== event.senderID) {
      return api.sendMessage("✘ Only the command requester can reply!", event.threadID, event.messageID);
    }

    const replyIndex = parseInt(event.body);
    const start = (Reply.page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;

    if (isNaN(replyIndex) || replyIndex < start + 1 || replyIndex > Math.min(end, Reply.cmdName.length)) {
      return api.sendMessage(`✘ Please reply with a number between ${start + 1} and ${Math.min(end, Reply.cmdName.length)}.`, event.threadID, event.messageID);
    }

    try {
      const selected = Reply.cmdName[replyIndex - 1];
      const res = await axios.get(cmdUrlsJson);
      const cmdUrl = res.data[selected.cmd];

      if (!cmdUrl) {
        return api.sendMessage("✘ Command URL pawa jay nai.", event.threadID, event.messageID);
      }

      api.unsendMessage(Reply.messageID);
      const msg = `╭───「 Command  」───╮\n│ ✅ STATUS: ${selected.status || "N/A"}\n│ 🌐 URL: ${cmdUrl}\n╰───────────────────╯`;
      api.sendMessage(msg, event.threadID, event.messageID);
    } catch (err) {
      api.sendMessage("✘ Command details load korte error hoyeche.", event.threadID, event.messageID);
    }
  }
};
