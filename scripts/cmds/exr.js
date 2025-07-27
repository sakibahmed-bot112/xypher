const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

module.exports = {
  config: {
    name: "exr",
    aliases: ["raw"],
    version: "1.0",
    author: "Eren",
    countDown: 5,
    role: 2,
    shortDescription: {
      en: "Upload file to Eren's server"
    },
    longDescription: {
      en: "Uploads a file from cmds folder to https://uploader-eren.onrender.com and returns the link",
    },
    category: "utility",
    guide: {
      en: "Use:\n→ !exr <filename>\n→ or exr <filename> (owner only)"
    }
  },

  onStart: async function({ api, event, args }) {
    const fileName = args[0];
    if (!fileName) return api.sendMessage("Please provide a file name.", event.threadID);

    const filePathWithoutExt = path.join(__dirname, '..', 'cmds', fileName);
    const filePathWithExt = path.join(__dirname, '..', 'cmds', fileName + '.js');

    const filePath = fs.existsSync(filePathWithoutExt)
      ? filePathWithoutExt
      : fs.existsSync(filePathWithExt)
      ? filePathWithExt
      : null;

    if (!filePath) return api.sendMessage("❌ File not found!", event.threadID);

    try {
      const form = new FormData();
      form.append("file", fs.createReadStream(filePath));

      const res = await axios.post("https://uploader-eren.onrender.com/upload", form, {
        headers: form.getHeaders()
      });

      if (res.data?.link) {
        return api.sendMessage(`✅ File uploaded:\n${res.data.link}`, event.threadID);
      } else {
        return api.sendMessage("❌ Upload failed.", event.threadID);
      }
    } catch (err) {
      console.error(err);
      return api.sendMessage("❌ Error while uploading the file.", event.threadID);
    }
  }
};
