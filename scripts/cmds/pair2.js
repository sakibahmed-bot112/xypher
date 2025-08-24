const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "pair2",
    author: " asif",
    category: "TOOLS",
  },

  onStart: async function ({ api, event, usersData }) {
    try {
      const threadData = await api.getThreadInfo(event.threadID);
      const users = threadData.userInfo;

      const mentions = event.mentions || {};
      const mentionIDs = Object.keys(mentions);
      const repliedUserID = event.type === "message_reply" ? event.messageReply.senderID : null;
      const senderID = event.senderID;

      let user1ID = null;
      let user2ID = null;

      // ✅ Case 1: 2 জন mention করলে
      if (mentionIDs.length >= 2) {
        const filtered = mentionIDs.filter(id => id !== senderID);
        if (filtered.length < 2) {
          return api.sendMessage("⚠️ Please mention two different users (not yourself).", event.threadID, event.messageID);
        }
        user1ID = filtered[0];
        user2ID = filtered[1];
      }

      // ✅ Case 2: 1 জন mention করলে
      else if (mentionIDs.length === 1 && mentionIDs[0] !== senderID) {
        user1ID = senderID;
        user2ID = mentionIDs[0];
      }

      // ✅ Case 3: রিপ্লাই করলে
      else if (repliedUserID && repliedUserID !== senderID) {
        user1ID = senderID;
        user2ID = repliedUserID;
      }

      let selectedMatch, matchName, baseUserID;
      let sIdImage, pairPersonImage;
      let user1, user2;

      // ✅ Pairing with selected IDs
      if (user1ID && user2ID) {
        user1 = users.find(u => u.id === user1ID);
        user2 = users.find(u => u.id === user2ID);

        if (!user1 || !user2 || !user1.gender || !user2.gender) {
          return api.sendMessage("⚠️ Couldn't determine gender for one or both users.", event.threadID, event.messageID);
        }

        if (user1.gender === user2.gender) {
          return api.sendMessage("⚠️Gay naki lesbu? Same gender pairing is not allowed.", event.threadID, event.messageID);
        }

        baseUserID = user1ID;
        selectedMatch = user2;
        matchName = user2.name;

        sIdImage = await loadImage(
          `https://graph.facebook.com/${user1ID}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`
        );
        pairPersonImage = await loadImage(
          `https://graph.facebook.com/${user2ID}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`
        );
      }

      // ✅ Case 4: র‍্যান্ডম পেয়ারিং
      else {
        const senderData = users.find((u) => u.id === senderID);
        if (!senderData || !senderData.gender) {
          return api.sendMessage("⚠️ Could not determine your gender.", event.threadID, event.messageID);
        }

        const myGender = senderData.gender;
        let matchCandidates = [];

        if (myGender === "MALE") {
          matchCandidates = users.filter(u => u.gender === "FEMALE" && u.id !== senderID);
        } else if (myGender === "FEMALE") {
          matchCandidates = users.filter(u => u.gender === "MALE" && u.id !== senderID);
        }

        if (matchCandidates.length === 0) {
          return api.sendMessage("❌ No suitable match found in the group.", event.threadID, event.messageID);
        }

        selectedMatch = matchCandidates[Math.floor(Math.random() * matchCandidates.length)];
        matchName = selectedMatch.name;
        baseUserID = senderID;

        sIdImage = await loadImage(
          `https://graph.facebook.com/${senderID}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`
        );
        pairPersonImage = await loadImage(
          `https://graph.facebook.com/${selectedMatch.id}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`
        );
      }

      const baseUserData = await usersData.get(baseUserID);
      const senderName = baseUserData.name;

      // 🎨 Canvas draw
      const width = 800;
      const height = 400;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      const background = await loadImage("https://i.imgur.com/I33VrvV.png");
      ctx.drawImage(background, 0, 0, width, height);
      ctx.drawImage(sIdImage, 385, 40, 170, 170);
      ctx.drawImage(pairPersonImage, width - 213, 190, 180, 170);

      const outputPath = path.join(__dirname, "pair_output.png");
      const out = fs.createWriteStream(outputPath);
      const stream = canvas.createPNGStream();
      stream.pipe(out);

      out.on("finish", () => {
        const lovePercent = Math.floor(Math.random() * 31) + 70;

        const messageBody = `
💖 𝗟𝗼𝘃𝗲 𝗠𝗮𝘁𝗰𝗵 𝗖𝗿𝗲𝗮𝘁𝗲𝗱 💖

🙎‍♂️ 𝗣𝗮𝗿𝘁𝗻𝗲𝗿 1: ${senderName}
🙎‍♀️ 𝗣𝗮𝗿𝘁𝗻𝗲𝗿 2: ${matchName}

👅 𝗟𝗼𝘃𝗲 𝗣𝗲𝗿𝗰𝗲𝗻𝘁𝗮𝗴𝗲: ${lovePercent}% 👫

 💝 𝗕𝗲 𝗵𝗮𝗽𝗽𝘆 𝗮𝗹𝗹 𝘆𝗼𝘂𝗿 𝗹𝗶𝗳𝗲 💝

🎀 𝗦𝗵𝗮𝗿𝗲 𝗵𝗮𝗽𝗽𝗶𝗻𝗲𝘀𝘀 𝗮𝗻𝗱 𝘀𝗽𝗿𝗲𝗮𝗱 𝗹𝗼𝘃𝗲 🎀
`;

        api.sendMessage(
          {
            body: messageBody,
            attachment: fs.createReadStream(outputPath),
          },
          event.threadID,
          () => fs.unlinkSync(outputPath),
          event.messageID
        );
      });

    } catch (error) {
      api.sendMessage(
        "❌ An error occurred while trying to find a match.\n" + error.message,
        event.threadID,
        event.messageID
      );
    }
  },
};
