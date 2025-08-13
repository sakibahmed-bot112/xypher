const Canvas = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "hijra",
    aliases: ["hijra", "hizra"],
    version: "1.0.1",
    author: "Asif",
    countDown: 5,
    role: 0,
    description: "মেনশন বা রিপলাই করা ইউজারের প্রোফাইল হিজরার গলায় বসাবে",
    category: "fun",
    guide: {
      bn: "{pn} @user\nঅথবা কারও মেসেজে রিপ্লাই দিয়ে লিখুন: {pn}"
    }
  },

  onStart: async function ({ api, event, message }) {
    try {
      let targetUid = null;

      if (Object.keys(event.mentions || {}).length > 0) {
        targetUid = Object.keys(event.mentions)[0];
      } else if (event.messageReply && event.messageReply.senderID) {
        targetUid = event.messageReply.senderID;
      } else {
        return message.reply("💃 দয়া করে কাউকে মেনশন করুন বা তার মেসেজে রিপলাই দিন।");
      }

      let targetName = "Unknown User";
      try {
        const userInfo = await api.getUserInfo(targetUid);
        targetName = userInfo[targetUid]?.name || "Unknown User";
      } catch {}

      const tmpDir = path.join(__dirname, "tmp");
      await fs.ensureDir(tmpDir);

      const outPath = path.join(tmpDir, `hijra_${event.threadID}_${Date.now()}.png`);
      const avatarPath = path.join(tmpDir, `avatar_${targetUid}.png`);

      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);
      const basePath = path.join(cacheDir, "hijra_base.png");

      if (!await fs.pathExists(basePath)) {
        const hijraURL = "https://files.catbox.moe/oovc6k.jpg"; // এখানে চাইলে হিজরার ছবি দিতে পারো
        const hijraRes = await axios.get(hijraURL, { responseType: "arraybuffer" });
        await fs.writeFile(basePath, Buffer.from(hijraRes.data, "binary"));
      }

      const avatarURL = `https://graph.facebook.com/${targetUid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const avRes = await axios.get(avatarURL, { responseType: "arraybuffer" });
      await fs.writeFile(avatarPath, Buffer.from(avRes.data, "binary"));

      const baseImg = await Canvas.loadImage(basePath);
      const canvas = Canvas.createCanvas(baseImg.width, baseImg.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(baseImg, 0, 0);

      const avImg = await Canvas.loadImage(avatarPath);

      const badgeSize = Math.floor(Math.min(canvas.width, canvas.height) * 0.25);
      const badgeX = Math.floor(canvas.width * 0.30);
      const badgeY = Math.floor(canvas.height * 0.65);
      const ringThickness = Math.max(4, Math.floor(badgeSize * 0.06));

      ctx.save();
      ctx.shadowBlur = Math.floor(badgeSize * 0.12);
      ctx.shadowColor = "rgba(0,0,0,0.35)";

      ctx.beginPath();
      ctx.arc(badgeX + badgeSize / 2, badgeY + badgeSize / 2, badgeSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avImg, badgeX, badgeY, badgeSize, badgeSize);
      ctx.restore();

      ctx.beginPath();
      ctx.arc(badgeX + badgeSize / 2, badgeY + badgeSize / 2, (badgeSize / 2) + (ringThickness / 2) - 1, 0, Math.PI * 2);
      ctx.lineWidth = ringThickness;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(badgeX + badgeSize / 2, badgeY + badgeSize / 2, badgeSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = "#000000";
      ctx.filter = "blur(2px)";
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.filter = "none";

      await fs.writeFile(outPath, canvas.toBuffer("image/png"));

      let replyText = Object.keys(event.mentions || {}).length > 0
        ? `💃 ${targetName} এখন আসল হিজরা রাণী 😹👑`
        : `💃 এটা হচ্ছে ${targetName}-এর হিজরা রূপ..!`;

      return message.reply({
        body: replyText,
        attachment: fs.createReadStream(outPath)
      }, async () => {
        await fs.remove(outPath).catch(() => {});
        await fs.remove(avatarPath).catch(() => {});
      });

    } catch (e) {
      console.error(e);
      return message.reply("দুঃখিত, হিজরা রূপ দিতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।");
    }
  }
};
