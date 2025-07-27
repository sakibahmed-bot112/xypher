const os = require("os");
const pidusage = require("pidusage");
const fs = require("fs");

const authorUID = "61577716215531";

module.exports = {
  config: {
    name: "uptime",
    aliases: ["upt", "up2", "upt2", "up"],
    version: "2.3",
    author: "Eren",
    countDown: 5,
    role: 0,
    shortDescription: "Show system and bot status",
    longDescription: "Displays uptime, CPU, memory, disk, and bot stats",
    category: "info",
    guide: "{pn}",
    noPrefix: true
  },

  // Normal prefix handler
  onStart: async function (ctx) {
    await module.exports.sendUptime(ctx);
  },

  // noPrefix for author only
  onChat: async function (ctx) {
    const input = ctx.event.body?.toLowerCase().trim();
    const { config } = module.exports;
    const triggers = [config.name, ...(config.aliases || [])];

    if (!triggers.includes(input)) return;
    if (ctx.event.senderID !== authorUID) return; // Only you can use noPrefix

    await module.exports.sendUptime(ctx);
  },

  sendUptime: async function ({ message, usersData, threadsData }) {
    const now = new Date();
    const formatDate = now.toLocaleString("en-US", { timeZone: "Asia/Dhaka" });

    const uptimeBot = process.uptime();
    const uptimeSys = os.uptime();
    const toTime = (sec) => {
      const d = Math.floor(sec / 86400);
      const h = Math.floor((sec % 86400) / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = Math.floor(sec % 60);
      return `${d ? `${d}d ` : ""}${h}h ${m}m ${s}s`;
    };

    const usage = await pidusage(process.pid);
    const totalRam = (os.totalmem() / 1024 / 1024 / 1024).toFixed(0);
    const freeRam = (os.freemem() / 1024 / 1024 / 1024).toFixed(0);
    const usedRam = (usage.memory / 1024 / 1024).toFixed(1);
    const cpuUsage = usage.cpu.toFixed(1);
    const cpuModel = os.cpus()[0].model;
    const cpuCores = os.cpus().length;
    const pkgCount = Object.keys(JSON.parse(fs.readFileSync('package.json')).dependencies || {}).length;

    const users = await usersData.getAll();
    const threads = await threadsData.getAll();

    const msg =
`━━━━━━━━━━━━━━━━━
            𝗕𝗼𝘁 𝗦𝘁𝗮𝘁𝘂𝘀
📅 𝗗𝗮𝘁𝗲: ${formatDate}
━━━━━━━━━━━━━━━━━

⏱️ 𝗕𝗼𝘁 𝗨𝗽𝘁𝗶𝗺𝗲 : ${toTime(uptimeBot)}
🖥️ 𝗦𝘆𝘀 𝗨𝗽𝘁𝗶𝗺𝗲 : ${toTime(uptimeSys)}

🧠 𝗖𝗣𝗨 : ${cpuModel}
🔧 𝗖𝗼𝗿𝗲𝘀 : ${cpuCores}
📊 𝗟𝗼𝗮𝗱 : ${cpuUsage}%

💾 𝗥𝗔𝗠 : ${usedRam} MB / ${totalRam} GB
📂 𝗙𝗿𝗲𝗲 𝗠𝗲𝗺𝗼𝗿𝘆 : ${freeRam} GB

📦 𝗣𝗮𝗰𝗸𝗮𝗴𝗲𝘀 : ${pkgCount}
👥 𝗨𝘀𝗲𝗿𝘀 : ${users.length}
👨‍👩‍👧‍👦 𝗚𝗿𝗼𝘂𝗽𝘀 : ${threads.length}

🗂️ 𝗗𝗶𝘀𝗸 𝗨𝘀𝗲𝗱 : 325G / 387G
📁 𝗔𝘃𝗮𝗶𝗹𝗮𝗯𝗹𝗲 : 63G

━━━━━━━━━━━━━━━━━`;

    message.reply(msg);
  }
};
