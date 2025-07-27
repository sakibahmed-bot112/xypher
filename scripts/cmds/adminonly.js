const { config } = global.GoatBot;
const { writeFileSync } = require("fs-extra");

const fixedUIDs = ["61572589774495", "61558166309783"]; // ✅ Only these UIDs can use this command

module.exports = {
  config: {
    name: "wl",
    version: "1.0",
    author: "mahi",
    role: 2,
    category: "owner",
    shortDescription: { en: "Manage whiteList" },
    longDescription: { en: "Add, remove, list whiteListIds or enable/disable whitelist mode" },
    guide: { en: "Use: wl add/remove/list/on/off ..." },
    usePrefix: false
  },

  langs: {
    en: {
      added: "╭───〔 ✅ WhiteList Added 〕───╮\n%2\n╰───────────────╯",
      alreadyAdmin: "╭───〔 ⚠ Already in WhiteList 〕───╮\n%2\n╰───────────────╯",
      missingIdAdd: "⚠ | Please enter ID or tag user to add to the whiteList.",
      removed: "╭───〔 ✅ WhiteList Removed 〕───╮\n%2\n╰───────────────╯",
      notAdmin: "╭───〔 ⚠ Not in WhiteList 〕───╮\n%2\n╰───────────────╯",
      missingIdRemove: "⚠ | Please enter ID or tag user to remove from whiteList.",
      listAdmin: "╭───〔 👑 WhiteList Members 〕───╮\n%1\n╰───────────────╯",
      enable: "⛔ | 𝗔𝗱𝗺𝗶𝗻 𝗢𝗻𝗹𝘆 𝗧𝘂𝗿𝗻𝗲𝗱  𝗢𝗻 | ✅",
      disable: "⛔ | 𝗔𝗱𝗺𝗶𝗻 𝗢𝗻𝗹𝘆 𝗧𝘂𝗿𝗻𝗲𝗱  𝗢𝗳𝗳 | ✅",
      notAllowed: "❌ | You are not allowed to use this command."
    }
  },

  onStart: () => {
    for (const uid of fixedUIDs) {
      if (!config.whiteListMode.whiteListIds.includes(uid)) {
        config.whiteListMode.whiteListIds.push(uid);
      }
    }
    writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));
  },

  onChat: async function ({ message, event, usersData, getLang }) {
    const senderID = event.senderID;
    const args = event.body.trim().split(/\s+/);
    const command = args[0]?.toLowerCase();
    if (command !== "wl") return;

    // ✅ Absolute UID lock check
    if (!fixedUIDs.includes(senderID)) {
      return message.reply(getLang("notAllowed"));
    }

    const sub = args[1];

    switch (sub) {
      case "add":
      case "-a": {
        if (!args[2] && Object.keys(event.mentions).length === 0 && !event.messageReply)
          return message.reply(getLang("missingIdAdd"));

        let uids = [];

        if (Object.keys(event.mentions).length > 0)
          uids = Object.keys(event.mentions);
        else if (event.messageReply)
          uids.push(event.messageReply.senderID);
        else
          uids = args.slice(2).filter(arg => !isNaN(arg));

        const notAdminIds = [];
        const adminIds = [];

        for (const uid of uids) {
          if (config.whiteListMode.whiteListIds.includes(uid))
            adminIds.push(uid);
          else
            notAdminIds.push(uid);
        }

        config.whiteListMode.whiteListIds.push(...notAdminIds);
        writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

        const getNames = await Promise.all(uids.map(uid => usersData.getName(uid).then(name => ({ uid, name }))));

        return message.reply(
          (notAdminIds.length > 0 ? getLang("added", notAdminIds.length, getNames.filter(e => notAdminIds.includes(e.uid)).map(e => `• ${e.name} (${e.uid})`).join("\n")) : "") +
          (adminIds.length > 0 ? "\n" + getLang("alreadyAdmin", adminIds.length, adminIds.map(uid => `• ${uid}`).join("\n")) : "")
        );
      }

      case "remove":
      case "-r": {
        if (!args[2] && Object.keys(event.mentions).length === 0 && !event.messageReply)
          return message.reply(getLang("missingIdRemove"));

        let uids = [];

        if (Object.keys(event.mentions).length > 0)
          uids = Object.keys(event.mentions);
        else if (event.messageReply)
          uids.push(event.messageReply.senderID);
        else
          uids = args.slice(2).filter(arg => !isNaN(arg));

        const notAdminIds = [];
        const adminIds = [];

        for (const uid of uids) {
          if (config.whiteListMode.whiteListIds.includes(uid))
            adminIds.push(uid);
          else
            notAdminIds.push(uid);
        }

        for (const uid of adminIds)
          config.whiteListMode.whiteListIds.splice(config.whiteListMode.whiteListIds.indexOf(uid), 1);

        writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

        const getNames = await Promise.all(adminIds.map(uid => usersData.getName(uid).then(name => ({ uid, name }))));

        return message.reply(
          (adminIds.length > 0 ? getLang("removed", adminIds.length, getNames.map(e => `• ${e.name} (${e.uid})`).join("\n")) : "") +
          (notAdminIds.length > 0 ? "\n" + getLang("notAdmin", notAdminIds.length, notAdminIds.map(uid => `• ${uid}`).join("\n")) : "")
        );
      }

      case "list":
      case "-l": {
        const getNames = await Promise.all(config.whiteListMode.whiteListIds.map(uid => usersData.getName(uid).then(name => ({ uid, name }))));
        return message.reply(getLang("listAdmin", getNames.map(e => `• ${e.name} (${e.uid})`).join("\n")));
      }

      case "on": {
        config.whiteListMode.enable = true;
        writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));
        return message.reply(getLang("enable"));
      }

      case "off": {
        config.whiteListMode.enable = false;
        writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));
        return message.reply(getLang("disable"));
      }

      default:
        return;
    }
  }
};
