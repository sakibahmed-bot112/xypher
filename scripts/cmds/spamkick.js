module.exports.config = {
  name: "spamkick",
  version: "1.0.0",
  role: 0, 
  author: "Dipto",
  usePrefix: true,
  description: { 
      en: "Automatically kick a user who spams messages in a group chat"
  },
  category: "group",
  guide: { en:"[on/off] or [settings]"},
  countDown: 5
};
module.exports.onChat = async ({ api, event, usersData, commandName }) => {
  const { senderID, threadID } = event;
  if (!global.antispam) global.antispam = new Map();

  const threadInfo = global.antispam.has(threadID) ? global.antispam.get(threadID) : { users: {} };
  if (!(senderID in threadInfo.users)) {
    threadInfo.users[senderID] = { count: 1, time: Date.now() };
  } else {
    threadInfo.users[senderID].count++;
    const timePassed = Date.now() - threadInfo.users[senderID].time;
    const messages = threadInfo.users[senderID].count;
    const timeLimit = 80000;
    const messageLimit = 10; //Limit of message

    if (messages > messageLimit && timePassed < timeLimit) {
      if(global.GoatBot.config.adminBot.includes(senderID)) return;
      api.removeUserFromGroup(senderID, threadID, async (err) => {
        if (err) {
          console.error(err);
        } else {
          api.sendMessage({body: `${await usersData.getName(senderID)} - বেশি বাল পাকনামির কারণে কিক দিলাম.!.\nUser ID: ${senderID}\n ❗ 𝐑𝐞𝐚𝐜𝐭 দে মেসজ এ আবার এড দিই বলদ রে..!💩.`}, threadID, (error,info) => {
              global.GoatBot.onReaction.set(info.messageID, { 
                  commandName, 
                  uid: senderID,
                  messageID: info.messageID
        });
          });
        }
      });

      threadInfo.users[senderID] = { count: 1, time: Date.now() };
    } else if (timePassed > timeLimit) {
      threadInfo.users[senderID] = { count: 1, time: Date.now() };
    }
  }

  global.antispam.set(threadID, threadInfo);

};

module.exports.onReaction = async ({ api, event, Reaction, threadsData, usersData , role }) => {
    const { uid, messageID } = Reaction;
    const { adminIDs, approvalMode } = await threadsData.get(event.threadID);
    const botID = api.getCurrentUserID();
    if (role < 1) return;
    var msg = "";

      try {
          await api.addUserToGroup(uid, event.threadID);
          if (approvalMode === true && !adminIDs.includes(botID)){
              msg += `Successfully added ${await usersData.getName(uid)} to approval list.`;
              await api.unsendMessage(messageID);
          }
          else{
              msg += `Successfully added ${await usersData.getName(uid)} to this group.`;
              await api.unsendMessage(messageID);
          }
      }
      catch (err) {
          msg += `Failed to add ${await usersData.getName(uid)} to this group.`;
      }
      console.log(msg);
  }



module.exports.onStart = async ({ api, event, args }) => {
  switch (args[0]) {
      case "on":
if (!global.antispam) global.antispam = new Map();
        global.antispam.set(event.threadID, { users: {} });
        api.sendMessage(" 𝐒𝐏𝐀𝐌  𝐊𝐈𝐂𝐊  𝐓𝐔𝐑𝐍𝐄𝐃  𝐎𝐍 ✅", event.threadID,event.messageID);
        break;
      case "off":
        if (global.antispam && global.antispam.has(event.threadID)) {
          global.antispam.delete(event.threadID);
          api.sendMessage(" 𝐒𝐏𝐀𝐌  𝐊𝐈𝐂𝐊  𝐓𝐔𝐑𝐍𝐄𝐃  𝐎𝐅𝐅 ❌", event.threadID,event.messageID);
        } else {
          api.sendMessage("- 𝐒𝐩𝐚𝐦 𝐤𝐢𝐜𝐤 𝐢𝐬 𝐧𝐨𝐭 𝐚𝐜𝐭𝐢𝐯𝐞 𝐨𝐧 𝐭𝐡𝐢𝐬 𝐠𝐫𝐨𝐮𝐩..!❌", event.threadID,event.messageID);
        }
        break;
      default:
        api.sendMessage("- 𝐏𝐥𝐞𝐚𝐬𝐞 𝐮𝐬𝐞 '𝐎𝐍' 𝐭𝐨 𝐚𝐜𝐭𝐢𝐯𝐚𝐭𝐞 𝐨𝐫 '𝐎𝐅𝐅' 𝐭𝐨 𝐝𝐞𝐚𝐜𝐭𝐢𝐯𝐚𝐭𝐞 𝐭𝐡𝐞 𝐬𝐩𝐚𝐦 𝐤𝐢𝐜𝐤.", event.threadID,event.messageID);
    }
  };
