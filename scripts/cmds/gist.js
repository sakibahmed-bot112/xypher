!cmd install gist.js const fs = require('fs');
const axios = require('axios');

module.exports.config = {
  name: "gist",
  version: "1",
  role: 2,
  author: "Muzan",
  usePrefix: true,
  description: "Create a GitHub Gist from reply or file",
  category: "convert",
  guide: { en: "[filename] or reply only" },
  countDown: 1
};

module.exports.onStart = async function({ api, event, args }) {
  const admin = ["100027116303378", "61558166309783"]; // Only these IDs can use
  if (!admin.includes(event.senderID)) {
    return api.sendMessage("- গিস্ট তর জন্য না গরিব..!🗿", event.threadID, event.messageID);
  }

  let code = '';
  let fileName = args[0];

  try {
    // 1️⃣ If user replied
    if (event.type === "message_reply" && event.messageReply.body) {
      code = event.messageReply.body;

      if (!fileName) {
        const time = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
        fileName = `gist_${time}.js`;
      } else if (!fileName.endsWith(".js")) {
        fileName += ".js";
      }

    // 2️⃣ If user provides a file name
    } else if (fileName) {
      const filePath = `scripts/cmds/${fileName}.js`;
      code = await fs.promises.readFile(filePath, 'utf-8');
      if (!fileName.endsWith(".js")) fileName += ".js";

    // 3️⃣ Neither reply nor file name
    } else {
      return api.sendMessage("⚠ | Please reply to a code or provide a file name.", event.threadID, event.messageID);
    }

    // ==== GitHub Token ====
    const GITHUB_TOKEN = "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"; // <-- replace with your token

    // ==== Create Gist ====
    const response = await axios.post(
      "https://api.github.com/gists",
      {
        description: "Bot-created gist",
        public: false,
        files: { [fileName]: { content: code } }
      },
      { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
    );

    const rawUrl = response.data.files[fileName].raw_url;

    // ==== Send to Messenger ====
    api.sendMessage(`✅ Gist Raw link:\n${rawUrl}`, event.threadID, event.messageID);

  } catch (err) {
    console.error("❌ Gist Error:", err.message || err);
    api.sendMessage("⚠️ Failed to create gist. Check your token or file.", event.threadID, event.messageID);
  }
};
