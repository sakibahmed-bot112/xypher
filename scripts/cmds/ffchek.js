const axios = require("axios");

module.exports = {
  config: {
    name: "ffchek",
    version: "1.0",
    author: "Nyx",
    countDown: 5,
    role: 0,
    shortDescription: "Check FF UID ban status",
    longDescription: "Check if a Free Fire UID is banned or safe",
    category: "TOOLS",
    guide: "{pn} [uid]"
  },

  onStart: async function ({ message, args }) {
    const uid = args[0];
    if (!uid) return message.reply("Please provide a Free Fire UID. Example: !ffchek 9586176047");

    try {
      const response = await axios.get('https://ff.garena.com/api/antihack/check_banned', {
        params: {
          'lang': 'en',
          'uid': uid
        },
        headers: {
          'authority': 'ff.garena.com',
          'accept': 'application/json, text/plain, */*',
          'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
          'cache-control': 'no-cache',
          'pragma': 'no-cache',
          'referer': 'https://ff.garena.com/en/support/',
          'sec-ch-ua': '"Chromium";v="137", "Not/A)Brand";v="24"',
          'sec-ch-ua-mobile': '?1',
          'sec-ch-ua-platform': '"Android"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
          'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
          'x-requested-with': 'B6FksShzIgjfrYImLpTsadjS86sddhFH'
        }
      });

      const isBanned = response.data?.data?.is_banned;

      if (isBanned === 0) {
        return message.reply(`UID: ${uid}\nStatus: Safe\nThis account is not banned.`);
      } else if (isBanned === 1) {
        return message.reply(`UID: ${uid}\nStatus: Banned\nThis account is currently banned.`);
      } else {
        return message.reply(`UID: ${uid}\nStatus: Unknown\nCould not determine ban status.`);
      }

    } catch (error) {
      console.error(error);
      return message.reply("Error occurred while checking status. Please try again later.");
    }
  }
};
