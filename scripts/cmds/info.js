module.exports = {
  config: {
    name: "info",
    version: "1.0",
    author: "MUNTASIR", 
    role: 0,
    shortDescription: "Admin & Info",
    longDescription: "Bot Owner Information",
    category: "info",
  },

  onStart: async function ({ event, message, usersData, threadsData }) {
  
      const userData = await usersData.get(event.senderID);
      const userName = userData.name;

      const threadData = await threadsData.get(event.threadID);
      const threadName = threadData.threadName;

      const currentDate = new Date();
      const formattedTime = currentDate.toLocaleTimeString("en-US", {
        timeZone: "Asia/Dhaka",
        hour12: true,
      });

      const adminImageURL = `https://i.imgur.com/xwPOJrf.jpeg`;

      const infoMessage = `
‎╭──────────────────⊙
‎│ 🎀 𝗔𝗦𝗦𝗔𝗟𝗔𝗠𝗨 𝗪𝗔𝗟𝗔𝗜𝗞𝗨𝗠 🎀
‎├──────────────────❖
‎├──❯ 𝗢𝘄𝗻𝗲𝗿 𝗜𝗻𝗳𝗼 ♐
‎├‣ 📌 𝐍𝐀𝐌𝐄 : 𝗠𝗨𝗡𝗧𝗔𝗦𝗜𝗥 𝗠𝗔𝗛𝗠𝗨𝗗
‎├‣📍 𝐀𝐃𝐃𝐑𝐄𝐒𝐒 : 𝗥𝗔𝗝𝗦𝗛𝗔𝗛𝗜
‎├‣🖋️ 𝐂𝐋𝐀𝐒𝐒 : 𝗦𝗘𝗖𝗥𝗘𝗧
‎├‣ 🎀 𝐑𝐄𝐋𝐀𝐓𝐈𝐎𝐍 : 𝗠𝗜𝗡𝗚𝗟𝗘
‎│  
‎├──❯ 𝗖𝗢𝗡𝗧𝗔𝗖𝗧 🔗 
‎├‣ 💬 𝐌𝐒𝐆 : https://m.me/ibonex.edenXtonu
‎├‣ 📢 𝐓𝐆 : 𝗡/𝗔
‎│
‎├──❯ 𝗕𝗢𝗧 𝗜𝗡𝗙𝗢 🤖
‎├‣ 🔰 𝐁𝐎𝐓 𝐏𝐑𝐄𝐅𝐈𝐗 : [ # ]
‎├‣ ⚡ 𝐁𝐎𝐓 𝐍𝐀𝐌𝐄 : TOP SHELBY
‎│  
‎├──❯ 𝗚𝗖 𝗜𝗡𝗙𝗢 
‎├‣ 🎭 𝐆𝐂 𝐍𝐀𝐌𝐄 : ${threadName}
‎├‣ ⏳ 𝐓𝐈𝐌𝐄 : ${formattedTime}
‎├──────────────────❖
‎│ 🙏 𝗧𝗛𝗔𝗡𝗞𝗦 𝗙𝗢𝗥 𝗨𝗦𝗜𝗡𝗚 🙏 
‎╰──────────────────⊙`;

      message.reply({
        body: infoMessage,
        attachment: await global.utils.getStreamFromURL(adminImageURL)
      });
  }
};
