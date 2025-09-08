const axios = require("axios");

module.exports = {
  config: {
    name: "hvd",
    aliases: ["hvdo"],
    version: "1.1",
    author: "kshitiz (fixed by ChatGPT)",
    countDown: 60,
    role: 2,
    shortDescription: "get hentai video",
    longDescription: "it will send hentai video",
    category: "𝟭𝟴+",
    guide: "{p}{n}hvdo",
  },

  sentVideos: [],

  onStart: async function ({ api, event, message }) {
    const senderID = event.senderID;

    const loadingMessage = await message.reply({
      body: "Loading random hentai... Please wait! upto 5min 🤡",
    });

    const link = [
      "https://drive.google.com/uc?export=download&id=1ywjcqK_AkWyxnRXjoB0JKLdChZsR69cK",
      "https://drive.google.com/uc?export=download&id=1xyC3bJWlmZVMoWJHYRLdX_dNibPVBDIV",
      "https://drive.google.com/uc?export=download&id=1whpsUv4Xzt3bp-QSlx03cLdwW2UsnEt2",
      // ... (rest of your links here)
    ];

    // Filter out already used ones
    let availableVideos = link.filter(video => !this.sentVideos.includes(video));

    if (availableVideos.length === 0) {
      this.sentVideos = [];
      availableVideos = [...link];
    }

    let randomVideo;
    let found = false;

    // Try until we find a working link
    while (availableVideos.length > 0 && !found) {
      const randomIndex = Math.floor(Math.random() * availableVideos.length);
      randomVideo = availableVideos[randomIndex];

      try {
        // Check if link is alive
        await axios.head(randomVideo, { timeout: 5000 });
        found = true;
        this.sentVideos.push(randomVideo);
      } catch (err) {
        // Remove broken link from list
        availableVideos.splice(randomIndex, 1);
      }
    }

    if (!found) {
      return message.reply("❌ Sorry, all video links are broken or unavailable.");
    }

    try {
      await message.reply({
        body: "make sure to watch full video🥵",
        attachment: await global.utils.getStreamFromURL(randomVideo),
      });
    } catch (e) {
      return message.reply("❌ Failed to send video. Try again later.");
    }

    setTimeout(() => {
      api.unsendMessage(loadingMessage.messageID);
    }, 5000);
  },
};
