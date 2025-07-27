const axios = require("axios");
const fs = require("fs-extra");
const request = require("request");

module.exports = {
	config: {
		name: "join",
		version: "2.0",
		author: "Asif",
		countDown: 5,
		role: 2,
		shortDescription: "Join the group that bot is in",
		longDescription: "",
		category: "owner",
		guide: {
			en: "{p}{n}",
		},
	},

	onStart: async function ({ api, event }) {
		try {
			const groupList = await api.getThreadList(10, null, ['INBOX']);
			const filteredList = groupList.filter(group => group.isGroup && group.threadID);

			if (filteredList.length === 0) {
				return api.sendMessage('❌ No group chats found.', event.threadID);
			}

			// Fetch actual thread info to get accurate names
			const groupDetails = await Promise.all(filteredList.map(async (group) => {
				try {
					const info = await api.getThreadInfo(group.threadID);
					return {
						name: info.threadName || "Unnamed Group",
						threadID: group.threadID,
						participantCount: info.participantIDs.length
					};
				} catch (err) {
					console.error(`Error fetching thread info for ${group.threadID}`, err);
					return null;
				}
			}));

			const validGroups = groupDetails.filter(Boolean); // Remove any failed lookups

			const formattedList = validGroups.map((group, index) =>
				`│${index + 1}. ${group.name}\n│𝐓𝐈𝐃: ${group.threadID}\n│𝐓𝐨𝐭𝐚𝐥 𝐌𝐞𝐦𝐛𝐞𝐫𝐬: ${group.participantCount}\n│`
			);

			const message = `╭─╮\n│ 𝐋𝐢𝐬𝐭 𝐨𝐟 𝐆𝐫𝐨𝐮𝐩 𝐂𝐡𝐚𝐭𝐬:\n${formattedList.join("\n")}\n╰───────────────ꔪ\n𝐌𝐚𝐱 𝐌𝐞𝐦𝐛𝐞𝐫𝐬 𝐏𝐞𝐫 𝐆𝐫𝐨𝐮𝐩 = 250\n\n🔁 Reply to this message with the number of the group you want to join.`;

			const sentMessage = await api.sendMessage(message, event.threadID);
			global.GoatBot.onReply.set(sentMessage.messageID, {
				commandName: 'join',
				messageID: sentMessage.messageID,
				author: event.senderID,
				groupList: validGroups // store resolved group list for reply
			});
		} catch (error) {
			console.error("Error listing group chats:", error);
			api.sendMessage('❌ An error occurred while retrieving group list.', event.threadID);
		}
	},

	onReply: async function ({ api, event, Reply, args }) {
		const { author, groupList } = Reply;

		if (event.senderID !== author) {
			return;
		}

		const groupIndex = parseInt(args[0], 10);

		if (isNaN(groupIndex) || groupIndex <= 0 || groupIndex > groupList.length) {
			return api.sendMessage('⚠️ Invalid number. Please choose a valid group number.', event.threadID, event.messageID);
		}

		try {
			const selectedGroup = groupList[groupIndex - 1];
			const groupID = selectedGroup.threadID;

			// Check group info again
			const info = await api.getThreadInfo(groupID);

			// Already a member?
			if (info.participantIDs.includes(event.senderID)) {
				return api.sendMessage(`⚠️ You are already in the group chat:\n${selectedGroup.name}`, event.threadID, event.messageID);
			}

			// Group full?
			if (info.participantIDs.length >= 250) {
				return api.sendMessage(`🚫 The group chat is full:\n${selectedGroup.name}`, event.threadID, event.messageID);
			}

			await api.addUserToGroup(event.senderID, groupID);
			api.sendMessage(`✅ You have been added to the group:\n${selectedGroup.name}`, event.threadID, event.messageID);
		} catch (error) {
			console.error("Error joining group chat:", error);
			api.sendMessage('❌ Failed to join the group. Please try again later.', event.threadID, event.messageID);
		} finally {
			global.GoatBot.onReply.delete(event.messageID);
		}
	},
};
