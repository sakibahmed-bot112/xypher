const fs = require("fs-extra");
const moment = require("moment-timezone");
const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");
const { utils } = global;

// ---- Math Bold Converter ----
function toMathBold(input) {
  const A = "A".codePointAt(0), a = "a".codePointAt(0), ZERO = "0".codePointAt(0);
  const BOLD_A = 0x1D400, BOLD_a = 0x1D41A, BOLD_0 = 0x1D7CE;
  let out = "";
  for (const ch of input) {
    const cp = ch.codePointAt(0);
    if (cp >= 65 && cp <= 90) out += String.fromCodePoint(BOLD_A + (cp - A));
    else if (cp >= 97 && cp <= 122) out += String.fromCodePoint(BOLD_a + (cp - a));
    else if (cp >= 48 && cp <= 57) out += String.fromCodePoint(BOLD_0 + (cp - ZERO));
    else out += ch;
  }
  return out;
}

module.exports = {
  config: {
    name: "prefix",
    version: "3.0",
    author: "NTKhang modified by asif+Muzan",
    countDown: 5,
    role: 0,
    shortDescription: "Customize bot prefix",
    longDescription: "Modify the bot's prefix for individual threads or globally (admin only).",
    category: "config",
    guide: {
      en: `
        {pn} <new prefix>: Change the prefix for your chat box.
        Example: {pn} #

        {pn} <new prefix> -g: Change the prefix globally (admin only).
        Example: {pn} # -g

        {pn} reset: Reset prefix to the default.
      `
    }
  },

  langs: {
    en: {
      reset: "🔄 Your prefix has been reset to default: %1",
      onlyAdmin: "🚫 Only admins can modify the global prefix.",
      confirmGlobal: "⚠️ React below to confirm changing the global prefix.",
      confirmThisThread: "⚠️ React below to confirm changing the thread prefix.",
      successGlobal: "✅ Global prefix successfully updated to: %1",
      successThisThread: "✅ Thread prefix successfully updated to: %1",
      myPrefix: "Here's your prefix information:"
    }
  },

  onStart: async function ({ message, role, args, event, threadsData, getLang }) {
    if (!args[0]) return message.reply("❌ Please provide a valid prefix or use 'reset'.");

    const newPrefix = args[0];
    const isGlobal = args[1] === "-g";

    if (newPrefix === "reset") {
      await threadsData.set(event.threadID, null, "data.prefix");
      return message.reply(getLang("reset", global.GoatBot.config.prefix));
    }

    if (isGlobal && role < 2) return message.reply(getLang("onlyAdmin"));

    const confirmationMessage = isGlobal ? getLang("confirmGlobal") : getLang("confirmThisThread");
    return message.reply(confirmationMessage, (err, info) => {
      global.GoatBot.onReaction.set(info.messageID, {
        commandName: this.config.name,
        author: event.senderID,
        newPrefix,
        setGlobal: isGlobal,
        messageID: info.messageID
      });
    });
  },

  onReaction: async function ({ message, threadsData, event, Reaction, getLang }) {
    const { author, newPrefix, setGlobal } = Reaction;

    if (event.userID !== author) return;

    if (setGlobal) {
      global.GoatBot.config.prefix = newPrefix;
      fs.writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
      return message.reply(getLang("successGlobal", newPrefix));
    } else {
      await threadsData.set(event.threadID, newPrefix, "data.prefix");
      return message.reply(getLang("successThisThread", newPrefix));
    }
  },

  onChat: async function ({ event, message, usersData }) {
    if (event.body.toLowerCase() === "prefix") {
      const data = await usersData.get(event.senderID);
      const name = data.name || "User";
      const currentTime = moment.tz("Asia/Dhaka").format("hh:mm:ss A");
      const threadPrefix = utils.getPrefix(event.threadID);
      const globalPrefix = global.GoatBot.config.prefix;

      // Load user avatar
      const avatarURL = `https://graph.facebook.com/${event.senderID}/picture?height=1000&width=1000&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const avatarBuffer = (await axios.get(avatarURL, { responseType: "arraybuffer" })).data;
      const avatar = await loadImage(Buffer.from(avatarBuffer, "binary"));

      // Create canvas
      const width = 800;
      const height = 450;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // Background
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, width, height);

      // Border
      const borderWidth = 10;
      ctx.lineWidth = borderWidth;
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#00c8ff");
      gradient.addColorStop(1, "#00ff88");
      ctx.strokeStyle = gradient;
      ctx.shadowColor = "#00f7ff";
      ctx.shadowBlur = 90;
      ctx.strokeRect(borderWidth / 2, borderWidth / 2, width - borderWidth, height - borderWidth);
      ctx.shadowBlur = 0;

      // Main box
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.strokeStyle = "#90EE90";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(50, 50, width - 100, height - 140, 20);
      ctx.fill();
      ctx.stroke();

      // Galaxy stars
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(50, 50, width - 100, height - 140, 20);
      ctx.clip();
      for (let i = 0; i < 200; i++) {
        const x = Math.random() * (width - 100) + 50;
        const y = Math.random() * (height - 140) + 50;
        const radius = Math.random() * 1.5 + 0.5;
        const alpha = Math.random() * 0.5 + 0.1;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
      }
      ctx.restore();

      // Title
      ctx.fillStyle = "#ADD8E6";
      ctx.font = "bold 30px Arial";
      ctx.textAlign = "center";
      ctx.fillText("PREFIX INFORMATION", width / 2, 100);

      // User info
      ctx.fillStyle = "#DA70D6";
      ctx.font = "italic bold 30px Arial";
      ctx.textAlign = "left";
      ctx.fillText(`°User: ${toMathBold(name)}`, 100, 150);

      // Labels
      ctx.fillStyle = "#90EE90";
      ctx.font = "bold 24px Arial";
      ctx.fillText("🌍 System Prefix:", 100, 200);
      ctx.fillText("🛸 Group Prefix:", 100, 250);
      ctx.fillText("🕒 Current Time:", 100, 300);

      // Global prefix
      let globalPrefixText = `[ ${toMathBold(globalPrefix)} ]`;
      if (["!", "."].includes(globalPrefix)) {
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 40px Arial";
      } else {
        ctx.fillStyle = "#4facfe";
        ctx.font = "35px Arial";
      }
      ctx.fillText(globalPrefixText, 350, 205);

      // Thread prefix (FIXED)
      let threadPrefixText = `[ ${toMathBold(threadPrefix)} ]`;
      if (["!", "."].includes(threadPrefix)) {
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 40px Arial";
      } else {
        ctx.fillStyle = "#4facfe";
        ctx.font = "35px Arial";
      }
      ctx.fillText(threadPrefixText, 350, 255);

      // Time
      ctx.fillStyle = "#A1C4FD";
      ctx.font = "27px Arial";
      ctx.fillText(toMathBold(currentTime), 350, 300);

      // Avatar
      const avatarSize = 100;
      const avatarX = width - 175;
      const avatarY = 230;
      const borderThickness = 6;
      ctx.beginPath();
      const avatarGradient = ctx.createLinearGradient(avatarX, avatarY, avatarX + avatarSize, avatarY + avatarSize);
      avatarGradient.addColorStop(0, "#FFA500");
      avatarGradient.addColorStop(1, "#00c8ff");
      ctx.arc(
        avatarX + avatarSize / 2,
        avatarY + avatarSize / 2,
        (avatarSize / 2) + borderThickness,
        0,
        Math.PI * 2
      );
      ctx.strokeStyle = avatarGradient;
      ctx.shadowColor = "#FFA500";
      ctx.shadowBlur = 25;
      ctx.lineWidth = borderThickness;
      ctx.stroke();
      ctx.closePath();
      ctx.shadowBlur = 0;
      ctx.save();
      ctx.beginPath();
      ctx.arc(
        avatarX + avatarSize / 2,
        avatarY + avatarSize / 2,
        avatarSize / 2,
        0,
        Math.PI * 2,
        true
      );
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
      ctx.restore();

      // Footer
      ctx.fillStyle = "#ff4d4d";
      ctx.font = "italic bold 20px Arial";
      ctx.textAlign = "center";
      ctx.shadowColor = "#ff4d4d";
      ctx.shadowBlur = 45;
      ctx.fillText(`⚡ Premium Prefix triggered by °User: ${toMathBold(name)}`, width / 2, height - 50);
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;

      // Save image
      const buffer = canvas.toBuffer();
      const imagePath = `${__dirname}/tmp/prefixInfo.png`;
      fs.ensureDirSync(`${__dirname}/tmp`);
      fs.writeFileSync(imagePath, buffer);

      // Body text
      const rawBodyText = `
📌 PREFIX INFORMATION
━━━━━━━━━━━━━━━━━━━
👤 User: ${name}
🌍 System Prefix: [ ${globalPrefix} ]
🛸 Group Prefix: [ ${threadPrefix} ]
🕒 Current Time: ${currentTime}
━━━━━━━━━━━━━━━━━━━
🔰 Prefix triggered by ${name}
`;

      // Convert full body text to Bold Unicode
      const bodyText = toMathBold(rawBodyText);

      // Send
      return message.reply({
        body: bodyText,
        attachment: fs.createReadStream(imagePath)
      }, () => fs.unlinkSync(imagePath));
    }
  }
};
