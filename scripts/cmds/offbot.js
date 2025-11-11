module.exports = {
	config: {
		name: "offbot",
		version: "1.0",
		author: "Samir",
		countDown: 45,
		role: 2,
		shortDescription: "Turn off bot",
		longDescription: "Turn off bot",
		category: "owner",
		guide: "{p}{n}"
	},
	onStart: async function ({event, api}) {
		const permission = ["61581502015227","61558166309783","61558166309783"];
    if (!permission.includes(event.senderID)) {
      return api.sendMessage("- Paku, You don't have permission to use this command. 🐤", event.threadID, event.messageID);
    }
		api.sendMessage("╔════ஜ۩۞۩ஜ═══╗\n\n📴Successfully Turned Off Archives System ✅\n╚════ஜ۩۞۩ஜ═══╝",event.threadID, () =>process.exit(0))}
};
