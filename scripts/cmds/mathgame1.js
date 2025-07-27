const fs = require("fs");
module.exports = {
  config: {
    name: "mathgame1",
    aliases: ["math"],
    version: "6.2",
    author: "Anthony",
    description: "An interactive math game with multiple-choice questions, a leaderboard, won points, and a 40-second answer limit!",
    category: "Games",
    usages: "mathgame | mathgame leaderboard | mathgame wonpoints",
    cooldowns: 3
  },
const fs = require("fs");

module.exports = {
  config: {
    name: "mathgame1",
    aliases: ["math"],
    version: "6.2",
    author: "Anthony",
    description: "An interactive math game with multiple-choice questions, a leaderboard, won points, and a 40-second answer limit!",
    category: "Games",
    usages: "mathgame | mathgame leaderboard | mathgame wonpoints",
    cooldowns: 3
  },

  onStart: async function ({ event, api }) {
    const { threadID, senderID, body } = event;

    if (!global.GoatBot) global.GoatBot = {};
    if (!global.GoatBot.mathGame) global.GoatBot.mathGame = {};
    if (!global.GoatBot.leaderboard) global.GoatBot.leaderboard = {};
    if (!global.GoatBot.wonPoints) global.GoatBot.wonPoints = {};
    if (!global.GoatBot.onReply) global.GoatBot.onReply = new Map();
    if (!global.GoatBot.rounds) global.GoatBot.rounds = {};
    if (!global.GoatBot.timers) global.GoatBot.timers = {};

    if (!global.GoatBot.leaderboard[threadID]) global.GoatBot.leaderboard[threadID] = {};
    if (!global.GoatBot.wonPoints[threadID]) global.GoatBot.wonPoints[threadID] = 0;
    if (!global.GoatBot.rounds[threadID]) global.GoatBot.rounds[threadID] = 0;

    if (body.toLowerCase().includes("leaderboard")) {
      return this.sendLeaderboard({ api, threadID });
    } else if (body.toLowerCase().includes("wonpoints")) {
      return this.sendWonPoints({ api, threadID });
    }

    global.GoatBot.rounds[threadID] = 0;
    this.generateQuestion({ event, api });
  },

  generateQuestion: function ({ event, api }) {
    const { threadID, senderID } = event;

    if (global.GoatBot.rounds[threadID] >= 5) {
      api.sendMessage("🎉 Math game session completed! Start again with 'mathgame'.", threadID);
      return;
    }

    const operations = ["+", "-", "*", "/"];
    let num1 = Math.floor(Math.random() * 50) + 1;
    let num2 = Math.floor(Math.random() * 20) + 1;
    let operation = operations[Math.floor(Math.random() * operations.length)];
    let correctAnswer, options = [];

    switch (operation) {
      case "+": correctAnswer = num1 + num2; break;
      case "-": correctAnswer = num1 - num2; break;
      case "*": correctAnswer = num1 * num2; break;
      case "/": correctAnswer = parseFloat((num1 / num2).toFixed(2)); break;
    }

    options.push(correctAnswer);
    while (options.length < 4) {
      let wrongAnswer = Math.floor(Math.random() * 100) + 1;
      if (!options.includes(wrongAnswer)) {
        options.push(wrongAnswer);
      }
    }

    options.sort(() => Math.random() - 0.5);
    let correctIndex = options.indexOf(correctAnswer) + 1;

    api.getUserInfo(senderID, (err, data) => {
      if (err) return console.error("Error fetching user info:", err);
      const userName = data[senderID].name;

      api.sendMessage({
        body: `🧮 Solve this (Round ${global.GoatBot.rounds[threadID] + 1}/5):\n` +
          `${num1} ${operation} ${num2}\n` +
          options.map((opt, index) => `${index + 1}. ${opt}`).join("\n") +
          `\n\nReply with the correct option number (1-4).\nOnly @${userName} can answer! (You have **40 seconds**)`,
        mentions: [{ tag: userName, id: senderID }]
      }, threadID, (err, info) => {
        if (err) return console.error("Error sending message:", err);

        global.GoatBot.mathGame[threadID] = { correctIndex, options, senderID };
        global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, threadID, correctIndex });

        // Set a 40-second timer for the answer
        global.GoatBot.timers[threadID] = setTimeout(() => {
          if (global.GoatBot.mathGame[threadID]) {
            api.sendMessage("⏳ Time's up! Moving to the next question...", threadID);
            delete global.GoatBot.mathGame[threadID];
            global.GoatBot.rounds[threadID] += 1;
            if (global.GoatBot.rounds[threadID] < 5) {
              this.generateQuestion({ event, api });
            } else {
              api.sendMessage("🎉 Math game session completed! Start again with 'mathgame'.", threadID);
            }
          }
        }, 40000);
      });
    });
  },

  onReply: async function ({ event, api }) {
    const { body, threadID, senderID, messageID } = event;

