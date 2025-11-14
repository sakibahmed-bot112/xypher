const Canvas = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "wanted2",
    aliases: ["wan2"],
    version: "1.0",
    author: "eden",
    countDown: 5,
    role: 0,
    shortDescription: "One Piece style wanted poster",
    longDescription: "Generate a high-quality One Piece wanted poster",
    category: "fun",
    guide: {
      en: "{pn} [reply/tag or nothing for self]"
    }
  },

  onStart: async function ({ event, message, usersData }) {
    const targetID = event.type === "message_reply"
      ? event.messageReply.senderID
      : Object.keys(event.mentions)[0] || event.senderID;

    const avatarURL = await usersData.getAvatarUrl(targetID);
    const baseURL = "https://i.imgur.com/Yslc5Co.jpeg";

    const [baseImage, avatarBuffer] = await Promise.all([
      Canvas.loadImage(baseURL),
      axios.get(avatarURL, {
        responseType: "arraybuffer",
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      }).then(res => Buffer.from(res.data, "binary"))
    ]);

    const avatarImage = await Canvas.loadImage(avatarBuffer);

    const canvas = Canvas.createCanvas(baseImage.width, baseImage.height);
    const ctx = canvas.getContext("2d");


    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

    ctx.drawImage(avatarImage, 52, 149, 382, 300); 

    const path = `${__dirname}/tmp/wanted_${targetID}.png`;
    fs.writeFileSync(path, canvas.toBuffer());

    message.reply({
      body: "Here's the wanted poster!",
      attachment: fs.createReadStream(path)
    }, () => fs.unlinkSync(path));
  }
};
