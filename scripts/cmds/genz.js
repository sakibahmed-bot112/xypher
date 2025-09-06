const fs = require("fs");
const path = require("path");
const axios = require("axios");

const data = {}; 

module.exports = {
  config: {
    name: "genz",
    aliases: [],
    author: "UPoL Zox",
    version: "2.0",
    cooldowns: 5,
    role: 0,
    shortDescription: "Turn imagination into visuals",
    longDescription: "Generate a stunning image based on your text or replied message.",
    category: "image",
    guide: "{pn} <your prompt> or reply to a message",
  },

  onStart: async function ({ message, args, event, usersData }) {
    const uid = event.senderID;
    const name = await usersData.getName(uid);
    const prompt = args.join(" ") || (event.type === "message_reply" ? event.messageReply.body : null);

    if (!prompt) return message.reply("â— Please provide a prompt or reply to a message to use as the prompt.");

    const today = new Date().toDateString();
    if (!data[uid]) data[uid] = { date: today, count: 0 };
    if (data[uid].date !== today) {
      data[uid].date = today;
      data[uid].count = 0;
    }

    if (data[uid].count >= 10) {
      return message.reply(`âš ï¸ You have reached your daily image generation limit of 10. Try again tomorrow.`);
    }

    const tagUser = {
      body: `â³ Dear ${name}, crafting your visual masterpiece from your imagination...`,
      mentions: [{ id: uid, tag: name }]
    };

    const startTime = Date.now();
    message.reply(tagUser, async (err, info) => {
      try {
        const imagineApiUrl = `https://zox-orewa.onrender.com/gen?prompt=${encodeURIComponent(prompt)}`;
        const response = await axios.get(imagineApiUrl, { responseType: "arraybuffer" });

        const imagePath = path.join(__dirname, "cache", `${Date.now()}_aiart.png`);
        fs.writeFileSync(imagePath, Buffer.from(response.data, "binary"));

        const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2);
        data[uid].count++;

        const stream = fs.createReadStream(imagePath);
        message.reply({
          body: `ðŸ–¼ï¸ Image generated successfully in ${timeTaken}s.`,
          attachment: stream
        }, () => {
          fs.unlinkSync(imagePath);
        });
      } catch (error) {
        console.error("GENZ Error:", error);
        message.reply("âŒ An error occurred while generating your image. Please try again later.");
      }
    });
  }
};
