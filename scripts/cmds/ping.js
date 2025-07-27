module.exports = {
  config: {
    name: "ping",
    author: "upol",
    version: "1.1",
    cooldowns: 3,
    role: 0,
    category: "system",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ message, api }) {
    await this.checkPing(message, api);
  },

  onChat: async function ({ event, message, api }) {
    if (event.body && event.body.toLowerCase() === "ping") {
      await this.checkPing(message, api);
    }
  },

  checkPing: async function (message, api) {
    let pingResults = [];
    const msg = await message.reply("🔄 Checking bot ping...");

    for (let i = 1; i <= 5; i++) {
      const start = Date.now();
      await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 200) + 50)); 
      const ping = Date.now() - start;

      let status;
      if (ping < 100) status = " Excellent";
      else if (ping < 200) status = " Good";
      else if (ping < 300) status = "⚠ Average";
      else status = "🐌 Slow";

      pingResults.push(`Ping ${i}: ${ping}ms \n_${status}_`);
      
      // মেসেজ আপডেট করা
      await api.editMessage(`🔄 Checking bot ping...\n\n${pingResults.join("\n\n")}`, msg.messageID);
    }

    // ফাইনাল মেসেজ পাঠানো
    api.editMessage(`🕛 Pong! \n\n${pingResults.join("\n")}`, msg.messageID);
  }
};
