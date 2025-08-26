const { config } = global.GoatBot;
const { client } = global;
const { writeFileSync } = require("fs-extra");

// ⬇️ এখানে তোমার ৩টা Owner UID বসাও
const OWNER_UID = ["661558166309783", "61572589774495", "100027116303378"];

module.exports = {
	config: {
		name: "whitelistthread",
		aliases: ["wlt", "wt"],
		version: "1.7",
		author: "NTKhang + Modified by Asif",
		countDown: 5,
		role: 2,
		description: {
			en: "Add, remove, edit whiteListThreadIds role"
		},
		category: "owner",
		guide: {
			en: '   {pn} [add | -a | +] [<tid>...]: ✦••┈𝗔𝗱𝗱 𝚆𝗛𝗜𝗧𝗘𝗟𝗜𝗦𝗧••┈✦\n'
				+ '   {pn} [remove | -r | -] [<tid>...]: ✦••┈𝗥𝗲𝗺𝗼𝘃𝗲 𝚆𝗛𝗜𝗧𝗘𝗟𝗜𝗦𝗧••┈✦\n'
				+ '   {pn} [list | -l]: ✦••┈𝗟𝗶𝘀𝘁 𝗪𝗵𝗶𝘁𝗲𝗟𝗶𝘀𝘁 𝗧𝗵𝗿𝗲𝗮𝗱𝗦••┈✦\n'
				+ '   {pn} [mode | -m] <on|off>: ✦••┈𝗠𝗼𝗱𝗲 𝗧𝗵𝗿𝗲𝗮𝗱••┈✦ (Only Owner)\n'
				+ '   {pn} [mode | -m] noti <on|off>: ✦••┈𝗡𝗼𝘁𝗶𝗳 𝗧𝗵𝗿𝗲𝗮𝗱••┈✦ (Only Owner)'
		}
	},

	langs: {
		en: {
			added: `\n✦••┈𝗔𝗱𝗱𝗲𝗱 %1 𝗧𝗵𝗿𝗲𝗮𝗱/𝗦••┈✦\n%2`,
			alreadyWLT: `✦⚠️••┈𝗔𝗹𝗿𝗲𝗮𝗱𝘆 𝗔𝗱𝗱𝗲𝗱 %1 𝗧𝗵𝗿𝗲𝗮𝗱/𝗦••┈✦\n%2\n`,
			missingTIDAdd: "⚠️••┈𝗣𝗹𝗲𝗮𝘀𝗲 𝗲𝗻𝘁𝗲𝗿 𝗧𝗜𝗗 𝘁𝗼 𝗮𝗱𝗱 𝗪𝗵𝗶𝘁𝗲𝗟𝗶𝘀𝘁 𝗧𝗵𝗿𝗲𝗮𝗱••┈✦",
			removed: `\n✦••┈𝗥𝗲𝗺𝗼𝘃𝗲𝗱 %1 𝗧𝗵𝗿𝗲𝗮𝗱/𝗦••┈✦\n%2`,
			notAdded: `✦❎••┈𝗗𝗶𝗱𝗻'𝘁 𝗔𝗱𝗱 %1 𝗧𝗵𝗿𝗲𝗮𝗱/𝗦••┈✦\n%2\n`,
			missingTIDRemove: "⚠️••┈𝗣𝗹𝗲𝗮𝘀𝗲 𝗲𝗻𝘁𝗲𝗿 𝗧𝗜𝗗 𝘁𝗼 𝗿𝗲𝗺𝗼𝘃𝗲 𝗪𝗵𝗶𝘁𝗲𝗟𝗶𝘀𝘁 𝗧𝗵𝗿𝗲𝗮𝗱••┈✦",
			listWLTs: `✦••┈𝗟𝗶𝘀𝘁 𝗼𝗳 𝗪𝗵𝗶𝘁𝗲𝗟𝗶𝘀𝘁 𝗧𝗵𝗿𝗲𝗮𝗱𝗦••┈✦`,
			turnedOn: "⛔|- 𝗔𝗗𝗠𝗜𝗡  𝗢𝗡𝗟𝗬  𝗢𝗡 -|✅",
			turnedOff: "⛔|- 𝗔𝗗𝗠𝗜𝗡  𝗢𝗡𝗟𝗬  𝗢𝗙𝗙 -|❌ ",
			turnedOnNoti: "✅••┈𝗧𝘂𝗿𝗻𝗲𝗱 𝗢𝗻 𝗡𝗼𝘁𝗶𝗳 𝗪𝗵𝗲𝗻 𝗡𝗼𝗻-𝗪𝗵𝗶𝘁𝗲𝗟𝗶𝘀𝘁 𝗧𝗵𝗿𝗲𝗮𝗱••┈✦",
			turnedOffNoti: "❎••┈𝗧𝘂𝗿𝗻𝗲𝗱 𝗢𝗳𝗳 𝗡𝗼𝘁𝗶𝗳 𝗪𝗵𝗲𝗻 𝗡𝗼𝗻-𝗪𝗵𝗶𝘁𝗲𝗟𝗶𝘀𝘁 𝗧𝗵𝗿𝗲𝗮𝗱••┈✦",
			onlyOwner: "- 𝗢𝗡𝗟𝗬 𝗢𝗪𝗡𝗘𝗥 𝗔𝗦𝗜𝗙 𝗨𝗦𝗘 𝗧𝗛𝗜𝗦..!😢"
		}
	},

	onStart: async function ({ message, args, event, getLang, api }) {
		switch (args[0]) {
			case "add":
			case "-a":
			case "+": {
				let tids = args.slice(1).filter(arg => !isNaN(arg));
				if (tids.length <= 0) tids.push(event.threadID);

				const notWLTIDs = [];
				const threadIDs = [];
				for (const tid of tids) {
					if (config.whiteListModeThread.whiteListThreadIds.includes(tid))
						threadIDs.push(tid);
					else
						notWLTIDs.push(tid);
				}
				config.whiteListModeThread.whiteListThreadIds.push(...notWLTIDs);

				const getNames = await Promise.all(tids.map(async tid => {
					const d = await api.getThreadInfo(tid).catch(() => null) || {};
					return { tid, name: d.threadName || "Not found" };
				}));

				writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));
				return message.reply(
					(notWLTIDs.length > 0 ? getLang("added", notWLTIDs.length, getNames.filter(({ tid }) => notWLTIDs.includes(tid)).map(({ tid, name }) => `├‣ ✦••𝗧𝗵𝗿𝗲𝗮𝗱 𝗡𝗮𝗺𝗲: ${name}\n╰‣ ✦••𝗧𝗵𝗿𝗲𝗮𝗱 𝗜𝗗: ${tid}`).join("\n")) : "")
					+ (threadIDs.length > 0 ? getLang("alreadyWLT", threadIDs.length, threadIDs.map(tid => `╰‣ ✦••𝗧𝗵𝗿𝗲𝗮𝗱 𝗜𝗗: ${tid}`).join("\n")) : "")
				);
			}
			case "remove":
			case "rm":
			case "-r":
			case "-": {
				let tids = args.slice(1).filter(arg => !isNaN(arg));
				if (tids.length <= 0) tids.push(event.threadID);

				const notWLTIDs = [];
				const threadIDs = [];
				for (const tid of tids) {
					if (config.whiteListModeThread.whiteListThreadIds.includes(tid))
						threadIDs.push(tid);
					else
						notWLTIDs.push(tid);
				}
				for (const tid of threadIDs)
					config.whiteListModeThread.whiteListThreadIds.splice(config.whiteListModeThread.whiteListThreadIds.indexOf(tid), 1);

				const getNames = await Promise.all(threadIDs.map(async tid => {
					const d = await api.getThreadInfo(tid).catch(() => null) || {};
					return { tid, name: d.threadName || "Not found" };
				}));

				writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));
				return message.reply(
					(threadIDs.length > 0 ? getLang("removed", threadIDs.length, getNames.map(({ tid, name }) => `├‣ ✦••𝗧𝗵𝗿𝗲𝗮𝗱 𝗡𝗮𝗺𝗲: ${name}\n╰‣ ✦••𝗧𝗵𝗿𝗲𝗮𝗱 𝗜𝗗: ${tid}`).join("\n")) : "")
					+ (notWLTIDs.length > 0 ? getLang("notAdded", notWLTIDs.length, notWLTIDs.map(tid => `╰‣ ✦••𝗧𝗵𝗿𝗲𝗮𝗱 𝗜𝗗: ${tid}`).join("\n")) : "")
				);
			}
			case "list":
			case "-l": {
				const whiteListIDs = config.whiteListModeThread.whiteListThreadIds;
				if (!whiteListIDs || whiteListIDs.length === 0)
					return message.reply("✦••┈𝗪𝗵𝗶𝘁𝗲𝗟𝗶𝘀𝘁 𝗧𝗵𝗿𝗲𝗮𝗱 𝗟𝗶𝘀𝘁 𝗶𝘀 𝗘𝗺𝗽𝘁𝘆••┈✦");

				const getNames = await Promise.all(whiteListIDs.map(async tid => {
					const t = await api.getThreadInfo(tid).catch(() => null) || {};
					const name = t.threadName || "Unfetched";
					return `├‣ ✦••𝗧𝗵𝗿𝗲𝗮𝗱 𝗡𝗮𝗺𝗲: ${name}\n╰‣ ✦••𝗧𝗵𝗿𝗲𝗮𝗱 𝗜𝗗: ${tid}`;
				}));

				return message.reply(`${getLang("listWLTs")}\n\n` + getNames.join("\n\n"));
			}
			case "mode":
			case "m":
			case "-m": {
				if (!OWNER_UID.includes(event.senderID)) {
					return message.reply(getLang("onlyOwner"));
				}

				let isSetNoti = false;
				let value;
				let indexGetVal = 1;

				if (args[1] == "noti") {
					isSetNoti = true;
					indexGetVal = 2;
				}

				if (args[indexGetVal] == "on") value = true;
				else if (args[indexGetVal] == "off") value = false;

				if (isSetNoti) {
					config.hideNotiMessage.whiteListModeThread = !value;
					message.reply(getLang(value ? "turnedOnNoti" : "turnedOffNoti"));
				} else {
					config.whiteListModeThread.enable = value;
					message.reply(getLang(value ? "turnedOn" : "turnedOff"));
				}

				writeFileSync(client.dirConfig, JSON.stringify(config, null, 2));
				break;
			}
			default:
				return message.reply(getLang("missingTIDAdd"));
		}
	}
};
