const Canvas = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "goat",
    aliases: ["chagol", "goat"],
    version: "1.0.1",
    author: "Asif",
    countDown: 5,
    role: 0,
    description: "মেনশন বা রিপলাই করা ইউজারের প্রোফাইল ছাগলের গলায় বসাবে",
    category: "fun",
    guide: {
      bn: "{pn} @user\nঅথবা কারও মেসেজে রিপ্লাই দিয়ে লিখুন: {pn}"
    }
  },

  onStart: async function ({ api, event, message }) {
    try {
      // ==== 1) টার্গেট UID বের করা (শুধু মেনশন বা রিপলাই হলে) ====
      let targetUid = null;

      if (Object.keys(event.mentions || {}).length > 0) {
        targetUid = Object.keys(event.mentions)[0];
      } else if (event.messageReply && event.messageReply.senderID) {
        targetUid = event.messageReply.senderID;
      } else {
        return message.reply("🐐 দয়া করে কাউকে মেনশন করুন বা তার মেসেজে রিপলাই দিন।");
      }

      // ==== 2) ইউজারের নাম আনা ====
      let targetName = "";
      try {
        const userInfo = await api.getUserInfo(targetUid);
        targetName = userInfo[targetUid]?.name || "Unknown User";
      } catch {
        targetName = "Unknown User";
      }

      // ==== 3) কাজের ফোল্ডার ====
      const tmpDir = path.join(__dirname, "tmp");
      await fs.ensureDir(tmpDir);

      const outPath = path.join(tmpDir, `goat_${event.threadID}_${Date.now()}.png`);
      const avatarPath = path.join(tmpDir, `avatar_${targetUid}.png`);

      // ==== 4) বেস ছাগল ইমেজ ====
      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);
      const basePath = path.join(cacheDir, "goat_base.png");

      if (!fs.existsSync(basePath)) {
        const goatURL = "https://files.catbox.moe/fc8933.jpg"; // ছাগল টেমপ্লেট
        const goatRes = await axios.get(goatURL, { responseType: "arraybuffer" });
        await fs.writeFile(basePath, Buffer.from(goatRes.data, "binary"));
      }

      // ==== 5) প্রোফাইল ছবি নামানো ====
      const avatarURL = `https://graph.facebook.com/${targetUid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const avRes = await axios.get(avatarURL, { responseType: "arraybuffer", maxRedirects: 5 });
      await fs.writeFile(avatarPath, Buffer.from(avRes.data, "binary"));

      // ==== 6) ক্যানভাসে আঁকা ====
      const baseImg = await Canvas.loadImage(basePath);
      const canvas = Canvas.createCanvas(baseImg.width, baseImg.height);
      const ctx = canvas.getContext("2d");

      // ব্যাকগ্রাউন্ডে ছাগল
      ctx.drawImage(baseImg, 0, 0);

      // প্রোফাইলকে গলায় বসানো
      const avImg = await Canvas.loadImage(avatarPath);

      const badgeSize = Math.floor(Math.min(canvas.width, canvas.height) * 0.25);
      const badgeX = Math.floor(canvas.width * 0.47);
      const badgeY = Math.floor(canvas.height * 0.50);
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

      // ==== 7) বডি মেসেজ ====
      let replyText = "";
      if (Object.keys(event.mentions || {}).length > 0) {
        replyText = `🐐 ${targetName} হলো আসল মগা ছাগল 🤣🤣 `;
      } else {
        replyText = `🐐 এটা হচ্ছে  ${targetName}-এর ছাগল হওয়ার রূপ..!`;
      }

      return message.reply({
        body: replyText,
        attachment: fs.createReadStream(outPath)
      }, async () => {
        await fs.remove(outPath).catch(() => {});
        await fs.remove(avatarPath).catch(() => {});
      });

    } catch (e) {
      console.error(e);
      return message.reply("দুঃখিত, ছাগল বানাতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।");
    }
  }
};
