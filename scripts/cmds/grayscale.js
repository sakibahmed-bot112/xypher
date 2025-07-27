module.exports = {
  config: {
    name: "grayscale",
    aliases: ["gray"],
    version: "1.0",
    author: "Ayan Nzt",
    description: "Make image grayscale",
    usage: "[reply image]",
    category: "image"
  },
  onStart: async function ({ api, event, args }) {
    const axios = require("axios");
    const fs = require("fs-extra");

    if (!event.messageReply || !event.messageReply.attachments || event.messageReply.attachments.length === 0)
      return api.sendMessage("⚠️ Reply to an image.", event.threadID, event.messageID);

    const url = event.messageReply.attachments[0].url;
    const apiUrl = `https://mahis-global-api.up.railway.app/api/grayscale?url=${encodeURIComponent(url)}`;
    const path = __dirname + `/cache/grayscale_${Date.now()}.png`;

    try {
      const response = await axios.get(apiUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(path, Buffer.from(response.data, "binary"));

      api.sendMessage({
        body: "✅ Here is your grayscale image.",
        attachment: fs.createReadStream(path)
      }, event.threadID, () => fs.unlinkSync(path), event.messageID);

    } catch (err) {
      console.error(err);
      api.sendMessage("❌ Failed to process image.", event.threadID, event.messageID);
    }
  }
};
