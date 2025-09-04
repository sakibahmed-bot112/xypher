const fs = require("fs");
const path = require("path");
const os = require("os");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "xid",
    version: "3.2",
    author: "Tawsin",
    role: 0,
    shortDescription: "Premium UID card",
    longDescription: "Show name, UID and profile photo with glowing premium style",
    category: "info",
    guide: "{pn} [@tag | reply | uid]"
  },

  onStart: async function ({ event, message, usersData, args }) {
    try {
      let userId = event.senderID;
      if (args[0] && /^\d+$/.test(args[0])) {
        userId = args[0];
      } else if (Object.keys(event.mentions)[0]) {
        userId = Object.keys(event.mentions)[0];
      } else if (event.type === "message_reply") {
        userId = event.messageReply.senderID;
      }

      let name = await usersData.getName(userId);
      if (!name) name = "Unknown";

      const uid = userId;

      let avatarBuffer;
      try {
        const avatarUrl = await usersData.getAvatarUrl(userId);
        const res = await axios.get(avatarUrl, { responseType: "arraybuffer" });
        avatarBuffer = res.data;
      } catch {
        avatarBuffer = await generateDefaultAvatar();
      }

      const card = await renderCard(name, uid, avatarBuffer);
      const filePath = path.join(os.tmpdir(), `${uid}_uid2.png`);
      fs.writeFileSync(filePath, card);

      message.reply({
        body: `👤 ${name}\n🆔 UID: ${uid}`,
        attachment: fs.createReadStream(filePath)
      }, () => fs.unlinkSync(filePath));
    } catch (err) {
      console.error(err);
      message.reply("❌ Couldn't generate UID card.");
    }
  }
};

async function renderCard(name, uid, avatarBuffer) {
  const canvas = createCanvas(720, 300);
  const ctx = canvas.getContext("2d");

  // Background
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#0b1d3a");
  gradient.addColorStop(1, "#1c233d");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 🌧 Heavy Rain Effect
for (let i = 0; i < 220; i++) {
  const x = Math.random() * canvas.width;
  const y = Math.random() * canvas.height;
  const len = Math.random() * 20 + 10; // লম্বা বৃষ্টি
  ctx.strokeStyle = "rgba(173,216,230,0.4)"; // হালকা নীল, বেশি visible
  ctx.lineWidth = 1; // মোটা লাইন
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 2, y + len);
  ctx.stroke();
}

  // Avatar with glow
  try {
    const avatar = await loadImage(avatarBuffer);
    const x = 40, y = 50, r = 90;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + r, y + r, r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, x, y, r * 2, r * 2);
    ctx.restore();

    // Red glowing border
    ctx.beginPath();
    ctx.arc(x + r, y + r, r + 4, 0, Math.PI * 2);
    ctx.strokeStyle = "#ff4d4d";
    ctx.shadowColor = "#ff4d4d";
    ctx.shadowBlur = 25;
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.shadowBlur = 0;
  } catch {}

  // Name (auto shrink)
  const maxTextWidth = 420;
  const dynamicFontSize = fitText(ctx, name, maxTextWidth, 42);
  ctx.font = `bold ${dynamicFontSize}px Sans-serif`;
  ctx.fillStyle = "#00ffff";
  ctx.shadowColor = "#00ffff";
  ctx.shadowBlur = 20;
  ctx.fillText(name, 270, 120);
  ctx.shadowBlur = 0;

  // UID
  ctx.font = "bold 32px Courier New";
  ctx.fillStyle = "#ff4cf5";
  ctx.shadowColor = "#ff4cf5";
  ctx.shadowBlur = 18;
  ctx.fillText(`UID:  ${uid}`, 270, 170);
  ctx.shadowBlur = 0;

  // Footer
  ctx.font = "16px Monospace";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("Premium UID card ", 480, 260);

  return canvas.toBuffer("image/png");
}

// Dynamic font shrinker
function fitText(ctx, text, maxWidth, baseSize) {
  let fontSize = baseSize;
  do {
    ctx.font = `bold ${fontSize}px Sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) break;
    fontSize -= 1;
  } while (fontSize > 12);
  return fontSize;
}

// Fallback avatar
async function generateDefaultAvatar() {
  const canvas = createCanvas(200, 200);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#555";
  ctx.beginPath();
  ctx.arc(100, 100, 100, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 90px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("?", 100, 110);
  return canvas.toBuffer("image/png");
  }
