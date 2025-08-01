const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas"); 
const axios = require("axios");
const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "welcome",
    version: "2.0",
    author: "𝐄𝐰'𝐫 𝐒𝐚𝐢𝐦 edit by asif",
    category: "events"
  },

  onStart: async function ({ event, api }) {
    if (event.logMessageType !== "log:subscribe") return;

    const { threadID, logMessageData } = event;
    const newUsers = logMessageData.addedParticipants;
    const botID = api.getCurrentUserID();

    if (newUsers.some(user => user.userFbId === botID)) return;

    const threadInfo = await api.getThreadInfo(threadID);
    const groupName = threadInfo.threadName;
    const memberCount = threadInfo.participantIDs.length;

    for (const user of newUsers) {
      const userId = user.userFbId;
      const fullName = user.fullName;

      const tmpDir = path.join(__dirname, "cache");
      fs.ensureDirSync(tmpDir);

      const avatarURL = `https://graph.facebook.com/${userId}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const avatarPath = path.join(tmpDir, `avt_${userId}.png`);
      const outputPath = path.join(tmpDir, `welcome_card_${userId}.png`);

      try {
        // Download avatar
        const res = await axios.get(avatarURL, { responseType: "arraybuffer" });
        fs.writeFileSync(avatarPath, Buffer.from(res.data, "utf-8"));

        const avatar = await loadImage(avatarPath);
        const W = 983, H = 480;
        const canvas = createCanvas(W, H);
        const ctx = canvas.getContext("2d");

        // Load background
        const bgUrl = "https://files.catbox.moe/zfrfb1.jpg";
        const bgRes = await axios.get(bgUrl, { responseType: "arraybuffer" });
        const bgImage = await loadImage(Buffer.from(bgRes.data, "binary"));
        ctx.drawImage(bgImage, 0, 0, W, H);

        // Draw white glowing ring around avatar
        const avatarSize = 190;
        const ax = (W - avatarSize) / 2;
        const ay = 40;
        const r = avatarSize / 2;

        ctx.beginPath();
        ctx.arc(ax + r, ay + r, r + 6, 0, Math.PI * 2);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 9.3;
        ctx.shadowColor = "#ffffff";
        ctx.shadowBlur = 400;
        ctx.stroke();

        // Draw avatar image
        ctx.save();
        ctx.beginPath();
        ctx.arc(ax + r, ay + r, r, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avatar, ax, ay, avatarSize, avatarSize);
        ctx.restore();

        // Draw text
        ctx.textAlign = "center";

        ctx.font = "bold 42px Arial";
        ctx.fillStyle = "#00e6ff";
        ctx.shadowColor = "#00ffff";
        ctx.shadowBlur = 100;
        ctx.fillText(`𝐇𝐞𝐥𝐥𝐨 ${fullName}`, W / 2, 280);

        ctx.font = "bold 34px Arial";
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "#ffffff";
        ctx.shadowBlur = 100;
        ctx.fillText(`𝐖𝐞𝐥𝐜𝐨𝐦𝐞 𝐭𝐨 ${groupName}`, W / 2, 330);

        ctx.font = "30px Arial";
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "#eeeeee";
        ctx.shadowBlur = 70;
        ctx.fillText(`𝐘𝐨𝐮'𝐫𝐞 𝐭𝐡𝐞 ${memberCount} 𝐦𝐞𝐦𝐛𝐞𝐫 𝐨𝐧 𝐭𝐡𝐢𝐬 𝐠𝐫𝐨𝐮𝐩.`, W / 2, 375);

        ctx.font = "28px monospace";
        ctx.fillStyle = "#eeeeee";
        ctx.shadowBlur = 8;
        ctx.fillText("━━━━━━━━━━━━━━━━", W / 2, 415);

        const timeStr = moment().tz("Asia/Dhaka").format("[📅] hh:mm:ss A - DD/MM/YYYY - dddd");
        ctx.font = "25px Arial";
        ctx.fillStyle = "#dddddd";
        ctx.shadowColor = "#999999";
        ctx.shadowBlur = 400;
        ctx.fillText(timeStr, W / 2, 455);

        // Save final image
        fs.writeFileSync(outputPath, canvas.toBuffer("image/png"));

        // Send welcome message
        const messageText = `- 𝐇𝐞𝐥𝐥𝐨 ${fullName}\n- 𝐖𝐞𝐥𝐜𝐨𝐦𝐞 𝐭𝐨 ${groupName}\n- 𝐘𝐨𝐮'𝐫𝐞 𝐭𝐡𝐞 ${memberCount} 𝐦𝐞𝐦𝐛𝐞𝐫 𝐨𝐧 𝐭𝐡𝐢𝐬 𝐠𝐫𝐨𝐮𝐩, 𝐩𝐥𝐞𝐚𝐬𝐞 𝐞𝐧𝐣𝐨𝐲..! 🎀\n━━━━━━━━━━━━━━━━\n${timeStr}`;

        await api.sendMessage({
          body: messageText,
          attachment: fs.createReadStream(outputPath),
          mentions: [{ tag: fullName, id: userId }]
        }, threadID);

        fs.unlinkSync(avatarPath);
        setTimeout(() => fs.unlink(outputPath).catch(() => { }), 60000);

      } catch (err) {
        console.error("⚠️ Error generating welcome image:", err);
      }
    }
  }
};
