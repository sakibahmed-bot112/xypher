!cmd install nickname.js const { getUserInfo } = global.utils;

module.exports = {
  config: {
    name: "nickname",
    aliases: ["nick", "nk"],
    version: "1.1",
    author: "YourName",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Show user's nickname in group"
    },
    longDescription: {
      en: "Show the nickname of a mentioned user (or yourself) in the group"
    },
    category: "group",
    guide: {
      en: "{pn} @mention / reply\n{pn} (to check your own nickname)"
    }
  },

  onStart: async function ({ api, event }) {
    try {
      const threadID = event.threadID;
      let targetID;

      if (Object.keys(event.mentions).length > 0) {
        targetID = Object.keys(event.mentions)[0];
      } else if (event.type === "message_reply") {
        targetID = event.messageReply.senderID;
      } else {
        targetID = event.senderID;
      }

      const threadInfo = await api.getThreadInfo(threadID);
      const nicknames = threadInfo.nicknames || {};
      const nickname = nicknames[targetID] || null;

      if (nickname) {
        const msg = 
`┏━━━━━━━━━━━━━━━━━┓
╏      ⦃ 𝐔𝐬𝐞𝐫 𝐍𝐢𝐜𝐤𝐍𝐚𝐦𝐞 ⦄
┣━━━━━━━━━━━━━━━━━┛
╏   𝐍► : ${nickname}
┗━━━━━━━━━━━━━━━━━━━━━━◊`;

        return api.sendMessage(msg, threadID, event.messageID);
      } else {
        return api.sendMessage(
          "- এই মূর্ক ইউসার নাম দেয় নি..!😵",
          threadID,
          event.messageID
        );
      }
    } catch (err) {
      console.error(err);
      return api.sendMessage("Wrong moye moye 😛", event.threadID, event.messageID);
    }
  }
};
