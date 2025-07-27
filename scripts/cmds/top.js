module.exports = {
  config: {
    name: "top",
    aliases: ["tp", "yeager"],
    version: "1.0",
    author: "Xos Eren",
    role: 0,
    shortDescription: {
      en: "Top 15 Rich Users"
    },
    longDescription: {
      en: "Displays the top 15 richest users in terms of money with formatted values."
    },
    category: "group",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ api, args, message, event, usersData }) {
    // Format money in different units (Billion, Million, Thousand)
    function formatMoney(amount) {
      if (amount >= 1e9) return `${(amount / 1e9).toFixed(2)} B💰`;
      if (amount >= 1e6) return `${(amount / 1e6).toFixed(2)} M💸`;
      if (amount >= 1e3) return `${(amount / 1e3).toFixed(2)} K💰`;
      return amount.toString();
    }

    // Get all users' data
    const allUsers = await usersData.getAll();

    // Sort users by money and take top 15
    const topUsers = allUsers.sort((a, b) => b.money - a.money).slice(0, 15);

    // Map the sorted users into a formatted list
    const topUsersList = topUsers.map((user, index) => {
      return `🔹 Rank ${index + 1} - ${user.name}\n💰 Balance: ${formatMoney(user.money)}\n`;
    });

    // Create message text
    const messageText = `
    Top 15 Richest Players 👥

    🎮 Player Rankings📊
    ${topUsersList.join('\n')}

    💡 Keep earning to improve your rank! 🚀💰
    `;
    
    // Send the formatted leaderboard
    message.reply(messageText);
  }
};
