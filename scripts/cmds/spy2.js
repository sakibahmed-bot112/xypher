const fs = require("fs-extra");
const path = require("path");
const Canvas = require("canvas");
const moment = require("moment");
const GIFEncoder = require("gifencoder");

module.exports = {
  config: {
    name: "spy2",
    version: "11.6",
    author: " 𝐀𝐒𝐈𝐅  ✈︎  🎀",
    countDown: 3,
    role: 0,
    shortDescription: { en: "Show animated rank card" },
    longDescription: { en: "Starry night style animated rank card with glowing multi-color border" },
    category: "profile",
    guide: { en: "{pn}" }
  },

  onStart: async function ({ api, event }) {
    const uid = event.senderID;
    const info = (await api.getUserInfo(uid))[uid] || {};
    const name = info.name || "Unknown";
    const gender = info.gender === 2 ? "Boy ♂️" : "Girl ♀️";
    const username = `user.${uid.slice(-4)}`;
    const exp = 97, maxExp = 170;
    const level = 34, rank = 22;
    const money = 990779, moneyRank = 27;
    const now = moment().format("YYYY-MM-DD hh:mm A");

    const W = 1200, H = 600;
    const FRAMES = 3;    // কম ফ্রেম
    const FPS = 30;      // বেশি FPS, দ্রুত গিফ তৈরি হবে

    const tmp = path.join(__dirname, `rank-${uid}.gif`);
    const enc = new GIFEncoder(W, H);
    enc.start();
    enc.setRepeat(0);
    enc.setDelay(1000 / FPS);
    enc.setQuality(10);  // কোয়ালিটি কমিয়ে দ্রুততা বাড়ানো হয়েছে

    let avatar = null;
    try {
      avatar = await Canvas.loadImage(`https://graph.facebook.com/${uid}/picture?height=512&width=512&access_token=350685531728|62f8ce9f74b12f84c123cc23437a4a32`);
    } catch {}

    for (let f = 0; f < FRAMES; f++) {
      const cv = Canvas.createCanvas(W, H);
      const ctx = cv.getContext("2d");

      // BG Gradient with purple shades
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#2e0854");   // Dark purple top
      bg.addColorStop(0.4, "#5a0e82"); // Medium purple mid
      bg.addColorStop(0.7, "#22035c"); // Original purple-ish
      bg.addColorStop(1, "#1a1a70");   // Deep blue bottom
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Stars - কমিয়ে ৪০ করে দিলাম
      for (let i = 0; i < 40; i++) {
        const x = Math.random() * W;
        const y = Math.random() * H;
        const r = Math.random() * 1.5 + 0.3;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.8 + 0.2})`;
        ctx.fill();
      }

      // 🔲 Animated Glowing Border
      const phase = f / FRAMES;
      const borderGrad = ctx.createLinearGradient(0, 0, W, H);
      borderGrad.addColorStop(0,   `hsl(${(phase + 0) * 360}, 100%, 60%)`);
      borderGrad.addColorStop(0.33,`hsl(${(phase + 0.33) * 360}, 100%, 60%)`);
      borderGrad.addColorStop(0.66,`hsl(${(phase + 0.66) * 360}, 100%, 60%)`);
      borderGrad.addColorStop(1,   `hsl(${(phase + 1) * 360}, 100%, 60%)`);
      ctx.strokeStyle = borderGrad;
      ctx.lineWidth = 18;
      ctx.strokeRect(0, 0, W, H);

      // 🔵 Animated Profile Ring
      const cX = W / 2, cY = 160;
      ctx.strokeStyle = `hsl(${(f / FRAMES) * 360},100%,65%)`;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(cX, cY, 110, 0, Math.PI * 2);
      ctx.stroke();

      // 🖼 Avatar
      ctx.save();
      ctx.beginPath();
      ctx.arc(cX, cY, 100, 0, Math.PI * 2);
      ctx.clip();
      if (avatar) ctx.drawImage(avatar, cX - 100, 60, 200, 200);
      else {
        ctx.fillStyle = "#333";
        ctx.fill();
      }
      ctx.restore();

      // 📝 Name - বড় ও পরিষ্কার
      ctx.font = "bold 48px Sans";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.fillText(name, cX, 320);

      // 📊 Info Left - বড় ও সুন্দর হালকা নীল
      ctx.font = "30px Sans";
      ctx.fillStyle = "#aaccff";
      ctx.textAlign = "left";
      let y = 380, gap = 46;
      ctx.fillText(`UID: ${uid}`, 80, y);       y += gap;
      ctx.fillText(`Nickname: ${name}`, 80, y); y += gap;
      ctx.fillText(`Gender: ${gender}`, 80, y); y += gap;
      ctx.fillText(`Username: ${username}`, 80, y); y += gap;
      ctx.fillText(`Level: ${level}`, 80, y);

      // 📊 Info Right - বড় ও গোল্ডেন
      ctx.textAlign = "right";
      y = 380;
      const rX = W - 80;
      ctx.fillStyle = "#ffd280";
      ctx.fillText(`EXP: ${exp} / ${maxExp}`, rX, y); y += gap;
      ctx.fillText(`Rank: #${rank}`,           rX, y); y += gap;
      ctx.fillText(`Money: ${money}`,          rX, y); y += gap;
      ctx.fillText(`Money Rank: #${moneyRank}`,rX, y); y += gap;

      // 📅 Time - বড় ও নরম নীল
      ctx.font = "24px Sans";
      ctx.fillStyle = "#99ccff";
      ctx.textAlign = "center";
      ctx.fillText(`Updated: ${now}`, cX, H - 30);

      enc.addFrame(ctx);
    }

    enc.finish();
    fs.writeFileSync(tmp, enc.out.getData());

    api.sendMessage({
      body: "𝐘𝐨𝐮𝐫 𝐬𝐩𝐲 𝐜𝐚𝐫𝐝 🎀",
      attachment: fs.createReadStream(tmp)
    }, event.threadID, () => fs.unlinkSync(tmp));
  }
};
