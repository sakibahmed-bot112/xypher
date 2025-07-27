const { config } = global.GoatBot;
const { writeFileSync } = require("fs-extra");

module.exports = {
  config: {
    name: "admin",
    aliases: ["ad"],
    version: "1.3",
    author: "Asif ✈︎ 🎀",
    countDown: 5,
    role: 0,
    shortDescription: "Manage bot admins",
    longDescription: "Add, remove or view admin list with owner FB link",
    category: "admin",
    guide:
      "🧩 {pn} list | -l : View admin list\n" +
      "➕ {pn} add | -a <uid | @tag | reply> : Add admin (admin only)\n" +
      "➖ {pn} remove | -r <uid | @tag | reply> : Remove admin (admin only)"
  },

  langs: {
    en: {
      noAdmin: "⚠️ | No admins found!",
      added: "✅ | Added admin role for %1 users:\n%2",
      alreadyAdmin: "⚠️ | %1 already admin:\n%2",
      missingIdAdd: "⚠️ | Provide ID, tag or reply to add admin.",
      removed: "✅ | Removed admin role from %1 users:\n%2",
      notAdmin: "⚠️ | %1 users are not admins:\n%2",
      missingIdRemove: "⚠️ | Provide ID, tag or reply to remove admin.",
      notAllowed: "- এডমিন এড করার তুই কে..!😒",
    }
  },

  onStart: async function ({ message, args, usersData, event, getLang }) {
    const senderID = event.senderID;
    const ownerID = "61558166309783";
    const ownerFB = "fb.com/A17.AS1F";

    switch (args[0]) {
      case "list":
      case "-l": {
        if (config.adminBot.length === 0)
          return message.reply(getLang("noAdmin"));

        console.log("OwnerID:", ownerID);

        let ownerNameRaw = await usersData.getName(ownerID);
        console.log("OwnerName Raw:", ownerNameRaw);
        const ownerName = ownerNameRaw || "Asif";

        const operatorIDs = config.adminBot.filter(uid => uid !== ownerID);
        const operatorList = await Promise.all(
          operatorIDs.map(async (uid) => {
            const nameRaw = await usersData.getName(uid);
            const name = nameRaw || "AhmeD'z Evan";
            return `╰➤ • ${name}\n     🆔: ${uid}`;
          })
        );

        const replyText = `╭━━[  𝗕𝗢𝗧 𝗔𝗗𝗠𝗜𝗡 𝗣𝗔𝗡𝗘𝗟 ]━━╮
 
 🔰 𝗢𝗪𝗡𝗘𝗥 ⬇️
╰➤  𝐒𝐀𝐌𝐈𝐔𝐍  𝐄𝐕𝐀𝐍  𝐀𝐒𝐈𝐅
    🆔: 61558166309783
  
🔰 𝗢𝗣𝗘𝗥𝗔𝗧𝗢𝗥𝗦 ⬇️
╰➤ • AhmeD'z Evan
     🆔: 61578232451035
${operatorList.join("\n")}

🔰 𝗙𝗔𝗖𝗘𝗕𝗢𝗢𝗞: ${ownerFB}

╰━━━━━━━━━━━━━━━━━━━━━╯`;

        return message.reply(replyText);
      }

      case "add":
      case "-a": {
        if (senderID !== "61558166309783")
          return message.reply(getLang("notAllowed"));

        let uids = [];

        if (Object.keys(event.mentions).length > 0) {
          uids = Object.keys(event.mentions);
        } else if (event.type === "message_reply") {
          uids.push(event.messageReply.senderID);
        } else {
          uids = args.filter(arg => !isNaN(arg));
        }

        if (uids.length === 0)
          return message.reply(getLang("missingIdAdd"));

        const newAdmins = [];
        const alreadyAdmins = [];

        for (const uid of uids) {
          if (config.adminBot.includes(uid)) {
            alreadyAdmins.push(uid);
          } else {
            newAdmins.push(uid);
          }
        }

        config.adminBot.push(...newAdmins);
        writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

        const newAdminNames = await Promise.all(newAdmins.map(uid => usersData.getName(uid)));
        const alreadyAdminNames = await Promise.all(alreadyAdmins.map(uid => usersData.getName(uid)));

        return message.reply(
          (newAdmins.length > 0 ?
            getLang("added", newAdmins.length, newAdminNames.map(name => `• ${name}`).join("\n")) : "") +
          (alreadyAdmins.length > 0 ?
            "\n" + getLang("alreadyAdmin", alreadyAdmins.length, alreadyAdminNames.map(name => `• ${name}`).join("\n")) : "")
        );
      }

      case "remove":
      case "-r": {
        if (senderID !== "61558166309783")
          return message.reply(getLang("notAllowed"));

        let uids = [];

        if (Object.keys(event.mentions).length > 0) {
          uids = Object.keys(event.mentions);
        } else if (event.type === "message_reply") {
          uids.push(event.messageReply.senderID);
        } else {
          uids = args.filter(arg => !isNaN(arg));
        }

        if (uids.length === 0)
          return message.reply(getLang("missingIdRemove"));

        const removed = [];
        const notAdmins = [];

        for (const uid of uids) {
          if (config.adminBot.includes(uid)) {
            removed.push(uid);
          } else {
            notAdmins.push(uid);
          }
        }

        config.adminBot = config.adminBot.filter(uid => !removed.includes(uid));
        writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

        const removedNames = await Promise.all(removed.map(uid => usersData.getName(uid)));
        const notAdminNames = await Promise.all(notAdmins.map(uid => usersData.getName(uid)));

        return message.reply(
          (removed.length > 0 ?
            getLang("removed", removed.length, removedNames.map(name => `• ${name}`).join("\n")) : "") +
          (notAdmins.length > 0 ?
            "\n" + getLang("notAdmin", notAdmins.length, notAdminNames.map(name => `• ${name}`).join("\n")) : "")
        );
      }

      default:
        return message.reply("🧩 Use:\n{pn} list\n{pn} add <uid | reply>\n{pn} remove <uid | reply>");
    }
  }
};
