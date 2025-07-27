 const { commands } = global.GoatBot;

const ADMIN_UID = "61576212342334";
const IMAGE_URL = "https://files.catbox.moe/63nu8l.jpg";

const ITEMS_PER_PAGE = 10;

module.exports = {
  config: {
    name: "help",
    version: "1.3",
    author: "mostakim//upgrade by Mahi",
    role: 0,
    category: "info",
    priority: 1,
  },

  onChat: async function ({ event, message }) {
    let text = (message.body || "").trim();

    // No prefix usage here, just check if text starts with "help" or "menu"
    if (!text) return;
    const parts = text.toLowerCase().split(/\s+/);
    const cmd = parts.shift();
    const args = parts;

    if (cmd !== "help" && cmd !== "menu") return;
    if (event.senderID !== ADMIN_UID) return;

    return this.onStart({ message, args, event, role: 2 });
  },

  onStart: async function ({ message, args, event, role }) {
    const top = "╭━━━━━━━━━━━━━━━━━";
    const mid = "┃";
    const sep = "┃━━━━━━━━━━━━━━━━━";
    const bottom = "╰━━━━━━━━━━━━━━━━━";

    const arg = args[0]?.toLowerCase();

    // Group commands by normalized category
    const categories = {};
    for (const [name, cmd] of commands.entries()) {
      if (cmd.config?.role <= role) {
        // Normalize category: trim + uppercase
        const cat = (cmd.config.category || "Uncategorized").trim().toUpperCase();
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(name);
      }
    }

    // Pagination handling (page number or no arg)
    if (!arg || /^\d+$/.test(arg)) {
      const page = arg ? Math.max(1, parseInt(arg)) : 1;
      const catNames = Object.keys(categories).sort((a, b) => a.localeCompare(b));
      const totalPages = Math.ceil(catNames.length / ITEMS_PER_PAGE);

      if (page > totalPages)
        return message.reply(`❌ Page ${page} does not exist. Total pages: ${totalPages}`);

      const startIndex = (page - 1) * ITEMS_PER_PAGE;
      const selectedCats = catNames.slice(startIndex, startIndex + ITEMS_PER_PAGE);

      let body = `${top}\n${mid} 📘 HELP MENU (Page ${page}/${totalPages})\n${sep}\n`;
      body += `${mid} 🔑 Prefix: -\n${mid} 📂 Total Commands: ${commands.size}\n${sep}\n`;

      selectedCats.forEach((cat) => {
        const cmds = categories[cat];
        body += `${mid} 📁 ${cat} [${cmds.length}]\n`;
        cmds.forEach((n) => {
          body += `${mid} ✦ ${n}\n`;
        });
        body += `${sep}\n`;
      });

      body += `${mid} BOTNAME : SumoHaYO ❤️‍🩹\n${bottom}`;

      return message.reply({ body, attachment: await global.utils.getStreamFromURL(IMAGE_URL) });
    }

    // Category filter by -category
    if (arg.startsWith("-")) {
      const catName = arg.slice(1).toUpperCase();
      const cmdsInCat = [];

      for (const [name, cmd] of commands.entries()) {
        const cat = (cmd.config.category || "Uncategorized").trim().toUpperCase();
        if (cat === catName && cmd.config.role <= role) {
          cmdsInCat.push(`${mid} ✦ ${name}`);
        }
      }

      if (!cmdsInCat.length) {
        return message.reply(`❌ No commands found in category "${catName}"`);
      }

      return message.reply(
        `${top}\n${mid} 📁 CATEGORY: ${catName}\n${sep}\n` +
          `${cmdsInCat.join("\n")}\n${bottom}`
      );
    }

    // Single command details
    const cmdObj = commands.get(arg) || commands.get(global.GoatBot.aliases.get(arg));
    if (!cmdObj || cmdObj.config.role > role) {
      return message.reply(`❌ Command "${arg}" not found or you don't have permission.`);
    }

    const cfg = cmdObj.config;
    const shortDesc = cfg.shortDescription?.en || "No short description.";
    const longDesc = cfg.longDescription?.en || "No detailed description.";
    const usage = cfg.guide?.en || "No usage provided.";

    const details =
      `${top}\n` +
      `${mid} 📌 COMMAND DETAILS\n${sep}\n` +
      `${mid} 📁 Category: ${cfg.category || "Uncategorized"}\n` +
      `${mid} 📄 Name: ${cfg.name}\n` +
      `${mid} 📜 Short: ${shortDesc}\n` +
      `${mid} 📖 Long:\n${mid} ${longDesc.replace(/\n/g, `\n${mid} `)}\n` +
      `${mid} 🧩 Usage: ${usage.replace(/{p}/g, "-").replace(/{n}/g, cfg.name)}\n` +
      `${mid} 👤 Author: ${cfg.author || "Unknown"}\n` +
      bottom;

    return message.reply(details);
  },
};
