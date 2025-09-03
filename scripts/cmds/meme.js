const axios = require("axios");

module.exports = {
  config: {
    name: "meme",
    aliases: ["memes"],
    version: "2.2",
    author: "Ew'r Saim",
    role: 0,
    countDown: 5,
    category: "fun",
    shortDescription: "Send a random meme or add a new one",
    longDescription: "Fetch random memes or add a meme via reply (only owner can add)",
    guide: "{pn} → Get 1 meme\n{pn} -5 → Get 5 memes\nReply media + {pn} add → Add meme (owner only)"
  },

  onStart: async function ({ api, event }) {
    try {
      const OWNER_UIDS = ["61558166309783", "100027116303378"];
      const baseApiUrlRes = await axios.get("https://raw.githubusercontent.com/Saim12678/Saim/main/baseApiUrl.json");
      const baseApiUrls = baseApiUrlRes.data;

      if (!baseApiUrls || !baseApiUrls.memes || !baseApiUrls.api) {
        return api.sendMessage("❌ Invalid API URLs configuration.", event.threadID, event.messageID);
      }

      const body = event.body?.trim();
      const isAdd = body?.toLowerCase().includes("add");
      const countMatch = body?.match(/-(\d+)/);
      const count = countMatch ? parseInt(countMatch[1]) : 1;

      if (isAdd) {
        if (!OWNER_UIDS.includes(event.senderID)) {
          return api.sendMessage("- পন্ডিত তোরে কে বলছে এড করতে, ইগনুরে থাক শালা..!🙄", event.threadID, event.messageID);
        }

        const attachment = event.messageReply?.attachments?.[0];
        if (!attachment?.url) {
          return api.sendMessage("❌ Reply to an image/video to add a meme.", event.threadID, event.messageID);
        }

        const memeUrl = attachment.url;
        if (!memeUrl.startsWith("http")) {
          return api.sendMessage("❌ Invalid media URL.", event.threadID, event.messageID);
        }

        const addRes = await axios.post(`${baseApiUrls.memes}/api/memes/add`, { url: memeUrl });
        if (addRes.data?.success) {
          return api.sendMessage(`✅ Added: ${addRes.data.url}`, event.threadID, event.messageID);
        }
        return api.sendMessage("❌ Failed to add meme.", event.threadID, event.messageID);
      }

      const res = await axios.get(`${baseApiUrls.memes}/api/memes?count=${count}`);
      const memes = res.data?.memes;
      if (!memes?.length) {
        return api.sendMessage("❌ No memes found!", event.threadID, event.messageID);
      }

      const attachments = [];
      for (let meme of memes) {
        try {
          const memeStream = await global.utils.getStreamFromURL(meme);
          attachments.push(memeStream);
        } catch (err) {
          console.error("Error fetching meme image stream:", err);
          continue;
        }
      }

      if (attachments.length > 0) {
        const messageBody = count > 1 ? `😂 Here are ${count} memes!` : "😂 Here's your meme!";
        await api.sendMessage({ body: messageBody, attachment: attachments }, event.threadID, event.messageID);
      } else {
        return api.sendMessage("❌ No memes available to send.", event.threadID, event.messageID);
      }

    } catch (err) {
      console.error(err.response?.data || err.message);
      api.sendMessage("❌ Meme command error!", event.threadID, event.messageID);
    }
  }
};
