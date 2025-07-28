const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

const bgURL = "https://i.ibb.co/sdRFrBQG/2-Nm-Kr-SUtr-T.jpg.jpeg";
const localBgPath = path.join(__dirname, "cache", "kick_bg.jpg");

module.exports = {
  config: {
    name: "kicked",
    version: "1.4-optimized",
    author: "Ew'r Saim",
    countDown: 5,
    role: 0,
    shortDescription: "Kick someone with haruka sakura style 😈",
    longDescription: "Sends an image showing the user kicking another user",
    category: "fun",
    guide: {
      en: "{pn} @tag"
    }
  },

  langs: {
    en: {
      noTag: "You must tag the person you want to kick."
    }
  },

  onStart: async function ({ event, message, usersData, args, getLang }) {
    const uid1 = event.senderID;
    const uid2 = Object.keys(event.mentions)[0];

    if (!uid2)
      return message.reply(getLang("noTag"));

    try {
      // ✅ Load or cache background locally
      await fs.ensureDir(path.dirname(localBgPath));
      if (!fs.existsSync(localBgPath)) {
        const bgRes = await axios.get(bgURL, { responseType: "arraybuffer" });
        await fs.writeFile(localBgPath, bgRes.data);
      }

      const [avatarURL1, avatarURL2] = await Promise.all([
        usersData.getAvatarUrl(uid1),
        usersData.getAvatarUrl(uid2)
      ]);

      const [avatar1, avatar2, bgImg] = await Promise.all([
        loadImage(avatarURL1).catch(() => null),
        loadImage(avatarURL2).catch(() => null),
        loadImage(localBgPath)
      ]);

      if (!avatar1 || !avatar2)
        throw new Error("Failed to load one or both avatars.");

      const canvas = createCanvas(bgImg.width, bgImg.height);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(bgImg, 0, 0);

      function drawCircle(ctx, img, x, y, size) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, x, y, size, size);
        ctx.restore();
      }

      drawCircle(ctx, avatar1, 500, 90, 90); // kicker
      drawCircle(ctx, avatar2, 230, 25, 90); // kicked

      const savePath = path.join(__dirname, "tmp");
      await fs.ensureDir(savePath);
      const imgPath = path.join(savePath, `${uid1}_${uid2}_kick.jpg`);
      await fs.writeFile(imgPath, canvas.toBuffer("image/jpeg"));

      const rawText = args.join(" ");
      const mentionTag = event.mentions[uid2] || "";
      const cleanedText = rawText.replace(mentionTag, "").trim();
      const finalText = cleanedText || "🦶💢-এটা আমার বেডি, ভাগ মাংগের পোলা..! 😎🔥";

      await message.reply({
        body: finalText,
        attachment: fs.createReadStream(imgPath)
      }, () => {
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      });

    } catch (err) {
      console.error("❌ Error in kicked.js:", err);
      return message.reply("⚠️ Failed to create kick image.");
    }
  }
};
