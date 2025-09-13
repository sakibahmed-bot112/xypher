const { createCanvas, loadImage, registerFont } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "welcome",
    version: "2.0",
    author: "Ew'r Saim",
    category: "events"
  },

  onStart: async function ({ api, event }) {
    if (event.logMessageType !== "log:subscribe") return;

    const { threadID, logMessageData, senderID } = event;
    const newUsers = logMessageData.addedParticipants;
    const botID = api.getCurrentUserID();

    if (newUsers.some(u => u.userFbId === botID)) return;

    const threadInfo = await api.getThreadInfo(threadID);
    const groupName = threadInfo.threadName;
    const memberCount = threadInfo.participantIDs.length;

    for (const user of newUsers) {
      const userId = user.userFbId;
      const fullName = user.fullName;

      const FONT_NAME = "ModernNoirBold";
      const FONT_URL = "https://github.com/Saim12678/Saim/blob/693ceed2f392ac4fe6f98f77b22344f6fc5ac9f8/fonts/tt-modernoir-trial.bold.ttf?raw=true";

      const TEXT_STYLES = {
        name: { fontSize: 64, y: 345 },
        group: { fontSize: 42, y: 400 },
        member: { fontSize: 38, y: 447 }
      };

      const avatarSize = 240;

      const backgrounds = [
        "https://files.catbox.moe/cj68oa.jpg",
        "https://files.catbox.moe/0n8mmb.jpg",
        "https://files.catbox.moe/hvynlb.jpg",
        "https://files.catbox.moe/leyeuq.jpg",
        "https://files.catbox.moe/7ufcfb.jpg",
        "https://files.catbox.moe/y78bmv.jpg"
      ];
      const bgUrl = backgrounds[Math.floor(Math.random() * backgrounds.length)];

      const tmp = path.join(__dirname, "..", "cache");
      await fs.ensureDir(tmp);

      const avatarPath = path.join(tmp, `avt_${userId}.png`);
      const bgPath = path.join(tmp, "bg.jpg");
      const outputPath = path.join(tmp, `welcome_${userId}.png`);
      const fontPath = path.join(tmp, `${FONT_NAME}.ttf`);

      try {
        if (!fs.existsSync(fontPath)) {
          const fontRes = await axios.get(FONT_URL, { responseType: "arraybuffer" });
          fs.writeFileSync(fontPath, fontRes.data);
        }
        registerFont(fontPath, { family: FONT_NAME });

        const avatarRes = await axios.get(
          `https://graph.facebook.com/${userId}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
          { responseType: "arraybuffer" }
        );
        fs.writeFileSync(avatarPath, avatarRes.data);

        const bgRes = await axios.get(bgUrl, { responseType: "arraybuffer" });
        fs.writeFileSync(bgPath, bgRes.data);

        const avatar = await loadImage(avatarPath);
        const bg = await loadImage(bgPath);

        const W = 983, H = 480;
        const canvas = createCanvas(W, H);
        const ctx = canvas.getContext("2d");

        ctx.drawImage(bg, 0, 0, W, H);

        const ax = (W - avatarSize) / 2;
        const ay = 30;

        ctx.beginPath();
        ctx.arc(W / 2, ay + avatarSize / 2, avatarSize / 2 + 6, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();

        ctx.save();
        ctx.beginPath();
        ctx.arc(W / 2, ay + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avatar, ax, ay, avatarSize, avatarSize);
        ctx.restore();

        function draw3DText(ctx, text, x, y, fontSize) {
          ctx.font = `${fontSize}px ${FONT_NAME}`;
          ctx.textAlign = "center";
          const offsets = [[4, 4], [3.5, 3.5], [3, 3], [2.5, 2.5], [2, 2], [1.5, 1.5], [1, 1]];
          ctx.fillStyle = "#000000";
          for (let [dx, dy] of offsets) ctx.fillText(text, x + dx, y + dy);
          ctx.fillStyle = "#ffffff";
          ctx.fillText(text, x, y);
        }

        draw3DText(ctx, `{ ${fullName} }`, W / 2, TEXT_STYLES.name.y, TEXT_STYLES.name.fontSize);
        draw3DText(ctx, groupName, W / 2, TEXT_STYLES.group.y, TEXT_STYLES.group.fontSize);
        draw3DText(ctx, `You're the ${memberCount} member on this group`, W / 2, TEXT_STYLES.member.y, TEXT_STYLES.member.fontSize);

        const buffer = canvas.toBuffer("image/png");
        fs.writeFileSync(outputPath, buffer);

        const timeStr = new Date().toLocaleString("en-BD", {
          timeZone: "Asia/Dhaka",
          hour: "2-digit", minute: "2-digit", second: "2-digit",
          weekday: "long", year: "numeric", month: "2-digit", day: "2-digit",
          hour12: true,
        });

        await api.sendMessage({
          body:
            `‎𝐇𝐞𝐥𝐥𝐨 ${fullName}\n` +
            `𝐖𝐞𝐥𝐜𝐨𝐦𝐞 𝐭𝐨 ${groupName}\n` +
            `𝐘𝐨𝐮'𝐫𝐞 𝐭𝐡𝐞 ${memberCount} 𝐦𝐞𝐦𝐛𝐞𝐫 𝐨𝐧 𝐭𝐡𝐢𝐬 𝐠𝐫𝐨𝐮𝐩, 𝐩𝐥𝐞𝐚𝐬𝐞 𝐞𝐧𝐣𝐨𝐲 🎉\n` +
            `━━━━━━━━━━━━━━━━\n` +
            `📅 ${timeStr}`,
          attachment: fs.createReadStream(outputPath),
          mentions: [{ tag: fullName, id: userId }]
        }, threadID);

        fs.unlinkSync(avatarPath);
        fs.unlinkSync(bgPath);
        fs.unlinkSync(outputPath);
      } catch (err) {
        console.error("❌ Error generating welcome image:", err);
      }
    }
  }
};
