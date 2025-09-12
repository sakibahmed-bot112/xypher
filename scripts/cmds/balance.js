const fs = require("fs");
const path = require("path");
const os = require("os");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

// ---- Math Bold Converter ----
function toMathBold(input) {
  const A = "A".codePointAt(0), a = "a".codePointAt(0), ZERO = "0".codePointAt(0);
  const BOLD_A = 0x1D400, BOLD_a = 0x1D41A, BOLD_0 = 0x1D7CE;
  let out = "";
  for (const ch of input) {
    const cp = ch.codePointAt(0);
    if (cp >= 65 && cp <= 90) out += String.fromCodePoint(BOLD_A + (cp - A));
    else if (cp >= 97 && cp <= 122) out += String.fromCodePoint(BOLD_a + (cp - a));
    else if (cp >= 48 && cp <= 57) out += String.fromCodePoint(BOLD_0 + (cp - ZERO));
    else out += ch;
  }
  return out;
}

module.exports = {
  config: {
    name: "bal",
    aliases: ["h", "b"],
    version: "2.2",
    author: "Muzan",
    role: 0,
    shortDescription: "Show user balance with styled glowing border",
    category: "economy",
    cooldown: 5
  },

  onStart: async function ({ event, message, usersData, args }) {
    try {
      if (args[0] && args[0].toLowerCase() === "top") {
        return await showTop(message, usersData);
      }

      const interestRate = 0.01;
      const now = Date.now();

      let userId = event.senderID;
      if (args[0] && /^\d+$/.test(args[0])) userId = args[0];
      else if (Object.keys(event.mentions)[0]) userId = Object.keys(event.mentions)[0];
      else if (event.type === "message_reply") userId = event.messageReply.senderID;

      const restrictedUids = ["100080195076753"];
      if (restrictedUids.includes(userId) && userId !== event.senderID)
        return message.reply(" You can't access this user's account.");

      let userData = await usersData.get(userId);
      if (!userData.data.bank) {
        userData.data.bank = { balance: 0, lastInterest: now };
        await usersData.set(userId, { data: userData.data });
      }

      const elapsed = now - userData.data.bank.lastInterest;
      if (elapsed >= 3600000) {
        const hours = Math.floor(elapsed / 3600000);
        const interest = Math.floor(userData.data.bank.balance * interestRate * hours);
        if (interest > 0) userData.data.bank.balance += interest;
        userData.data.bank.lastInterest = now;
        await usersData.set(userId, { data: userData.data });
      }

      // Deposit
      if (args[0] && ["deposit", "dep"].includes(args[0].toLowerCase())) {
        if (!args[1]) return message.reply("💰 Enter amount to deposit.");
        let amount = parseAmount(args[1], userData.money);
        if (amount <= 0) return message.reply("❌ Invalid amount.");
        if (amount > userData.money) return message.reply("❌ Not enough money in wallet.");
        userData.money -= amount;
        userData.data.bank.balance += amount;
        await usersData.set(userId, { money: userData.money, data: userData.data });
        return message.reply(`✅ Deposited $${formatMoney(amount)} into bank.`);
      }

      // Withdraw
      if (args[0] && ["withdraw", "with"].includes(args[0].toLowerCase())) {
        if (!args[1]) return message.reply("💰 Enter amount to withdraw.");
        let amount = parseAmount(args[1], userData.data.bank.balance);
        if (amount <= 0) return message.reply("❌ Invalid amount.");
        if (amount > userData.data.bank.balance) return message.reply("❌ Not enough money in bank.");
        userData.data.bank.balance -= amount;
        userData.money += amount;
        await usersData.set(userId, { money: userData.money, data: userData.data });
        return message.reply(`✅ Withdrew $${formatMoney(amount)} into wallet.`);
      }

      userData = await usersData.get(userId);
      const name = (await usersData.getName(userId)) || "Unknown";
      const wallet = userData.money || 0;
      const bank = userData.data.bank.balance || 0;
      const biscuits = userData.data.biscuit || 0;

      let avatarBuffer;
      try {
        const avatarUrl = await usersData.getAvatarUrl(userId);
        const response = await axios.get(avatarUrl, { responseType: "arraybuffer" });
        avatarBuffer = response.data;
      } catch {
        avatarBuffer = await generateDefaultAvatar(name);
      }

      const cardImage = await renderCard(name, wallet, bank, biscuits, avatarBuffer);
      const filePath = path.join(os.tmpdir(), `${userId}_bal.png`);
      fs.writeFileSync(filePath, cardImage);

      message.reply(
        { body: ` ${toMathBold(name)}'s Balance`, attachment: fs.createReadStream(filePath) },
        () => { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); }
      );

    } catch (err) {
      console.error(err);
      message.reply("❌ Error while processing balance.");
    }
  }
};

async function showTop(message, usersData) {
  const allUsers = await usersData.getAll();
  const sorted = allUsers
    .map(u => ({
      name: u.name || "Unknown",
      total: (u.money || 0) + ((u.data?.bank?.balance) || 0)
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  let msg = " Top 10 Richest Users \n\n";
  sorted.forEach((u, i) => msg += `${i + 1}. ${toMathBold(u.name)} — $${formatMoney(u.total)}\n`);
  message.reply(msg);
}

// ✅ parseAmount with k,m,b,t...
function parseAmount(input, max) {
  input = input.toLowerCase();
  if (input === "all") return max;
  const match = input.match(/^([\d.]+)([kmbtqQsoNd])?$/i);
  if (!match) return NaN;
  let [, num, unit] = match;
  num = parseFloat(num);

  const multipliers = {
    k: 1e3, m: 1e6, b: 1e9, t: 1e12,
    q: 1e15, Q: 1e18, s: 1e21, S: 1e24,
    o: 1e27, n: 1e30, d: 1e33
  };

  if (unit && multipliers[unit]) num *= multipliers[unit];
  return num;
}

// ✅ formatMoney with shortcuts
function formatMoney(num) {
  if (num < 1000) return num.toString();
  const units = ["", "k", "m", "b", "t", "q", "Q", "s", "S", "o", "n", "d"];
  let i = 0;
  while (num >= 1000 && i < units.length - 1) {
    num /= 1000;
    i++;
  }
  return `${parseFloat(num.toFixed(2))}${units[i]}`;
}

async function generateDefaultAvatar(name = "?") {
  const canvas = createCanvas(200, 200);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#777";
  ctx.beginPath();
  ctx.arc(100, 100, 100, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 90px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(name[0].toUpperCase(), 100, 110);
  return canvas.toBuffer("image/png");
}

async function renderCard(name, wallet, bank, biscuits, avatarBuffer) {
  const width = 1000, height = 500;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, width, height);

  const borderWidth = 15;
  ctx.lineWidth = borderWidth;
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#00c8ff");
  gradient.addColorStop(1, "#00ff88");
  ctx.strokeStyle = gradient;
  ctx.shadowColor = "#00f7ff";
  ctx.shadowBlur = 40;
  ctx.strokeRect(borderWidth / 2, borderWidth / 2, width - borderWidth, height - borderWidth);
  ctx.shadowBlur = 0;

  const centerX = 185, centerY = 180, radius = 90;
  try {
    const avatar = await loadImage(avatarBuffer);
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, centerX - radius, centerY - radius, radius * 2, radius * 2);
    ctx.restore();
  } catch {}

  const strokeGradient = ctx.createLinearGradient(centerX - radius, centerY, centerX + radius, centerY);
  strokeGradient.addColorStop(0, "#00BFFF");
  strokeGradient.addColorStop(1, "#90EE90");
  ctx.save();
  ctx.strokeStyle = strokeGradient;
  ctx.lineWidth = 8;
  ctx.shadowColor = "#00FFFF";
  ctx.shadowBlur = 25;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius + 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.font = "bold 50px Arial";
  ctx.fillStyle = "#00e6ff";
  ctx.shadowColor = "#00f7ff";
  ctx.shadowBlur = 25;
  ctx.fillText(toMathBold(name), 350, 150);
  ctx.shadowBlur = 0;

  // ---- use short formatted money here ----
  ctx.font = "bold 40px Arial";
  ctx.fillStyle = "#00ffcc";
  ctx.shadowColor = "#00ffcc";
  ctx.shadowBlur = 20;
  ctx.fillText(toMathBold(`Wallet: ${formatMoney(wallet)}`), 350, 250);
  ctx.fillText(toMathBold(`Bank: ${formatMoney(bank)}`), 350, 310);
  ctx.fillText(toMathBold(`Biscuits: ${formatMoney(biscuits)}`), 350, 370);
  ctx.shadowBlur = 0;

  const totalWealth = wallet + bank;
  const maxWealth = 100000;
  const barWidth = Math.min((totalWealth / maxWealth) * 600, 600);
  ctx.fillStyle = "#ffb347";
  ctx.fillRect(280, 410, barWidth, 30);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.strokeRect(280, 410, 600, 30);
  ctx.fillStyle = "#ffffff";
  ctx.font = "20px Arial";
  ctx.fillText("Wealth Level", 520, 430);

  ctx.fillStyle = "#ffffff";
  ctx.font = "18px Arial";
  ctx.fillText("Premium Balance Card", 700, 470);

  for (let i = 0; i < 180; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const len = Math.random() * 20 + 10;
    ctx.strokeStyle = "rgba(173,216,230,0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 2, y + len);
    ctx.stroke();
  }

  return canvas.toBuffer("image/png");
		  }
