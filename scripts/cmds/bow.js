const axios = require("axios");

module.exports = {
  config: {
    name: "bow",
    aliases: ["wife"], // ✅ এখানে alias যোগ করা হলো
    version: "1.0.0",
    permission: 0,
    role: 0, // ✅ role 0 সেট করা হলো
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

      // ✅ র‍্যান্ডম ফিমেল ইউজার বাছাই
      const randomUID = femaleIDs[Math.floor(Math.random() * femaleIDs.length)];
      const name = await usersData.getName(randomUID);

      // ✅ Avatar URL ঠিক করা
      const avatarUrl = `https://graph.facebook.com/${randomUID}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

      const stream = await global.utils.getStreamFromURL(avatarUrl);

      const framedMessage = `
╔════════════════════════╗
║           🚺 - বউ সিলেকশন - 🚺       
╠════════════════════════╣
║ 👩 𝗡𝗮𝗺𝗲: ${name.padEnd(15, " ")}
║ 🆔 𝗨𝗶𝗱: ${randomUID.padEnd(15, " ")}
╠════════════════════════╣
║  - এটা লাগবে নাকি বল..!😕 
║  - শালা বউ কয়টা লাগে তর..!🥱   
╚════════════════════════╝
`;

      // ✅ মেসেজ সেন্ড করে msgID স্টোর করি
      const sent = await api.sendMessage({ body: framedMessage, attachment: stream }, event.threadID, event.messageID);

      // ✅ ২৫ সেকেন্ড পরে আনসেন্ট
      setTimeout(() => {
        api.unsendMessage(sent.messageID);
      }, 25000);

    } catch (error) {
      api.sendMessage("ত্রুটি: " + error.message, event.threadID, event.messageID);
    }
  }
};
