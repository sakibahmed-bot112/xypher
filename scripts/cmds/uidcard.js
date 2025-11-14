const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

// ---- Math Bold Converter ----
function toMathBold(input) {
  const A = "A".codePointAt(0),
    a = "a".codePointAt(0),
    ZERO = "0".codePointAt(0);
  const BOLD_A = 0x1d400,
    BOLD_a = 0x1d41a,
    BOLD_0 = 0x1d7ce;
  let out = "";
  for (const ch of input) {
    const cp = ch.codePointAt(0);
    if (cp >= 65 && cp <= 90) out += String.fromCodePoint(BOLD_A + (cp - A));
    else if (cp >= 97 && cp <= 122)
      out += String.fromCodePoint(BOLD_a + (cp - a));
    else if (cp >= 48 && cp <= 57)
      out += String.fromCodePoint(BOLD_0 + (cp - ZERO));
    else out += ch;
  }
  return out;
}

module.exports = {
  config: {
    name: "uidcard",
    aliases: ["u2", "uidc"],
    version: "1.1.0",
    author: "EDEN",
    prefix: "awto",
    role: 0,
    shortDescription: "Reply/Mention-based UID canvas card",
    category: "without prefix",
    cooldowns: 5,
  },

  onStart: async function ({ message, event, api, usersData }) {
    const safeReply = async (text) => {
      try {
        if (message && typeof message.reply === "function")
          return await message.reply(text);
        if (message && typeof message.send === "function")
          return await message.send(text);
        if (api && typeof api.sendMessage === "function") {
          const threadID =
            event?.threadID ||
            event?.thread ||
            message?.threadID ||
            event?.senderID;
          return await api.sendMessage(text, threadID);
        }
      } catch (e) {
        console.error("safeReply error:", e);
      }
    };

    try {
      // -------- Resolve target UID & name --------
      let targetUID = null;
      const mentions =
        (event &&
          (event.mentions || (event.message && event.message.mentions))) ||
        (message && message.mentions) ||
        null;

      if (mentions && typeof mentions === "object" && Object.keys(mentions).length > 0) {
        targetUID = Object.keys(mentions)[0];
      }
      if (!targetUID) {
        targetUID =
          event?.messageReply?.senderID ||
          (event?.messageReply && event.messageReply.senderID) ||
          null;
      }
      if (!targetUID) {
        targetUID =
          event?.senderID || message?.senderID || message?.author || null;
      }
      if (!targetUID) {
        return safeReply(
          "❌ লক্ষ্য ব্যবহারকারী সনাক্ত করা যায়নি। রিপ্লাই/মেনশন করে দেখুন।"
        );
      }

      // Get display name
      let name = "Unknown User";
      try {
        if (usersData && typeof usersData.getName === "function") {
          const n = await usersData.getName(targetUID);
          if (n) name = n;
        }
      } catch (e) {}
      try {
        if (
          name === "Unknown User" &&
          api &&
          typeof api.getUserInfo === "function"
        ) {
          const info = await api.getUserInfo(targetUID);
          name = info?.[targetUID]?.name || info?.name || name;
        }
      } catch (e) {}

      // -------- Avatar buffer --------
      const getAvatarBuffer = async (uid) => {
        try {
          if (usersData && typeof usersData.getAvatarUrl === "function") {
            const url = await usersData.getAvatarUrl(uid);
            if (url) {
              const res = await axios.get(url, {
                responseType: "arraybuffer",
                timeout: 10000,
              });
              return Buffer.from(res.data);
            }
          }
        } catch (e) {}
        try {
          if (api && typeof api.getUserInfo === "function") {
            const info = await api.getUserInfo(uid);
            const avatarUrl =
              info?.[uid]?.thumbSrc ||
              info?.thumbSrc ||
              info?.[uid]?.profileUrl ||
              info?.profileUrl;
            if (avatarUrl) {
              const res = await axios.get(avatarUrl, {
                responseType: "arraybuffer",
                timeout: 10000,
              });
              return Buffer.from(res.data);
            }
          }
        } catch (e) {}
        return null;
      };
      const avatarBuf = await getAvatarBuffer(targetUID);

      // -------- Canvas --------
      const W = 1000,
        H = 500;
      const canvas = createCanvas(W, H);
      const ctx = canvas.getContext("2d");

      ctx.fillStyle = "rgba(255, 100, 100, 0.15)";
      ctx.fillRect(0, 0, W, H);

      const glow = ctx.createRadialGradient(0, H * 0.5, 0, 0, H * 0.5, W);
      glow.addColorStop(0, "rgba(144,238,144,0.6)");
      glow.addColorStop(0.35, "rgba(144,238,144,0.3)");
      glow.addColorStop(0.7, "rgba(144,238,144,0.15)");
      glow.addColorStop(1, "rgba(144,238,144,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      for (let i = 0; i < 120; i++) {
        ctx.globalAlpha = Math.random() * 0.6 + 0.15;
        ctx.beginPath();
        ctx.arc(
          Math.random() * W,
          Math.random() * H,
          Math.random() * 1.3 + 0.2,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = "#cfe9ff";
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      function roundedRect(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
      }

      const cardX = 40,
        cardY = 40,
        cardW = W - 80,
        cardH = H - 80,
        rad = 22;
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.35)";
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 8;
      roundedRect(cardX, cardY, cardW, cardH, rad);
      ctx.fillStyle = "rgba(9, 20, 46, 0.75)";
      ctx.fill();
      ctx.restore();

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
          ctx.drawImage(
            img,
            avatarCX - avatarR,
            avatarCY - avatarR,
            avatarR * 2,
            avatarR * 2
          );
        } catch (e) {
          drawInitials();
        }
      } else drawInitials();
      ctx.restore();

      function drawInitials() {
        const initials =
          name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((s) => s[0]?.toUpperCase())
            .join("") || "U";
        const g = ctx.createLinearGradient(
          avatarCX - avatarR,
          avatarCY - avatarR,
          avatarCX + avatarR,
          avatarCY + avatarR
        );
        g.addColorStop(0, "#1f3b73");
        g.addColorStop(1, "#2a6f8f");
        ctx.fillStyle = g;
        ctx.fillRect(avatarCX - avatarR, avatarCY - avatarR, avatarR * 2, avatarR * 2);

        ctx.fillStyle = "#eaf7ff";
        ctx.font = `bold ${Math.round(avatarR * 0.9)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(toMathBold(initials), avatarCX, avatarCY + 2);
      }

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
      ctx.fillText(toMathBold(name), avatarCX + avatarR + 28, avatarCY + 10);
      ctx.restore();

      ctx.font = "bold 32px sans-serif";
      ctx.fillStyle = "#ff4d4d";
      ctx.save();
      ctx.shadowColor = "rgba(255,0,0,1)";
      ctx.shadowBlur = 25;
      ctx.fillText("Sir Heres your Uid", avatarCX + avatarR + 28, avatarCY + 70);
      ctx.restore();

      ctx.strokeStyle = "rgba(135,206,250,0.25)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cardX + 30, cardY + 265);
      ctx.lineTo(cardX + cardW - 30, cardY + 265);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cardX + 30, cardY + 275);
      ctx.lineTo(cardX + cardW - 30, cardY + 275);
      ctx.stroke();

      ctx.font = "bold 40px sans-serif";
      ctx.fillStyle = "#bfeaff";
      ctx.textAlign = "center";
      ctx.fillText(
        `UID: ${toMathBold(targetUID)}`,
        cardX + cardW / 2,
        cardY + cardH - 70
      );

      ctx.font = "16px sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillText(
        "By EDEN",
        cardX + cardW / 2,
        cardY + cardH - 36
      );

      const cacheDir = path.join(__dirname, "cache");
      fs.mkdirSync(cacheDir, { recursive: true });
      const outPath = path.join(cacheDir, `uidc_${Date.now()}.png`);
      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(outPath, buffer);

      try {
        message.reply(
          {
            body: `👤 ${toMathBold(name)}\n🆔 UID: ${toMathBold(targetUID)}`,
            attachment: fs.createReadStream(outPath),
          },
          () => fs.unlinkSync(outPath)
        );
      } catch (err) {
        console.error(err);
        message.reply("❌ Couldn't generate UID card.");
      }
    } catch (err) {
      console.error("uidc error:", err?.stack || err);
      try {
        await safeReply(
          `❌ একটি ত্রুটি ঘটেছে। লগ চেক করুন। ( ${
            err?.message || "unknown"
          } )`
        );
      } catch (e) {
        console.error(e);
      }
    }
  },
};
