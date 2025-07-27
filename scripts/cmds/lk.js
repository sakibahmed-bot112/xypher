const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "lk",
    category: "MEDIA",
    author: "Ma Hi",
    usage: "Reply to an image, video or audio file with: lk",
    cooldown: 5,
    role: 0
  },

  onStart: async ({ event, message }) => {
    const att = event.messageReply?.attachments?.[0];
    if (!att) return message.reply("Please reply to an image, video, or audio file.");

    try {
      const { data: apiConfig } = await axios.get("https://raw.githubusercontent.com/Ayan-alt-deep/xyc/main/baseApiurl.json");
      const baseUrl = apiConfig.lk;
      if (!baseUrl) return message.reply("Upload API base URL not found in config.");

      const fileUrl = att.url;
      const ext = path.extname(fileUrl.split("?")[0]) || ".jpg";
      const tempPath = `/tmp/upload${ext}`;
      const response = await axios.get(fileUrl, { responseType: "stream" });
      const writer = fs.createWriteStream(tempPath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      const form = new FormData();
      form.append("file", fs.createReadStream(tempPath));

      const uploadRes = await axios.post(`${baseUrl}/upload`, form, {
        headers: form.getHeaders()
      });

      fs.unlinkSync(tempPath);

      if (uploadRes.data?.url) {
        message.reply(`Uploaded ✅\nURL: ${uploadRes.data.url}`);
      } else {
        message.reply("Upload failed: No URL returned.");
      }

    } catch (error) {
      message.reply("Upload failed:\n" + error.message);
    }
  }
};
