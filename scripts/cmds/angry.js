const fs = require("fs");
const path = require("path");

const dataFile = path.join(__dirname, "angryEmojis.json");

// ডিফল্ট ইমোজিগুলো
const defaultEmojis = [
  "😠", "😒", "😑", "⚜️", "🙂", "😄", "👺", "🤬",
  "😡", "😤", "😣", "😾", "🚫", "⛔", "✖️", "❌",
  "❎", "‼️", "❗", "🔴"
];

// ফাইল থেকে লোড বা ডিফল্ট দিয়ে শুরু
function loadEmojis() {
  try {
    if (fs.existsSync(dataFile)) {
      return JSON.parse(fs.readFileSync(dataFile, "utf8"));
    }
    fs.writeFileSync(dataFile, JSON.stringify(defaultEmojis, null, 2));
    return [...defaultEmojis];
  } catch (err) {
    console.error("Failed to load emoji list:", err);
    return [...defaultEmojis];
  }
}

// ফাইলে সেভ
function saveEmojis(list) {
  fs.writeFileSync(dataFile, JSON.stringify(list, null, 2));
}

module.exports = {
  config: {
    name: "angry",
    version: "3.0",
    author: "NibiR",
    countDown: 3,
    role: 2,
    shortDescription: "Custom emoji reply to unsend bot message",
    longDescription:
      "Reply with custom emoji to bot message to unsend. Use *angry add/remove/list to customize.",
    category: "no prefix"
  },

  onStart: async function ({ args, message }) {
    let emojis = loadEmojis();

    if (!args[0]) {
      return message.reply(
        "❓ ব্যবহার:\n*angry add 😳\n*angry remove ❌\n*angry list"
      );
    }

    const action = args[0].toLowerCase();
    const target = args[1];

    if (action === "add") {
      if (!target) return message.reply("⚠️ কোন ইমোজি দিবে তা লেখো।");
      if (emojis.includes(target)) {
        return message.reply(`⚠️ ${target} আগেই লিস্টে আছে।`);
      }
      emojis.push(target);
      saveEmojis(emojis);
      return message.reply(`✅ ${target} যোগ করা হয়েছে Angry emoji লিস্টে।`);
    }

    if (action === "remove") {
      if (!target) return message.reply("⚠️ কোন ইমোজি রিমুভ করবে তা লেখো।");
      if (!emojis.includes(target)) {
        return message.reply(`⚠️ ${target} লিস্টে নেই।`);
      }
      emojis = emojis.filter(e => e !== target);
      saveEmojis(emojis);
      return message.reply(`🗑️ ${target} মুছে ফেলা হলো Angry emoji লিস্ট থেকে।`);
    }

    if (action === "list") {
      return message.reply("📜 Current angry emojis:\n" + emojis.join(" "));
    }

    return message.reply("❓ ব্যবহার:\n*angry add 😳\n*angry remove ❌\n*angry list");
  },

  onChat: async function ({ event, api }) {
    const { body, messageReply } = event;

    if (!body || !messageReply) return;

    const content = body.trim();
    const emojis = loadEmojis();

    if (emojis.includes(content)) {
      try {
        const botID = api.getCurrentUserID();
        if (messageReply.senderID === botID) {
          await api.unsendMessage(messageReply.messageID);
        }
      } catch (err) {
        console.error("Emoji unsend error:", err);
      }
    }
  }
};
