const axios = require("axios");
const fs = require("fs-extra");
const Jimp = require("jimp");

module.exports = {
  config: {
    name: "pair2",
    aliases: [],
    version: "1.5",
    author: "asif",
    countDown: 5,
    role: 0,
    shortDescription: "Pair two users in a glowing frame love style",
    longDescription: "Glow ফ্রেম সহ পেয়ার",
    category: "love",
    guide: "{pn} [২ জন মেনশন করলে ওদের pair করবে]"
  },

  onStart: async function({ api, event, threadsData, usersData }) {
    const { threadID, messageID, senderID, mentions, type, messageReply } = event;
    const { participantIDs } = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();

    let user1, user2;
    const mentionIDs = Object.keys(mentions);

    if (mentionIDs.length === 2) {
      [user1, user2] = mentionIDs;
    } else if (mentionIDs.length === 1) {
      user1 = senderID;
      user2 = mentionIDs[0];
    } else if (type === "message_reply" && messageReply.senderID !== senderID) {
      user1 = senderID;
      user2 = messageReply.senderID;
    } else {
      const others = participantIDs.filter(id => id !== senderID && id !== botID);
      if (others.length === 0)
        return api.sendMessage("⚠️ pairing করার মতো কেউ নেই!", threadID, messageID);
      user1 = senderID;
      user2 = others[Math.floor(Math.random() * others.length)];
    }

    try {
      const name1 = (await usersData.get(user1)).name;
      const name2 = (await usersData.get(user2)).name;
      const lovePercent = Math.floor(Math.random() * 101);

      // ⬇️ প্রোফাইল পিক ডাউনলোড
      const img1Data = (await axios.get(
        `https://graph.facebook.com/${user1}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
        { responseType: "arraybuffer" }
      )).data;

      const img2Data = (await axios.get(
        `https://graph.facebook.com/${user2}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
        { responseType: "arraybuffer" }
      )).data;

      fs.writeFileSync(__dirname + "/cache/avt1.png", Buffer.from(img1Data, "utf-8"));
      fs.writeFileSync(__dirname + "/cache/avt2.png", Buffer.from(img2Data, "utf-8"));

      const size = 300;
      const glowSize = 20; // glow এর পুরুত্ব

      const createGlowFrame = async (imageBuffer) => {
        const avatar = await Jimp.read(imageBuffer);
        avatar.resize(size, size);

        const totalSize = size + glowSize * 2;
        const frame = new Jimp(totalSize, totalSize);

        // Gradient Glow তৈরি করো
        for (let i = 0; i < glowSize; i++) {
          const mixColor = Jimp.rgbaToInt(
            138 + Math.floor(i * 6),  // purple to red
            43 + Math.floor(i * 3),   // purple to blue
            226 - Math.floor(i * 4),  // purple to blue fade
            255
          );
          frame.scan(i, i, totalSize - i * 2, totalSize - i * 2, function(x, y, idx) {
            this.bitmap.data[idx + 0] = (mixColor >> 24) & 255;
            this.bitmap.data[idx + 1] = (mixColor >> 16) & 255;
            this.bitmap.data[idx + 2] = (mixColor >> 8) & 255;
            this.bitmap.data[idx + 3] = 255;
          });
        }

        frame.composite(avatar, glowSize, glowSize);
        return frame;
      };

      const framed1 = await createGlowFrame(__dirname + "/cache/avt1.png");
      const framed2 = await createGlowFrame(__dirname + "/cache/avt2.png");

      // ⬅️➡️ পাশাপাশি বসাও
      const combined = new Jimp(framed1.bitmap.width + framed2.bitmap.width + 20, framed1.bitmap.height);
      combined.composite(framed1, 0, 0);
      combined.composite(framed2, framed1.bitmap.width + 20, 0);

      const finalPath = __dirname + "/cache/paired.png";
      await combined.writeAsync(finalPath);

      const msg = {
        body: `🥰- নাও তোমাদের জুটি..!!
💌- ২০০ বছর এর প্রেমের শুভকামনা রাইলো.!💘
💖- ম্যাচিং রেট: ${lovePercent}%
💑- @${name1} ❤️ @${name2}`,
        mentions: [
          { id: user1, tag: `@${name1}` },
          { id: user2, tag: `@${name2}` }
        ],
        attachment: fs.createReadStream(finalPath)
      };

      return api.sendMessage(msg, threadID, messageID);
    } catch (err) {
      console.error("❌ Error:", err);
      return api.sendMessage("❌ pairing করতে সমস্যা হয়েছে!", threadID, messageID);
    }
  }
};
