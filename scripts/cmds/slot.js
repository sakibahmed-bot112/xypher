const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");
const GIFEncoder = require("gifencoder");
const twemoji = require("twemoji");

// --- Game Configuration ---
const symbols = ["🍒", "🍋", "🍊", "🍉", "⭐", "🔔", "💎", "7️⃣"];
const payouts = {
  "7️⃣7️⃣7️⃣": 100,
  "💎💎💎": 50,
  "🔔🔔🔔": 25,
  "⭐⭐⭐": 15,
  "🍉🍉🍉": 10,
  "🍊🍊🍊": 7,
  "🍋🍋🍋": 5,
  "🍒🍒🍒": 3,
  "🍒🍒": 2,
  "🍋🍋": 2,
  "🍊🍊": 2,
  "🍉🍉": 2,
  "⭐⭐": 2,
  "🔔🔔": 2,
  "💎💎": 2,
  "7️⃣7️⃣": 5,
};

// --- Normalize helper ---
function normalizeEmoji(e) {
  return twemoji.convert.toCodePoint(e, "-");
}

// --- Weighted Reels ---
function generateWeightedReelStrip() {
  const weights = {
    "🍒": 12,
    "🍋": 10,
    "🍊": 8,
    "🍉": 6,
    "⭐": 5,
    "🔔": 4,
    "💎": 3,
    "7️⃣": 2,
  };

  let weightedStrip = [];
  for (const [symbol, weight] of Object.entries(weights)) {
    for (let i = 0; i < weight; i++) {
      weightedStrip.push(symbol);
    }
  }

  // Shuffle
  for (let i = weightedStrip.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [weightedStrip[i], weightedStrip[j]] = [weightedStrip[j], weightedStrip[i]];
  }

  return weightedStrip;
}

const weightedReelStrips = [
  generateWeightedReelStrip(),
  generateWeightedReelStrip(),
  generateWeightedReelStrip(),
];

// --- Emoji Loader ---
const emojiCache = {};
async function preloadEmojis() {
  for (const s of symbols) {
    if (!emojiCache[s]) {
      const svg = twemoji.parse(s, { folder: "svg", ext: ".svg" });
      const url = svg.match(/src="(.*?)"/)[1];
      emojiCache[s] = await loadImage(url);
    }
  }
}

async function drawEmoji(ctx, x, y, emoji, size = 70) {
  const img = emojiCache[emoji];
  ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
}

// --- Game Functions ---
function getResult() {
  return [
    weightedReelStrips[0][Math.floor(Math.random() * weightedReelStrips[0].length)],
    weightedReelStrips[1][Math.floor(Math.random() * weightedReelStrips[1].length)],
    weightedReelStrips[2][Math.floor(Math.random() * weightedReelStrips[2].length)],
  ];
}

function calculateWinnings(result, bet) {
  const joined = result.join("");
  if (payouts[joined]) {
    return { amount: bet * payouts[joined], winType: "JACKPOT" };
  }

  if (result[0] === result[1] && payouts[result[0] + result[1]]) {
    return { amount: bet * payouts[result[0] + result[1]], winType: "DOUBLE" };
  }

  if (result[1] === result[2] && payouts[result[1] + result[2]]) {
    return { amount: bet * payouts[result[1] + result[2]], winType: "DOUBLE" };
  }

  return { amount: 0, winType: "LOSS" };
}

module.exports = {
  config: {
    name: "slot",
    aliases: ["slots"],
    version: "3.1",
    author: "TawsiN",
    role: 0,
    shortDescription: { en: "Play the slot machine" },
    longDescription: { en: "Slot machine game with animated GIF + Twemoji rendering." },
    category: "economy",
    guide: { en: "{pn} <bet_amount>" },
  },

  onStart: async function ({ api, event, message, usersData, args }) {
    const betAmount = parseInt(args[0]);
    if (isNaN(betAmount) || betAmount <= 0) {
      return message.reply("Please enter a valid bet amount.");
    }

    const senderID = event.senderID;
    const userData = await usersData.get(senderID);
    if (!userData || userData.money < betAmount) {
      return message.reply("You don't have enough money to place that bet.");
    }

    const processingMessage = await message.reply("Spinning the reels...");

    try {
      await preloadEmojis();

      userData.money -= betAmount;
      await usersData.set(senderID, { money: userData.money });

      const result = getResult();
      const { amount: winnings, winType } = calculateWinnings(result, betAmount);

      if (winnings > 0) {
        userData.money += winnings;
        await usersData.set(senderID, { money: userData.money });
      }

      const gifPath = path.join(__dirname, "cache", `slot_${Date.now()}.gif`);
      await fs.ensureDir(path.dirname(gifPath));

      const canvasWidth = 600;
      const canvasHeight = 400;
      const encoder = new GIFEncoder(canvasWidth, canvasHeight);
      const gifStream = fs.createWriteStream(gifPath);
      encoder.createReadStream().pipe(gifStream);
      encoder.start();
      encoder.setRepeat(0);
      encoder.setDelay(100);
      encoder.setQuality(15);

      const canvas = createCanvas(canvasWidth, canvasHeight);
      const ctx = canvas.getContext("2d");

      const reelWidth = 100;
      const reelHeight = 100;
      const reelPositionsX = [150, 300, 450];
      const reelWindowY = 190;

      const frameCount = 30;
      const spinDuration = 20;

      for (let i = 0; i < frameCount; i++) {
        // Background
        const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
        gradient.addColorStop(0, "#1a1a2e");
        gradient.addColorStop(1, "#16213e");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Frame
        ctx.fillStyle = "#222242";
        ctx.fillRect(80, 110, 440, 160);
        ctx.strokeStyle = "#ffcc00";
        ctx.lineWidth = 5;
        ctx.strokeRect(80, 110, 440, 160);

        // Title
        ctx.fillStyle = "#ffcc00";
        ctx.shadowColor = "rgba(255, 204, 0, 0.5)";
        ctx.shadowBlur = 10;
        ctx.font = "bold 48px Arial";
        ctx.textAlign = "center";
        ctx.fillText("SLOT MACHINE", canvasWidth / 2, 60);
        ctx.shadowBlur = 0;

        // Reels
        for (let r = 0; r < 3; r++) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(reelPositionsX[r] - reelWidth / 2, reelWindowY - reelHeight / 2, reelWidth, reelHeight);
          ctx.clip();

          const stopFrame = spinDuration + r * 3;
          if (i < stopFrame) {
            const yOffset = (Date.now() + r * 100) % 100;
            for (let s = -1; s < 2; s++) {
              const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
              await drawEmoji(ctx, reelPositionsX[r], reelWindowY + yOffset + s * 100 - 50, randomSymbol, 70);
            }
          } else {
            if (
              winType !== "LOSS" &&
              ((winType === "JACKPOT") ||
                (winType === "DOUBLE" && (r === 0 || r === 1) && result[0] === result[1]) ||
                (winType === "DOUBLE" && (r === 1 || r === 2) && result[1] === result[2]))
            ) {
              ctx.shadowColor = "#ffcc00";
              ctx.shadowBlur = 15;
            }
            await drawEmoji(ctx, reelPositionsX[r], reelWindowY, result[r], 70);
            ctx.shadowBlur = 0;
          }
          ctx.restore();

          ctx.strokeStyle = "#444466";
          ctx.lineWidth = 2;
          ctx.strokeRect(reelPositionsX[r] - reelWidth / 2, reelWindowY - reelHeight / 2, reelWidth, reelHeight);
        }

        // Final result text
        if (i === frameCount - 1) {
          ctx.fillStyle = winnings > 0 ? "#4ade80" : "#ef4444";
          ctx.font = "bold 28px Arial";
          if (winType === "JACKPOT") {
            ctx.fillText(`JACKPOT! ${result.join(" ")}`, canvasWidth / 2, 320);
          } else if (winType === "DOUBLE") {
            ctx.fillText(`DOUBLE! ${result.join(" ")}`, canvasWidth / 2, 320);
          } else {
            ctx.fillText("NO WIN", canvasWidth / 2, 320);
          }

          if (winnings > 0) {
            ctx.fillStyle = "#ffcc00";
            ctx.font = "bold 24px Arial";
            ctx.fillText(`You won $${winnings.toLocaleString()}!`, canvasWidth / 2, 360);
          }
        }

        encoder.addFrame(ctx);
      }

      // Hold last frame
      for (let hold = 0; hold < 30; hold++) {
        encoder.addFrame(ctx);
      }

      encoder.finish();
      await new Promise((res) => gifStream.on("finish", res));

      let resultMessage = `🎰 Slot Result 🎰\n`;
      resultMessage += `Bet: $${betAmount.toLocaleString()}\n`;
      resultMessage += `Result: ${result.join(" ")}\n`;

      if (winType === "JACKPOT") {
        resultMessage += `JACKPOT! Three ${result[0]} symbols!\n`;
      } else if (winType === "DOUBLE") {
        resultMessage += `DOUBLE! Two symbols!\n`;
      } else {
        resultMessage += `No winning combination.\n`;
      }

      if (winnings > 0) {
        resultMessage += `You won $${winnings.toLocaleString()}!\n`;
      }

      resultMessage += `New balance: $${userData.money.toLocaleString()}`;

      await message.reply({
        body: resultMessage,
        attachment: fs.createReadStream(gifPath),
      });

      fs.unlinkSync(gifPath);
      message.unsend(processingMessage.messageID);
    } catch (error) {
      console.error("Slot machine error:", error);
      message.reply("Sorry, the slot machine encountered an error. Please try again later.");
      message.unsend(processingMessage.messageID);
    }
  },
};
