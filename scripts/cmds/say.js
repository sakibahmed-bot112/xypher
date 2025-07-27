const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "say",
    aliases: [],
    version: "1.0",
    author: "Mahi",
    countDown: 3,
    role: 0
  },

  onStart: async function ({ api, event, args }) {
    const text = args.join(" ");
    if (!text) return api.sendMessage("⚠️ Please provide some text.\nExample: !say Hello there", event.threadID, event.messageID);

    const apiUrl = `https://text-to-speach-kappa.vercel.app/say?text=${encodeURIComponent(text)}`;
    const filePath = path.join(__dirname, "temp_say.mp3");

    try {
      const response = await axios({
        url: apiUrl,
        method: "GET",
        responseType: "stream"
      });

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      writer.on("finish", () => {
        const replyTarget = event.messageReply?.messageID || event.messageID;

        api.sendMessage({
          attachment: fs.createReadStream(filePath)
        }, event.threadID, () => fs.unlinkSync(filePath), replyTarget);
      });

      writer.on("error", err => {
        console.error("File write error:", err);
        api.sendMessage("❌ Failed to write audio file.", event.threadID, event.messageID);
      });
    } catch (err) {
      console.error("TTS API error:", err.message);
      api.sendMessage("❌ Failed to generate voice.", event.threadID, event.messageID);
    }
  }
};
