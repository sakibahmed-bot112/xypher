const fs = require("fs-extra");
const { createCanvas, Image, loadImage } = require("canvas");
const path = require("path");

module.exports = {
  config: {
    name: "owner",
    version: "2.1",
    author: "Asif",
    shortDescription: "Galaxy styled owner card with colored borders and owner image.",
    longDescription: "Premium owner info image card with background stars, color borders, and bottom-right owner photo.",
    category: "ℹ️ Info",
    guide: { en: ".owner" },
    usePrefix: true
  },

  onStart: async function ({ api, event }) {
    const owner = {
      name: "𝗔𝗵𝗺𝗲𝗗'𝘇  𝗘𝘃𝗮𝗻",
      whatsapp: "0133**98714",
      botName: "✴️ 𝗔𝘂𝗿𝗮 ✴️",
      nickName: "𝗔𝘀𝗶𝗳",
      class: "𝗜𝗻𝘁𝗲𝗿 2𝗻𝗱 𝗬𝗲𝗮𝗿",
      religion: "𝗜𝘀𝗹𝗮𝗺",
      relationship: "𝗦𝗶𝗻𝗴𝗹𝗲",
      address: "𝗡𝗲𝘁𝗿𝗮𝗸𝗼𝗻𝗮"
    };

    const width = 800, height = 500;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // 🌌 Background
    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, "#000000");
    bg.addColorStop(0.5, "#1a1a40");
    bg.addColorStop(1, "#3f0d63");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // ✨ Stars
    for (let i = 0; i < 120; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const r = Math.random() * 1.2;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.fill();
    }

    // 🏷️ Heading
    const headingText = "⭐ BOT OWNER INFO ⭐";
    ctx.font = "bold 42px Sans-serif";
    ctx.textAlign = "center";
    const textX = width / 2;
    const textY = 80;
    const metrics = ctx.measureText(headingText);
    const boxWidth = metrics.width + 30;
    const boxHeight = 60;
    const boxX = textX - boxWidth / 2;
    const boxY = textY - boxHeight + 15;

    const grad = ctx.createLinearGradient(boxX, boxY, boxX + boxWidth, boxY);
    grad.addColorStop(0, "#FF0000");
    grad.addColorStop(0.33, "#800080");
    grad.addColorStop(0.66, "#0000FF");
    grad.addColorStop(1, "#FFFF00");

    ctx.lineWidth = 4;
    ctx.strokeStyle = grad;
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.rect(boxX, boxY, boxWidth, boxHeight);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.fillText(headingText, textX, textY);

    // 📋 Info block
    ctx.textAlign = "left";
    const lines = [
      { label: "👤 Owner:", value: owner.name },
      { label: "📱 WhatsApp:", value: owner.whatsapp },
      { label: "🤖 Bot Name:", value: owner.botName },
      { label: "📝 Nickname:", value: owner.nickName },
      { label: "🏫 Class:", value: owner.class },
      { label: "🕋 Religion:", value: owner.religion },
      { label: "❤️ Relation:", value: owner.relationship },
      { label: "🏠 Address:", value: owner.address }
    ];

    const startX = 100;
    const startY = 200;
    const lineHeight = 45;
    const labelMaxWidth = 200;

    lines.forEach((item, i) => {
      const y = startY + i * lineHeight;
      ctx.font = "bold 24px Sans-serif";
      ctx.fillStyle = "#ffeb66";
      ctx.fillText(item.label, startX, y);

      ctx.font = "italic 25px Sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(item.value, startX + labelMaxWidth, y);
    });

    // ✨ Glow Gradient Border (All around)
    const borderWidth = 8;
    ctx.save();
    const frameGrad = ctx.createLinearGradient(0, 0, width, height);
    frameGrad.addColorStop(0, "#ff0066");
    frameGrad.addColorStop(0.33, "#9933ff");
    frameGrad.addColorStop(0.66, "#00ccff");
    frameGrad.addColorStop(1, "#ffff66");

    ctx.lineWidth = borderWidth;
    ctx.strokeStyle = frameGrad;
    ctx.shadowColor = "#ff66cc"; // glow color
    ctx.shadowBlur = 25;

    ctx.strokeRect(borderWidth / 2, borderWidth / 2, width - borderWidth, height - borderWidth);
    ctx.restore();

    // 🖼️ Owner Photo
    try {
      const photoPath = path.join(__dirname, "owner_photo.jpg");
      let img;

      if (await fs.pathExists(photoPath)) {
        const imgBuffer = await fs.readFile(photoPath);
        img = new Image();
        img.src = imgBuffer;
      } else {
        img = await loadImage("https://files.catbox.moe/aiy3ta.jpg");
      }

      const photoW = 140, photoH = 140;
      const marginRight = 40, marginBottom = 50;
      const x = width - photoW - marginRight;
      const y = height - photoH - marginBottom;
      const radius = 18;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + photoW - radius, y);
      ctx.quadraticCurveTo(x + photoW, y, x + photoW, y + radius);
      ctx.lineTo(x + photoW, y + photoH - radius);
      ctx.quadraticCurveTo(x + photoW, y + photoH, x + photoW - radius, y + photoH);
      ctx.lineTo(x + radius, y + photoH);
      ctx.quadraticCurveTo(x, y + photoH, x, y + photoH - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();

      ctx.shadowColor = "rgba(255, 0, 204, 0.8)";
      ctx.shadowBlur = 15;

      const frameGrad = ctx.createLinearGradient(x, y, x + photoW, y + photoH);
      frameGrad.addColorStop(0, "#ff0066");
      frameGrad.addColorStop(0.5, "#9933ff");
      frameGrad.addColorStop(1, "#00ccff");
      ctx.strokeStyle = frameGrad;
      ctx.lineWidth = 8;
      ctx.stroke();

      ctx.shadowColor = "transparent";
      ctx.clip();
      ctx.drawImage(img, x, y, photoW, photoH);
      ctx.restore();

      const nameY = y + photoH + 28;
      ctx.font = "bold 20px Sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.fillText(owner.name, x + photoW / 2, nameY);
    } catch (e) {
      console.error("❌ Owner photo load failed:", e.message);
    }

    // 📤 Save and Send
    const outPath = path.join(__dirname, "cache", "owner_card.png");
    await fs.ensureDir(path.dirname(outPath));
    await fs.writeFile(outPath, canvas.toBuffer("image/png"));

    api.sendMessage({
      body: "",
      attachment: fs.createReadStream(outPath)
    }, event.threadID, (err, info) => {
      fs.unlinkSync(outPath); // Clean after send

      // ⏳ Delete after 20s
      setTimeout(() => {
        api.unsendMessage(info.messageID);
      }, 20000);
    }, event.messageID);
  }
};
