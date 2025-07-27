const axios = require('axios');

module.exports = {
  config: {
    name: "naruto",
    version: "3.0",
    role: 0,
    author: "Eren Yeager",
    category: "anime",
    guide: {
      en: "{p}naruto -s[season] -ep[episode]\nExample: {p}naruto -s1 -ep2"
    }
  },

  onStart: async function ({ api, event, args }) {
    try {
      const season = args.find(arg => arg.startsWith("-s"))?.slice(2);
      const episode = args.find(arg => arg.startsWith("-ep"))?.slice(3);

      if (!season || !episode) {
        return api.sendMessage(
          "⚠️ Usage: naruto -s[season] -ep[episode]\nExample: naruto -s1 -ep2",
          event.threadID
        );
      }

      const loadingMsg = await api.sendMessage("🌀 Fetching Naruto episode...", event.threadID);

      const jsonUrl = "https://raw.githubusercontent.com/Ayan-alt-deep/xyc/main/naruto_episodes.json";
      const response = await axios.get(jsonUrl, { timeout: 10000 });
      const data = response.data;

      const seasonKey = `season${season}`;
      const episodeKey = `episode${episode}`;

      const videoUrl = data?.[seasonKey]?.[episodeKey];

      if (!videoUrl) {
        throw new Error(`No episode found for Season ${season}, Episode ${episode}.`);
      }

      await api.sendMessage({
        body: `🎥 Naruto S${season}E${episode}\n━━━━━━━━━━━━━━━\n📺 Watch now! Hindi Dubbed Episode\n🌍 Provided by: Eren Yeager`,
        attachment: await global.utils.getStreamFromURL(videoUrl)
      }, event.threadID);

      api.unsendMessage(loadingMsg.messageID);

    } catch (error) {
      console.error("Naruto Command Error:", error);
      api.sendMessage(
        `❌ Failed to fetch episode:\n${error.message}\n\nPlease try again later.`,
        event.threadID
      );
    }
  }
};
