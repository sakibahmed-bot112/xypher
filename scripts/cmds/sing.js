const axios = require('axios'); const yts = require("yt-search");

// Fetch Base API URL const baseApiUrl = async () => { const base = await axios.get( https://raw.githubusercontent.com/Mostakim0978/D1PT0/refs/heads/main/baseApiUrl.json ); return base.data.api; };

// Set global API (async () => { global.apis = { diptoApi: await baseApiUrl() }; })();

// Stream from URL async function getStreamFromURL(url, pathName) { try { const response = await axios.get(url, { responseType: "stream" }); response.data.path = pathName; return response.data; } catch (err) { throw err; } }

// Attach Stream Function to Global Utils global.utils = { ...global.utils, getStreamFromURL: global.utils.getStreamFromURL || getStreamFromURL };

// Extract YouTube Video ID function getVideoID(url) { const checkurl = /^(?:https?://)?(?:m.|www.)?(?:youtu.be/|youtube.com/(?:embed/|v/|watch?v=|watch?.+&v=|shorts/))((\w|-){11})(?:\S+)?$/; const match = url.match(checkurl); return match ? match[1] : null; }

// Command Config const config = { name: "sing", author: "eden", credits: "eden", version: "1.2.0", role: 0, hasPermssion: 0, description: "", usePrefix: true, prfix: true, category: "media", commandCategory: "media", cooldowns: 5, countDown: 5, };

// Start Function async function onStart({ api, args, event }) { try { let videoID; const url = args[0]; let w;

// If input is a YouTube link
if (url && (url.includes("youtube.com") || url.includes("youtu.be"))) {
  videoID = getVideoID(url);
  if (!videoID) {
    return api.sendMessage("Invalid YouTube URL.", event.threadID, event.messageID);
  }
}

// If input is text (song name)
else {
  const songName = args.join(' ');

  w = await api.sendMessage(
    `Searching song "${songName}"...`,
    event.threadID
  );

  const r = await yts(songName);
  const videos = r.videos.slice(0, 50);
  const videoData = videos[Math.floor(Math.random() * videos.length)];

  videoID = videoData.videoId;
}

// Fetch download info
const { data: { title, quality, downloadLink } } = await axios.get(
  `${global.apis.diptoApi}/ytDl3?link=${videoID}&format=mp3`
);

// Remove searching message
if (w?.messageID) api.unsendMessage(w.messageID);

// Shorten link
const o = '.php';
const shortenedLink = (
  await axios.get(`https://tinyurl.com/api-create${o}?url=${encodeURIComponent(downloadLink)}`)
).data;

// Send result message + audio
await api.sendMessage(
  {
    body: `🔖 - 𝚃𝚒𝚝𝚕𝚎: ${title}\n✨ - 𝚀𝚞𝚊𝚕𝚒𝚝𝚢: ${quality}\n\n📥 - 𝙳𝚘𝚠𝚗𝚕𝚘𝚊𝚍 𝙻𝚒𝚗𝚔: ${shortenedLink}`,
    attachment: await global.utils.getStreamFromURL(downloadLink, title + '.mp3')
  },
  event.threadID,
  event.messageID
);

}

catch (e) { api.sendMessage(e.message || "An error occurred.", event.threadID, event.messageID); } }

module.exports = { config, onStart, run: onStart };
