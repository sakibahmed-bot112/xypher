module.exports = {
	config: {
		name: "out",
		version: "1.0",
		author: "XyryllPanget",
		countDown: 5,
		role: 2,
		shortDescription: {
			vi: "",
			en: "kick 🦶 bot from gc by owner bot"
		},
		longDescription: {
			vi: "",
			en: "remove bot from group "
		},
		category: "owner",
		guide: {
			vi: "",
			en: "just write غادر"
		}
},
	onStart: async function ({ api, args, message, event }) {
		const permission = ["100084649759285","61572589774495"];
  if (!permission.includes(event.senderID)) {
    api.sendMessage(" - 𝗞𝗮𝗻𝗸𝗶𝗿 𝗰𝗲𝗹𝗲 𝗮𝗺𝗸 𝗯𝗲𝗿 𝗸𝗼𝗿𝗮𝗿 𝘁𝘂𝗶 𝗸𝗲..!😤.", event.threadID, event.messageID);
    return;
  }

			if (!args[0]) return api.removeUserFromGroup(api.getCurrentUserID(), event.threadID);
				if (!isNaN(args[0])) return api.removeUserFromGroup(api.getCurrentUserID(), args.join(" "));
	}
}
