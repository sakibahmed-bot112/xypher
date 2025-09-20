const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "balance",
    aliases: ["bal"],
    version: "1.9",
    author: "asif",
    countDown: 5,
    role: 0,
    shortDescription: "Show balance card / Transfer money",
    category: "bank",
    guide: "{pn}\n{pn} transfer <uid|@mention> <amount>\n{pn} (as reply to a user)"
  },

  onStart: async function ({ api, event, args, usersData }) {
    try {
      let userID = event.senderID.toString();

      // === If message is a reply ===
      if (event.type === "message_reply" && !args[0]) {
        userID = event.messageReply.senderID.toString();
      }

      const userInfo = (usersData && (await usersData.get(userID))) || {};
      const userName = userInfo.name || "Unknown User";

      // === Balance Transfer Feature ===
      if (args[0] && args[0].toLowerCase() === "transfer") {
        if (args.length < 2) {
          return api.sendMessage(
            `⚠️ Usage: ${this.config.name} transfer <uid|@mention> <amount>`,
            event.threadID,
            event.messageID
          );
        }

        let receiverID = null;
        let receiverName = null;

        if (event.mentions && Object.keys(event.mentions).length > 0) {
          receiverID = Object.keys(event.mentions)[0];
          receiverName = event.mentions[receiverID] || null;
        } else if (args[1]) {
          const possibleId = String(args[1]).replace(/[^0-9]/g, "");
          if (possibleId) receiverID = possibleId;
        }

        let amountArgIndex = 2;
        if (event.mentions && Object.keys(event.mentions).length > 0) {
          let foundAmount = null;
          for (let i = 1; i < args.length; i++) {
            if (/^\d+$/.test(args[i])) {
              foundAmount = args[i];
              break;
            }
          }
          if (foundAmount) {
            amountArgIndex = args.indexOf(foundAmount);
          } else {
            amountArgIndex = 1;
          }
        }

        const amount = parseInt(args[amountArgIndex]);

        if (!receiverID) {
          return api.sendMessage("❌ Receiver not found. Provide UID or mention someone.", event.threadID, event.messageID);
        }

        if (isNaN(amount) || amount <= 0) {
          return api.sendMessage("❌ Invalid amount.", event.threadID, event.messageID);
        }

        const senderBalance = (await usersData.get(event.senderID, "money")) || 0;
        if (senderBalance < amount) {
          return api.sendMessage("💸 Insufficient balance.", event.threadID, event.messageID);
        }

        const receiverInfo = (await usersData.get(receiverID)) || {};
        receiverName = receiverName || receiverInfo.name || "Unknown User";

        await usersData.set(event.senderID, { money: senderBalance - amount });
        const receiverBalance = (await usersData.get(receiverID, "money")) || 0;
        await usersData.set(receiverID, { money: receiverBalance + amount });

        const mentionData = [
          {
            id: receiverID,
            tag: receiverName
          }
        ];

        return api.sendMessage(
          {
            body: `✅ ${userName} sent balance  $${amount} to ${receiverName} \n📉 New Balance: $${senderBalance - amount}`,
            mentions: mentionData
          },
          event.threadID,
          event.messageID
        );
      }

      // === Balance Card Section ===
      let balance = (await usersData.get(userID, "money")) || 0;

      function formatBalance(num) {
        const units = ["", "k", "m", "b", "t", "q", "Q", "s", "S", "o", "n", "d"];
        let i = 0;
        while (num >= 1000 && i < units.length - 1) {
          num /= 1000;
          i++;
        }
        return num.toFixed(2) + units[i];
      }

      const width = 1400;
      const height = 760;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      function roundedRectPath(ctx, x, y, w, h, r) {
        const rr = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + rr, y);
        ctx.arcTo(x + w, y, x + w, y + h, rr);
        ctx.arcTo(x + w, y + h, x, y + h, rr);
        ctx.arcTo(x, y + h, x, y, rr);
        ctx.arcTo(x, y, x + w, y, rr);
        ctx.closePath();
      }

      // background
      const g = ctx.createLinearGradient(0, 0, 0, height);
      g.addColorStop(0, "#0b1338");
      g.addColorStop(1, "#081033");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);

      ctx.lineWidth = 8;
      ctx.strokeStyle = "#ffd400";
      ctx.lineJoin = "round";
      roundedRectPath(ctx, 12, 12, width - 24, height - 24, 22);
      ctx.stroke();

      ctx.save();
      roundedRectPath(ctx, 28, 28, width - 56, 120, 18);
      ctx.clip();
      const hdrGrad = ctx.createLinearGradient(0, 28, 0, 148);
      hdrGrad.addColorStop(0, "rgba(40,35,35,0.46)");
      hdrGrad.addColorStop(1, "rgba(30,28,28,0.18)");
      ctx.fillStyle = hdrGrad;
      ctx.fillRect(28, 28, width - 56, 120);
      ctx.restore();

      ctx.fillStyle = "#ffd400";
      ctx.font = "bold 56px Sans";
      ctx.textBaseline = "middle";
      ctx.fillText("USER BALANCE INFO", 60, 80);

      const badgeX = width - 420;
      const badgeY = 40;
      const badgeW = 360;
      const badgeH = 80;
      ctx.save();
      ctx.shadowColor = "#00faff";
      ctx.shadowBlur = 28;
      roundedRectPath(ctx, badgeX, badgeY, badgeW, badgeH, 8);
      ctx.fillStyle = "#00faff";
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = "#002428";
      ctx.font = "700 29px Sans";
      ctx.textBaseline = "middle";
      ctx.fillText("DIAMOND MEMBER", badgeX + 20, badgeY + badgeH / 2 + 2);

      const avatarCenterX = 160;
      const avatarCenterY = 280;
      const avatarRadius = 110;
      try {
        const avatarURL = `https://graph.facebook.com/${userID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        const avatarImg = await loadImage(avatarURL);
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(
          avatarImg,
          avatarCenterX - avatarRadius,
          avatarCenterY - avatarRadius,
          avatarRadius * 2,
          avatarRadius * 2
        );
        ctx.restore();
      } catch (e) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
        ctx.fillStyle = "#2a2a2a";
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = "#fff";
        ctx.font = "bold 48px Sans";
        ctx.textBaseline = "middle";
        const initials = userName
          .split(" ")
          .map((s) => s[0])
          .slice(0, 2)
          .join("")
          .toUpperCase() || "?";
        ctx.fillText(
          initials,
          avatarCenterX - ctx.measureText(initials).width / 2,
          avatarCenterY
        );
      }

      ctx.beginPath();
      ctx.arc(avatarCenterX, avatarCenterY, avatarRadius + 6, 0, Math.PI * 2);
      ctx.lineWidth = 8;
      ctx.strokeStyle = "#ffd400";
      ctx.stroke();

      const nameX = 330;
      const nameY = 230;
      ctx.fillStyle = "#ffffff";
      ctx.font = "700 48px Sans";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(userName, nameX, nameY);

      ctx.font = "30px Sans";
      ctx.fillStyle = "#bdbdbd";
      ctx.fillText(`ID: ${userID}`, nameX, nameY + 48);

      ctx.font = "38px Sans";
      ctx.fillStyle = "#e8e8e8";
      const cardLast4 = userID.slice(-4);
      const maskedCard = "•••• •••• •••• " + (cardLast4 || "0000");
      ctx.fillText(maskedCard, nameX, nameY + 104);

      const now = new Date();
      const expMonth = String(now.getMonth() + 1).padStart(2, "0");
      const expYear = String((now.getFullYear() + 3) % 100).padStart(2, "0");
      const validThru = `  : ${expMonth}/${expYear}`;

      ctx.font = "26px Sans";
      ctx.fillStyle = "#cfcfcf";
      ctx.fillText("VALID THRU", nameX, nameY + 162);
      ctx.font = "30px Sans";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(validThru, nameX + 150, nameY + 162);

      const chipX = width - 220;
      const chipY = 230;
      ctx.fillStyle = "#ffd54f";
      roundedRectPath(ctx, chipX, chipY, 80, 60, 8);
      ctx.fill();

      ctx.lineWidth = 4;
      ctx.strokeStyle = "#00ff88";
      ctx.beginPath();
      ctx.arc(chipX + 110, chipY + 30, 10, -1.1, 1.1);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(chipX + 110, chipY + 30, 18, -1.1, 1.1);
      ctx.stroke();

      const balBoxX = 60;
      const balBoxY = 490;
      const balBoxW = width - 120;
      const balBoxH = 130;
      ctx.save();
      ctx.shadowColor = "#000";
      ctx.shadowBlur = 18;
      ctx.globalAlpha = 0.85;
      roundedRectPath(ctx, balBoxX, balBoxY, balBoxW, balBoxH, 18);
      ctx.fillStyle = "rgba(18,18,25,0.45)";
      ctx.fill();
      ctx.restore();

      const labelX = balBoxX + 30;
      const labelY = balBoxY + 30;
      ctx.font = "bold 30px Sans";
      ctx.fillStyle = "#bdbdbd";
      ctx.fillText("AVAILABLE BALANCE", labelX, labelY);

      const amountX = labelX;
      const amountY = balBoxY + 110;
      ctx.font = "bold 72px Sans";
      ctx.textBaseline = "alphabetic";
      ctx.save();
      ctx.shadowColor = "#00ff88";
      ctx.shadowBlur = 36;
      ctx.fillStyle = "#14ff8a";
      const amtText = `$${formatBalance(balance)}`;
      ctx.fillText(amtText, amountX, amountY);
      ctx.restore();

      const footerH = 54;
      ctx.fillStyle = "#00ff88";
      ctx.fillRect(28, height - footerH - 28, width - 56, footerH);

      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = "22px Sans";
      const footerText = "Elon Bank • Secure Digital Banking • 24/7 Support";
      const footerWidth = ctx.measureText(footerText).width;
      ctx.fillText(footerText, (width - footerWidth) / 2, height - footerH / 2 - 18);

      const outPath = path.join(__dirname, `balance_${userID}.png`);
      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(outPath, buffer);

      api.sendMessage(
        {
          body: `💳 USER BALANCE INFO\n\n👤 Name:   ${userName}\n🆔 UID:   ${userID}\n💰 Balance:   $${formatBalance(balance)}\n📅 Valid Thru:   ${expMonth}/${expYear}\n\n🏦 Personal Bank`,
          attachment: fs.createReadStream(outPath)
        },
        event.threadID,
        () => {
          try {
            fs.unlinkSync(outPath);
          } catch (e) {}
        },
        event.messageID
      );
    } catch (err) {
      console.error(err);
      api.sendMessage("Error while generating balance card.", event.threadID);
    }
  }
};
