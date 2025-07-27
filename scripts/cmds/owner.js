const fs = require("fs-extra");
const request = require("request");
const os = require("os");

module.exports = {
  config: {
    name: "owner",
    version: "1.0",
    author: "✨ Eren Yeh ✨",
    shortDescription: "Show full bot owner info with videos & Urdu bio",
    longDescription: "Detailed owner information with bot stats, uptime, Urdu bio and cool videos.",
    category: "ℹ️ Info",
    guide: {
      en: ".owner"
    },
    usePrefix: true
  },

  onStart: async function ({ api, event }) {
    const ownerInfo = {
      name: "Xos Eren",
      whatsapp: "+8801839268235",
      botName: "💦 SpiDeY 🕸️",
      botType: "GoatBot",
      commandCooldown: "5s",
      ownerID: "61574046213712",
      botVersion: "1.0",
      bio: "اُسے نئے طریقوں سے بنانے کی صلاحیت ہے، ایک اچھا اور فعال معاون۔"
    };

    const botUptime = process.uptime();
    const botHours = Math.floor(botUptime / 3600);
    const botMinutes = Math.floor((botUptime % 3600) / 60);
    const botSeconds = Math.floor(botUptime % 60);
    const formattedBotUptime = `${botHours}h ${botMinutes}m ${botSeconds}s`;

    const sysUptime = os.uptime();
    const sysDays = Math.floor(sysUptime / (3600 * 24));
    const sysHours = Math.floor((sysUptime % (3600 * 24)) / 3600);
    const sysMinutes = Math.floor((sysUptime % 3600) / 60);
    const sysSeconds = Math.floor(sysUptime % 60);
    const formattedSysUptime = `${sysDays}d ${sysHours}h ${sysMinutes}m ${sysSeconds}s`;

    const body = `
╭──────────╮
        ʙᴏᴛ ᴏᴡɴᴇʀ ɪɴғᴏ   😾💋
╰──────────╯      ──────────────────────────╯

👤 ᴏᴡɴᴇʀ ɴᴀᴍᴇ: ${ownerInfo.name}
📱 ᴏᴡɴᴇʀ ᴡʜᴀᴛsᴀᴘᴘ: ${ownerInfo.whatsapp}

📦 ʙᴏᴛ ᴛʏᴘᴇ: ${ownerInfo.botType}

⏳ ᴄᴏᴍᴍᴀɴᴅ ᴄᴏᴏʟᴅᴏᴡɴ: ${ownerInfo.commandCooldown}

🆔 ᴏᴡɴᴇʀ ɪᴅ: ${ownerInfo.ownerID}

🤖 ʙᴏᴛ ɴᴀᴍᴇ: ${ownerInfo.botName}

💬 ᴇᴘʜᴏ: Responsive bot for automation and management.


🌟 ʙɪᴏ: ${ownerInfo.bio}

────────────────────────────────────


`;

    const imgurVideos = [
      "https://i.imgur.com/0bCwiQa.mp4"
    ];

    const downloadVideo = (url, path) => {
      return new Promise((resolve, reject) => {
        request(url)
          .pipe(fs.createWriteStream(path))
          .on("close", resolve)
          .on("error", reject);
      });
    };

    const videoPaths = [];
    for (let i = 0; i < imgurVideos.length; i++) {
      const path = `${__dirname}/cache/video${i}.mp4`;
      await downloadVideo(imgurVideos[i], path);
      videoPaths.push(path);
    }

    api.sendMessage(
      {
        body,
        attachment: videoPaths.map(p => fs.createReadStream(p))
      },
      event.threadID,
      () => videoPaths.forEach(p => fs.unlinkSync(p)),
      event.messageID
    );
  },

  onChat: async function ({ event, message }) {
    const body = event.body?.trim().toLowerCase();
    if (body === "owner") {
      return this.onStart({ event, message });
    }
  }
};