const axios = require('axios');
const jimp = require("jimp");
const fs = require("fs");

module.exports = {
  config: {
    name: "propose",
    aliases: ["proposal"],
    version: "1.1",
    author: "Kivv × AceGun",
    countDown: 5,
    role: 0,
    shortDescription: "@mention someone to propose",
    longDescription: "",
    category: "fun",
    guide: "{pn} mention/tag"
  },

  onStart: async function ({ message, event, args }) {
    const mention = Object.keys(event.mentions);
    if (mention.length == 0) return message.reply("Please mention someone");

    const one = event.senderID;
    const two = mention[0];

    try {
      const imagePath = await createProposal(one, two);
      message.reply({ body: "「 Please be mine😍❤️ 」", attachment: fs.createReadStream(imagePath) });
    } catch (err) {
      console.error(err);
      message.reply("Failed to create proposal image.");
    }
  }
};

async function createProposal(one, two) {
  // Load avatars
  const avone = await jimp.read(`https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);
  const avtwo = await jimp.read(`https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);

  // Create circular mask
  const mask = await new jimp(512, 512, 0xFFFFFFFF);
  mask.circle();

  avone.resize(90, 90).mask(mask.resize(90, 90), 0, 0);
  avtwo.resize(90, 90).mask(mask.resize(90, 90), 0, 0);

  // Load background
  const img = await jimp.read("https://i.ibb.co/RNBjSJk/image.jpg");
  img.resize(760, 506)
    .composite(avone, 210, 65)
    .composite(avtwo, 458, 105);

  const pth = "propose.png";
  await img.writeAsync(pth);
  return pth;
}
