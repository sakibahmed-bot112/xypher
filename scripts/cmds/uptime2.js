const os = require('os');
const { createCanvas } = require('canvas');
const fs = require('fs-extra');
const path = require('path');
const si = require('systeminformation');
const moment = require('moment-timezone');

function sanitizePercentage(value, defaultVal = 0) {
    const num = parseFloat(value);
    if (isNaN(num)) return defaultVal;
    return Math.max(0, Math.min(100, num));
}

function formatUptime(seconds) {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
}

async function getCurrentCPUUsage() {
    return new Promise((resolve) => {
        const startCores = os.cpus();
        setTimeout(() => {
            const endCores = os.cpus();
            let totalIdle = 0, totalTick = 0;
            for (let i = 0; i < endCores.length; i++) {
                const start = startCores[i].times;
                const end = endCores[i].times;
                totalTick += (end.user - start.user) + (end.nice - start.nice) + (end.sys - start.sys) + (end.irq - start.irq) + (end.idle - start.idle);
                totalIdle += (end.idle - start.idle);
            }
            const usage = totalTick > 0 ? ((totalTick - totalIdle) / totalTick) * 100 : 0;
            resolve(Math.max(0, Math.min(100, usage)).toFixed(2));
        }, 100);
    });
}

async function getDiskInfo() {
    try {
        const data = await si.fsSize();
        const primaryDisk = data.find(d => d.mount === '/' || d.fs.toLowerCase().startsWith('c:')) || data[0];
        if (primaryDisk) {
            return {
                use: primaryDisk.use,
                total: (primaryDisk.size / 1024 / 1024 / 1024).toFixed(1) + ' GB'
            };
        }
    } catch (e) { console.error(e); }
    return { use: 0, total: 'N/A' };
}

function drawHexagon(ctx, x, y, size, fillStyle, strokeStyle, lineWidth = 2) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i + (Math.PI / 6);
        const px = x + size * Math.cos(angle);
        const py = y + size * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    if (fillStyle) ctx.fillStyle = fillStyle, ctx.fill();
    if (strokeStyle) ctx.strokeStyle = strokeStyle, ctx.lineWidth = lineWidth, ctx.stroke();
}

function fillHexStat(ctx, x, y, label, value, labelColor, valueColor, labelFont, valueFont) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = labelColor; ctx.font = labelFont; ctx.fillText(label, x, y + 18);
    ctx.fillStyle = valueColor; ctx.font = valueFont; ctx.fillText(value, x, y - 8);
}

module.exports = {
    config: {
        name: 'up2',
        aliases: ['uptime2', 'up2', 'upt2'],
        version: '7.0',
        author: 'Mahi-- | Saim',
        countDown: 10,
        role: 0,
        category: 'system',
        guide: { en: '{pn}: Generates Hex-style system panel PNG with Bangladesh time & stylish white text.' }
    },

    onStart: async function ({ message }) {
        try {
            const osMemoryUsagePercentageNum = sanitizePercentage(((os.totalmem() - os.freemem()) / os.totalmem()) * 100);
            const currentCpuUsageNum = parseFloat(await getCurrentCPUUsage());
            const diskInfo = await getDiskInfo();
            const diskUsagePercentageNum = sanitizePercentage(diskInfo.use);
            const cpuCores = os.cpus().length;
            const platformInfo = `${os.platform()} (${os.arch()})`;
            const botUptime = formatUptime(process.uptime());
            const systemUptime = formatUptime(os.uptime());
            const totalRam = (os.totalmem() / 1024 / 1024 / 1024).toFixed(1) + ' GB';
            const nodeVersion = process.version;
            const hostname = os.hostname();

            // Canvas setup
            const canvasWidth = 1000, canvasHeight = 667;
            const canvas = createCanvas(canvasWidth, canvasHeight);
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#0b0f1c'; ctx.fillRect(0, 0, canvasWidth, canvasHeight);

            // Glow colors rotation
            const glowColors = ['#0000FF', '#ADD8E6', '#FF0000', '#00FF00'];
            const colorFile = path.join(__dirname, 'cache', 'lastColor.json');
            let colorData = await fs.readJson(colorFile).catch(() => ({ lastUsedIndex: 0 }));
            const currentIndex = colorData.lastUsedIndex % glowColors.length;
            const glowColor = glowColors[currentIndex];
            colorData.lastUsedIndex = currentIndex + 1;
            await fs.writeJson(colorFile, colorData);

            // Hex positions
            const mainHexSize = 100, satelliteHexSize = 85, cornerHexSize = 70;
            const centerX = canvasWidth / 2, centerY = canvasHeight / 2;
            const satelliteDist = mainHexSize + satelliteHexSize;
            const cornerDistX = satelliteDist + cornerHexSize;
            const cornerDistY = satelliteHexSize + 30;

            const satelliteHexes = [
                { angle: 60, label: "RAM USAGE", value: `${osMemoryUsagePercentageNum.toFixed(1)}%`, font: 'bold 30px Arial' },
                { angle: 120, label: "SYS UPTIME", value: systemUptime, font: 'bold 19px Arial' },
                { angle: 180, label: "CPU USAGE", value: `${currentCpuUsageNum.toFixed(1)}%`, font: 'bold 30px Arial' },
                { angle: 240, label: "BOT UPTIME", value: botUptime, font: 'bold 22px Arial' },
                { angle: 300, label: "CPU CORES", value: cpuCores, font: 'bold 30px Arial' },
                { angle: 0, label: "DISK USAGE", value: `${diskUsagePercentageNum.toFixed(1)}%`, font: 'bold 30px Arial' }
            ];

            satelliteHexes.forEach(hex => {
                const angleRad = (Math.PI / 180) * hex.angle;
                const hexX = centerX + satelliteDist * Math.cos(angleRad);
                const hexY = centerY + satelliteDist * Math.sin(angleRad);
                drawHexagon(ctx, hexX, hexY, satelliteHexSize, '#111a25', glowColor, 3);
                fillHexStat(ctx, hexX, hexY, hex.label, hex.value, '#FFFFFF', '#FFFFFF', '14px Arial', hex.font);
            });

            const cornerHexes = [
                { x: centerX - cornerDistX, y: centerY - cornerDistY, label: "TOTAL RAM", value: totalRam },
                { x: centerX + cornerDistX, y: centerY - cornerDistY, label: "NODE.JS", value: nodeVersion },
                { x: centerX - cornerDistX, y: centerY + cornerDistY, label: "TOTAL DISK", value: diskInfo.total },
                { x: centerX + cornerDistX, y: centerY + cornerDistY, label: "HOSTNAME", value: hostname.substring(0, 9) }
            ];

            cornerHexes.forEach(hex => {
                drawHexagon(ctx, hex.x, hex.y, cornerHexSize, '#111a25', glowColor, 2);
                fillHexStat(ctx, hex.x, hex.y, hex.label, hex.value, '#FFFFFF', '#FFFFFF', '12px Arial', 'bold 18px Arial');
            });

            drawHexagon(ctx, centerX, centerY, mainHexSize, '#111a25', glowColor, 4);
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 28px Arial'; ctx.fillText("Elon Ten", centerX, centerY - 15);
            ctx.fillStyle = '#FFFFFF'; ctx.font = '16px Arial'; ctx.fillText("by Asif", centerX, centerY + 22);

            // Bangladesh time 12-hour format
            const now = moment().tz("Asia/Dhaka");
            const dateString = now.format("DD/MM/YYYY");
            const timeString = now.format("hh:mm A");

            const textMessage = `
━━━━━━━━━━━━━━
𝗨𝗽𝘁𝗶𝗺𝗲 𝗜𝗻𝗳𝗼 :
╭─╼━━━━━━━━╾─╮
│ RAM Usage     : ${osMemoryUsagePercentageNum.toFixed(1)}%
│ CPU Usage     : ${currentCpuUsageNum.toFixed(1)}%
│ Disk Usage    : ${diskUsagePercentageNum.toFixed(0)}%
│ System Uptime : ${systemUptime}
│ Bot Uptime    : ${botUptime}
│ CPU Cores     : ${cpuCores}
│ Node.js       : ${nodeVersion}
│ Hostname      : ${hostname.substring(0, 12)}
╰─━━━━━━━━━╾─╯
📅 Date: ${dateString}
⏰ Time: ${timeString}
`;

            const imgPath = path.join(__dirname, "cache", `system_panel_${Date.now()}.png`);
            await fs.ensureDir(path.dirname(imgPath));
            const out = fs.createWriteStream(imgPath);
            canvas.createPNGStream().pipe(out);
            await new Promise(res => out.on('finish', res));

            await message.reply({ body: textMessage, attachment: fs.createReadStream(imgPath) });
            fs.unlink(imgPath, (err) => { if (err) console.error(err); });

        } catch (err) {
            console.error(err);
            return message.reply("❌ Could not generate system panel. Check console logs.");
        }
    }
};
