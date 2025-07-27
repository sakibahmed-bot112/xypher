const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "dal",
    aliases: ["mdal"],
    author: "Mahi--",
    version: "2.0",
    cooldowns: 15,
    role: 0,
    shortDescription: "Generate stunning artwork from your prompts.",
    longDescription: "Transforms your prompt into a beautifully crafted image using the Mobius AI system.",
    category: "AI Tools",
    guide: "{p}dal <your prompt>",
  },

  onStart: async function ({ message, args, api, event }) {
    const prompt = args.join(" ");
    if (!prompt) {
      return api.sendMessage("⚠ | You need to provide a prompt to create an image. Try something descriptive!", event.threadID);
    }

    const startTime = Date.now();
    api.sendMessage("🎨 | Working on your masterpiece... please hold tight!", event.threadID, event.messageID);

    try {
      const apiUrl = `https://mahi-apis.onrender.com/api/dal?prompt=${encodeURIComponent(prompt)}`;
      const response = await axios.get(apiUrl);

      const imageUrl = response.data.imageUrl;
      if (!imageUrl) {
        return api.sendMessage("❌ | Couldn’t fetch the image right now. Try again soon!", event.threadID);
      }

      const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });
      const cacheFolderPath = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheFolderPath)) fs.mkdirSync(cacheFolderPath);

      const imagePath = path.join(cacheFolderPath, `generated_image_${Date.now()}.png`);
      fs.writeFileSync(imagePath, Buffer.from(imageResponse.data, "binary"));

      const generationTime = ((Date.now() - startTime) / 1000).toFixed(2);
      const stream = fs.createReadStream(imagePath);

      message.reply({
        body: `✨ | Here’s your generated image based on the prompt:\n*${prompt}*\n\n🕐 Created in ${generationTime} seconds.`,
        attachment: stream
      });

    } catch (error) {
      console.error("Image Generation Error:", error);
      return api.sendMessage("❌ | Something went wrong. Try a different prompt or try again later.", event.threadID);
    }
  }
};
