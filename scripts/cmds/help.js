const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");
const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;

let currentImageIndex = 0;

const helpListImages = [
  "https://files.catbox.moe/0qrdic.webp",
  "https://files.catbox.moe/sok16l.gif",
  "https://files.catbox.moe/er07ay.webp",
  "https://files.catbox.moe/fdtpzs.webp",
  "https://files.catbox.moe/um8brf.webp"
];

module.exports = {
  config: {
    name: "help",
    version: "1.19",
    author: "gay amit",
    countDown: 5,
    role: 0,
    shortDescription: { en: "View command usage and list all commands directly" },
    longDescription: { en: "View command usage and list all commands directly" },
    category: "info",
    guide: { en: "{pn} / help [category] or help commandName" },
    priority: 1,
  },

  onStart: async function ({ message, args, event, role }) {
    const { threadID } = event;
    const prefix = getPrefix(threadID);
    const categories = {};

    const helpListImage = helpListImages[currentImageIndex];
    currentImageIndex = (currentImageIndex + 1) % helpListImages.length;

    for (const [name, value] of commands) {
      if (!value?.config || typeof value.onStart !== "function") continue;
      if (value.config.role > 1 && role < value.config.role) continue;
      const category = value.config.category?.toLowerCase() || "uncategorized";
      if (!categories[category]) categories[category] = [];
      categories[category].push(name);
    }

    const rawInput = args.join(" ").trim();

    if (!rawInput) {
      let msg = "╔═══════════════╗\n";
      msg += "     🎏 𝙴𝙻𝙾𝙽 𝙷𝙴𝙻𝙿 𝙼𝙴𝙽𝚄\n";
      msg += "╚═══════════════╝\n";

      for (const category of Object.keys(categories).sort()) {
        msg += `┍━━━[ ${category.toUpperCase()} ]☃\n`;
        const names = categories[category].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
        for (const cmd of names) msg += `┋ᐉ ${cmd}\n`;
        msg += "┕━━━━━━━━━━━━◊\n";
      }

      msg += "┍━━━[𝙸𝙽𝙵𝚁𝙾𝙼]━━━◊\n";
      msg += `┋➥𝚃𝙾𝚃𝙰𝙻 𝙲𝙼𝙳: [${commands.size}]\n`;
      msg += `┋➥𝙿𝚁𝙴𝙵𝙸𝚇: ⦃ ${prefix} ⦄\n`;
      msg += `┋𝙾𝚆𝙽𝙴𝚁: 𝚂𝙰𝙼𝙸𝚄𝙽  𝙴𝚅𝙰𝙽  𝙰𝚂𝙸𝙵\n`;
      msg += "┕━━━━━━━━━━━◊";

      const sentMsg = await message.reply({
        body: msg,
        attachment: await global.utils.getStreamFromURL(helpListImage),
      });
      setTimeout(() => message.unsend(sentMsg.messageID), 120000);
      return;
    }

    if (rawInput.startsWith("[") && rawInput.endsWith("]")) {
      const categoryName = rawInput.slice(1, -1).toLowerCase();
      if (!categories[categoryName]) {
        return message.reply(`❌ Category "${categoryName}" খুঁজে পাওয়া যায়নি।\n📁 Available: ${Object.keys(categories).map(c => `[${c}]`).join(", ")}`);
      }

      let msg = `╔═══════════════╗\n`;
      msg += `     𝐇𝐄𝐋𝐏 - ${categoryName.toUpperCase()}\n`;
      msg += `╚═══════════════╝\n`;
      msg += `┍━━━[ ${categoryName.toUpperCase()} ]\n`;

      const names = categories[categoryName].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
      for (const cmd of names) msg += `┋ᐉ ${cmd}\n`;
      msg += "┕━━━━━━━━━━━━◊";

      const sentMsg = await message.reply({ body: msg });
      setTimeout(() => message.unsend(sentMsg.messageID), 120000);
      return;
    }

    const commandName = rawInput.toLowerCase();
    const command = commands.get(commandName) || commands.get(aliases.get(commandName));
    if (!command || !command?.config) {
      return message.reply(`❌ Command "${commandName}" খুঁজে পাওয়া যায়নি।\nTry: /help or /help [category]`);
    }

    const configCommand = command.config;
    const roleText = roleTextToString(configCommand.role);
    const author = configCommand.author || "Unknown";
    const longDescription = configCommand.longDescription?.en || "No description";
    const guideBody = configCommand.guide?.en || "No guide available.";
    const usage = guideBody.replace(/{pn}/g, `${prefix}${configCommand.name}`);
    const category = configCommand.category || "Uncategorized";
    const aliasesList = configCommand.aliases?.length ? configCommand.aliases.join(", ") : "None";
    const cooldown = configCommand.countDown ? `${configCommand.countDown}s` : "None";

    const response = 
`╔══ [𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗜𝗡𝗙𝗢] ══╗
┋🧩 Name       : ${configCommand.name}
┋🗂️ Category   : ${category}
┋📜 Description: ${longDescription}
┋🔁 Aliases    : ${aliasesList}
┋⚙️ Version    : ${configCommand.version || "1.0"}
┋🔐 Permission : ${roleText}
┋⏱️ Cooldown   : ${cooldown}
┋👑 Author     : ${author}
┋📖 Usage      : ${usage}
╚════════════════════╝`;

    const sentMsg = await message.reply({ body: response });
    setTimeout(() => message.unsend(sentMsg.messageID), 120000);
  }
};

function roleTextToString(role) {
  switch (role) {
    case 0: return "0 (Everyone)";
    case 1: return "1 (Group Admin)";
    case 2: return "2 (Bot Admin)";
    case 3: return "3 (Super Admin)";
    default: return `${role} (Unknown)`;
  }
      }
