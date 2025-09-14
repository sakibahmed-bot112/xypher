const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "niggah",
    version: "1.0",
    author: "TawsiN",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Generate a funny image from UID" },
    longDescription: { en: "Generate a direct image using the mentioned or replied user's UID" },
    category: "fun",
    guide: { en: "{p}{n} @mention or reply to a user" }
  },

  onStart: async function ({ event, api, message }) {
    try {
      let uid;

      // Handle reply case
      if (event.type === "message_reply") {
        uid = event.messageReply.senderID;
      }

      // Handle mention
      else if (Object.keys(event.mentions).length > 0) {
        uid = Object.keys(event.mentions)[0];
      }

      // If no mention or reply
      else {
        return message.reply("❌ Please mention a user or reply to their message.");
      }

      // API URL
      const url = `https://betadash-api-swordslush-production.up.railway.app/nigga?userid=${uid}`;

      // Get image
      const imgPath = path.join(__dirname, "cache", `${uid}_nigga.jpg`);
      const res = await axios.get(url, { responseType: "arraybuffer" });
      fs.writeFileSync(imgPath, Buffer.from(res.data, "binary"));

      // Send image
      await message.reply({ attachment: fs.createReadStream(imgPath) });

      // Cleanup
      fs.unlinkSync(imgPath);
    } catch (err) {
      console.error(err);
      message.reply("❌ Failed to generate image.");
    }
  }
};
