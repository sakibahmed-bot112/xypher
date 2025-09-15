module.exports = {
  config: {
    name: "count",
    version: "2.5", // Updated version
    author: "Mahi--",
    countDown: 10,
    role: 0,
    description: {
      vi: "Xem bảng xếp hạng tin nhắn dưới dạng ảnh (từ lúc bot vào nhóm).",
      en: "View the message count leaderboard as an image (since the bot joined the group)."
    },
    category: "box chat",
    guide: {
      vi: "   {pn}: Xem thẻ hoạt động của bạn."
        + "\n   {pn} @tag: Xem thẻ hoạt động của người được tag."
        + "\n   {pn} all: Xem bảng xếp hạng của tất cả thành viên.",
      en: "   {pn}: View your activity card."
        + "\n   {pn} @tag: View the activity card of tagged users."
        + "\n   {pn} all: View the leaderboard of all members."
    },
    envConfig: {
      "ACCESS_TOKEN": "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662"
    }
  },

  langs: {
    vi: {
      invalidPage: "Số trang không hợp lệ.",
      leaderboardTitle: "BẢNG XẾP HẠNG HOẠT ĐỘNG NHÓM",
      userCardTitle: "THẺ HOẠT ĐỘNG",
      page: "Trang %1/%2",
      reply: "Phản hồi tin nhắn này kèm số trang để xem tiếp.",
      totalMessages: "Tổng Tin Nhắn",
      serverRank: "Hạng Server",
      dailyActivity: "Hoạt Động 7 Ngày Qua",
      messageBreakdown: "Phân Tích Tin Nhắn",
      busiestDay: "NGÀY BẬN RỘN NHẤT",
      text: "Văn Bản",
      sticker: "Nhãn Dán",
      media: "Tệp",
      fallbackName: "Người dùng Facebook"
    },
    en: {
      invalidPage: "Invalid page number.",
      leaderboardTitle: "GROUP ACTIVITY LEADERBOARD",
      userCardTitle: "ACTIVITY CARD",
      page: "Page %1/%2",
      reply: "Reply to this message with a page number to see more.",
      totalMessages: "Total Messages",
      serverRank: "Server Rank",
      dailyActivity: "Last 7 Days Activity",
      messageBreakdown: "Message Breakdown",
      busiestDay: "BUSIEST DAY",
      text: "Text",
      sticker: "Sticker",
      media: "Media",
      fallbackName: "Facebook User"
    }
  },

  onLoad: async function () {
    const { resolve } = require("path");
    const { existsSync, mkdirSync } = require("fs-extra");
    const { registerFont } = require("canvas");

    const assetsPath = resolve(__dirname, "assets", "count");
    if (!existsSync(assetsPath)) mkdirSync(assetsPath, { recursive: true });

    try {
      registerFont(resolve(assetsPath, "font.ttf"), { family: "BeVietnamPro" });
    } catch (e) {
      console.log("Could not load custom font for 'count' command, using sans-serif.");
    }
  },

  onChat: async function ({ event, threadsData, usersData }) {
    const { threadID, senderID } = event;
    const { resolve } = require("path");
    const { readJsonSync, writeJsonSync, ensureFileSync } = require("fs-extra");
    const moment = require("moment-timezone");

    try {
      const members = await threadsData.get(threadID, "members");
      const findMember = members.find(user => user.userID == senderID);
      if (!findMember) {
        members.push({
          userID: senderID,
          name: await usersData.getName(senderID),
          nickname: null,
          inGroup: true,
          count: 1
        });
      } else {
        findMember.count = (findMember.count || 0) + 1;
      }
      await threadsData.set(threadID, members, "members");
    } catch (err) {
      console.error("Failed to update compatible count data:", err);
    }

    const dataPath = resolve(__dirname, "cache", "count_activity.json");
    ensureFileSync(dataPath);

    let activityData = {};
    try {
      activityData = readJsonSync(dataPath);
    } catch { /* File is empty or corrupted */ }

    if (!activityData[threadID]) activityData[threadID] = {};
    if (!activityData[threadID][senderID]) {
      activityData[threadID][senderID] = {
        total: 0,
        types: { text: 0, sticker: 0, media: 0 },
        daily: {}
      };
    }

    const user = activityData[threadID][senderID];
    const today = moment().tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD");

    user.total = (user.total || 0) + 1;
    user.daily[today] = (user.daily[today] || 0) + 1;

    if (event.attachments.some(att => att.type === 'sticker')) {
      user.types.sticker = (user.types.sticker || 0) + 1;
    } else if (event.attachments.length > 0) {
      user.types.media = (user.types.media || 0) + 1;
    } else {
      user.types.text = (user.types.text || 0) + 1;
    }

    const sortedDays = Object.keys(user.daily).sort((a, b) => new Date(b) - new Date(a));
    if (sortedDays.length > 7) {
      for (let i = 7; i < sortedDays.length; i++) delete user.daily[sortedDays[i]];
    }

    writeJsonSync(dataPath, activityData, { spaces: 2 });
  },

  onStart: async function ({ args, threadsData, message, event, api, getLang, envCommands }) {
    const { Canvas, loadImage } = require("canvas");
    const { resolve } = require("path");
    const { createWriteStream, readJsonSync, ensureFileSync } = require("fs-extra");
    const axios = require("axios");
    const moment = require("moment-timezone");
    const { threadID, senderID, mentions } = event;

    const ACCESS_TOKEN = envCommands.count.ACCESS_TOKEN;

    const threadData = await threadsData.get(threadID);
    const dataPath = resolve(__dirname, "cache", "count_activity.json");
    ensureFileSync(dataPath);
    let activityData = {};
    try {
      activityData = readJsonSync(dataPath)[threadID] || {};
    } catch { /* file is empty */ }

    const usersInGroup = (await api.getThreadInfo(threadID)).participantIDs;
    let combinedData = [];

    for (const user of threadData.members) {
      if (!usersInGroup.includes(user.userID)) continue;
      const activity = activityData[user.userID] || {
        total: user.count || 0,
        types: { text: 0, sticker: 0, media: 0 },
        daily: {}
      };
      combinedData.push({
        uid: user.userID,
        name: user.name || getLang("fallbackName"),
        count: user.count || 0,
        activity
      });
    }

    combinedData.sort((a, b) => b.count - a.count);
    combinedData.forEach((user, index) => user.rank = index + 1);

    const themes = [
      { primary: '#FF4500', secondary: '#8B949E', bg: ['#090401', '#17110D'] },
      { primary: '#00FFFF', secondary: '#8B949E', bg: ['#010409', '#0D1117'] },
      { primary: '#F8F32B', secondary: '#8B949E', bg: ['#040109', '#170D11'] },
      { primary: '#FF00FF', secondary: '#8B949E', bg: ['#090109', '#110D17'] },
      { primary: '#00FF00', secondary: '#8B949E', bg: ['#010901', '#0D170D'] }
    ];
    const theme = themes[Math.floor(Math.random() * themes.length)];

    const getAvatar = async (uid, name) => {
      try {
        const url = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=${ACCESS_TOKEN}`;
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return await loadImage(response.data);
      } catch (error) {
        console.error("Failed to fetch avatar for", uid, "Falling back to placeholder.");
        const canvasTemp = new Canvas(512, 512);
        const ctxTemp = canvasTemp.getContext('2d');
        const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'];
        const bgColor = colors[parseInt(uid) % colors.length];
        ctxTemp.fillStyle = bgColor;
        ctxTemp.fillRect(0, 0, 512, 512);
        ctxTemp.fillStyle = '#FFFFFF';
        ctxTemp.font = '256px sans-serif';
        ctxTemp.textAlign = 'center';
        ctxTemp.textBaseline = 'middle';
        ctxTemp.fillText(name.charAt(0).toUpperCase(), 256, 256);
        return await loadImage(canvasTemp.toBuffer());
      }
    };

    const drawGlowingText = (ctx, text, x, y, color, size, blur = 15) => {
      ctx.font = `bold ${size}px "BeVietnamPro", "sans-serif"`;
      ctx.shadowColor = color;
      ctx.shadowBlur = blur;
      ctx.fillStyle = color;
      ctx.fillText(text, x, y);
      ctx.shadowBlur = 0;
    };

    const fitText = (ctx, text, maxWidth) => {
      let currentText = text;
      if (ctx.measureText(currentText).width > maxWidth) {
        while (ctx.measureText(currentText + '...').width > maxWidth) {
          currentText = currentText.slice(0, -1);
        }
        return currentText + '...';
      }
      return currentText;
    };

    const drawCircularAvatar = (ctx, avatar, x, y, radius) => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar, x - radius, y - radius, radius * 2, radius * 2);
      ctx.restore();
    };

    // ---------- MAIN FLOW: leaderboard or usercard ----------

    if (args[0]?.toLowerCase() === 'all') {
      const usersPerPage = 10;
      const leaderboardUsers = combinedData.filter(u => u.rank > 3);
      const totalPages = Math.ceil(leaderboardUsers.length / usersPerPage) || 1;
      let page = parseInt(args[1]) || 1;
      if (page < 1 || page > totalPages) page = 1;

      const startIndex = (page - 1) * usersPerPage;
      const pageUsers = leaderboardUsers.slice(startIndex, startIndex + usersPerPage);

      const canvas = new Canvas(1200, 1700);
      const ctx = canvas.getContext('2d');

      // ===== Space Themed Background =====
      ctx.fillStyle = "#000014";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < 400; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 1.5;
        const alpha = Math.random() * 0.8 + 0.2;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.shadowColor = `rgba(255, 255, 255, ${alpha})`;
        ctx.shadowBlur = 5;
        ctx.fill();
      }

      {
        const nebulaX = canvas.width * 0.7;
        const nebulaY = canvas.height * 0.2;
        const nebulaRadius = Math.max(canvas.width, canvas.height) * 0.5;

        const nebGrad = ctx.createRadialGradient(
          nebulaX,
          nebulaY,
          0,
          nebulaX,
          nebulaY,
          nebulaRadius
        );
        nebGrad.addColorStop(0, 'rgba(255, 0, 255, 0.15)');
        nebGrad.addColorStop(0.5, 'rgba(0, 0, 255, 0.1)');
        nebGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = nebGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      {
        const neb2X = canvas.width * 0.2;
        const neb2Y = canvas.height * 0.8;
        const neb2Radius = Math.max(canvas.width, canvas.height) * 0.6;

        const nebGrad2 = ctx.createRadialGradient(
          neb2X,
          neb2Y,
          0,
          neb2X,
          neb2Y,
          neb2Radius
        );
        nebGrad2.addColorStop(0, 'rgba(0, 255, 255, 0.1)');
        nebGrad2.addColorStop(0.5, 'rgba(0, 128, 255, 0.05)');
        nebGrad2.addColorStop(1, 'transparent');
        ctx.fillStyle = nebGrad2;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      // ===== End Background =====

      // rest of leaderboard rendering
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke(); }
      for (let i = 0; i < canvas.height; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke(); }

      ctx.textAlign = 'center';
      drawGlowingText(ctx, getLang("leaderboardTitle"), canvas.width / 2, 100, theme.primary, 60);

      const top3 = combinedData.slice(0, 3);
      const podColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
      const podPositions = [
        { x: canvas.width / 2, y: 300, r: 100 },
        { x: 250, y: 320, r: 80 },
        { x: canvas.width - 250, y: 320, r: 80 }
      ];
      const rankOrder = [1, 0, 2];

      for(const i of rankOrder) {
        const user = top3[i];
        if (!user) continue;
        const pos = podPositions[i];
        ctx.strokeStyle = podColors[i];
        ctx.lineWidth = 5;
        ctx.shadowColor = podColors[i];
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, pos.r + 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        const avatar = await getAvatar(user.uid, user.name);
        drawCircularAvatar(ctx, avatar, pos.x, pos.y, pos.r);
        ctx.textAlign = 'center';
        ctx.font = `bold ${pos.r * 0.3}px "BeVietnamPro", "sans-serif"`;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(fitText(ctx, user.name, pos.r * 2.2), pos.x, pos.y + pos.r + 40);
        ctx.font = `normal ${pos.r * 0.25}px "BeVietnamPro", "sans-serif"`;
        ctx.fillStyle = theme.secondary;
        ctx.fillText(`${user.count} msgs`, pos.x, pos.y + pos.r + 75);
        ctx.fillStyle = podColors[i];
        ctx.beginPath();
        ctx.arc(pos.x, pos.y - pos.r + 10, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.font = `bold 30px "BeVietnamPro", "sans-serif"`;
        ctx.fillText(`#${user.rank}`, pos.x, pos.y - pos.r + 20);
      }

      let currentY = 550;
      for (const user of pageUsers) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.fillRect(50, currentY, 1100, 90);

        ctx.textAlign = 'left';
        ctx.font = `bold 30px "BeVietnamPro", "sans-serif"`;
        ctx.fillStyle = theme.secondary;
        ctx.fillText(`#${user.rank}`, 60, currentY + 58);

        const avatar = await getAvatar(user.uid, user.name);
        drawCircularAvatar(ctx, avatar, 160, currentY + 45, 30);

        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(fitText(ctx, user.name, 350), 210, currentY + 58);

        const barWidth = 350;
        const barX = 700;
        const progress = (user.count / (top3[0]?.count || user.count)) * barWidth;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(barX, currentY + 35, barWidth, 20);
        ctx.fillStyle = theme.primary;
        ctx.fillRect(barX, currentY + 35, progress, 20);

        ctx.textAlign = 'right';
        ctx.font = `bold 30px "BeVietnamPro", "sans-serif"`;
        ctx.fillStyle = theme.primary;
        ctx.fillText(user.count, canvas.width - 60, currentY + 58);

        currentY += 105;
      }

      ctx.textAlign = 'center';
      ctx.fillStyle = theme.secondary;
      ctx.font = `normal 24px "BeVietnamPro", "sans-serif"`;
      ctx.fillText(getLang("page", page, totalPages), canvas.width / 2, canvas.height - 70);
      ctx.fillText(getLang("reply"), canvas.width / 2, canvas.height - 40);

      const path = resolve(__dirname, 'cache', `leaderboard_${threadID}.png`);
      const out = createWriteStream(path);
      const stream = canvas.createPNGStream();
      stream.pipe(out);
      out.on('finish', () => {
        message.reply({
          attachment: require('fs').createReadStream(path)
        }, (err, info) => {
          if (err) return console.error(err);
          global.GoatBot.onReply.set(info.messageID, {
            commandName: this.config.name,
            messageID: info.messageID,
            author: senderID,
            threadID: threadID,
            type: 'leaderboard'
          });
        });
      });

    } else {
      const targetUsers = Object.keys(mentions).length > 0 ? Object.keys(mentions) : [senderID];

      for(const uid of targetUsers) {
        const user = combinedData.find(u => u.uid == uid);
        if (!user) continue;

        const canvas = new Canvas(800, 1200);
        const ctx = canvas.getContext('2d');

        // ===== Space Themed Background =====
        ctx.fillStyle = "#000014";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < 400; i++) {
          const x = Math.random() * canvas.width;
          const y = Math.random() * canvas.height;
          const radius = Math.random() * 1.5;
          const alpha = Math.random() * 0.8 + 0.2;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.shadowColor = `rgba(255, 255, 255, ${alpha})`;
          ctx.shadowBlur = 5;
          ctx.fill();
        }

        {
          const nebulaX = canvas.width * 0.7;
          const nebulaY = canvas.height * 0.2;
          const nebulaRadius = Math.max(canvas.width, canvas.height) * 0.5;

          const nebGrad = ctx.createRadialGradient(
            nebulaX,
            nebulaY,
            0,
            nebulaX,
            nebulaY,
            nebulaRadius
          );
          nebGrad.addColorStop(0, 'rgba(255, 0, 255, 0.15)');
          nebGrad.addColorStop(0.5, 'rgba(0, 0, 255, 0.1)');
          nebGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = nebGrad;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        {
          const neb2X = canvas.width * 0.2;
          const neb2Y = canvas.height * 0.8;
          const neb2Radius = Math.max(canvas.width, canvas.height) * 0.6;

          const nebGrad2 = ctx.createRadialGradient(
            neb2X,
            neb2Y,
            0,
            neb2X,
            neb2Y,
            neb2Radius
          );
          nebGrad2.addColorStop(0, 'rgba(0, 255, 255, 0.1)');
          nebGrad2.addColorStop(0.5, 'rgba(0, 128, 255, 0.05)');
          nebGrad2.addColorStop(1, 'transparent');
          ctx.fillStyle = nebGrad2;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        // ===== End Background =====

        // rest of usercard rendering
        drawGlowingText(ctx, getLang("userCardTitle"), 220, 70, theme.primary, 45);

        ctx.shadowColor = theme.primary;
        ctx.shadowBlur = 30;
        const avatar = await getAvatar(user.uid, user.name);
        drawCircularAvatar(ctx, avatar, canvas.width/2, 200, 100);
        ctx.shadowBlur = 0;

        ctx.textAlign = 'center';
        ctx.font = `bold 40px "BeVietnamPro", "sans-serif"`;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(fitText(ctx, user.name, 600), canvas.width/2, 340);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(50, 400, canvas.width - 100, 120);

        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 415);
        ctx.lineTo(canvas.width / 2, 505);
        ctx.strokeStyle = theme.primary;
        ctx.lineWidth = 1;
        ctx.shadowColor = theme.primary;
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = theme.secondary;
        ctx.font = `bold 24px "BeVietnamPro", "sans-serif"`;
        ctx.fillText(getLang("serverRank"), 225, 440);
        ctx.fillText(getLang("totalMessages"), canvas.width - 225, 440);

        ctx.fillStyle = theme.primary;
        ctx.font = `bold 48px "BeVietnamPro", "sans-serif"`;
        ctx.fillText(`#${user.rank}`, 225, 490);
        ctx.fillText(user.count, canvas.width - 225, 490);

        const dailyData = user.activity.daily;
        const days = [];
        for(let i=6; i>=0; i--) {
          const day = moment().tz("Asia/Ho_Chi_Minh").subtract(i, 'days');
          days.push({
            label: day.format('dddd'),
            shortLabel: day.format('ddd'),
            key: day.format('YYYY-MM-DD'),
            count: dailyData[day.format('YYYY-MM-DD')] || 0
          });
        }

        const busiestDay = days.reduce((prev, current) => (prev.count > current.count) ? prev : current, {count: -1});
        ctx.textAlign = 'center';
        ctx.fillStyle = theme.secondary;
        ctx.font = `bold 24px "BeVietnamPro", "sans-serif"`;
        ctx.fillText(getLang("busiestDay"), canvas.width/2, 580);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold 32px "BeVietnamPro", "sans-serif"`;
        ctx.fillText(busiestDay.count > 0 ? `${busiestDay.label} - ${busiestDay.count} msgs` : 'N/A', canvas.width/2, 625);

        ctx.textAlign = 'left';
        ctx.fillStyle = theme.secondary;
        ctx.font = `bold 24px "BeVietnamPro", "sans-serif"`;
        ctx.fillText(getLang("dailyActivity"), 50, 700);

        const graphX = 80, graphW = canvas.width - 160, graphH = 120;
        const graphY = 850;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(graphX, graphY - graphH, graphW, graphH);

        const maxCount = Math.max(...days.map(d => d.count), 1);

        ctx.beginPath();
        ctx.moveTo(graphX, graphY - (days[0].count / maxCount * graphH));
        ctx.strokeStyle = theme.primary;
        ctx.lineWidth = 3;

        days.forEach((day, i) => {
          const x = graphX + (i / 6) * graphW;
          const y = graphY - (day.count / maxCount * graphH);
          ctx.lineTo(x, y);

          ctx.textAlign = 'center';
          ctx.fillStyle = theme.secondary;
          ctx.font = '18px "BeVietnamPro", "sans-serif"';
          ctx.fillText(day.shortLabel, x, graphY + 25);
        });
        ctx.stroke();

        ctx.textAlign = 'left';
        ctx.fillStyle = theme.secondary;
        ctx.font = `bold 24px "BeVietnamPro", "sans-serif"`;
        ctx.fillText(getLang("messageBreakdown"), 50, 920);

        const types = user.activity.types;
        const totalTypes = types.text + types.sticker + types.media;
        const breakdownData = [
          { label: getLang("text"), value: types.text, color: theme.primary },
          { label: getLang("sticker"), value: types.sticker, color: '#3FBAC2' },
          { label: getLang("media"), value: types.media, color: '#F4E409' }
        ];

        const donutY = 1025;
        const donutR = 60;
        const donutX = 200;
        let startAngle = -0.5 * Math.PI;

        if(totalTypes > 0) {
          breakdownData.forEach(item => {
            const sliceAngle = (item.value / totalTypes) * 2 * Math.PI;
            ctx.beginPath();
            ctx.moveTo(donutX, donutY);
            ctx.arc(donutX, donutY, donutR, startAngle, startAngle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = item.color;
            ctx.fill();
            startAngle += sliceAngle;
          });
        } else {
          ctx.beginPath();
          ctx.arc(donutX, donutY, donutR, 0, 2 * Math.PI);
          ctx.fillStyle = theme.secondary;
          ctx.fill();
        }

        let legendY = 980;
        breakdownData.forEach(item => {
          const percentage = totalTypes > 0 ? (item.value / totalTypes * 100).toFixed(1) : 0;
          ctx.fillStyle = item.color;
          ctx.fillRect(350, legendY, 20, 20);
          ctx.fillStyle = '#FFFFFF';
          ctx.font = `bold 22px "BeVietnamPro", "sans-serif"`;
          ctx.fillText(item.label, 380, legendY + 16);
          ctx.fillStyle = theme.secondary;
          ctx.textAlign = 'right';
          ctx.fillText(`${percentage}% (${item.value})`, canvas.width - 50, legendY + 16);
          ctx.textAlign = 'left';
          legendY += 45;
        });

        const path = resolve(__dirname, 'cache', `usercard_${uid}.png`);
        const out = createWriteStream(path);
        const stream = canvas.createPNGStream();
        stream.pipe(out);
        out.on('finish', () => {
          message.reply({ attachment: require('fs').createReadStream(path) });
        });
      }
    }
  },

  onReply: async function ({ event, Reply, message, getLang }) {
    if (event.senderID !== Reply.author || Reply.type !== 'leaderboard') return;

    const page = parseInt(event.body);
    if (isNaN(page)) return;

    try {
      message.unsend(Reply.messageID);
      const newArgs = ['all', page.toString()];
      await this.onStart({
        ...arguments[0],
        args: newArgs,
        event: { ...arguments[0].event, body: `/count ${newArgs.join(' ')}` }
      });
    } catch (e) {
      console.error("Error during pagination reply:", e);
      message.reply(getLang("invalidPage"));
    }
  }
};amr 
