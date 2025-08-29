const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "xsay",
    version: "1.0",
    author: "Tarek",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Translate text to Japanese and convert to voice"
    },
    longDescription: {
      en: "Translates Bangla/English text into Japanese and generates Japanese TTS voice."
    },
    category: "fun",
    guide: {
      en: "{pn} <text>"
    }
  },

  onStart: async function ({ message, args }) {
    try {
      if (args.length === 0) {
        return message.reply("⚠️ Please provide some text.\nExample: /say I love you");
      }

      const text = args.join(" ");

      // 1. Translate to Japanese
      const transRes = await axios.get(`https://translate.googleapis.com/translate_a/single`, {
        params: {
          client: "gtx",
          sl: "auto",
          tl: "ja",
          dt: "t",
          q: text
        }
      });

      const japaneseText = transRes.data[0].map(item => item[0]).join("");

      // 2. TTS (Japanese voice)
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(japaneseText)}&tl=ja&client=tw-ob`;
      const filePath = path.join(__dirname, "say.mp3");
      const voiceRes = await axios.get(ttsUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(filePath, Buffer.from(voiceRes.data, "utf-8"));

      // 3. Send message with voice
      await message.reply({
        body: `🗣️ ${japaneseText}`,
        attachment: fs.createReadStream(filePath)
      });

      fs.unlinkSync(filePath);

    } catch (e) {
      console.error(e);
      message.reply("❌ Error while processing your request!");
    }
  }
};
