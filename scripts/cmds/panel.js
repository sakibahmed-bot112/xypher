const os = require("os");
const moment = require("moment-timezone");
const { createCanvas } = require("canvas");
const GIFEncoder = require("gifencoder");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "panel",
    version: "6.4",
    author: "- 𝐀𝐒𝐈𝐅  ✈︎  🎀",
    description: "Thin border, faster animation, stable glowing effect.",
    usage: "/panel",
    category: "system",
    role: 0
  },

  onStart: async function ({ api, event }) {
    try {
      const width = 1000, height = 700;
      const encoder = new GIFEncoder(width, height);
      const fileName = `cpanel_${Date.now()}.gif`;
      const filePath = path.join(__dirname, fileName);
      const stream = fs.createWriteStream(filePath);
      encoder.createReadStream().pipe(stream);

      encoder.start();
      encoder.setRepeat(0);
      encoder.setDelay(150);
      encoder.setQuality(10);

      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      const formatUptime = (sec) => {
        const d = Math.floor(sec / 86400);
        const h = Math.floor((sec % 86400) / 3600);
        const m = Math.floor((sec % 3600) / 60);
        return `${d}d ${h}h ${m}m`;
      };

      const getSystemStats = () => {
        const sysUptimeSec = os.uptime();
        const botUptimeSec = process.uptime();
        const totalMemGB = os.totalmem() / 1024 / 1024 / 1024;
        const freeMemGB = os.freemem() / 1024 / 1024 / 1024;
        const usedMemGB = totalMemGB - freeMemGB;
        const ramUsagePercent = (usedMemGB / totalMemGB) * 100;
        const cpuCount = os.cpus().length;
        const nodeVersion = process.version;
        const loadAvg1m = os.loadavg()[0];

        return [
          ["BOT UPTIME", formatUptime(botUptimeSec)],
          ["CPU CORES", cpuCount.toString()],
          ["NODE.JS", nodeVersion],
          ["DISK USAGE", "21.8%"],
          ["RAM USAGE", ramUsagePercent.toFixed(1) + "%"],
          ["SYS UPTIME", formatUptime(sysUptimeSec)],
          ["CPU LOAD", loadAvg1m.toFixed(2) + "%"]
        ];
      };

      const borderColorSets = [
        ["#ff0000", "#ff9900", "#ffff00", "#00ff00"],
        ["#00ffff", "#0000ff", "#8a2be2", "#ff00ff"],
        ["#ff1493", "#ffa500", "#7fff00", "#00fa9a"],
        ["#9400d3", "#00bfff", "#00ff7f", "#ff4500"],
        ["#ff6347", "#40e0d0", "#adff2f", "#1e90ff"],
        ["#7cfc00", "#00ced1", "#ff69b4", "#ffd700"],
        ["#00ffcc", "#cc00ff", "#ff3366", "#66ff66"]
      ];

      const drawHex = (x, y, label, value, frame, colorCycle) => {
        const r = 100;

        for (let i = 0; i < 6; i++) {
          const angle1 = Math.PI / 3 * i;
          const angle2 = Math.PI / 3 * (i + 1);
          const x1 = x + r * Math.cos(angle1);
          const y1 = y + r * Math.sin(angle1);
          const x2 = x + r * Math.cos(angle2);
          const y2 = y + r * Math.sin(angle2);

          const colorIndex = (frame + i) % colorCycle.length;
          const color = colorCycle[colorIndex];

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = color;
          ctx.shadowColor = color;
          ctx.shadowBlur = 15;
          ctx.lineWidth = 4;
          ctx.stroke();
        }

        ctx.shadowBlur = 0;
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";

        ctx.font = "18px Arial";
        ctx.fillText(label, x, y - 10);
        ctx.font = "bold 22px Arial";
        ctx.fillText(value, x, y + 20);
      };

      const cx = width / 2;
      const cy = height / 2;
      const spacing = 180;

      const positions = [
        [cx, cy - spacing],
        [cx + spacing, cy - spacing / 2],
        [cx + spacing, cy + spacing / 2],
        [cx, cy + spacing],
        [cx - spacing, cy + spacing / 2],
        [cx - spacing, cy - spacing / 2],
        [cx, cy]
      ];

      for (let frame = 0; frame < 8; frame++) {  // ফ্রেম সংখ্যা কমিয়ে ৮ করা হলো দ্রুততার জন্য
        const stats = getSystemStats();

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = "#0f0f1b";
        ctx.fillRect(0, 0, width, height);

        // মিক্সড ৪ কালারের গ্লোয়িং বর্ডার (পাতলা)
        const grad = ctx.createLinearGradient(0, 0, width, 0);
        grad.addColorStop(0, "#0000ff");     // Blue
        grad.addColorStop(0.33, "#8a2be2");  // Purple
        grad.addColorStop(0.66, "#ffff00");  // Yellow
        grad.addColorStop(1, "#ff0000");     // Red

        ctx.lineWidth = 8;  // পাতলা বর্ডার
        ctx.strokeStyle = grad;
        ctx.shadowColor = "#ffffff";
        ctx.shadowBlur = 30;
        ctx.strokeRect(10, 10, width - 20, height - 20);
        ctx.shadowBlur = 0;

        // Date-Time ও Linux info (ছোট এবং কম জায়গায়)
        ctx.font = "bold 20px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
        ctx.fillStyle = "#00ffff";
        ctx.textAlign = "left";
        ctx.shadowColor = "#00ffff";
        ctx.shadowBlur = 15;

        const dateTimeText = moment().tz("Asia/Dhaka").format("DD/MM/YYYY HH:mm:ss");
        ctx.fillText(`🕒 ${dateTimeText}`, 30, 60);

        const osText = `🐧 Linux (${os.platform()})`;
        ctx.fillText(osText, 30, 90);

        ctx.shadowBlur = 0;

        // এনিমেটেড হেক্সাগন ড্র করা
        for (let i = 0; i < stats.length; i++) {
          const colorSet = borderColorSets[i % borderColorSets.length];
          drawHex(positions[i][0], positions[i][1], stats[i][0], stats[i][1], frame, colorSet);
        }

        // 𝗢𝗪𝗡𝗘𝗥: - 𝐀𝐒𝐈𝐅  ✈︎  🎀 স্টাইলিশ লেখা নিচে
        ctx.font = "bold 28px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
        ctx.fillStyle = "#00ffff";
        ctx.textAlign = "center";
        ctx.shadowColor = "#00ffff";
        ctx.shadowBlur = 20;
        ctx.fillText("𝗢𝗪𝗡𝗘𝗥:- 𝐀𝐒𝐈𝐅  ✈︎  🎀", width / 2, height - 30);
        ctx.shadowBlur = 0;

        encoder.addFrame(ctx);
      }

      encoder.finish();

      stream.on("finish", () => {
        api.sendMessage({
          body: "",
          attachment: fs.createReadStream(filePath)
        }, event.threadID, () => fs.unlinkSync(filePath));
      });

    } catch (err) {
      console.error(err);
      api.sendMessage("❌ An error occurred while generating the dashboard.", event.threadID);
    }
  }
};
