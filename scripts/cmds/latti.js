const Canvas = require("canvas");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "latti",
    aliases: [],
    version: "1.3.1",
    author: "eden",
    countDown: 5,
    role: 0,
    description: "লাত্থি মারার মজা 😂",
    category: "fun",
    guide: "{pn} @user অথবা রিপলাই"
  },

  onStart: async function ({ event, api, usersData }) {
    try {
      const senderID = String(event.senderID);
      let targetID;

      // টার্গেট বের করা
      if (event.mentions && Object.keys(event.mentions).length > 0) {
        targetID = String(Object.keys(event.mentions)[0]);
      } else if (event.messageReply) {
        targetID = String(event.messageReply.senderID);
      } else {
        return api.sendMessage("- কাকে লাত্থি মারবি মেনশন দে..!😼", event.threadID, event.messageID);
      }

      // নাম ফেচ করার ফাংশন
      const getName = async (uid) => {
        try {
          const info = await api.getUserInfo([uid]);
          return info[uid]?.name?.trim() || "নাম খুঁজে পাওয়া যায়নি";
        } catch {
          return "নাম খুঁজে পাওয়া যায়নি";
        }
      };

      const senderName = await getName(senderID);
      const targetName = await getName(targetID);

      // প্রোফাইল পিক
      const senderPic = await usersData.getAvatarUrl(senderID);
      const targetPic = await usersData.getAvatarUrl(targetID);

      // বেস ইমেজ
      const baseImage = await Canvas.loadImage("https://files.catbox.moe/7g0mv5.jpg");
      const canvas = Canvas.createCanvas(baseImage.width, baseImage.height);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

      const avatarSize = Math.round(Math.min(canvas.width, canvas.height) * 0.24);
      const stomachX = Math.round(canvas.width * 0.20);
      const stomachY = Math.round(canvas.height * 0.50);
      const chestX = Math.round(canvas.width * 0.60);
      const chestY = Math.round(canvas.height * 0.24);

      const drawCircleImage = async (url, x, y, size) => {
        const img = await Canvas.loadImage(url);
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        const ratio = Math.max(size / img.width, size / img.height);
        const nw = img.width * ratio;
        const nh = img.height * ratio;
        const dx = x - (nw - size) / 2;
        const dy = y - (nh - size) / 2;
        ctx.drawImage(img, dx, dy, nw, nh);
        ctx.restore();
      };

      await drawCircleImage(senderPic, stomachX, stomachY, avatarSize);
      await drawCircleImage(targetPic, chestX, chestY, avatarSize);

      // সেভ + সেন্ড
      const path = __dirname + "/tmp/latti_" + Date.now() + ".png";
      await fs.ensureDir(__dirname + "/tmp");
      fs.writeFileSync(path, canvas.toBuffer());

      api.sendMessage(
        { body: `💥 ${senderName} লাত্থি দিলো ${targetName} মূর্খ কে..!`, attachment: fs.createReadStream(path) },
        event.threadID,
        () => fs.unlinkSync(path),
        event.messageID
      );

    } catch (e) {
      console.error(e);
      api.sendMessage("❌ Something wrong", event.threadID, event.messageID);
    }
  }
};
