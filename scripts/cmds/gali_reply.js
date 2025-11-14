const triggerWords = [
  "bokasoda",
  "mc",
  "chod",
  "nodir pola",
  "bc",
  "chudi",
  "khankir pola",
  "abal",
  "Boakachoda",
  "madarchod",
  "khanki chudi",
  "bokachoda"
];

module.exports = {
  config: {
    name: "gali",
    version: "1.0.1",
    author: "IBONEX TEAM",
    countDown: 5,
    role: 0,
    shortDescription: "Auto gali reply",
    longDescription: "No prefix auto-reply when someone says offensive words",
    category: "no prefix"
  },

  onChat: async function ({ event, message }) {
    const text = event.body?.toLowerCase();
    if (!text) return;

    for (const word of triggerWords) {
      if (text.startsWith(word.toLowerCase())) {

        return message.reply(
          "তোর মতো বোকাচোদা রে আমার বস চু*দা বাদ দিছে🤣\nবস এখন আর hetars চুষে না🥱😈"
        );
      }
    }
  },

  onStart: async function () {
    // No command usage
  }
};
