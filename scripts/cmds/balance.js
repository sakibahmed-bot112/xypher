module.exports = {
	config: {
		name: "balance",
		aliases: ["bal"],
		version: "1.5",
		author: "BaYjid",
		countDown: 5,
		role: 0,
		description: {
			vi: "xem số tiền hiện có của bạn hoặc người được tag, hoặc thêm tiền",
			en: "view your money, the money of the tagged person, or add money"
		},
		category: "economy",
		guide: {
			vi: "   {pn}: xem số tiền của bạn"
				+ "\n   {pn} <@tag>: xem số tiền của người được tag"
				+ "\n   {pn} add <số tiền>: thêm tiền vào tài khoản của bạn"
				+ "\n   {pn} add <số tiền> <@tag>: thêm tiền cho người được tag",
			en: "   {pn}: view your money"
				+ "\n   {pn} <@tag>: view the money of the tagged person"
				+ "\n   {pn} add <amount>: add money to your account"
				+ "\n   {pn} add <amount> <@tag>: give money to the tagged person"
		}
	},

	langs: {
		vi: {
			money: "Bạn đang có %1$",
			moneyOf: "%1 đang có %2$",
			addedMoney: "Đã thêm %1$ vào tài khoản của bạn. Số dư hiện tại: %2$",
			addedMoneyTo: "Bạn đã chuyển %1$ cho %2. Số dư của bạn: %3$",
			invalidAmount: "Số tiền không hợp lệ.",
			notEnoughMoney: "Bạn không có đủ tiền để chuyển.",
			limitExceeded: "Bạn chỉ có thể thêm tối đa 500$ một lần."
		},
		en: {
			money: "💰 | 𝚈𝚘𝚞'𝚜 𝚆𝚊𝚕𝚕𝚎𝚝:\n━━━━━━━━━━━━━━\n💵 𝗕𝗔𝗟𝗔𝗡𝗖𝗘: %1$ \n━━━━━━━━━━━━━━\n🎉🎉🎉🎉🎉🎉🎉🎉",
			moneyOf: "%1 has %2$",
			addedMoney: "✅ Added %1$ to your account. New balance: %2$",
			addedMoneyTo: "✅ You sent %1$ to %2. Your new balance: %3$",
			invalidAmount: "❌ Invalid amount.",
			notEnoughMoney: "❌ You don't have enough money to send.",
			limitExceeded: "❌ You can only add a maximum of 200$ at a time."
		}
	},

	onStart: async function ({ message, usersData, event, args, getLang }) {
		// Replace with the actual admin user ID
		const adminID = "100005193854879"; 

		if (args[0] === "add") {
			const amount = parseInt(args[1]);
			if (isNaN(amount) || amount <= 0) return message.reply(getLang("invalidAmount"));

			// Check if user is an admin; if not, apply the limit
			const isAdmin = event.senderID === adminID;
			if (!isAdmin && amount > 200) return message.reply(getLang("limitExceeded")); // Limit amount to 200 for non-admins

			const senderData = await usersData.get(event.senderID);

			if (Object.keys(event.mentions).length > 0) {
				const uid = Object.keys(event.mentions)[0];
				const recipientData = await usersData.get(uid);

				// Check if sender has enough money to send
				if (senderData.money < amount) return message.reply(getLang("notEnoughMoney"));

				// Deduct money from sender and add to recipient
				senderData.money -= amount;
				recipientData.money += amount;

				await usersData.set(event.senderID, senderData);
				await usersData.set(uid, recipientData);

				return message.reply(getLang("addedMoneyTo", amount, event.mentions[uid].replace("@", ""), senderData.money));
			}

			// If no user is mentioned, add money to sender's account
			senderData.money += amount;
			await usersData.set(event.senderID, senderData);
			return message.reply(getLang("addedMoney", amount, senderData.money));
		}

		if (Object.keys(event.mentions).length > 0) {
			const uids = Object.keys(event.mentions);
			let msg = "";
			for (const uid of uids) {
				const userMoney = await usersData.get(uid, "money");
				msg += getLang("moneyOf", event.mentions[uid].replace("@", ""), userMoney) + '\n';
			}
			return message.reply(msg);
		}

		const userData = await usersData.get(event.senderID);
		message.reply(getLang("money", userData.money));
	}
};
