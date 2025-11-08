const axios = require("axios");

const BASE_API = "https://manga-sfkr.onrender.com/api";

module.exports = {
  config: {
    name: "manga",
    version: "5.0",
    author: "Eren",
    countDown: 5,
    role: 0,
    shortDescription: "Search and read manga",
    longDescription: "Multi-step manga reader: search manga, select chapter, read pages",
    category: "anime",
    guide: "{pn} <manga name>"
  },

  onStart: async function ({ api, event, args }) {
    const query = args.join(" ").trim();
    if (!query) return api.sendMessage("❌ Please provide a manga name.\nExample: !manga jujutsu kaisen", event.threadID, event.messageID);

    try {
      const res = await axios.get(`${BASE_API}/manga`, { params: { title: query } });
      const mangaList = res.data.data;
      if (!mangaList || mangaList.length === 0) return api.sendMessage("😿 No manga found.", event.threadID, event.messageID);

      let msg = `🔍 Search results for "${query}":\n\n`;
      mangaList.slice(0, 5).forEach((m, i) => {
        const title = m.attributes.title.en || "Unknown Title";
        msg += `${i + 1}. ${title}\n`;
      });
      msg += `\n💬 Reply with the manga number (e.g. 1) to select.`;

      api.sendMessage(msg, event.threadID, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: "manga",
          type: "select_manga",
          author: event.senderID,
          mangaList: mangaList.slice(0, 5),
          messageID: info.messageID // important for auto unsend
        });
      }, event.messageID);

    } catch (err) {
      console.error(err);
      return api.sendMessage("❌ Error searching manga.", event.threadID, event.messageID);
    }
  },

  onReply: async function ({ api, event, Reply }) {
    if (event.senderID !== Reply.author) return;

    if (Reply.type === "select_manga") {
      const num = parseInt(event.body);
      if (isNaN(num) || num < 1 || num > Reply.mangaList.length)
        return api.sendMessage("❌ Invalid manga number.", event.threadID, event.messageID);

      const selectedManga = Reply.mangaList[num - 1];
      const mangaId = selectedManga.id;
      const mangaTitle = selectedManga.attributes.title.en || "Unknown Title";

      try {
        const chRes = await axios.get(`${BASE_API}/manga/${mangaId}/chapters`);
        const chapters = chRes.data.data || [];
        if (chapters.length === 0)
          return api.sendMessage("⚠️ No chapters found.", event.threadID, event.messageID);

        // Auto unsend old list
        api.unsendMessage(Reply.messageID);

        let msg = `📚 Chapters for "${mangaTitle}":\n\n`;
        chapters.slice(0, 10).forEach((c, i) => {
          const chNum = c.attributes.chapter || "?";
          const chTitle = c.attributes.title || "";
          msg += `${i + 1}. Chapter ${chNum} ${chTitle}\n`;
        });
        msg += `\n💬 Reply with chapter number (e.g. 1)`;

        api.sendMessage(msg, event.threadID, (err, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: "manga",
            type: "select_chapter",
            author: event.senderID,
            chapters,
            mangaTitle,
            messageID: info.messageID
          });
        }, event.messageID);

      } catch (err) {
        console.error(err);
        return api.sendMessage("❌ Failed to get chapters.", event.threadID, event.messageID);
      }
    }

    if (Reply.type === "select_chapter") {
      const num = parseInt(event.body);
      if (isNaN(num) || num < 1 || num > Reply.chapters.length)
        return api.sendMessage("❌ Invalid chapter number.", event.threadID, event.messageID);

      const chapter = Reply.chapters[num - 1];
      const chapterId = chapter.id;
      const chapterNum = chapter.attributes.chapter || "?";
      const chapterTitle = chapter.attributes.title || "";

      await api.sendMessage(`⏳ Loading Chapter ${chapterNum} ${chapterTitle}...`, event.threadID);

      try {
        const imgRes = await axios.get(`${BASE_API}/chapter/${chapterId}/images`);
        const baseUrl = imgRes.data.baseUrl;
        const hash = imgRes.data.chapter.hash;
        const images = imgRes.data.chapter.data;

        // Auto unsend chapter list
        api.unsendMessage(Reply.messageID);

        // Prepare all image streams
        const attachments = [];
        for (const img of images) {
          const imgUrl = `${baseUrl}/data/${hash}/${img}`;
          attachments.push(await global.utils.getStreamFromURL(imgUrl));
        }

        await api.sendMessage({
          body: `📖 Reading Chapter ${chapterNum} ${chapterTitle}`,
          attachment: attachments
        }, event.threadID);

        return api.sendMessage(`✅ Finished reading Chapter ${chapterNum}!`, event.threadID);

      } catch (err) {
        console.error(err);
        return api.sendMessage("❌ Failed to load chapter pages.", event.threadID, event.messageID);
      }
    }
  }
};
