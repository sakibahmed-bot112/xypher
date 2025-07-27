module.exports = {
  config: {
    name: "blur",
    aliases: [],
    version: "1.0",
    author: "Ayan Nzt",
    description: "Blur an image with optional level",
    usage: "[level] (reply image)",
    category: "image"
  },
  onStart: async function ({ api, event, args }) {
    const axios = require("axios");
    const fs = require("fs-extra");

    if (!event.messageReply || !event.messageReply.attachments || event.messageReply.attachments.length === 0)
      return api.sendMessage("⚠️ Reply to an image.", event.threadID, event.messageID);

    const url = event.messageReply.attachments[0].url;
    const level = args[0] || 5; // default blur level = 5
    const apiUrl = `https://mahis-global-api.up.railway.app/api/blur?url=${encodeURIComponent(url)}&level=${level}`;
    const path = __dirname + `/cache/blur_${Date.now()}.png`;

    try {
      const response = await axios.get(apiUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(path, Buffer.from(response.data, "binary"));

      api.sendMessage({
        body: `✅ Here is your blurred image (level ${level}).`,
        attachment: fs.createReadStream(path)
      }, event.threadID, () => fs.unlinkSync(path), event.messageID);

    } catch (err) {
      console.error(err);
      api.sendMessage("❌ Failed to process image.", event.threadID, event.messageID);
    }
  }
};
