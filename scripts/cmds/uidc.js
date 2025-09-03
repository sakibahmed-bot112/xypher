const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "uidc",
    aliases: ["uidc", "uida"],
    version: "1.1.0",
    author: "Muzan",
    cooldowns: 3,
    role: 0,
    shortDescription: "Reply/Mention-based UID canvas card",
  },

  // Main handler
  onStart: async function ({ message, event, api, usersData }) {
    // helper to safely reply if available
    const safeReply = async (text) => {
      try {
        if (message && typeof message.reply === "function") return await message.reply(text);
        if (message && typeof message.send === "function") return await message.send(text);
        if (api && typeof api.sendMessage === "function") {
          const threadID = event?.threadID || event?.thread || message?.threadID || event?.senderID;
          return await api.sendMessage(text, threadID);
        }
      } catch (e) {
        console.error("safeReply error:", e);
      }
    };

    try {
      // -------- Resolve target UID & name (mentions -> reply -> sender) --------
      let targetUID = null;

      // support multiple mention shapes: event.mentions (object), message.mentions, event.message?.mentions
      const mentions =
        (event && (event.mentions || (event.message && event.message.mentions))) ||
        (message && message.mentions) ||
        null;

      if (mentions && typeof mentions === "object" && Object.keys(mentions).length > 0) {
        targetUID = Object.keys(mentions)[0];
      }

      // reply to message
      if (!targetUID) {
        targetUID =
          event?.messageReply?.senderID ||
          (event?.messageReply && event.messageReply.senderID) ||
          null;
      }

      // fallback to event sender or message author
      if (!targetUID) {
        targetUID = event?.senderID || message?.senderID || message?.author || null;
      }

      if (!targetUID) {
        return safeReply("❌ লক্ষ্য ব্যবহারকারী সনাক্ত করা যায়নি। রিপ্লাই/মেনশন করে দেখুন।");
      }

      // Get display name (try usersData.getName then api.getUserInfo)
      let name = "Unknown User";
      try {
        if (usersData && typeof usersData.getName === "function") {
          const n = await usersData.getName(targetUID);
          if (n) name = n;
        }
      } catch (e) {}
      try {
        if ((name === "Unknown User") && api && typeof api.getUserInfo === "function") {
          const info = await api.getUserInfo(targetUID);
          name = info?.[targetUID]?.name || info?.name || name;
        }
      } catch (e) {}

      // -------- Avatar buffer with safe fallbacks (never throw) --------
      const getAvatarBuffer = async (uid) => {
        // try usersData.getAvatarUrl
        try {
          if (usersData && typeof usersData.getAvatarUrl === "function") {
            const url = await usersData.getAvatarUrl(uid);
            if (url) {
              const res = await axios.get(url, { responseType: "arraybuffer", timeout: 10000 });
              return Buffer.from(res.data);
            }
          }
        } catch (e) {
          console.warn("getAvatarBuffer: usersData.getAvatarUrl failed:", e?.message || e);
        }

        // try api.getUserInfo thumbSrc / avatar fields
        try {
          if (api && typeof api.getUserInfo === "function") {
            const info = await api.getUserInfo(uid);
            const avatarUrl = info?.[uid]?.thumbSrc || info?.thumbSrc || info?.[uid]?.profileUrl || info?.profileUrl;
            if (avatarUrl) {
              const res = await axios.get(avatarUrl, { responseType: "arraybuffer", timeout: 10000 });
              return Buffer.from(res.data);
            }
          }
        } catch (e) {
          console.warn("getAvatarBuffer: api.getUserInfo failed:", e?.message || e);
        }

        // fallback: null -> we will draw initials
        return null;
      };

      const avatarBuf = await getAvatarBuffer(targetUID);

      // -------- Canvas drawing --------
      const W = 1000, H = 500;
      const canvas = createCanvas(W, H);
      const ctx = canvas.getContext("2d");

      // background (very light red)
ctx.fillStyle = "rgba(255, 100, 100, 0.15)"; // subtle light red
ctx.fillRect(0, 0, W, H);

// Left prominent green glow
const glow = ctx.createRadialGradient(0, H * 0.5, 0, 0, H * 0.5, W); // radius বাড়ালাম
glow.addColorStop(0, "rgba(144,238,144,0.6)"); // light green, opacity বেশি
glow.addColorStop(0.35, "rgba(144,238,144,0.3)");
glow.addColorStop(0.7, "rgba(144,238,144,0.15)");
glow.addColorStop(1, "rgba(144,238,144,0)"); 
ctx.fillStyle = glow;
ctx.fillRect(0, 0, W, H);

      // 🌧 Heavy Rain Effect
for (let i = 0; i < 150; i++) {
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

// কিছু রঙিন তারা চাইলে (বোনাস effect ✨)
for (let i = 0; i < 30; i++) {
  const x = Math.random() * canvas.width;
  const y = Math.random() * canvas.height;
  const radius = Math.random() * 2 + 1;
  const colors = ["#FFD700", "#87CEFA", "#FF69B4", "#ADFF2F"];
  const color = colors[Math.floor(Math.random() * colors.length)];
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

      // ---- Rounded Card Function ----
function roundedRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ---- Card Properties ----
const cardX = 40, cardY = 40, cardW = W - 80, cardH = H - 80, rad = 22;

// Save state + add shadow
ctx.save();
ctx.shadowColor = "rgba(0,0,0,0.35)";
ctx.shadowBlur = 20;
ctx.shadowOffsetY = 8;

// Draw card background
roundedRect(cardX, cardY, cardW, cardH, rad);
ctx.fillStyle = "rgba(9, 20, 46, 0.75)";
ctx.fill();

// Clip everything inside the rounded card
ctx.clip();

// 🌌 Galaxy effect (stars)
for (let i = 0; i < 200; i++) {
  const x = Math.random() * (cardW - 20) + cardX + 10; // card এর ভেতরে সীমাবদ্ধ
  const y = Math.random() * (cardH - 20) + cardY + 10;
  const radius = Math.random() * 1.5 + 0.5;
  const alpha = Math.random() * 0.8 + 0.2;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
  ctx.fill();
}

// Restore to remove clip effect for later drawings
ctx.restore();

      // avatar
      const avatarR = 95;
      const avatarCX = cardX + 120;
      const avatarCY = cardY + 140;

      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarCX, avatarCY, avatarR, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      if (avatarBuf) {
        try {
          const img = await loadImage(avatarBuf);
          ctx.drawImage(img, avatarCX - avatarR, avatarCY - avatarR, avatarR * 2, avatarR * 2);
        } catch (e) {
          // if image decode failed -> draw initials
          drawInitials();
        }
      } else {
        drawInitials();
      }
      ctx.restore();

      function drawInitials() {
        const initials =
          (name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((s) => s[0]?.toUpperCase())
            .join("") || "U");
        const g = ctx.createLinearGradient(avatarCX - avatarR, avatarCY - avatarR, avatarCX + avatarR, avatarCY + avatarR);
        g.addColorStop(0, "#1f3b73");
        g.addColorStop(1, "#2a6f8f");
        ctx.fillStyle = g;
        ctx.fillRect(avatarCX - avatarR, avatarCY - avatarR, avatarR * 2, avatarR * 2);

        ctx.fillStyle = "#eaf7ff";
        ctx.font = `bold ${Math.round(avatarR * 0.9)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(initials, avatarCX, avatarCY + 2);
      }

      // glowing stroke around avatar
      ctx.save();
      ctx.shadowColor = "#87cefa";
      ctx.shadowBlur = 25;
      ctx.lineWidth = 6;
      ctx.strokeStyle = "#87cefa";
      ctx.beginPath();
      ctx.arc(avatarCX, avatarCY, avatarR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#e6f5ff";
      ctx.beginPath();
      ctx.arc(avatarCX, avatarCY, avatarR - 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // emoji and name
ctx.font = "36px sans-serif";
ctx.textAlign = "left";
ctx.textBaseline = "middle";
ctx.fillStyle = "#ffffff";
ctx.fillText("", avatarCX + avatarR + 28, avatarCY - 30);

ctx.font = "bold 40px sans-serif";
ctx.fillStyle = "#e9f6ff";
ctx.save();
ctx.shadowColor = "rgba(135,206,250,0.6)";
ctx.shadowBlur = 10;
ctx.fillText(name, avatarCX + avatarR + 28, avatarCY + 10);
ctx.restore();

// "Sir Heres your Uid" - big red glowing text
ctx.font = "bold 32px sans-serif"; // একটু বড় এবং মোটা
ctx.fillStyle = "#ff4d4d"; // লাল রঙ
ctx.save();
ctx.shadowColor = "rgba(255,0,0,1)"; // শক্তিশালী রেড গ্লো
ctx.shadowBlur = 25; // গ্লো অনেক
ctx.fillText("Sir Heres your Uid", avatarCX + avatarR + 28, avatarCY + 70); // নিচে সরানো
ctx.restore();

      // divider 1
ctx.strokeStyle = "rgba(135,206,250,0.25)"; // আরও হালকা
ctx.lineWidth = 1.2;
ctx.beginPath();
ctx.moveTo(cardX + 30, cardY + 265); // একটু উপরে
ctx.lineTo(cardX + cardW - 30, cardY + 265);
ctx.stroke();

// divider 2
ctx.strokeStyle = "rgba(135,206,250,0.25)"; // একই হালকা রঙ
ctx.lineWidth = 1.2;
ctx.beginPath();
ctx.moveTo(cardX + 30, cardY + 275); // একটু নিচে, ফাঁকা রাখার জন্য
ctx.lineTo(cardX + cardW - 30, cardY + 275);
ctx.stroke();

      // UID
      ctx.font = "bold 40px sans-serif";
      ctx.fillStyle = "#bfeaff";
      ctx.textAlign = "center";
      ctx.fillText(`UID: ${targetUID}`, cardX + cardW / 2, cardY + cardH - 70);

      // footer hint
      ctx.font = "16px sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillText("A premium Canvas uid Card |Muzan", cardX + cardW / 2, cardY + cardH - 36);

      // save image
      const cacheDir = path.join(__dirname, "cache");
      fs.mkdirSync(cacheDir, { recursive: true });
      const outPath = path.join(cacheDir, `uidc_${Date.now()}.png`);
      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(outPath, buffer);

      // Safe sending (tries several methods)
      const safeSend = async () => {
        if (message && typeof message.reply === "function") {
          return await message.reply({ body: "", attachment: fs.createReadStream(outPath) });
        }
        if (message && typeof message.send === "function") {
          return await message.send({ body: "", attachment: fs.createReadStream(outPath) });
        }
        if (api && typeof api.sendMessage === "function") {
          const threadID = event?.threadID || event?.thread || message?.threadID || event?.senderID;
          // many frameworks expect (message, threadID)
          try {
            return await api.sendMessage({ body: "", attachment: fs.createReadStream(outPath) }, threadID);
          } catch (e) {
            // fallback: older signature
            return await api.sendMessage({ body: "", attachment: fs.createReadStream(outPath) }, threadID);
          }
        }
        throw new Error("No available send method (message.reply / message.send / api.sendMessage not found).");
      };

      try {
        await safeSend();
      } finally {
        // cleanup
        setTimeout(() => {
          try {
            fs.unlinkSync(outPath);
          } catch (_) {}
        }, 60 * 1000);
      }

    } catch (err) {
      // log full error for debugging
      console.error("uidc error:", err?.stack || err);

      // user-facing reply with small hint
      try {
        return await safeReply(`❌ একটি ত্রুটি ঘটেছে। লগ চেক করুন। ( ${err?.message || "unknown"} )`);
      } catch (e) {
        console.error("safeReply fallback failed:", e);
      }
    }
  },
};
