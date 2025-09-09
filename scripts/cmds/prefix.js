const fs = require("fs-extra");
const { utils } = global;

module.exports = {
  config: {
    name: "prefix",
    version: "2.0",
    author: "gay sobhan",
    countDown: 5,
    role: 0,
    shortDescription: "Show stylish prefix info",
    longDescription: "Displays system/chat prefix, author, date, and time in a stylish format.",
    category: "auto 🪐",
  },

  onStart: async function(){},

  onChat: async function({ event, message, threadsData }) {
    if (event.body && event.body.toLowerCase() === "prefix") {
      // Get system and chat prefix
      const systemPrefix = global.GoatBot?.config?.prefix || "∞";
      const chatPrefix = (global.utils?.getPrefix ? global.utils.getPrefix(event.threadID) : "+") || systemPrefix;
      const author = "𝐒𝐚𝐢'𝐊𝐨 𝐓. 𝐄𝐯𝐚𝐧";
      // Time in Dhaka timezone for your region
      const now = new Date();
      const dhakaTime = now.toLocaleString("en-US", { timeZone: "Asia/Dhaka" });
      // Parse date and time
      const dateObj = new Date(dhakaTime);
      const day = dateObj.getDate();
      const daySuffix = (d) => d === 1 || d === 21 || d === 31 ? "st" : d === 2 || d === 22 ? "nd" : d === 3 || d === 23 ? "rd" : "th";
      const formattedDate = dateObj.toLocaleString("en-US", { month: "long" }) + " " + day + daySuffix(day) + ", " + dateObj.getFullYear();
      const formattedTime = dateObj.toLocaleTimeString("en-US");

      // Stylish reply message
      const reply =
`┌─❖
│ 𝗣𝗥𝗘𝗙𝗜𝗫  𝗜𝗡𝗙𝗢  📍
├─❖
│ 𝗦𝗬𝗦𝗧𝗘𝗠  𝗣𝗥𝗘𝗙𝗜𝗫 : [ ${systemPrefix} ]
│ 𝗖𝗛𝗔𝗧  𝗣𝗥𝗘𝗙𝗜𝗫 : [ ${chatPrefix} ]
├─❖
│ 𝗕𝗢𝗧  𝗔𝗨𝗧𝗛𝗢𝗥 : ${author}
│ 𝗗𝗔𝗧𝗘 : ${formattedDate}
│ 𝗧𝗜𝗠𝗘 : ${formattedTime}
└─❖`;

      return message.reply({
        body: reply,
        attachment: await global.utils.getStreamFromURL("https://i.postimg.cc/sXDjTPv4/Messenger-creation-DD26421-F-BAEB-4098-BBE1-C864-E5-B74403.gif")
      });
    }
  }
};
