const axios = require('axios');
const { getStreamFromURL } = global.utils;

module.exports = {
  config: {
    name: "flux",
    version: "1.1",
    author: "Redwan",
    countDown: 0,
    longDescription: {
      en: "Create AI-generated images with your prompt."
    },
    category: "image",
    role: 0,
    guide: {
      en: "{pn} <prompt>"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    if (!this.checkAuthor()) {
      return message.reply("Unauthorized action.");
    }

    const prompt = args.join(' ').trim();
    if (!prompt) {
      return message.reply("Enter a prompt to generate an image.");
    }

    message.reply("𝐏𝐥𝐳 𝐰𝐚𝐢𝐭 𝐛𝐛𝐲 🎀🐥.", async (err, info) => {
      if (err) return console.error(err);

      try {
        const apiUrl = `https://global-redwans-apis.onrender.com/api/fluxxx?p=${encodeURIComponent(prompt)}&mode=flux`;
        const response = await axios.get(apiUrl);
        const { html } = response.data.data;

        const imageUrls = [...html.matchAll(/<a href="(https:\/\/aicdn\.picsart\.com\/[a-zA-Z0-9-]+\.jpg)"/g)].map(match => match[1]);

        if (!imageUrls || imageUrls.length < 2) {
          return message.reply("Image generation failed. Try again.");
        }

        const imageStreams = await Promise.all(
          imageUrls.slice(0, 2).map((url, index) => getStreamFromURL(url, `flux_image_${index + 1}.png`))
        );

        message.reply({
          body: "Here are your images!",
          attachment: imageStreams,
        });

      } catch (error) {
        console.error(error);
        message.reply("Something went wrong. Try again later.");
      }
    });
  },

  checkAuthor: function () {
    return this.config.author === "Redwan";
  }
};
