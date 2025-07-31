const DIG = require("discord-image-generation");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "kiss",
    aliases: ["kiss"],
    version: "1.1",
    author: "NIB",
    countDown: 5,
    role: 0,
    shortDescription: "KISS",
    longDescription: "",
    category: "funny",
    guide: "{pn}"
  },

  onStart: async function ({ api, message, event, args, usersData }) {
    let one = event.senderID;
    let two;
    const mention = Object.keys(event.mentions);

    // যদি কেউ মেনশন করে
    if (mention.length >= 1) {
      two = mention[0];
    } 
    // যদি মেনশন না করে কিন্তু কারো মেসেজে রিপ্লাই করে
    else if (event.messageReply) {
      two = event.messageReply.senderID;
    } 
    else {
      return message.reply("Please mention someone or reply to their message.");
    }

    const avatarURL1 = await usersData.getAvatarUrl(one);
    const avatarURL2 = await usersData.getAvatarUrl(two);

    // 👇 Avatars are swapped here
    const img = await new DIG.Kiss().getImage(avatarURL2, avatarURL1);

    const pathSave = `${__dirname}/tmp/${one}_${two}_kiss.png`;
    fs.writeFileSync(pathSave, Buffer.from(img));

    const content = "- 𝗨𝗺𝗺𝗺𝗺𝗮𝗵 𝗯𝗯𝘆..!😘";
    message.reply({
      body: `${content || "Bópppp 😵‍💫😵"}`,
      attachment: fs.createReadStream(pathSave)
    }, () => fs.unlinkSync(pathSave));
  }
};
