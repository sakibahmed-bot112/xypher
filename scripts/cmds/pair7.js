const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "pair7",
    version: "mention-fix-ultra",
    author: "Tarek Shikdar",
    countDown: 5,
    role: 0,
    shortDescription: "Pair 2 users and show their profile pics",
    longDescription: "Matches you with a random user and shows both profile pictures",
    category: "fun",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ api, event, usersData }) {
    const senderID = event.senderID;
    const threadID = event.threadID;

    const getUserName = async (uid) => {
      let name = await usersData.getName(uid);
      if (!name) {
        try {
          const info = await api.getUserInfo(uid);
          name = info[uid]?.name || "💔 Mystery Lover";
        } catch (e) {
          name = "💔 Mystery Lover";
        }
      }
      return name;
    };

    const allUserIDs = (await api.getThreadInfo(threadID)).participantIDs.filter(id => id !== senderID && id !== api.getCurrentUserID());

    if (allUserIDs.length < 1) {
      return api.sendMessage("You need at least one more person to pair with 😅", threadID);
    }

    const pairedID = allUserIDs[Math.floor(Math.random() * allUserIDs.length)];

    const name1 = await getUserName(senderID);
    const name2 = await getUserName(pairedID);

    const lovePercent = Math.floor(Math.random() * 21) + 80;
    const compatibility = Math.floor(Math.random() * 31) + 70;

    const avatarURL1 = await usersData.getAvatarUrl(senderID);
    const avatarURL2 = await usersData.getAvatarUrl(pairedID);

    const img1Path = path.join(__dirname, `tmp/xpair_${senderID}.jpg`);
    const img2Path = path.join(__dirname, `tmp/xpair_${pairedID}.jpg`);

    try {
      const [res1, res2] = await Promise.all([
        axios.get(avatarURL1, { responseType: "arraybuffer" }),
        axios.get(avatarURL2, { responseType: "arraybuffer" })
      ]);

      fs.ensureDirSync(path.dirname(img1Path));
      fs.writeFileSync(img1Path, res1.data);
      fs.writeFileSync(img2Path, res2.data);

      const msgText = 
`🌟 Look what we have here... a brand new pair just dropped! 💞

👩‍❤️‍👨 ${name1} has just been paired with ${name2}

💖 Love Meter: ${lovePercent}%
🔗 Compatibility Score: ${compatibility}%

🎊 Let’s shower them with love and blessings! 🥰💐`;

      const mentionIndex = msgText.indexOf(name2);

      api.sendMessage({
        body: msgText,
        mentions: [{
          tag: name2,
          id: pairedID,
          fromIndex: mentionIndex
        }],
        attachment: [
          fs.createReadStream(img1Path),
          fs.createReadStream(img2Path)
        ]
      }, threadID, () => {
        fs.unlinkSync(img1Path);
        fs.unlinkSync(img2Path);
      });

    } catch (err) {
      console.error("❌ Failed to fetch profile pictures:", err);
      return api.sendMessage("😢 Failed to fetch profile pictures, please try again later!", threadID);
    }
  }
};
