const fs = require("fs-extra");
const { utils } = global;

module.exports = {
  config: {
    name: "prefix",
    version: "1.5",
    author: "NTkhang || Kari Gori By Xos Eren",
    countDown: 5,
    role: 0,
    description: "Change the bot prefix in your chat box or globally (admin only)",
    category: "⚙️ Configuration",
    guide: {
      en:
        "┌─『 Prefix Settings 』─┐\n"
      + "│\n"
      + "│ 🔹 {pn} <prefix>\n"
      + "│     Set prefix for this chat\n"
      + "│     Example: {pn} $\n"
      + "│\n"
      + "│ 🔹 {pn} <prefix> -g\n"
      + "│     Set global prefix (Admin only)\n"
      + "│     Example: {pn} $ -g\n"
      + "│\n"
      + "│ ♻️ {pn} reset\n"
      + "│     Reset to default prefix\n"
      + "│\n"
      + "└──────────────────────┘"
    }
  },

  langs: {
    en: {
      reset:
        "━━━━━━━━━━━━━━━━━\n"
      + ` ✅ Reset to default: %1\n`
      + "━━━━━━━━━━━━━━━━━",
      onlyAdmin:
        "┌─『 Permission Denied 』─┐\n"
      + "│ ⛔ Only bot admins can change global prefix!\n"
      + "└──────────────────────────┘",
      confirmGlobal:
        "\n"
      + " ⚙️ React to confirm global prefix update.\n"
      + "",
      confirmThisThread:
        "\n"
      + " ⚙️ React to confirm this chat's prefix update.\n"
      + "\n",
      successGlobal:
        "\n"
      + `✅ Global prefix: %1\n`
      + "",
      successThisThread:
        "𝗕𝗕𝗬 🐥🎀\n"
      + `𝗣𝗿𝗲𝗳𝗶𝘅 𝗰𝗵𝗮𝗻𝗴𝗲𝗱 𝘁𝗼  %1\n`
      + " 𝘀𝘂𝗰𝗰𝗲𝘀𝘀𝗳𝘂𝗹𝗹𝘆 ✅",
      myPrefix:
        "┌─『 Current Prefix 』─┐\n"
      + `│ 🌍 Global: %1\n`
      + `│ 💬 This Chat: %2\n`
      + "│\n"
      + `│ ➤ Type: ${2}help\n`
      + "└─────────────────────┘"
    }
  },

  onStart: async function ({ message, role, args, commandName, event, threadsData, getLang }) {
    if (!args[0]) return message.SyntaxError();

    if (args[0] === "reset") {
      await threadsData.set(event.threadID, null, "data.prefix");
      return message.reply(getLang("reset", global.GoatBot.config.prefix));
    }

    const newPrefix = args[0];
    const formSet = {
      commandName,
      author: event.senderID,
      newPrefix,
      setGlobal: args[1] === "-g"
    };

    if (formSet.setGlobal && role < 2) {
      return message.reply(getLang("onlyAdmin"));
    }

    const confirmMessage = formSet.setGlobal ? getLang("confirmGlobal") : getLang("confirmThisThread");
    return message.reply(confirmMessage, (err, info) => {
      formSet.messageID = info.messageID;
      global.GoatBot.onReaction.set(info.messageID, formSet);
    });
  },

  onReaction: async function ({ message, threadsData, event, Reaction, getLang }) {
    const { author, newPrefix, setGlobal } = Reaction;
    if (event.userID !== author) return;

    if (setGlobal) {
      global.GoatBot.config.prefix = newPrefix;
      fs.writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
      return message.reply(getLang("successGlobal", newPrefix));
    }

    await threadsData.set(event.threadID, newPrefix, "data.prefix");
    return message.reply(getLang("successThisThread", newPrefix));
  },

  onChat: async function ({ event, message, threadsData }) {
    const globalPrefix = global.GoatBot.config.prefix;
    const threadPrefix = await threadsData.get(event.threadID, "data.prefix") || globalPrefix;

    if (event.body && event.body.toLowerCase() === "prefix") {
      return message.reply({
        body:
          "━━━━━━━━━━━━━━━━━\n"
        + ' 🔰𝐏𝐫𝐞𝐟𝐢𝐱 𝐢𝐧𝐟𝐨𝐫𝐦𝐚𝐭𝐢𝐨𝐧 ⬇⬇⬇     \n'
        + '                                                   \n'     
        + ` 🌍 𝗦𝘆𝘀𝘁𝗲𝗺 𝗽𝗿𝗲𝗳𝗶𝘅 :  ${globalPrefix}\n`
        + ` 💬 𝗚𝗿𝗼𝘂𝗽 𝗽𝗿𝗲𝗳𝗶𝘅  :  ${threadPrefix}\n`
        + ` ➤ ${threadPrefix} 𝗛𝗲𝗹𝗽 𝘁𝗼 𝘀𝗲𝗲 𝗮𝗹𝗹 𝗰𝗺𝗱𝘀 \n`
        + "━━━━━━━━━━━━━━━━━",
        attachment: await utils.getStreamFromURL("https://files.catbox.moe/3tooti.mp4")
      });
    }
  }
};
