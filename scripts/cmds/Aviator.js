const fs = require("fs");
const path = require("path");

module.exports = {
config: {
name: "aviator",
aliases: ["avi", "plane"],
version: "1.0",
author: "GoatBot",
role: 0,
shortDescription: {
en: "Aviator crash game with live animation",
},
longDescription: {
en: "Play aviator crash game with real-time multiplier animation and auto cashout features.",
},
category: "game",
guide: {
en: `
{pn} start <bet> [auto] - Start game with bet amount and optional auto cashout
{pn} cashout - Manual cashout during game
{pn} balance - Show your balance
{pn} bonus - Daily bonus claim
{pn} top - Top 10 leaderboard
{pn} stats - Your personal statistics
{pn} history - Last 5 game results
{pn} help - Show this guide

Examples:
{pn} start 100 - Bet 100 coins
{pn} start 50 3.5 - Bet 50 coins with auto cashout at 3.5x`
}
},

langs: {
en: {
invalid_amount: "Please enter a valid bet amount (minimum 10, maximum 10000).",
not_enough_money: "You don't have enough coins to make this bet.",
game_active: "You already have an active game! Use 'aviator cashout' to cash out.",
no_active_game: "You don't have any active game.",
balance_info: "💰 Your Balance: %1 coins",
bonus_claimed: "🎁 Daily bonus claimed! +500 coins",
bonus_cooldown: "⏰ You can claim your next bonus in %1 hours.",
cashout_success: "✈️ Cashed out at %1x! Won %2 coins!",
game_crashed: "💥 Plane crashed at %1x! Lost %2 coins.",
auto_cashout: "🤖 Auto cashed out at %1x! Won %2 coins!"
}
},

onStart: async function ({ args, message, event, usersData, getLang, api }) {
const { senderID } = event;
const userData = await usersData.get(senderID);
const command = args[0]?.toLowerCase();

// Balance command  
if (command === "balance" || command === "bal") {  
  return message.reply(getLang("balance_info", userData.money));  
}  

// Help command  
if (command === "help") {  
  return message.reply(this.config.guide.en);  
}  

// Daily bonus command  
if (command === "bonus") {  
  const now = Date.now();  
  const lastBonus = userData.data?.lastBonusTime || 0;  
  const bonusCooldown = 24 * 60 * 60 * 1000; // 24 hours  
    
  if (now - lastBonus < bonusCooldown) {  
    const remainingHours = Math.ceil((bonusCooldown - (now - lastBonus)) / (60 * 60 * 1000));  
    return message.reply(getLang("bonus_cooldown", remainingHours));  
  }  

  await usersData.set(senderID, {  
    money: userData.money + 500,  
    data: {  
      ...userData.data,  
      lastBonusTime: now  
    }  
  });  

  return message.reply(getLang("bonus_claimed"));  
}  

// Top leaderboard  
if (command === "top" || command === "leaderboard") {  
  try {  
    const userIds = Object.keys(global.db.allUserData || {});  
    const leaderboard = [];  
      
    for (const userId of userIds) {  
      try {  
        const user = await usersData.get(userId);  
        if (user && typeof user.money === 'number' && user.money > 0) {  
          const safeName = (user.name || "Unknown").replace(/[<>&"']/g, "");  
          leaderboard.push({  
            name: safeName.substring(0, 30),  
            money: Math.floor(user.money)  
          });  
        }  
      } catch (userError) {  
        continue;  
      }  
    }  
      
    if (leaderboard.length === 0) {  
      return message.reply("💰 No players found!");  
    }  
      
    leaderboard.sort((a, b) => b.money - a.money);  
    const top10 = leaderboard.slice(0, 10);  
      
    let topMessage = "🏆 AVIATOR TOP 10 RICHEST PLAYERS 🏆\n\n";  
    top10.forEach((player, index) => {  
      const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`;  
      topMessage += `${medal} ${player.name}: ${player.money.toLocaleString()} coins\n`;  
    });  
      
    return message.reply(topMessage);  
  } catch (error) {  
    return message.reply("❌ Error loading leaderboard.");  
  }  
}  

// Personal stats  
if (command === "stats") {  
  const stats = userData.data?.aviatorStats || {  
    games: 0,  
    wins: 0,  
    totalBet: 0,  
    totalWon: 0,  
    maxMultiplier: 0,  
    biggestWin: 0  
  };  

  const winRate = stats.games > 0 ? ((stats.wins / stats.games) * 100).toFixed(1) : 0;  
  const avgCashout = stats.wins > 0 ? (stats.totalWon / stats.wins).toFixed(2) : 0;  

  return message.reply(`📊 YOUR AVIATOR STATS 📊

🎮 Games Played: ${stats.games}
🏆 Wins: ${stats.wins}
📈 Win Rate: ${winRate}%
🎯 Max Multiplier: ${stats.maxMultiplier}x
💰 Biggest Win: ${stats.biggestWin} coins
📊 Average Cashout: ${avgCashout}x
💸 Total Bet: ${stats.totalBet} coins
💵 Total Won: ${stats.totalWon} coins`);
}

// Game history  
if (command === "history") {  
  const history = userData.data?.aviatorHistory || [];  
    
  if (history.length === 0) {  
    return message.reply("📜 No game history found. Play some games first!");  
  }  

  let historyMessage = "📜 LAST 5 AVIATOR GAMES 📜\n\n";  
  history.slice(-5).reverse().forEach((game, index) => {  
    const result = game.won ? `Won ${game.winAmount}` : `Lost ${game.betAmount}`;  
    const multiplier = game.cashoutMultiplier || game.crashMultiplier;  
    historyMessage += `${index + 1}. Bet: ${game.betAmount} | ${multiplier}x | ${result}\n`;  
  });  

  return message.reply(historyMessage);  
}  

// Cashout command  
if (command === "cashout") {  
  const activeGame = userData.data?.activeAviatorGame;  
    
  if (!activeGame) {  
    return message.reply(getLang("no_active_game"));  
  }  

  // Calculate current multiplier based on time elapsed  
  const timeElapsed = Date.now() - activeGame.startTime;  
  const currentMultiplier = Math.min(1 + (timeElapsed / 1000) * 0.1, 50); // Max 50x  

  const winAmount = Math.floor(activeGame.betAmount * currentMultiplier);  
  const newBalance = userData.money + winAmount;  

  // Get fresh user data to prevent race conditions  
  const freshUserData = await usersData.get(senderID);  
    
  // Verify game is still active and matches  
  if (!freshUserData.data?.activeAviatorGame ||   
      freshUserData.data.activeAviatorGame.gameId !== activeGame.gameId) {  
    return message.reply("Game session expired or invalid.");  
  }  

  // Update stats consistently  
  const stats = freshUserData.data?.aviatorStats || {};  
  stats.games = (stats.games || 0) + 1;  
  stats.wins = (stats.wins || 0) + 1;  
  stats.totalBet = (stats.totalBet || 0) + activeGame.betAmount;  
  stats.totalWon = (stats.totalWon || 0) + winAmount;  
  stats.maxMultiplier = Math.max(stats.maxMultiplier || 0, currentMultiplier);  
  stats.biggestWin = Math.max(stats.biggestWin || 0, winAmount);  

  // Add to history  
  const history = freshUserData.data?.aviatorHistory || [];  
  history.push({  
    betAmount: activeGame.betAmount,  
    cashoutMultiplier: currentMultiplier,  
    winAmount: winAmount,  
    won: true,  
    timestamp: Date.now()  
  });  

  // Keep only last 20 games  
  while (history.length > 20) {  
    history.shift();  
  }  

  await usersData.set(senderID, {  
    money: freshUserData.money + winAmount,  
    data: {  
      ...freshUserData.data,  
      activeAviatorGame: null,  
      aviatorStats: stats,  
      aviatorHistory: history  
    }  
  });  

  return message.reply(getLang("cashout_success", currentMultiplier.toFixed(2), winAmount));  
}  

// Start game command  
if (command === "start") {  
  if (!args[1]) {  
    return message.reply(getLang("invalid_amount"));  
  }  
    
  const betAmount = parseFloat(args[1]);  
  const autoMultiplier = args[2] ? parseFloat(args[2]) : null;  

  if (isNaN(betAmount) || betAmount < 10 || betAmount > 10000) {  
    return message.reply(getLang("invalid_amount"));  
  }  

  if (args[2] && (isNaN(autoMultiplier) || autoMultiplier < 1.1 || autoMultiplier > 50)) {  
    return message.reply("Invalid auto multiplier. Must be between 1.1x and 50x.");  
  }  

  if (userData.money < betAmount) {  
    return message.reply(getLang("not_enough_money"));  
  }  

  if (userData.data?.activeAviatorGame) {  
    return message.reply(getLang("game_active"));  
  }  

  // Deduct bet amount and create game instance with unique ID  
  const gameId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);  
    
  await usersData.set(senderID, {  
    money: userData.money - betAmount,  
    data: {  
      ...userData.data,  
      activeAviatorGame: {  
        betAmount: betAmount,  
        autoMultiplier: autoMultiplier,  
        startTime: Date.now(),  
        gameId: gameId  
      }  
    }  
  });  

  // Start animated game  
  await this.playAviatorGame(message, api, senderID, betAmount, autoMultiplier, usersData, getLang, gameId);  
  return;  
}  

return message.reply("Invalid command. Use 'aviator help' for guide.");

},

async playAviatorGame(message, api, senderID, betAmount, autoMultiplier, usersData, getLang, gameId) {
// Generate crash point (1.0x to 50x with weighted probability)
const random = Math.random();
let crashPoint;

if (random < 0.5) crashPoint = 1 + Math.random() * 1; // 1-2x (50%)  
else if (random < 0.8) crashPoint = 2 + Math.random() * 3; // 2-5x (30%)  
else if (random < 0.95) crashPoint = 5 + Math.random() * 10; // 5-15x (15%)  
else crashPoint = 15 + Math.random() * 35; // 15-50x (5%)  
  
// Ensure crash point doesn't exceed 50x  
crashPoint = Math.min(crashPoint, 50);  

const gameMsg = await message.reply("✈️ Aviator starting...\n\n🛫 1.00x");  

let currentMultiplier = 1.0;  
let isGameActive = true;  
let autoCashedOut = false;
let editCount = 0; // Track number of edits to prevent too many

// Animation loop  
const gameInterval = setInterval(async () => {  
  if (!isGameActive) return;  

  currentMultiplier += 0.2; // Increased increment to reduce total edits

  // Check if reached crash point - stop game immediately  
  if (currentMultiplier >= crashPoint) {  
    currentMultiplier = crashPoint; // Set exact crash point  
    isGameActive = false;  
    clearInterval(gameInterval);  

    try {  
      const freshUserData = await usersData.get(senderID);  
        
      // Verify game is still valid  
      if (!freshUserData.data?.activeAviatorGame ||   
          freshUserData.data.activeAviatorGame.gameId !== gameId) {  
        return;  
      }  

      // Update stats for loss consistently  
      const stats = freshUserData.data?.aviatorStats || {};  
      stats.games = (stats.games || 0) + 1;  
      stats.totalBet = (stats.totalBet || 0) + betAmount;  

      // Add to history  
      const history = freshUserData.data?.aviatorHistory || [];  
      history.push({  
        betAmount: betAmount,  
        crashMultiplier: crashPoint,  
        winAmount: 0,  
        won: false,  
        timestamp: Date.now()  
      });  

      // Keep only last 20 games  
      while (history.length > 20) {  
        history.shift();  
      }  

      await usersData.set(senderID, {  
        money: freshUserData.money,  
        data: {  
          ...freshUserData.data,  
          activeAviatorGame: null,  
          aviatorStats: stats,  
          aviatorHistory: history  
        }  
      });  

      try {  
        await api.editMessage(`✈️ AVIATOR GAME ✈️\n\n💥 CRASHED at ${crashPoint.toFixed(2)}x!\n💸 You Lost: ${betAmount} coins\n💵 Balance: ${freshUserData.money} coins`, gameMsg.messageID);  
      } catch (editError) {  
        await message.reply(`💥 Plane crashed at ${crashPoint.toFixed(2)}x! You lost ${betAmount} coins`);  
      }  
    } catch (error) {  
      console.error("Crash handling error:", error);  
    }  
    return;  
  }  

  // Check auto cashout  
  if (autoMultiplier && currentMultiplier >= autoMultiplier && !autoCashedOut) {  
    autoCashedOut = true;  
    isGameActive = false;  
    clearInterval(gameInterval);  

    const winAmount = Math.floor(betAmount * autoMultiplier);  
      
    try {  
      const freshUserData = await usersData.get(senderID);  
        
      // Verify game is still valid  
      if (!freshUserData.data?.activeAviatorGame ||   
          freshUserData.data.activeAviatorGame.gameId !== gameId) {  
        return;  
      }  

      // Update stats consistently  
      const stats = freshUserData.data?.aviatorStats || {};  
      stats.games = (stats.games || 0) + 1;  
      stats.wins = (stats.wins || 0) + 1;  
      stats.totalBet = (stats.totalBet || 0) + betAmount;  
      stats.totalWon = (stats.totalWon || 0) + winAmount;  
      stats.maxMultiplier = Math.max(stats.maxMultiplier || 0, autoMultiplier);  
      stats.biggestWin = Math.max(stats.biggestWin || 0, winAmount);  

      // Add to history  
      const history = freshUserData.data?.aviatorHistory || [];  
      history.push({  
        betAmount: betAmount,  
        cashoutMultiplier: autoMultiplier,  
        winAmount: winAmount,  
        won: true,  
        timestamp: Date.now()  
      });  

      // Keep only last 20 games  
      while (history.length > 20) {  
        history.shift();  
      }  

      const newBalance = freshUserData.money + winAmount;  

      await usersData.set(senderID, {  
        money: newBalance,  
        data: {  
          ...freshUserData.data,  
          activeAviatorGame: null,  
          aviatorStats: stats,  
          aviatorHistory: history  
        }  
      });  

      try {  
        await api.editMessage(`✈️ AVIATOR GAME ✈️\n\n🤖 Auto cashed out at ${autoMultiplier.toFixed(2)}x!\n💰 You Won: ${winAmount} coins\n💵 Balance: ${newBalance} coins`, gameMsg.messageID);  
      } catch (editError) {  
        await message.reply(`🤖 Auto cashed out at ${autoMultiplier.toFixed(2)}x! You won ${winAmount} coins`);  
      }  
    } catch (error) {  
      console.error("Auto cashout error:", error);  
    }  
    return;  
  }  

  // Only edit if we haven't exceeded limit and at specific intervals
  if (editCount < 3 && (currentMultiplier % 1.0 < 0.3 || (autoMultiplier && currentMultiplier >= autoMultiplier - 0.5))) {
    editCount++;
    const display = `✈️ AVIATOR GAME ✈️\n\n🛫 ${currentMultiplier.toFixed(2)}x\n💰 Bet: ${betAmount} coins${autoMultiplier ? `\n🤖 Auto: ${autoMultiplier}x` : '\n💡 Type "aviator cashout" to cash out!'}`;  
      
    try {  
      await api.editMessage(display, gameMsg.messageID);  
    } catch (error) {  
      // Skip fallback to avoid too many messages
    }  
  }

}, 800); // Slower update interval to reduce edits

// Safety timeout (max 1 minute to reduce risk)  
setTimeout(async () => {  
  if (isGameActive) {  
    isGameActive = false;  
    clearInterval(gameInterval);  
      
    const timeoutMultiplier = Math.min(1 + (60000 / 1000) * 0.1, 50); // 1 minute timeout
      
    try {  
      const freshUserData = await usersData.get(senderID);  
        
      // Verify game is still valid  
      if (!freshUserData.data?.activeAviatorGame ||   
          freshUserData.data.activeAviatorGame.gameId !== gameId) {  
        return;  
      }  

      // Handle timeout as a crash with consistent stats  
      const stats = freshUserData.data?.aviatorStats || {};  
      stats.games = (stats.games || 0) + 1;  
      stats.totalBet = (stats.totalBet || 0) + betAmount;  

      const history = freshUserData.data?.aviatorHistory || [];  
      history.push({  
        betAmount: betAmount,  
        crashMultiplier: timeoutMultiplier,  
        winAmount: 0,  
        won: false,  
        timestamp: Date.now()  
      });  

      while (history.length > 20) {  
        history.shift();  
      }  

      await usersData.set(senderID, {  
        money: freshUserData.money,  
        data: {  
          ...freshUserData.data,  
          activeAviatorGame: null,  
          aviatorStats: stats,  
          aviatorHistory: history  
        }  
      });  

      try {  
        await api.editMessage(`✈️ AVIATOR GAME ✈️\n\n⏰ Game timeout at ${timeoutMultiplier.toFixed(2)}x!\n💸 You Lost: ${betAmount} coins\n💵 Balance: ${freshUserData.money} coins`, gameMsg.messageID);  
      } catch (editError) {  
        await message.reply(`⏰ Game timeout at ${timeoutMultiplier.toFixed(2)}x! You lost ${betAmount} coins`);  
      }  
    } catch (error) {  
      console.error("Timeout handling error:", error);  
    }  
  }  
}, 60000); // Reduced to 1 minute

}
};
