const axios = require("axios");

const gApi = async () => {
  const base = await axios.get(
    "https://raw.githubusercontent.com/nazrul4x/Noobs/main/Apis.json"
  );
  return base.data.api;
};

module.exports.config = {
  name: "infinity",
  aliases: ["ini","infi"],
  version: "1.6.9",
  author: "Nazrul",
  role: 0,
  description: "Generate Infinity model unique image ",
  category: "image",
  countDown: 3,
  guide: {
    en: "{pn} write a prompt"
  }
};

module.exports.onStart = async ({ api, event, args }) => {
  const { threadID, messageID } = event;
  const prompt = args.join(" ");
  if (!prompt) {
    return api.sendMessage("please provide a prompt", threadID, messageID);
  }
  try {
    const res = await axios.get(`${await gApi()}/nazrul/infinity?prompt=${encodeURIComponent(prompt)}`);
    const image = res.data.imgUrl;
    const imgUrl = await axios.get(image, { responseType: 'stream' });

    api.sendMessage({
      body: "🌊 Here's your Generated image\n",
      attachment: imgUrl.data
    }, threadID, messageID);

  } catch (error) {
    await api.sendMessage(`💔 error: ${error.message}`, threadID, messageID);
  }
};
