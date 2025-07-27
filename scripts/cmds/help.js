const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;

module.exports = {
  config: {
    name: "help",
    version: "3.0",
    author: "- 𝐀𝐒𝐈𝐅 ✈︎ 🎀",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Show all commands beautifully" },
    longDescription: { en: "Display categorized commands with a designed layout" },
    category: "info",
    guide: { en: "{pn} [category or command name]" }
  },

  onStart: async function ({ message, args, event, role }) {
    const prefix = getPrefix(event.threadID);
    const input = args.join(" ").trim().toLowerCase();
    const categories = {};

    for (const [name, cmd] of commands) {
      if (!cmd?.config || typeof cmd.onStart !== "function") continue;
      if (cmd.config.role > 1 && role < cmd.config.role) continue;

      const category = (cmd.config.category || "Uncategorized").toUpperCase();
      if (!categories[category]) categories[category] = [];
      categories[category].push(name);
    }

    // 📋 Full menu
    if (!input) {
      let msg = `╭══ 🎀 𝗔𝗦𝗜𝗙 𝗕𝗢𝗧 𝗛𝗘𝗟𝗣 𝗠𝗘𝗡𝗨 🎀 ══╮\n\n`;

      for (const category of Object.keys(categories).sort()) {
        const cmds = categories[category].sort();
        msg += `🔰 𝗖𝗔𝗧𝗘𝗚𝗢𝗥𝗬: ${category}\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━\n`;
        const formattedCmds = cmds.map(cmd => `⤷ ${prefix}${cmd}`).join("   ");
        msg += `${formattedCmds}\n\n`;
      }

      msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `📌 𝗣𝗿𝗲𝗳𝗶𝘅: ${prefix}\n`;
      msg += `🔢 𝗧𝗼𝘁𝗮𝗹 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀: ${commands.size}\n`;
      msg += `👑 𝗢𝘄𝗻𝗲𝗿: 𝐀𝐒𝐈𝐅 ✈︎ 🐢`;

      const imageUrl = "https://files.catbox.moe/37x9vo.jpg";
      const stream = await global.utils.getStreamFromURL(imageUrl);

      const sent = await message.reply({ body: msg, attachment: stream });
      setTimeout(() => message.unsend(sent.messageID), 60 * 1000);
      return;
    }

    // 🔍 Category-wise
    if (input.startsWith("[") && input.endsWith("]")) {
      const categoryName = input.slice(1, -1).toUpperCase();
      const cmds = categories[categoryName];
      if (!cmds)
        return message.reply(`❌ Category "${categoryName}" not found.\nAvailable: ${Object.keys(categories).map(c => `[${c}]`).join(", ")}`);

      let msg = `🔰 𝗖𝗔𝗧𝗘𝗚𝗢𝗥𝗬: ${categoryName}\n`;
      msg += `━━━━━━━━━━━━━━━━━━━━\n`;
      msg += cmds.sort().map(c => `⤷ ${prefix}${c}`).join("   ");

      const sent = await message.reply(msg);
      setTimeout(() => message.unsend(sent.messageID), 60 * 1000);
      return;
    }

    // 🧾 Command-specific
    const commandName = input;
    const cmd = commands.get(commandName) || commands.get(aliases.get(commandName));
    if (!cmd || !cmd.config)
      return message.reply(`❌ Command "${commandName}" not found.\nTry: ${prefix}help`);

    const config = cmd.config;
    const usage = (config.guide?.en || "No usage").replace(/{pn}/g, `${prefix}${config.name}`);
    const desc = config.longDescription?.en || config.shortDescription?.en || "No description";
    const roleText = roleTextToString(config.role);

    const msg = `
╭── 🎯 𝗖𝗢𝗠𝗠𝗔𝗡𝗗: ${stylizeSmallCaps(config.name)} ──╮
│ 📝 𝗗𝗲𝘀𝗰: ${desc}
│ 📘 𝗨𝘀𝗮𝗴𝗲: ${usage}
│ 🔁 𝗥𝗼𝗹𝗲: ${roleText}
│ 👨‍💻 𝗔𝘂𝘁𝗵𝗼𝗿: ${config.author || "𝐀𝐬𝐢𝐟"}
╰─────────────────────`;

    const sent = await message.reply(msg);
    setTimeout(() => message.unsend(sent.messageID), 40 * 1000);
  }
};

// 🎨 Small caps font converter
function stylizeSmallCaps(text) {
  const map = {
    a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ꜰ', g: 'ɢ', h: 'ʜ', i: 'ɪ',
    j: 'ᴊ', k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ', q: 'ǫ', r: 'ʀ',
    s: 'ꜱ', t: 'ᴛ', u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x', y: 'ʏ', z: 'ᴢ'
  };
  return text.split('').map(c => map[c.toLowerCase()] || c).join('');
}

// 🎓 Role level description
function roleTextToString(role) {
  switch (role) {
    case 0: return "Everyone";
    case 1: return "Group Admin";
    case 2: return "Bot Admin";
    case 3: return "Super Admin";
    default: return `Level ${role}`;
  }
          }
