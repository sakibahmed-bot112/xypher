const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "uid3",
    version: "2.5-final",
    author: "Asif",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Stylish UID card with photo" },
    category: "info",
    guide: {
      en: "{p}uid → your UID\n{p}uid @tag → tagged UID\n{p}uid (reply) → replied UID"
    }
  },

  onStart: async function ({ event, message, api }) {
    try {
      /* ---------- UID & Name ---------- */
      const uid = event.messageReply
        ? event.messageReply.senderID
        : Object.keys(event.mentions)[0] || event.senderID;

      let name = "Unknown User";
      try {
        const info = await api.getUserInfo(uid);
        if (info && info[uid] && info[uid].name) name = info[uid].name;
      } catch (e) {
        console.error("Name fetch error:", e);
      }

      /* ---------- Avatar ---------- */
      const avatarURL = `https://graph.facebook.com/${uid}/picture?height=512&width=512&access_token=350685531728|62f8ce9f74b12f84c123cc23437a4a32`;
      const avatarRes = await axios.get(avatarURL, { responseType: "arraybuffer" });
      const avatarImg = await loadImage(avatarRes.data);

      /* ---------- Canvas ---------- */
      const W = 700, H = 250;
      const canvas = createCanvas(W, H);
      const ctx = canvas.getContext("2d");

      /* --- Background gradient --- */
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, "#0f0c29"); g.addColorStop(0.5, "#302b63"); g.addColorStop(1, "#24243e");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

      /* --- Diagonal lines --- */
      ctx.strokeStyle = "rgba(255,255,255,0.1)"; ctx.lineWidth = 1;
      for (let i = -200; i < W; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 300, 300); ctx.stroke(); }

      /* --- Avatar + multicolor ring --- */
      const A = { size:130, x:50, y:60 }, centerX = A.x + A.size/2, centerY = A.y + A.size/2, radius = A.size/2 + 6;
      ctx.lineWidth = 8; ctx.shadowBlur = 20;
      const segs = [
        [0, Math.PI/2, "#ff0000"], [Math.PI/2, Math.PI, "#0066ff"],
        [Math.PI, 3*Math.PI/2, "#ffd700"], [3*Math.PI/2, 2*Math.PI, "#b401ff"]
      ];
      for (const [s,e,c] of segs) { ctx.beginPath(); ctx.strokeStyle = c; ctx.shadowColor = c; ctx.arc(centerX, centerY, radius, s, e); ctx.stroke(); }

      ctx.save();
      ctx.beginPath(); ctx.arc(centerX, centerY, A.size/2, 0, Math.PI*2); ctx.clip();
      ctx.drawImage(avatarImg, A.x, A.y, A.size, A.size); ctx.restore();

      /* --- Username (extra-bold & bigger font) --- */
      const nameX = 230, nameY = 120;
      ctx.font = "900 42px Arial";  // একটু মোটা ও বড়
      ctx.fillStyle="#00ffff"; ctx.shadowColor="#00ffff"; ctx.shadowBlur=6;
      ctx.fillText(name, nameX, nameY);
      ctx.lineWidth=3; ctx.strokeStyle="#0066ff"; ctx.shadowBlur=0; ctx.strokeText(name, nameX, nameY);

      /* --- UID --- */
      ctx.font = "bold 28px Arial";
      ctx.fillStyle="#ff00ff"; ctx.shadowColor="#ff00ff"; ctx.shadowBlur=12;
      ctx.fillText(`UID: ${uid}`, 210, 170);

      /* ---------- Asia/Dhaka timestamp ---------- */
      const dhakaTime = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Dhaka",
        year: "numeric", month: "short", day: "2-digit",
        hour: "2-digit", minute: "2-digit"
      }).format(new Date());

      ctx.font = "500 16px Arial";
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      const txtW = ctx.measureText(dhakaTime).width;
      ctx.fillText(dhakaTime, W - txtW - 20, H - 20);

      /* ---------- Save & send ---------- */
      const tmpPath = path.join(__dirname, "tmp", `uid_card_${uid}.png`);
      await fs.ensureDir(path.dirname(tmpPath));
      fs.writeFileSync(tmpPath, canvas.toBuffer("image/png"));

      return message.reply(
        { body: `🪪 ${name}'s UID: ${uid}`, attachment: fs.createReadStream(tmpPath) },
        () => fs.unlinkSync(tmpPath)
      );

    } catch (err) {
      console.error("❌ UID Command Error:", err);
      return message.reply("❌ An error occurred while generating the UID card.");
    }
  }
};
