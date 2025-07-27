const fs = require("fs");
const { getTime, drive } = global.utils;
if (!global.temp.welcomeEvent) global.temp.welcomeEvent = {};

module.exports = {
  config: {
    name: "welcome",
    version: "3.6",
    author: "Ariyan x Mahi",
    category: "events"
  },

  langs: {
    en: {
      session1: "morning",
      session2: "noon",
      session3: "afternoon",
      session4: "evening",
      multiple1: "you",
      multiple2: "you guys",
      defaultWelcomeMessage:
`━━━━━━━━━━━━━━━━━
- Assalamualaikum {userNameTag}
{multiple} are Now Members of  our {boxName} family 🐱

-  YOU'RE THE {memberIndex} 
MEMBER{memberPlural}
━━━━━━━━━━━━━━━━
- ADDED BY: {inviterName}
📜 GROUP RULES: {prefix}rules
⚙️ COMMANDS: {prefix}help
━━━━━━━━━━━━━━━━`
    }
  },

  onStart: async ({ threadsData, message, event, api, getLang, usersData }) => {
    if (event.logMessageType !== "log:subscribe") return;

    const { threadID } = event;
    const prefix = global.utils.getPrefix(threadID);
    const dataAddedParticipants = event.logMessageData.addedParticipants;
    const botID = api.getCurrentUserID();
    const threadData = await threadsData.get(threadID);
    const threadName = threadData.threadName;

    // ✅ Bot Added (Invited) Message
    const { nickNameBot } = global.GoatBot.config;
    if (dataAddedParticipants.some(user => user.userFbId == botID)) {
      if (nickNameBot)
        api.changeNickname(nickNameBot, threadID, botID);

      try {
        const memberInfo = await api.getThreadInfo(threadID);
        const memberCount = memberInfo.participantIDs.length;
        const inviterName = await usersData.getName(event.author);

        const videoURL = "https://files.catbox.moe/p5hcai.mp4";
        const videoResponse = await global.utils.getStreamFromURL(videoURL);

        await message.send({
          body:
`━━━━━━━━━━━━━━━━━
- THANKS FOR ADDING ME TO ${threadName} 🐱
- I'M YOUR ${memberCount}${getNumberSuffix(memberCount)} MEMBER

━━━━━━━━━━━━━━━━
INVITED BY: ${inviterName}
My all commands : ${prefix}help
━━━━━━━━━━━━━━━━━`,
          attachment: [videoResponse]
        });

      } catch (e) {
        console.error("Error while sending bot welcome:", e);
      }
      return;
    }

    // 👤 Handle User Join
    if (!global.temp.welcomeEvent[threadID])
      global.temp.welcomeEvent[threadID] = {
        joinTimeout: null,
        dataAddedParticipants: []
      };

    global.temp.welcomeEvent[threadID].dataAddedParticipants.push(...dataAddedParticipants);
    clearTimeout(global.temp.welcomeEvent[threadID].joinTimeout);

    global.temp.welcomeEvent[threadID].joinTimeout = setTimeout(async function () {
      const addedUsers = global.temp.welcomeEvent[threadID].dataAddedParticipants;
      const dataBanned = threadData.data.banned_ban || [];
      const mentions = [];
      const names = [];

      for (const user of addedUsers) {
        if (dataBanned.some(ban => ban.id == user.userFbId)) continue;
        names.push(user.fullName);
        mentions.push({ tag: user.fullName, id: user.userFbId });
      }

      if (names.length === 0) return;

      const welcomeMsgTemplate = threadData.data.welcomeMessage || getLang("defaultWelcomeMessage");
      const memberInfo = await api.getThreadInfo(threadID);
      const memberCount = memberInfo.participantIDs.length;

      const memberIndexList = [];
      for (let i = memberCount - names.length + 1; i <= memberCount; i++) {
        memberIndexList.push(i + getNumberSuffix(i));
      }

      const inviterName = await usersData.getName(event.author);
      const form = {
        body: welcomeMsgTemplate
          .replace(/\{userNameTag\}/g, names.join(", "))
          .replace(/\{multiple\}/g, names.length > 1 ? getLang("multiple2") : getLang("multiple1"))
          .replace(/\{boxName\}/g, threadName)
          .replace(/\{memberIndex\}/g, memberIndexList.join(", "))
          .replace(/\{memberPlural\}/g, names.length > 1 ? "s" : "")
          .replace(/\{inviterName\}/g, inviterName)
          .replace(/\{prefix\}/g, prefix),
        mentions
      };

      try {
        const videoURL = "https://files.catbox.moe/p5hcai.mp4";
        const videoResponse = await global.utils.getStreamFromURL(videoURL);
        form.attachment = [videoResponse];
      } catch (e) {
        console.error("Error while attaching welcome video:", e);
      }

      message.send(form);
      delete global.temp.welcomeEvent[threadID];
    }, 1500);
  }
};

function getNumberSuffix(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return (s[(v - 20) % 10] || s[v] || s[0]);
}
