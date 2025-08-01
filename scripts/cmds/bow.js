const axios = require("axios");

module.exports = {
  config: {
    name: "bowde",
    aliases: [],
    version: "1.0.0",
    permission: 0,
    author: "Asif",
    prefix: "awto",
    description: "Randomly select a 'bow' from group",
    category: "fun",
    cooldowns: 5
  },

  onStart: async function({ api, event, usersData }) {
    try {
      const threadInfo = await api.getThreadInfo(event.threadID);
      const participantIDs = threadInfo.participantIDs;

      const femaleIDs = [];
      for (const id of participantIDs) {
        if (id === api.getCurrentUserID()) continue;
        const userInfo = await api.getUserInfo(id);
        if (userInfo[id].gender === 1) {
          femaleIDs.push(id);
        }
      }

      if (femaleIDs.length === 0) {
        return api.sendMessage("দুঃখিত, গ্রুপে কোনো মেয়ে পাওয়া যায়নি।", event.threadID, event.messageID);
      }

      const randomUID = femaleIDs[Math.floor(Math.random() * femaleIDs.length)];
      const name = await usersData.getName(randomUID);
      const avatarUrl = await usersData.getAvatarUrl(randomUID);

      if (!avatarUrl) throw new Error("প্রোফাইল ছবি পাওয়া যায়নি।");

      const stream = await global.utils.getStreamFromURL(avatarUrl);

      const framedMessage = `
╔════════════════════════╗
║      🚺 - বউ সিলেকশন - 🚺       
╠════════════════════════╣
║ 👩 𝗡𝗮𝗺𝗲: ${name.padEnd(15, " ")}
║ 🆔 𝗨𝗶𝗱: ${randomUID.padEnd(15, " ")}
╠════════════════════════╣
║  - এটা লাগবে নাকি বল..!😕 
║  - নাকি আরেকটা দিব..!🥱   ╚════════════════════════╝
`;

      // মেসেজ সেন্ড করে msgID স্টোর করি
      const sent = await api.sendMessage({ body: framedMessage, attachment: stream }, event.threadID, event.messageID);

      // ২৫ সেকেন্ড (25000 মিলিসেকেন্ড) পরে আনসেন্ট
      setTimeout(() => {
        api.unsendMessage(sent.messageID);
      }, 25000);

    } catch (error) {
      api.sendMessage("ত্রুটি: " + error.message, event.threadID, event.messageID);
    }
  }
};
