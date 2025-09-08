const axios = require('axios');

module.exports = {
  config: {
    name: "pnx",
    aliases: ["ah"],
    version: "1.0",
    author: "Badhon",
    countDown: 5,
    role: 2,
    shortDescription: "get random waifu",
    longDescription: "Get waifu",
    category: "18+",
    guide: "{pn} {{<name>}}"
  },

  onStart: async function ({ message, args }) {
   
    const name = args.join(" ") || "waifu"; // 
    try {
      // Construct the API URL using the provided or default category
      let res = await axios.get(`https://api.waifu.pics/nsfw/${name}`);
      let res2 = res.data;
      let img = res2.url;

      
      const form = {
        body: `   「𝗨𝗳𝘀 𝗯𝗮𝗯𝘆 𝗮𝘀𝘁𝗲 🥵」   ` // Custom message
      };

    
      if (img) {
        form.attachment = await global.utils.getStreamFromURL(img);
        message.reply(form);
      } else {
        // If no image is found in the response
        message.reply("❌ No waifu image found for this category.");
      }
    } catch (e) {
      // Error handling if the API call fails
      console.error(e);
      message.reply(`❌ Error: No waifu found for category "${name}"., fuck`);
    }
  }
};
