const ytSearch = require("yt-search");

module.exports = {
  config: {
    name: "sing",
    aliases: ["audi", "music"],
    version: "1.0",
    author: "Eren Yeager",
    countDown: 5,
    role: 0,
    shortDescription: "Play music from YouTube",
    longDescription: "Search and stream mp3 audio from YouTube using your API",
    category: "media"
  },

  onStart: async function ({ args, message, api }) {
    if (!args.length)
      return message.reply("⚠️ Please type a song name.\nUsage: !xong <song name>");

    const query = args.join(" ");
    try {
      const res = await ytSearch(query);
      const video = res.videos.length > 0 ? res.videos[0] : null;

      if (!video) {
        return message.reply("😿 No results found for your query.");
      }

      const videoUrl = `https://youtube.com/watch?v=${video.videoId}`;
      const apiUrl = `https://webm-to-mp3-production.up.railway.app/xong?url=${encodeURIComponent(videoUrl)}`;

      const loadingMsg = await message.reply(
        `Downloading Please wait..`
      );

      setTimeout(() => {
        api.unsendMessage(loadingMsg.messageID);
      }, 4000);

      await message.reply({
        body: `🎶 Now playing: ${video.title}`,
        attachment: await global.utils.getStreamFromURL(apiUrl)
      });

    } catch (err) {
      console.error(err);
      await message.reply("❌ Failed to process. Try again later.");
    }
  }
};
