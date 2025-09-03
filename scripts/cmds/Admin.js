const { config } = global.GoatBot;
const { writeFileSync } = require("fs-extra");

module.exports = {
  config: {
    name: "admin",
    version: "2.8",
    author: " Mahi + Updated by Asif",
    countDown: 5,
    role: 0,
    category: "box chat",
    aliases: ["ad"],
    shortDescription: { en: "Add, remove, edit admin role" },
    longDescription: { en: "Add, remove, edit admin role" },
    guide: {
      en:
        '{pn} [add | -a] <uid | @tag>: Add admin role for user\n' +
        '{pn} [remove | -r] <uid | @tag>: Remove admin role of user\n' +
        '{pn} [list | -l]: List all admins'
    }
  },

  langs: {
    en: {
      added: `┏━━ ✅ 𝗔𝗗𝗗𝗘𝗗 [ %1 ] ━━━━━┓\n%2\n┗━━━━━━━━━━━━━━━━━┛`,
      alreadyAdmin: `┏━ ⚠️ 𝗔𝗟𝗥𝗘𝗔𝗗𝗬 𝗔𝗗𝗗 [ %1 ] ━┓\n%2\n┗━━━━━━━━━━━━━━━━━┛`,
      removed: `┏━━ ❌ 𝗥𝗘𝗠𝗢𝗩𝗘𝗗 [ %1 ] ━━┓\n%2\n┗━━━━━━━━━━━━━━━━┛`,
      notAdmin: "⚠️ | %1 users don't have admin role:\n%2",
      missingIdAdd: "⚠️ | Please enter ID or tag user to add admin role",
      missingIdRemove: "⚠️ | Please enter ID or tag user to remove admin role",
      listAdmin: "👑 | List of admins:\n%1",
      noPermissionList: " - ফকিন্নি এডমিন লিস্ট দেখার যোগ্যতা নাই     তর..!😾"
    }
  },

  onStart: async function ({ message, args, usersData, event, getLang }) {
    return await this.handle(message, args, usersData, event, getLang);
  },

  handle: async function (message, args, usersData, event, getLang) {
    const ownerUIDs = ["100027116303378"]; // Owner UID
    const permittedUIDs = ["100027116303378", "61558166309783"]; // Add/remove অনুমতি

    if (!args[0]) return;

    const sub = args[0].toLowerCase();

    // শুধু add/remove এর সময় অনুমতি চেক করবে
    if ((sub === "add" || sub === "-a" || sub === "remove" || sub === "-r") && !permittedUIDs.includes(event.senderID)) {
      return message.reply("⚠️ - বট কি তর বাপের, এডমিন এড করবি..!🙄");
    }

    const toBold = (txt) =>
      txt.replace(/[A-Za-z0-9]/g, (c) =>
        String.fromCodePoint({
          A: 0x1d400, B: 0x1d401, C: 0x1d402, D: 0x1d403, E: 0x1d404,
          F: 0x1d405, G: 0x1d406, H: 0x1d407, I: 0x1d408, J: 0x1d409,
          K: 0x1d40a, L: 0x1d40b, M: 0x1d40c, N: 0x1d40d, O: 0x1d40e,
          P: 0x1d40f, Q: 0x1d410, R: 0x1d411, S: 0x1d412, T: 0x1d413,
          U: 0x1d414, V: 0x1d415, W: 0x1d416, X: 0x1d417, Y: 0x1d418,
          Z: 0x1d419, a: 0x1d41a, b: 0x1d41b, c: 0x1d41c, d: 0x1d41d,
          e: 0x1d41e, f: 0x1d41f, g: 0x1d420, h: 0x1d421, i: 0x1d422,
          j: 0x1d423, k: 0x1d424, l: 0x1d425, m: 0x1d426, n: 0x1d427,
          o: 0x1d428, p: 0x1d429, q: 0x1d42a, r: 0x1d42b, s: 0x1d42c,
          t: 0x1d42d, u: 0x1d42e, v: 0x1d42f, w: 0x1d430, x: 0x1d431,
          y: 0x1d432, z: 0x1d433, 0: 0x1d7ce, 1: 0x1d7cf, 2: 0x1d7d0,
          3: 0x1d7d1, 4: 0x1d7d2, 5: 0x1d7d3, 6: 0x1d7d4, 7: 0x1d7d5,
          8: 0x1d7d6, 9: 0x1d7d7,
        }[c] || c)
      );

    const getUIDs = () => {
      let uids = Object.keys(event.mentions || {});
      if (!uids.length && event.messageReply) uids.push(event.messageReply.senderID);
      if (!uids.length) uids = args.slice(1).filter((a) => /^\d+$/.test(a));
      return uids;
    };

    // ---- Add ----
    if (sub === "add" || sub === "-a") {
      const uids = getUIDs();
      if (!uids.length) return message.reply(getLang("missingIdAdd"));

      const already = [], added = [];
      for (const uid of uids) config.adminBot.includes(uid) ? already.push(uid) : added.push(uid);
      config.adminBot.push(...added);
      writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

      const names = await Promise.all(uids.map(uid => usersData.getName(uid).then(n => ({ uid, name: n }))));
      return message.reply(
        (added.length ? getLang("added", added.length, names.filter(u => added.includes(u.uid)).map(u => `• 𝗡𝗮𝗺𝗲 : ${toBold(u.name)}\n• 𝗨𝗜𝗗  = ${toBold(u.uid)}`).join("\n")) : "") +
        (already.length ? getLang("alreadyAdmin", already.length, already.map(uid => `• 𝗨𝗜𝗗  = ${toBold(uid)}`).join("\n")) : "")
      );
    }

    // ---- Remove ----
    if (sub === "remove" || sub === "-r") {
      const uids = getUIDs();
      if (!uids.length) return message.reply(getLang("missingIdRemove"));

      const removed = [], notAdmin = [];
      for (const uid of uids) config.adminBot.includes(uid) ? removed.push(uid) : notAdmin.push(uid);
      removed.forEach(uid => config.adminBot.splice(config.adminBot.indexOf(uid), 1));
      writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

      const names = await Promise.all(removed.map(uid => usersData.getName(uid).then(n => ({ uid, name: n }))));
      return message.reply(
        (removed.length ? getLang("removed", removed.length, names.map(u => `• 𝗡𝗮𝗺𝗲 : ${toBold(u.name)}\n• 𝗨𝗜𝗗  = ${toBold(u.uid)}`).join("\n")) : "") +
        (notAdmin.length ? getLang("notAdmin", notAdmin.length, notAdmin.map(uid => `• ${uid}`).join("\n")) : "")
      );
    }

    // ---- List ----
    if (sub === "list" || sub === "-l") {
      // শুধু Owner বা Admin রাই লিস্ট দেখতে পারবে
      if (!config.adminBot.includes(event.senderID) && !ownerUIDs.includes(event.senderID)) {
        return message.reply(getLang("noPermissionList"));
      }

      const names = await Promise.all(
        config.adminBot.map(uid =>
          usersData.getName(uid).then(n => ({ uid, name: n })).catch(() => ({ uid, name: uid }))
        )
      );

      const owners = names.filter(u => ownerUIDs.includes(u.uid));
      const operators = names.filter(u => !ownerUIDs.includes(u.uid));

      let msg = `┏━━━━━━━━━━━━━━━━━━━━┓\n┃        👑 𝗔𝗗𝗠𝗜𝗡 𝗟𝗜𝗦𝗧       ┃\n┣━━━━━━━━━━━━━━━━━━━━┫\n`;
      if (owners.length)
        msg += `┃ 👑 ${toBold("𝗢𝗪𝗡𝗘𝗥  𝗟𝗜𝗦𝗧")} ┃\n` +
               owners.map((u,i)=>`┃ ${i+1}. 👑 Name: ${toBold(u.name)}\n┃    UID : ${toBold(u.uid)}`).join("\n") +
               "\n┣━━━━━━━━━━━━━━━━━━━━┫\n";
      if (operators.length)
        msg += `┃ 👫 ${toBold("𝗢𝗣𝗘𝗥𝗔𝗧𝗢𝗥  𝗟𝗜𝗦𝗧")} ┃\n` +
               operators.map((u,i)=>`┃ ${i+1}. 🎀 Name: ${toBold(u.name)}\n┃    UID : ${toBold(u.uid)}`).join("\n") +
               "\n";
      msg += `┗━━━━━━━━━━━━━━━━━━━━┛\n👫 𝗧𝗼𝘁𝗮𝗹 𝗔𝗱𝗺𝗶𝗻𝘀: ${toBold(names.length.toString())}`;

      return message.reply(msg);
    }
  }
};
