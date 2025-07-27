module.exports = {
  config: {
    name: "info",
    version: "1.0",
    author: "RANA", //Don't change the credit because I made it. Any problems to contact me. https://facebook.com/100063487970328
    countDown: 5,
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
      const adminImageURL = `https://scontent.xx.fbcdn.net/v/t1.15752-9/514466734_742767444777171_4742576670908501801_n.jpg?stp=dst-jpg_p480x480_tt6&_nc_cat=101&ccb=1-7&_nc_sid=9f807c&_nc_eui2=AeFow1ccA1kGqWPBaH-me7KzgT9H0okQDdKBP0fSiRAN0uTyDhiHWuW_EzI_xahS38Fx6ZxiGTd9b_4_dM58d4B5&_nc_ohc=yf7DFtViZH8Q7kNvwFmD7D_&_nc_oc=Adn7vPGSVwhh9Y0FzlVHOmkqdUQ2QdS4T_jka7JDaiNz5Rkycgi3W1e4EQnk4YMlAYE&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent.xx&oh=03_Q7cD2wGCqu749j9XJCkPVKB_4wxvICZvZfcrj-h6BYHvEmKRHg&oe=68924F64`;

      // মেসেজ টেমপ্লেট
      const infoMessage = `
‎╭──────────────────⊙
‎│ 🎀 𝗔𝗦𝗦𝗔𝗟𝗔𝗠𝗨 𝗪𝗔𝗟𝗔𝗜𝗞𝗨𝗠 🎀
‎├──────────────────❖
‎├──❯ 𝗢𝘄𝗻𝗲𝗿 𝗜𝗻𝗳𝗼 ♐
‎├‣ 📌 𝐍𝐀𝐌𝐄 : 𝙼𝙾𝙷𝙰𝙼𝙼𝙰𝙳 𝙰𝚂𝙸𝙵
‎├‣📍𝐀𝐃𝐃𝐑𝐄𝐒𝐒 : 𝙽𝙴𝚃𝚁𝙾𝙺𝙾𝙽𝙰 
‎│  
‎├──❯ 𝗖𝗢𝗡𝗧𝗔𝗖𝗧  🔗 
‎├‣ 🏷️ 𝐅𝐁  : facebook.com/A17.AS1F
‎├‣ 📢 𝐓𝐆  : t.me/itsmeasif23
‎├‣ 💬 𝐌𝐒𝐆 : m.me/A17.AS1F
‎│
‎├──❯ 𝗕𝗢𝗧 𝗜𝗡𝗙𝗢  🤖
‎├‣ 🔰 𝐁𝐎𝐓 𝐏𝐑𝐄𝐅𝐈𝐗 : [ ! ]
‎├‣ ⚡ 𝐁𝐎𝐓 𝐍𝐀𝐌𝐄 : - 𝐀𝐒𝐈𝐅  ✈︎  𝐁𝐎𝐓 
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
