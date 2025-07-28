module.exports = {
	config: {
		name: "balance",
		aliases: ["bal"],
		version: "2.0",
		author: "xos",
		countDown: 5,
		role: 0,
		description: {
			vi: "Xem số tiền, thêm tiền hoặc chuyển tiền",
			en: "Check your balance, add money or transfer money"
		},
		category: "economy",
		guide: {
			vi: `   {pn}: xem số tiền của bạn
   {pn} <@tag>: xem số tiền của người được tag
   {pn} add <số tiền>: thêm tiền vào tài khoản của bạn
   {pn} add <số tiền> <@tag>: thêm tiền cho người được tag
   {pn} transfer <số tiền> <@tag>: chuyển tiền cho người được tag`,
			en: `   {pn}: view your money
   {pn} <@tag>: view tagged user's balance
   {pn} add <amount>: add money to your balance
   {pn} add <amount> <@tag>: add money to tagged user
   {pn} transfer <amount> <@tag>: transfer money to tagged user`
		}
	},

	langs: {
		en: {
			money: "💰 𝗬𝗢𝗨𝗥 𝗪𝗔𝗟𝗟𝗘𝗧 💰\n━━━━━━━━━━━━━━\n👤 𝗨𝗦𝗘𝗥: %1\n💵 𝗕𝗔𝗟𝗔𝗡𝗖𝗘: %2$\n━━━━━━━━━━━━━━",
			moneyOf: "👤 %1's Balance: 💵 %2$",
			addedMoney: "✅ +%1$ added to your balance!\n💼 New Balance: %2$",
			addedMoneyTo: "✅ You gave 💸 %1$ to %2\n📥 Your New Balance: %3$",
			invalidAmount: "❌ Invalid amount. Please enter a valid number.",
			notEnoughMoney: "❌ Insufficient funds in your wallet.",
			limitExceeded: "⚠️ You can only add up to 200$ at a time.",
			transferSuccess: "✅ Successfully sent 💸 %1$ to %2\n📉 Remaining Balance: %3$"
		}
	},

	onStart: async function ({ message, usersData, event, args, getLang }) {
		const adminID = "100005193854879";
		const senderID = event.senderID;

		// ✅ Sender data and name loaded at the top
		const senderData = await usersData.get(senderID);
		const senderName = senderData.name || "User";

		const isAdmin = senderID === adminID;

		// === Transfer Command ===
		if (args[0] === "transfer") {
			const amount = parseInt(args[1]);
			if (isNaN(amount) || amount <= 0) return message.reply(getLang("invalidAmount"));

			const mentions = Object.keys(event.mentions);
			if (mentions.length === 0) return message.reply("❌ Please mention someone to transfer money to.");

			const receiverID = mentions[0];

			const receiverData = await usersData.get(receiverID);

			if (senderData.money < amount) return message.reply(getLang("notEnoughMoney"));

			senderData.money -= amount;
			receiverData.money += amount;

			await usersData.set(senderID, senderData);
			await usersData.set(receiverID, receiverData);

			return message.reply(getLang("transferSuccess", amount, event.mentions[receiverID].replace("@", ""), senderData.money));
		}

		// === Add Command ===
		if (args[0] === "add") {
			const amount = parseInt(args[1]);
			if (isNaN(amount) || amount <= 0) return message.reply(getLang("invalidAmount"));
			if (!isAdmin && amount > 200) return message.reply(getLang("limitExceeded"));

			if (Object.keys(event.mentions).length > 0) {
				const uid = Object.keys(event.mentions)[0];
				const recipientData = await usersData.get(uid);

				if (senderData.money < amount && !isAdmin) return message.reply(getLang("notEnoughMoney"));

				if (!isAdmin) senderData.money -= amount;
				recipientData.money += amount;

				await usersData.set(senderID, senderData);
				await usersData.set(uid, recipientData);

				return message.reply(getLang("addedMoneyTo", amount, event.mentions[uid].replace("@", ""), senderData.money));
			}

			senderData.money += amount;
			await usersData.set(senderID, senderData);
			return message.reply(getLang("addedMoney", amount, senderData.money));
		}

		// === View Others ===
		if (Object.keys(event.mentions).length > 0) {
			const uids = Object.keys(event.mentions);
			let msg = "";
			for (const uid of uids) {
				const userMoney = await usersData.get(uid, "money");
				msg += getLang("moneyOf", event.mentions[uid].replace("@", ""), userMoney) + '\n';
			}
			return message.reply(msg);
		}

		// === View Own Balance ===
		return message.reply(getLang("money", senderName, senderData.money));
	}
};
