const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { loadImage, createCanvas } = require("canvas");

module.exports = {
  config: {
    name: "kickass",
    aliases:["asskick"],
    version: "1.1",
    author: "Amit Max ⚡",
    countDown: 5,
    role: 0,
    shortDescription: "Kick someone's ass!",
    longDescription: "A fun command to kick someone's ass with a picture.",
    category: "fun",
    guide: "{pn} @mention or reply",
  },

  onStart: async function ({ event, api, usersData }) {
    let mention = Object.keys(event.mentions)[0];
    let targetID = mention || event.messageReply?.senderID;

    if (!targetID)
      return api.sendMessage("কাকে পাছায় লাথি মারবে? ট্যাগ কর বা কারো রিপ্লাই দাও!", event.threadID, event.messageID);

    const kickerID = event.senderID;

    const getAvatar = async (uid) => {
      try {
        const url = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        const avatarPath = path.join(__dirname, `${uid}_avatar.png`);
        const res = await axios.get(url, { responseType: "arraybuffer" });
        fs.writeFileSync(avatarPath, res.data);
        return avatarPath;
      } catch (err) {
        console.error(`Error fetching avatar for user ${uid}: ${err.message}`);
        return "https://i.imgur.com/TfXKnVC.png";
      }
    };

    const bg = await loadImage("https://i.imgur.com/OUEgkT7.jpeg");
    const canvas = createCanvas(bg.width, bg.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bg, 0, 0);

    const kickerAvatarPath = await getAvatar(kickerID);
    const targetAvatarPath = await getAvatar(targetID);

    const kickerAvatar = await loadImage(kickerAvatarPath);
    const targetAvatar = await loadImage(targetAvatarPath);

    ctx.save();
    ctx.beginPath();
    ctx.arc(130, 140, 50, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(kickerAvatar, 80, 90, 100, 100);
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(340, 160, 50, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(targetAvatar, 290, 110, 100, 100);
    ctx.restore();

    const output = path.join(__dirname, "kickass_output.png");
    fs.writeFileSync(output, canvas.toBuffer("image/png"));

    const senderName = await usersData.getName(kickerID);
    const targetName = event.mentions[mention] || (event.messageReply?.senderName || "Friend");

    api.sendMessage({
      body: `⚡ পাছায় লাথি মারলাম! \n${senderName} এমন জোরে লাথি মারছে ${targetName}-এর পাছায় যে এখন সে উড়তেছে!`,
      attachment: fs.createReadStream(output),
      mentions: [{ tag: targetName, id: targetID }],
    }, event.threadID, () => {
      fs.unlinkSync(output);
      fs.unlinkSync(kickerAvatarPath);
      fs.unlinkSync(targetAvatarPath);
    }, event.messageID);
  }
};
