const fs = require("fs");
const path = require("path");
const https = require("https");

const imageUrl = "https://i.imgur.com/CbScwwJ.jpeg";
const localPath = path.join(__dirname, "ping_image.jpg");

module.exports = {
  config: {
    name: "ping2",
    version: "1.0",
    author: "xos Eren",
    countDown: 5,
    role: 0,
    shortDescription: "Check bot speed!",
    longDescription: "Check bot response & uptime with a cute image.",
    category: "Utility",
  },

  onStart: async () => {},

  onChat: async function ({ event, message }) {
    if ((event.body || "").toLowerCase() === "ping2") {
      const start = Date.now();
      const systemUptime = process.uptime(); // in seconds
      const botUptime = global.botStartTime
        ? Math.floor((Date.now() - global.botStartTime) / 1000)
        : systemUptime;

      // Download image
      const file = fs.createWriteStream(localPath);
      https.get(imageUrl, (response) => {
        response.pipe(file);
        file.on("finish", async () => {
          const ping = Date.now() - start;

          const body = `
╭━━━⌈ ✨  𝙿𝙸𝙽𝙶  ✨ ⌋━━━╮

⏳ 𝙿𝙸𝙽𝙶 𝚃𝙸𝙼𝙴: ${ping}ms

     (Eren)

╰━━━━━━━━━━━━━━━━━━━━╯
          `.trim();

          return message.reply({
            body,
            attachment: fs.createReadStream(localPath),
          });
        });
      });
    }
  },
};

function formatTime(seconds) {
  const d = Math.floor(seconds / (3600 * 24));
  seconds %= 3600 * 24;
  const h = Math.floor(seconds / 3600);
  seconds %= 3600;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${d}d ${h}h ${m}m ${s}s`;
}
