const { exec } = require('child_process');

module.exports = {
  config: {
    name: "shell",
    version: "1.0",
    author: "Samir // Eren Yeager",
    countDown: 5,
    role: 0,
    shortDescription: "Execute shell commands",
    longDescription: "Executes terminal shell commands from chat",
    category: "shell",
    guide: {
      vi: "{p}{n} <command>",
      en: "{p}{n} <command>"
    },
    usePrefix: false,
    onChat: true
  },

  onStart: async function ({ args, message, event }) {
    const allowedUIDs = ["100027116303378", "61558166309783", "61572589774495"];
    if (!allowedUIDs.includes(event.senderID)) {
      const insults = [
        "-Nasa' র অনেক বড় হেকার আইসে আমার Shell use করতে..!",
        "- এই কমান্ড তোর জন্য না, যাহ কেল্কুলেটর চালা..!",
        "- প্রথমে permission manage কর..!",
        "- Code লেখার আগে বাবার permission নিয়ে আস..!",
        "- তুই shell দিয়ে কি করবি মাংগের নাতি.!",
        "- বম্ব বলা উইরা যা মাংগের পোলা..!",
        "-চুপ চাপ চলে যা শালারপুত.!",
        "- এই command কোন বাচ্চারা চালাতে পারে না..!"
      ];
      const insult = insults[Math.floor(Math.random() * insults.length)];
      return message.reply(insult);
    }

    const command = args.join(" ");
    if (!command) return message.reply("Please provide a command to execute.");

    exec(command, (error, stdout, stderr) => {
      if (error) return message.reply(`Error:\n${error.message}`);
      if (stderr) return message.reply(`Stderr:\n${stderr}`);
      const output = stdout || "Command executed successfully, but no output.";
      message.reply(`Output:\n${output}`);
    });
  },

  onChat: async function ({ event, args, message }) {
    const prefixUsed = event.body.split(" ")[0].toLowerCase();
    if (prefixUsed !== "shell") return;

    const allowedUIDs = ["61558166309783", "61558166309783"];
    if (!allowedUIDs.includes(event.senderID)) {
      const insults = [
        "-Nasa' র অনেক বড় হেকার আইসে আমার Shell use করতে..!😹",
        "- এই কমান্ড তোর জন্য না, যাহ কেল্কুলেটর চালা..!😼",
        "- প্রথমে 𝐀𝐒𝐈𝐅 ✈︎ বস এর permission manage কর..!😞",
        "- Code লেখার আগে বাবার permission নিয়ে আস বস এর.!",
        "- তুই shell দিয়ে কি করবি মাংগের নাতি..!😾",
        "- বম্ব বলা উইরা যা মাংগের পোলা..!🚮",
        "চুপ চাপ চলে যা মাংগের নাতি..!😼",
        "- এই command কোন বাচ্চারা চালাতে পারে না..!"
      ];
      const insult = insults[Math.floor(Math.random() * insults.length)];
      return message.reply(insult);
    }

    const command = args.join(" ");
    if (!command) return message.reply("Please provide a command to execute.");

    exec(command, (error, stdout, stderr) => {
      if (error) return message.reply(`Error:\n${error.message}`);
      if (stderr) return message.reply(`Stderr:\n${stderr}`);
      const output = stdout || "Command executed successfully, but no output.";
      message.reply(`Output:\n${output}`);
    });
  }
};
