/*
───────────────────────────────
💬 admincall.js | Auto reply when admin name is called
🧠 Author: Meheraz x ChatGPT
───────────────────────────────
*/

module.exports = {
  config: {
    name: "admincall",
    version: "2.1",
    author: "Meheraz",
    role: 0,
    shortdescription: "Auto reply when admin name is mentioned or called",
    longdescription: "Bot automatically replies when admin's name appears in any message (no prefix).",
    category: "system",
    cooldowns: 2,
    usePrefix: false // 🚫 works without prefix
  },

  // onStart is not used for no-prefix commands
  onStart: async function () {},

  onChat: async function ({ api, event }) {
    const threadID = event.threadID;
    const message = (event.body || "").toLowerCase().trim();

    // ✅ Add your admin names (all lowercase for best detection)
    const adminNames = ["muntasir", "mahmud", "eden"];

    // 🎭 Optional: Random replies list
    const replies = [
      "👑 | Respect the boss! That's my admin you're calling 😎",
      "💬 | উনি ব্যাস্ত আছেন, যা বলবেন আমাকে বলেন",
      "🔥 | উনি তনু আপুর সাথে ব্যাস্ত আছেন, ওনাকে ডাকিয়েন না",
      "💖 | My admin is busy right now, but sends love!",
      "⚡ | Careful! You just summoned the admin 😏"
    ];

    // 🎲 Pick a random reply
    const randomReply = replies[Math.floor(Math.random() * replies.length)];

    // 🔍 Check if any admin name is mentioned in message
    for (const name of adminNames) {
      if (message.includes(name)) {
        return api.sendMessage(randomReply, threadID, event.messageID);
      }
    }
  }
};
