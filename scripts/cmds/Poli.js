const axios = require("axios");

module.exports = {
  config: {
    name: "poli",
    version: "1.0",
    author: "Eren",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Generate anime-style image" },
    longDescription: { en: "Generate image using Flux-Ultra AI from a prompt" },
    category: "ai",
    guide: { en: "{pn} neko girl with pink hair" }
  },

  onStart: async function ({ message, args, api }) {
    const prompt = args.join(" ");
    if (!prompt) return message.reply("⚠️ Please enter a prompt.\n\nExample: poli demon girl with horns");

    const loading = await message.reply("✨ Generating image...");

    try {
      const response = await axios({
        method: "GET",
        url: `https://zeehao-xcos.up.railway.app/flux-ultra`,
        params: { prompt },
        responseType: "stream"
      });

      // auto unsend the loading message
      setTimeout(() => {
        api.unsendMessage(loading.messageID);
      }, 1000); // 1 second

      // send final image with styled body
      message.reply({
        body: `🎨 𝗔𝗜 𝗔𝗿𝘁 𝗚𝗲𝗻𝗲𝗿𝗮𝘁𝗲𝗱\n\n📝 𝗣𝗿𝗼𝗺𝗽𝘁: ${prompt}\n📌 𝗠𝗼𝗱𝗲𝗹: polination -v1\n\n`,
        attachment: response.data
      });
    } catch (error) {
      console.error("POLI IMAGE STREAM ERROR:", error.message);
      message.reply("❌ Failed to fetch image stream from API.");
    }
  }
};
