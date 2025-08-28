const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");
const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;

module.exports = {
  config: {
    name: "help",
    version: "1.18",
    author: "dimu na deke lab nai author",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "View command usage and list all commands directly",
    },
    longDescription: {
      en: "View command usage and list all commands directly",
    },
    category: "info",
    guide: {
      en: "{pn} / help [category] or help commandName",
    },
    priority: 1,
  },

  onStart: async function ({ message, args, event, role }) {
    const { threadID } = event;
    const prefix = getPrefix(threadID);
    const categories = {};

    for (const [name, value] of commands) {
      if (!value?.config || typeof value.onStart !== "function") continue;
      if (value.config.role > 1 && role < value.config.role) continue;

      const category = value.config.category?.toLowerCase() || "uncategorized";
      if (!categories[category]) categories[category] = [];
      categories[category].push(name);
    }

    const helpListImages = ["https://files.catbox.moe/npi3pv.jpg"];
    const helpListImage = helpListImages[Math.floor(Math.random() * helpListImages.length)];
    const rawInput = args.join(" ").trim();

    // 🧾 Full Help Menu
    if (!rawInput) {
      let msg = "╔═══════════════╗\n";
      msg += "     🎏 𝙴𝙻𝙾𝙽 𝙷𝙴𝙻𝙿 𝙼𝙴𝙽𝚄\n";
      msg += "╚═══════════════╝\n";

      for (const category of Object.keys(categories).sort()) {
        msg += `┍━━━[ ${category.toUpperCase()} ]☃\n`;
        const names = categories[category].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
        for (const cmd of names) {
          msg += `┋🔰 ${cmd}\n`;
        }
        msg += "┕━━━━━━━━━━━━◊\n";
      }

      msg += "┍━━━[𝙸𝙽𝙵𝚁𝙾𝙼]━━━◊\n";
      msg += `┋➥𝚃𝙾𝚃𝙰𝙻𝙲𝙼𝙳: [${commands.size}]\n`;
      msg += `┋➥𝙿𝚁𝙴𝙵𝙸𝚇: ${prefix}\n`;
      msg += `┋𝙾𝚆𝙽𝙴𝚁: 𝚂𝙰𝙼𝙸𝚄𝙽  𝙴𝚅𝙰𝙽  𝙰𝚂𝙸𝙵\n`;
      msg += "┕━━━━━━━━━━━◊";

      const sentMsg = await message.reply({
        body: msg,
        attachment: await global.utils.getStreamFromURL(helpListImage),
      });
      setTimeout(() => message.unsend(sentMsg.messageID), 120000);
      return;
    }

    // 📁 Specific Category
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
      for (const cmd of names) {
        msg += `┋🔰 ${cmd}\n`;
      }

      msg += "┕━━━━━━━━━━━━◊";

      const sentMsg = await message.reply({
        body: msg,
        attachment: await global.utils.getStreamFromURL(helpListImage),
      });
      setTimeout(() => message.unsend(sentMsg.messageID), 120000);
      return;
    }

    // 🔍 Command Detail
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

    const response = `
╭───⊙
│ 🔶 ${stylizeSmallCaps(configCommand.name)}
├── INFO
│ 📝 Description: ${longDescription}
│ 👑 Author: ${author}
│ ⚙ Guide: ${usage}
├── USAGE
│ 🔯 Version: ${configCommand.version || "1.0"}
│ ♻ Role: ${roleText}
╰────────────⊙`;

    const sentMsg = await message.reply(response);
    setTimeout(() => message.unsend(sentMsg.messageID), 120000);
  }
};

// 🔡 Small Caps Converter
function stylizeSmallCaps(text) {
  const map = {
    a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ꜰ', g: 'ɢ', h: 'ʜ', i: 'ɪ',
    j: 'ᴊ', k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ', q: 'ǫ', r: 'ʀ',
    s: 'ꜱ', t: 'ᴛ', u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x', y: 'ʏ', z: 'ᴢ',
    A: 'ᴀ', B: 'ʙ', C: 'ᴄ', D: 'ᴅ', E: 'ᴇ', F: 'ꜰ', G: 'ɢ', H: 'ʜ', I: 'ɪ',
    J: 'ᴊ', K: 'ᴋ', L: 'ʟ', M: 'ᴍ', N: 'ɴ', O: 'ᴏ', P: 'ᴘ', Q: 'ǫ', R: 'ʀ',
    S: 'ꜱ', T: 'ᴛ', U: 'ᴜ', V: 'ᴠ', W: 'ᴡ', X: 'x', Y: 'ʏ', Z: 'ᴢ',
    0: '0', 1: '1', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9'
  };
  return text.split('').map(c => map[c] || c).join('');
}

// 🧾 Role Name Resolver
function roleTextToString(role) {
  switch (role) {
    case 0: return "0 (Everyone)";
    case 1: return "1 (Group Admin)";
    case 2: return "2 (Bot Admin)";
    case 3: return "3 (Super Admin)";
    default: return `${role} (Unknown)`;
  }
        }
