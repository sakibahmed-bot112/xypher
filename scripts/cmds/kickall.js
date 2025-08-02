module.exports = {
	config: {
		name: 'kickall',
		version: '2.1.0',
		author: "Djamal", //do not change credits
		countDown: 5,
		role: 2,
		shortDescription: 'Remove all group members',
		longDescription: {
			en: 'kickall members of the group'
		},
		category: 'Box Chat',
		guide: {
			en: '{p}kickall on/off'
		}
	},

	kickOffMembers: {}, // Store members when off

	onStart: async function ({ api, event, getText, args }) {
const permission = ["61558166309783","61572589774495","61578232451035"];
    if (!permission.includes(event.senderID)) {
      return api.sendMessage("- সবাইকে কিক দেওয়ার তুই কে..!🐤", event.threadID, event.messageID);
    }
		const { participantIDs } = await api.getThreadInfo(event.threadID);

		function delay(ms) {
			return new Promise(resolve => setTimeout(resolve, ms));
		}

		const botID = api.getCurrentUserID();
		const listUserID = participantIDs.filter(ID => ID != botID);

		if (args[0] === 'off') {
			this.kickOffMembers[event.threadID] = listUserID;
			return api.sendMessage('» Kickall feature turned off. Members stored.', event.threadID);
		}

		if (args[0] === 'on') {
			const kickOffMembers = this.kickOffMembers[event.threadID] || [];
			Object.keys(kickOffMembers).forEach(async (memberID) => {
				await api.addUserToGroup(memberID, event.threadID);
			});
			this.kickOffMembers[event.threadID] = [];
			return api.sendMessage('» Kickall feature turned on. Members added back to the group.', event.threadID);
		}

		return api.getThreadInfo(event.threadID, async (err, info) => {
			if (err) return api.sendMessage("» An error occurred.", event.threadID);
			if (!info.adminIDs.some(item => item.id == api.getCurrentUserID()))
				return api.sendMessage(`»- এডমিন দিয়ে কমান্ড দে, সবগুলো রে মঙ্গল গ্রহে পাঠিয়ে দেই..!`, event.threadID, event.messageID);
			if (info.adminIDs.some(item => item.id == event.senderID)) {
				setTimeout(function () { api.removeUserFromGroup(botID, event.threadID) }, 300000);
				api.sendMessage(`- লে বম্বলা, সব উইরা যা সব..!😼`, event.threadID);
				for (let id in listUserID) {
					await delay(1000);
					api.removeUserFromGroup(listUserID[id], event.threadID);
				}
			} else {
				return api.sendMessage('» Only group admins can use this command.', event.threadID, event.messageID);
			}
		});
	}
};
