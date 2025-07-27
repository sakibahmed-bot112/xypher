const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

const bgURL = "https://files.catbox.moe/xnx2la.jpg";
const bgPath = path.join(__dirname, "cache", "hack_bg.jpg");

module.exports = {
  config: {
    name: "hacker",
    version: "3.8",
    author: "Ew'r Saim",
    countDown: 5,
    role: 0,
    shortDescription: "goriber hacker",
    longDescription: "goriber hacker",
    category: "fun",
    guide: {
      en: "{pn} [@mention]"
    }
  },

  langs: {
    en: {
      error: "⚠️ Failed to create hack image."
    }
  },

  onStart: async function ({ event, message, usersData, getLang }) {
    const uid = Object.keys(event.mentions)[0] || event.senderID;

    try {
      await fs.ensureDir(path.dirname(bgPath));

      if (!fs.existsSync(bgPath)) {
        const res = await axios.get(bgURL, { responseType: "arraybuffer" });
        await fs.writeFile(bgPath, res.data);
      }

      const [bg, avatar] = await Promise.all([
        loadImage(bgPath).catch(e => {
          console.log("❌ Background load failed:", e.message);
          return null;
        }),
        usersData.getAvatarUrl(uid).then(url => loadImage(url)).catch(e => {
          console.log("❌ Avatar load failed:", e.message);
          return null;
        })
      ]);

      if (!avatar) throw new Error("Avatar load failed");

      const width = bg?.width || 600;
      const height = bg?.height || 400;

      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // Draw background or fallback black
      if (bg) {
        ctx.drawImage(bg, 0, 0, width, height);
      } else {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, width, height);
      }

      /* ======= AVATAR POSITION & SIZE SETTINGS ======= */
      const avatarSize = 85;
      let avatarX = 378;
      const avatarY = 130;

      avatarX = Math.max(0, Math.min(avatarX, width - avatarSize));
      /* =============================================== */

      // Draw neon glow behind avatar
      ctx.save();
      ctx.shadowColor = "rgba(0, 191, 255, 0.7)"; // light blue glow
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 8, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fillStyle = "rgba(0,0,0,0)";
      ctx.fill();
      ctx.restore();

      // Draw avatar circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
      ctx.restore();

      // Save image
      const outPath = path.join(__dirname, "tmp", `hack_clean_${uid}.jpg`);
      await fs.ensureDir(path.dirname(outPath));
      await fs.writeFile(outPath, canvas.toBuffer("image/jpeg"));

      // Single funny message
      const funnyText = "💻 Hacking your life... Just kidding! 😜";

      await message.reply({
        body: funnyText,
        attachment: fs.createReadStream(outPath)
      }, () => fs.unlinkSync(outPath));

    } catch (err) {
      console.error("❌ Hack Clean Error:", err.message || err);
      return message.reply(getLang("error"));
    }
  }
};
