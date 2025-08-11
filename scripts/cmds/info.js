module.exports = {
  config: {
    name: "info",
    version: "1.0",
    author: "RANA", 
    role: 0,
    shortDescription: "Admin & Info",
    longDescription: "Bot Owner Information",
    category: "info",
  },

  onStart: async function ({ event, message, usersData, threadsData }) {
  
      // ইউজার ও থ্রেডের তথ্য সংগ্রহ
      const userData = await usersData.get(event.senderID);
      const userName = userData.name;

      const threadData = await threadsData.get(event.threadID);
      const threadName = threadData.threadName;

      // তারিখ ও সময় সংগ্রহ
      const currentDate = new Date();
      const formattedDate = currentDate.toLocaleDateString("en-US", {
        year: "numeric", 
        month: "long", 
        day: "numeric"
      });

      const formattedTime = currentDate.toLocaleTimeString("en-US", {
        timeZone: "Asia/Dhaka",
        hour12: true,
      });

      // এডমিনের ছবি URL
      const adminImageURL = `https://files.catbox.moe/8zrewo.jpg`;

      // মেসেজ টেমপ্লেট
      const infoMessage = `
‎╭──────────────────⊙
‎│ 🎀 𝗔𝗦𝗦𝗔𝗟𝗔𝗠𝗨 𝗪𝗔𝗟𝗔𝗜𝗞𝗨𝗠 🎀
‎├──────────────────❖
‎├──❯ 𝗢𝘄𝗻𝗲𝗿 𝗜𝗻𝗳𝗼 ♐
‎├‣ 📌 𝐍𝐀𝐌𝐄 : 𝙼𝙾𝙷𝙰𝙼𝙼𝙰𝙳 𝙰𝚂𝙸𝙵
‎├‣📍 𝐀𝐃𝐃𝐑𝐄𝐒𝐒 : 𝙽𝙴𝚃𝚁𝙾𝙺𝙾𝙽𝙰 
‎├‣🖋️ 𝐂𝐋𝐀𝐒𝐒 : 𝙸𝙽𝚃𝙴𝚁 𝚂𝙴𝙲𝙾𝙽𝙳 𝚈𝙴𝙰𝚁
‎├‣ 🎀 𝐑𝐄𝐋𝐀𝐓𝐈𝐎𝐍 : 𝚂𝙸𝙽𝙶𝙻𝙴
‎│  
‎├──❯ 𝗖𝗢𝗡𝗧𝗔𝗖𝗧  🔗 
‎├‣ 🏷️ 𝐅𝐁  : facebook.com/A17.AS1F
‎├‣ 📢 𝐓𝐆  : t.me/itsmeasif23
‎├‣ 💬 𝐌𝐒𝐆 : m.me/A17.AS1F
‎│
‎├──❯ 𝗕𝗢𝗧 𝗜𝗡𝗙𝗢  🤖
‎├‣ 🔰 𝐁𝐎𝐓 𝐏𝐑𝐄𝐅𝐈𝐗 : [ ! ]
‎├‣ ⚡ 𝐁𝐎𝐓 𝐍𝐀𝐌𝐄 : 𝐄𝐥𝐨𝐧 𝐓𝐞𝐧 
‎│  
‎├──❯ 𝗚𝗖 𝗜𝗡𝗙𝗢 
‎├‣ 🎭 𝙶𝙲 𝙽𝙰𝙼𝙴 :${threadName}
‎├‣ ⏳ 𝚃𝙸𝙼𝙴 : ${formattedTime}  
‎├──────────────────❖
‎│ 🙏 𝗧𝗛𝗔𝗡𝗞𝗦 𝗙𝗢𝗥 𝗨𝗦𝗜𝗡𝗚 🙏 
‎╰──────────────────⊙`;

      // মেসেজ পাঠানো
      message.reply({
        body: infoMessage,
        attachment: await global.utils.getStreamFromURL(adminImageURL)
      });
  }
};
