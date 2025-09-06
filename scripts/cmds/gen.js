const fs = require("fs");
const path = require("path");
const os = require("os");
const fetch = require("node-fetch");
const { randomUUID } = require("crypto");

module.exports = {
  config: {
    name: "gen",
    version: "1.3",
    author: "UPoL Zox",
    prefix: "awto",
    shortDescription: "Generate an image using picedit.top API",
    guide: "{p}{n} <prompt>",
    category: "without prefix",
  },

  onStart: async function ({ args, message }) {
    try {
      const prompt = args.join(" ").trim();
      if (!prompt) return message.reply("⚠âš ï¸� Please provide a prompt for the image .");

      const waiting = await message.reply(` âš ï¸� generating image...`);

      const response = await fetch("https://www.picedit.top/api/image", {
        method: "POST",
        headers: {
          "accept": "*/*",
          "content-type": "application/json",
          "origin": "https://www.picedit.top",
          "referer": "https://www.picedit.top/",
          "user-agent": "Mozilla/5.0"
        },
        body: JSON.stringify({ prompt, image: null })
      });

      if (!response.ok) {
        return message.reply(`HTTP ${response.status} - ${await response.text()}`);
      }

      const data = await response.json();
      if (!data.image) return message.reply("❌ No image returned from API.");

      const base64Data = data.image.split(",")[1];
      const imgBuffer = Buffer.from(base64Data, "base64");
      const filePath = path.join(os.tmpdir(), `picedit_${randomUUID()}.png`);
      fs.writeFileSync(filePath, imgBuffer);

      try { 
        await message.unsend(waiting.messageID); 
      } catch {}

      await message.reply({
        body: `✨ Here is your image:`,
        attachment: fs.createReadStream(filePath)
      });

      fs.unlinkSync(filePath);

    } catch (err) {
      console.error("PicEdit error:", err);
      return message.reply("❌ Failed to generate image. Please try again later.");
    }
  }
};
