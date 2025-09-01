const fs = require("fs-extra");
const moment = require("moment-timezone");
const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");
const { utils } = global;

module.exports = {
  config: {
    name: "prefix",
    version: "2.7",
    author: "NTKhangir pula",
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

  onChat: async function ({ event, message, usersData, getLang }) {
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

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#1a1a2e");
      gradient.addColorStop(1, "#16213e");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Decorative elements
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      for (let i = 0; i < 20; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 5, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Main box
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.strokeStyle = "#4facfe";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(50, 50, width - 100, height - 140, 20);
      ctx.fill();
      ctx.stroke();

      // Title
      ctx.fillStyle = "#4facfe";
      ctx.font = "bold 30px Arial";
      ctx.textAlign = "center";
      ctx.fillText("PREFIX INFORMATION", width / 2, 100);

      // User info
      ctx.fillStyle = "#ffffff";
      ctx.font = "20px Arial";
      ctx.textAlign = "left";
      ctx.fillText(`👤 User: ${name}`, 100, 150);

      // Prefix info
      ctx.fillStyle = "#4facfe";
      ctx.font = "bold 24px Arial";
      ctx.fillText("🛸 Group Prefix:", 100, 200);
      ctx.fillText("🌍 System Prefix:", 100, 250);
      ctx.fillText("🕒 Current Time:", 100, 300);

      ctx.fillStyle = "#ffffff";
      ctx.font = "24px Arial";
      ctx.fillText(threadPrefix, 350, 200);
      ctx.fillText(globalPrefix, 350, 250);
      ctx.fillText(currentTime, 350, 300);

      // Avatar with solid white circular border
      const avatarSize = 100;
      const avatarX = width - 165;
      const avatarY = 240;
      const borderThickness = 6;

      ctx.beginPath();
      ctx.arc(
        avatarX + avatarSize / 2,
        avatarY + avatarSize / 2,
        (avatarSize / 2) + borderThickness,
        0,
        Math.PI * 2
      );
      ctx.strokeStyle = "#ffffff"; // Solid white border
      ctx.lineWidth = borderThickness;
      ctx.stroke();
      ctx.closePath();

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
      ctx.fillStyle = "#FFFF00";
      ctx.font = "italic bold 18px Arial";
      ctx.textAlign = "center";
      ctx.shadowColor = "#FFFF00";
      ctx.shadowBlur = 15;
      ctx.fillText("⚡ Powered by Sai'Ko T. Evān", width / 2, height - 70);
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;

      // Save and send
      const buffer = canvas.toBuffer();
      const imagePath = `${__dirname}/tmp/prefixInfo.png`;
      fs.ensureDirSync(`${__dirname}/tmp`);
      fs.writeFileSync(imagePath, buffer);

      return message.reply({
        body: getLang("myPrefix"),
        attachment: fs.createReadStream(imagePath)
      }, () => fs.unlinkSync(imagePath));
    }
  }
};
