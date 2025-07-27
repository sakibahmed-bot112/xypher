module.exports = {
    config: {
        name: "rps",
        version: "1.0.0",
        hasPermission: 0,
        author: "Xos Eren",
        description: "✊✋✌️ Play Rock, Paper, Scissors & win coins!",
        commandCategory: "games",
        usages: "[rock/paper/scissors] [bet_amount]",
        cooldowns: 5,
        aliases: ["rockpaperscissors", "rpsgame"]
    },

    onStart: async function ({ api, event, args, usersData }) {
        let userChoice = args[0]?.toLowerCase();
        let betAmount = parseInt(args[1]);
        let userID = event.senderID;

        if (!["✊", "🖐️", "✌️"].includes(userChoice)) {
            return api.sendMessage("⚠️ Please choose rock, paper, or scissors!", event.threadID, event.messageID);
        }

        if (!betAmount || isNaN(betAmount) || betAmount <= -0) {
            return api.sendMessage("Please chose Amount \n\nEx : {pn} Rps ✌️ 10", event.threadID, event.messageID);
        }

        // Get user's balance
        let userData = await usersData.get(userID);
        let balance = userData.money || 0;

        if (betAmount > balance) {
            return api.sendMessage(`❌ You don't have enough money! Your balance: ${balance} coins`, event.threadID, event.messageID);
        }

        // Bot's random choice
        let choices = ["✊", "🖐️", "✌️"];
        let botChoice = choices[Math.floor(Math.random() * choices.length)];

        let resultMessage = `──────( 𝐑𝐞𝐬𝐮𝐥𝐭 )──────\n\n𝐘𝐨𝐮 𝐜𝐡𝐨𝐬𝐞 =  ${userChoice}\n𝐁𝐨𝐭 𝐜𝐡𝐨𝐬𝐞 =  ${botChoice}\n\n`;

        // Determine winner
        if (
            (userChoice === "✊" && botChoice === "✌️") ||
            (userChoice === "✌️" && botChoice === "🖐️") ||
            (userChoice === "🖐️" && botChoice === "✊")
        ) {
            balance += betAmount;
            resultMessage += `──────( 𝐏𝐫𝐨𝐟𝐢𝐭 )──────\n\n𝐘𝐨𝐮 𝐰𝐢𝐧 : ${betAmount} coins!\n𝐍𝐞𝐰 𝐁𝐚𝐥𝐚𝐧𝐜𝐞: ${balance} `;
        } else if (userChoice === botChoice) {
            resultMessage += `──────( 𝐝𝐫𝐚𝐰 )──────\n 𝐁𝐚𝐥𝐚𝐧𝐜𝐞: ${balance} coins`;
        } else {
            balance -= betAmount;
            resultMessage += ` ──────( 𝐋𝐨𝐬𝐞 )──────\n\n𝐘𝐨𝐮 𝐥𝐨𝐬𝐭 ${betAmount} coins\n𝐍𝐞𝐰 𝐁𝐚𝐥𝐚𝐧𝐜𝐞: ${balance} coins`;
        }

        // Update user's balance
        await usersData.set(userID, { money: balance });

        return api.sendMessage(resultMessage, event.threadID, event.messageID);
    }
};
