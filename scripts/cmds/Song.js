const ytSearch = require("yt-search");

module.exports = {
  config: {
    name: "song",
    aliases: ["sng", "muic"],
    version: "1.0",
    author: "Eren Yeager",
    countDown: 5,
    role: 0,
    shortDescription: "Play music from YouTube",
    longDescription: "Search and stream mp3 audio from YouTube using your API",
    category: "media"
  },

  onStart: async function ({ args, message, api, event }) {
    if (!args.length)
      return message.reply("⚠️ Please type a song name.\nUsage: !xong <song name>");

    const query = args.join(" ");
    let loadingMsgID;
    try {
      // send loading message & save ID
      loadingMsgID = (await message.reply("🎀🐥𝐏𝐥𝐞𝐚𝐬𝐞 𝐰𝐚𝐢𝐭 𝐁𝐁𝐘...")).messageID;

      const res = await ytSearch(query);
      const video = res.videos.length > 0 ? res.videos[0] : null;

      // no result
      if (!video) {
        await api.unsendMessage(loadingMsgID);
        return message.reply("😿 No results found for your query.");
      }

      const videoUrl = `https://youtube.com/watch?v=${video.videoId}`;
      const apiUrl = `https://webm-to-mp3-production.up.railway.app/xong?url=${encodeURIComponent(videoUrl)}`;

      // unsend loading msg
      await api.unsendMessage(loadingMsgID);

      await message.reply({
        body: `🎵 Found: ${video.title}\n🎧 Streaming audio...`,
        attachment: await global.utils.getStreamFromURL(apiUrl)
      });

    } catch (err) {
      console.error(err);
      if (loadingMsgID) await api.unsendMessage(loadingMsgID);
      await message.reply("❌ Failed to process. Try again later.");
    }
  }
};
