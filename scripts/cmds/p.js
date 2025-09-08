const axios = require("axios");

module.exports = {
  config: {
    name: "p",
    version: "1.0",
    author: "RI F AT",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Generate AI image prompt from image"
    },
    longDescription: {
      en: "Generate a detailed AI prompt from an image using your deployed API"
    },
    category: "ai",
    guide: {
      en: "{pn}\nReply to an image with this command."
    }
  },

  onStart: async function ({ message, event }) {
    if (
      !event.messageReply ||
      !event.messageReply.attachments?.[0]?.type?.startsWith("photo")
    ) {
      return message.reply("Please reply to an image to generate a prompt.");
    }

    const imgURL = event.messageReply.attachments[0].url;
    const apiUrl = `https://rifatapi-sooty.vercel.app/api/prompt?img=${encodeURIComponent(imgURL)}`;

    try {
      const res = await axios.get(apiUrl);
      if (res.data && res.data.reply) {
        return message.reply(res.data.reply); 
      } else {
        return message.reply("Failed to get a valid prompt from API.");
      }
    } catch (err) {
      console.error("Prompt fetch error:", err.message);
      return message.reply("Failed to generate prompt. Please try again later.");
    }
  }
};
