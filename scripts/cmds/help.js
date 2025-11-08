const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");
const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;
const doNotDelete = "[ RAKIB ]";

module.exports = {
  config: {
    name: "help",
    version: "1.17",
    author: "EDEN",
    countDown: 5,
    role: 0,
    shortDescription: { en: "View command usage and list all commands directly" },
    longDescription: { en: "View command usage and list all commands directly" },
    category: "𝗔𝗟𝗟 𝗖𝗠𝗗",
    guide: { en: "{pn} / help cmdName " },
    priority: 1,
  },

  onStart: async function ({ message, args, event, threadsData, role }) {
    const { threadID } = event;
    const prefix = getPrefix(threadID);

    const helpListImages = [
      "https://i.postimg.cc/6pcnfXvT/Messenger-creation-1364262568824299.webp",
      "https://i.postimg.cc/26hvDnsS/efa10dcb488c629e415c16c0e9bf65aa.jpg",
      "https://i.postimg.cc/GhZMPjb6/received-4160564894262583.jpg"
    ];

    const randomImage = helpListImages[Math.floor(Math.random() * helpListImages.length)];

    if (args.length === 0) {
      const categories = {};
      let msg = "";

      // ✅ Header simple
      msg += `🪓S H E L B Y  H E L P  M E N U🪓\n`;

      // ✅ Keep original category design
      for (const [name, value] of commands) {
        if (value.config.role > 1 && role < value.config.role) continue;
        const category = value.config.category || "Uncategorized";
        categories[category] = categories[category] || { commands: [] };
        categories[category].commands.push(name);
      }

      Object.keys(categories).forEach(category => {
        if (category !== "info") {
          msg += `\n╭━═━┈⟬${category.toUpperCase()}⟭`;
          const names = categories[category].commands.sort();

          for (let i = 0; i < names.length; i++) {
            msg += `\n┋—ᐉ ◈ ${names[i]}`;
          }

          msg += `\n╰━━━━═━┈┈━═━━━🗿`;
        }
      });

      const totalCommands = commands.size;

      // ✅ Footer intact
      msg += `
❏━━━═━┈┈━═━━━❏
📜 Total Commands: [ ${totalCommands} ]
📬 All cmd: ${prefix}help [cmdName]
🛠️ Prefix: ${prefix}
👑 Owner: EDEN
🎉 Add my gc: ${prefix}supportgc
🔗 Messenger link: m.me/ibonex.edenXtonu
❏━━━═━┈┈━═━━━❏‌‌`;

      try {
        const imgPath = path.join(__dirname, "helpImage.jpg");
        const imgData = (await axios.get(randomImage, { responseType: "arraybuffer" })).data;
        fs.writeFileSync(imgPath, Buffer.from(imgData, "binary"));

        await message.reply({ body: msg, attachment: fs.createReadStream(imgPath) });
        fs.unlinkSync(imgPath);
      } catch {
        await message.reply(msg);
      }

    } else {
      const commandName = args[0].toLowerCase();
      const command = commands.get(commandName) || commands.get(aliases.get(commandName));

      if (!command) return message.reply(`Command "${commandName}" not found.`);

      const config = command.config;
      const usage = config.guide?.en?.replace(/{p}/g, prefix).replace(/{n}/g, config.name) || "No usage guide.";

      const reply = `╭── NAME ────☺︎︎
│ ${config.name}
├──☺︎︎ INFO
│ Description: ${config.longDescription?.en || "No description"}
│ Version: ${config.version || "1.0"}
│ Role: ${config.role || 0}
│ Author: ${config.author || "Unknown"}
├──☺︎︎ Usage
│ ${usage}
╰────────────☺︎︎`;

      await message.reply(reply);
    }
  },
};
