const axios = require("axios");
const { getStreamFromURL } = global.utils;

module.exports = {
  config: {
    name: "pin",
    aliases: ["Pinterest", "pin"],
    version: "1.0",
    author: "SiAM",
    countDown: 5,
    role: 0,
    shortDescription: "Search Pinterest and return images",
    longDescription: "Fetches images from Pinterest based on a search query",
    category: "Image",
    guide: {
      en: "{pn} your query -- [count]\n\n" +
          "Example: {pn} cute cats -- 10\n" +
          "• Default count is 5 images\n" +
          "• Maximum is 20 images"
    }
  },

  onStart: async function({ api, args, message, event }) {
    try {
      let count = 5;
      const dashIndex = args.indexOf("--");
      if (dashIndex !== -1 && args.length > dashIndex + 1) {
        const n = parseInt(args[dashIndex + 1], 10);
        if (!isNaN(n)) {
          count = Math.min(n, 20);
        }
        args.splice(dashIndex, 2);
      }

      const query = args.join(" ").trim();
      if (!query) {
        return message.reply("Please provide a search query. Example: /Pinterest mountains -- 8");
      }

    
      const processingMessage = await message.reply("🔍 Fetching images from Pinterest...");
      message.reaction("⏰", event.messageID);

   
      const res = await axios.get(
        `https://connect-foxapi.onrender.com/pinterest?search=${encodeURIComponent(query)}`
      );

      const links = Array.isArray(res.data.links) ? res.data.links : [];
      const toSend = links.slice(0, count);

      if (toSend.length === 0) {
        await message.reply(`No images found for "${query}".`);
      } else {
        
        const streams = await Promise.all(
          toSend.map((url) => getStreamFromURL(url))
        );

        
        await message.reply({
          body: `Here are ${streams.length} images for "${query}":`,
          attachment: streams
        });
      }


      await message.unsend(processingMessage.messageID);
      await message.reaction("✅", event.messageID);

    } catch (error) {
      console.error(error);
      message.reply("Err.\nServer has skil isu😾");
    }
  }
};
