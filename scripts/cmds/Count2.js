const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");
const ChartJS = require("chart.js/auto");

const dataFile = path.join(__dirname, "cache", "activity.json");

function loadData() {
  if (!fs.existsSync(dataFile)) return {};
  return JSON.parse(fs.readFileSync(dataFile));
}

function saveData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

module.exports = {
  config: {
    name: "count2",
    version: "3.3.4",
    author: "Asif",
    role: 0,
    description: "Activity card system",
    category: "utility",
    guide: "{pn}"
  },

  onChat: async ({ event }) => {
    if (!event?.senderID || !event?.threadID) return;

    const { threadID, senderID, body, attachments, stickerID } = event;
    const data = loadData();
    if (!data[threadID]) data[threadID] = {};
    if (!data[threadID][senderID]) data[threadID][senderID] = { total: 0, text: 0, sticker: 0, media: 0, daily: {} };

    const user = data[threadID][senderID];
    user.total++;
    if (body) user.text++;
    else if (stickerID) user.sticker++;
    else if (attachments?.length) user.media++;

    const today = new Date().toISOString().split("T")[0];
    user.daily[today] = (user.daily[today] || 0) + 1;

    saveData(data);
  },

  onStart: async ({ api, event }) => {
    const { threadID, senderID } = event;
    const data = loadData();
    if (!data[threadID]?.[senderID]) return api.sendMessage("❌ No data yet!", threadID);

    const user = data[threadID][senderID];
    const userInfo = await api.getUserInfo(senderID);
    const userName = userInfo[senderID]?.name || "Unknown";

    const users = Object.entries(data[threadID]).map(([id, u]) => ({ id, total: u.total }))
      .sort((a, b) => b.total - a.total);
    const serverRank = users.findIndex(u => u.id === senderID) + 1;

    const busiest = Object.entries(user.daily).sort((a, b) => b[1] - a[1])[0] || [];
    const busiestDayName = busiest[0] ? new Date(busiest[0]).toLocaleDateString("en-US", { weekday: "long" }) : "None";
    const busiestDayCount = busiest[1] || 0;

    const days = [], values = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      days.push(d.toLocaleDateString("en-US", { weekday: "short" }));
      values.push(user.daily[key] || 0);
    }

    const width = 800, height = 1200;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#00FF00"; ctx.font = "bold 50px Sans"; ctx.textAlign = "center";
    ctx.fillText("ACTIVITY CARD", width / 2, 80);

    const avatar = await loadImage(`https://graph.facebook.com/${senderID}/picture?height=1000&width=1000&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);
    ctx.save(); ctx.beginPath(); ctx.arc(width / 2, 200, 100, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
    ctx.drawImage(avatar, width / 2 - 100, 100, 200, 200); ctx.restore();

    ctx.fillStyle = "#fff"; ctx.font = "bold 42px Sans"; ctx.fillText(userName, width / 2, 350);

    ctx.font = "30px Sans"; ctx.fillStyle = "#aaa";
    ctx.fillText("Server Rank", width / 2 - 150, 420);
    ctx.fillText("Total Messages", width / 2 + 150, 420);

    ctx.font = "bold 40px Sans"; ctx.fillStyle = "#00FF00";
    ctx.fillText(`#${serverRank}`, width / 2 - 150, 470);
    ctx.fillText(`${user.total}`, width / 2 + 150, 470);

    ctx.fillStyle = "#aaa"; ctx.font = "25px Sans"; ctx.fillText("BUSIEST DAY", width / 2, 550);
    ctx.fillStyle = "#fff"; ctx.font = "bold 35px Sans"; ctx.fillText(`${busiestDayName} - ${busiestDayCount} msgs`, width / 2, 590);

    const chartCanvas = createCanvas(600, 250);
    new ChartJS.Chart(chartCanvas, {
      type: "line",
      data: { labels: days, datasets: [{ data: values, borderColor: "#00FF00", borderWidth: 3, tension: 0.4, pointRadius: 6, pointBackgroundColor: "#00FF00", pointBorderColor: "#fff", pointHoverRadius: 8 }] },
      options: { responsive: false, plugins: { legend: { display: false }, tooltip: { enabled: true, backgroundColor: "#000", titleColor: "#00FF00", bodyColor: "#fff", bodyFont: { size: 18 } } }, scales: { x: { ticks: { color: "#fff", font: { size: 20, weight: "bold" }, padding: 12 }, grid: { color: "rgba(255,255,255,0.1)" } }, y: { ticks: { color: "#fff", font: { size: 18 } }, grid: { color: "rgba(255,255,255,0.1)" } } } }
    });
    ctx.drawImage(chartCanvas, 100, 630);

    const pieCanvas = createCanvas(150, 150);
    new ChartJS.Chart(pieCanvas, {
      type: "pie",
      data: { labels: ["Text", "Sticker", "Media"], datasets: [{ data: [user.text, user.sticker, user.media], backgroundColor: ["#00FF00", "#FFD700", "#00CFFF"] }] },
      options: { plugins: { legend: { display: false } } }
    });
    ctx.drawImage(pieCanvas, width / 2 - 300, 990);

    ctx.fillStyle = "#fff"; ctx.font = "30px Sans"; ctx.textAlign = "center";
    ctx.fillText("Message breakdown", width / 2 - 225, 970);

    const legendX = width / 2 - 50, valueX = width / 2 + 350, legendY = 1030, lineHeight = 40, squareSize = 25;
    const totalCount = user.text + user.sticker + user.media;

    ctx.fillStyle = "#00FF00"; ctx.fillRect(legendX, legendY - squareSize + 5, squareSize, squareSize);
    ctx.fillStyle = "#FFD700"; ctx.fillRect(legendX, legendY - squareSize + 5 + lineHeight, squareSize, squareSize);
    ctx.fillStyle = "#00CFFF"; ctx.fillRect(legendX, legendY - squareSize + 5 + lineHeight * 2, squareSize, squareSize);

    ctx.fillStyle = "#fff"; ctx.font = "bold 28px Sans"; ctx.textAlign = "left";
    ctx.fillText("Text", legendX + squareSize + 10, legendY);
    ctx.fillText("Sticker", legendX + squareSize + 10, legendY + lineHeight);
    ctx.fillText("Media", legendX + squareSize + 10, legendY + lineHeight * 2);

    ctx.textAlign = "right";
    ctx.fillText(`${user.text} (${totalCount ? Math.round((user.text / totalCount) * 100) : 0}%)`, valueX, legendY);
    ctx.fillText(`${user.sticker} (${totalCount ? Math.round((user.sticker / totalCount) * 100) : 0}%)`, valueX, legendY + lineHeight);
    ctx.fillText(`${user.media} (${totalCount ? Math.round((user.media / totalCount) * 100) : 0}%)`, valueX, legendY + lineHeight * 2);

    const filePath = path.join(__dirname, "cache", `activity_${senderID}.png`);
    fs.writeFileSync(filePath, canvas.toBuffer("image/png"));
    return api.sendMessage({ body: "📊 Your activity card!", attachment: fs.createReadStream(filePath) }, threadID, () => fs.unlinkSync(filePath));
  }
};
