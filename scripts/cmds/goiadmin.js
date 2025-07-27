const axios = require("axios");

let lastResponse = null; // আগের মেসেজ মনে রাখার জন্য

module.exports = {
  config: {
    name: "goiadmin",
    author: "Eren",
    role: 0,
    shortDescription: "Owner Mention Protection",
    longDescription: "Prevents unnecessary mentions of Eren",
    category: "BOT",
    guide: "{pn}"
  },

  onChat: async function({ api, event }) {
    const authorID = "61576212342334";

    if (event.senderID !== authorID) {
      const mentions = Object.keys(event.mentions || {});
      if (mentions.includes(authorID)) {
        try {
          const res = await axios.get("https://raw.githubusercontent.com/Ayan-alt-deep/xyc/main/goiadmin.json");
          const responses = res.data.responses;

          if (!responses || responses.length === 0)
            return api.sendMessage("❌ JSON ফাঁকা!", event.threadID);

          let filtered = responses.filter(msg => msg !== lastResponse);
          if (filtered.length === 0) filtered = responses;

          const random = filtered[Math.floor(Math.random() * filtered.length)];
          lastResponse = random;

          return api.sendMessage({ body: random }, event.threadID, event.messageID);
        } catch (err) {
          return api.sendMessage("❌ JSON থেকে ডেটা নিতে সমস্যা হয়েছে!", event.threadID);
        }
      }
    }
  },

  onStart: async function() {
    console.log("✅ goiadmin Module Loaded with Anti-Repeat Random System");
  }
};
