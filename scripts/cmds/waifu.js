const axios = require('axios');

module.exports = {
	config: {
		name: "waifu",
		aliases: ["waifu", "neko"],
		version: "2.0",
		author: "NISAN + ChatGPT",
		countDown: 5,
		role: 0,
		shortDescription: "Anime action with tag support",
		longDescription: "Send anime-style actions with optional user mention",
		category: "anime",
		guide: "{pn} <category> [@mention]"
	},

	onStart: async function ({ message, args, event, usersData }) {
		const { mentions, senderID } = event;
		const mentionIDs = Object.keys(mentions);
		const category = args[0]?.toLowerCase();
		const senderName = (await usersData.get(senderID))?.name || "Someone";
		const targetTag = mentionIDs.length > 0 ? mentions[mentionIDs[0]] : null;
		const targetID = mentionIDs.length > 0 ? mentionIDs[0] : null;

		// ✅ ডিফল্ট: কিছু না দিলে random waifu
		if (!category) {
			try {
				const res = await axios.get(`https://api.waifu.pics/sfw/waifu`);
				const img = res.data.url;

				const form = {
					body: `${senderName} sent a waifu just for you 💖`,
					attachment: await global.utils.getStreamFromURL(img)
				};
				message.reply(form);
			} catch (e) {
				message.reply(`🥺 Couldn't fetch waifu.`);
			}
			return;
		}

		// ✅ ক্যাটাগরি অনুযায়ী মজার টেক্সট
		const messages = {
			slap: `${senderName} - থাপ্পড় মেরে চুপ করিয়ে দিলো ${targetTag} কে! 😵‍💫`,
			hug: `${senderName} - ভালবাসা দিয়ে জড়িয়ে ধরলো ${targetTag} কে 🤗`,
			kick: `${senderName} - লাত্থি মেরে উগান্ডায় পাঠালো ${targetTag} কে 😂`,
			cuddle: `${senderName} ${targetTag}- কে মিষ্টি করে জড়িয়ে ধরলো 🥰`,
			pat: `${senderName} ${targetTag} - এর মাথায় হাত বুলিয়ে দিলো 😇`,
			bonk: `${senderName} ${targetTag} - এর মাথায় বঁটকা মারলো! 🤕`,
			yeet: `${senderName} ${targetTag} - কে আকাশে ছুড়ে দিলো! 🪂`,
			kiss: `${senderName} ${targetTag} - কে আদর করে কিস দিলো 😘`,
			kill: `${senderName} - চুপিচুপি ${targetTag} কে শেষ করে দিলো ☠️`,
			happy: `${senderName} - আনন্দে ${targetTag} এর সাথে নাচছে! 🥳`,
			poke: `${senderName} - কিউটভাবে খোঁচা দিলো ${targetTag} কে 👉`,
			blush: `${senderName} ${targetTag} - কে দেখে লজ্জায় লাল হয়ে গেলো 😳`,
			dance: `${senderName} ${targetTag} - এর সাথে নাচতে শুরু করলো 💃🕺`,
			cry: `${senderName} ${targetTag} - এর কাঁধে মাথা রেখে কাঁদছে 😢`
		};

		const fallbackText = `${senderName} ${category} করলো ${targetTag || "নিজেই"} কে 🔥`;

		// ✅ API কল এবং রেসপন্স
		try {
			const res = await axios.get(`https://api.waifu.pics/sfw/${category}`);
			const img = res.data.url;

			const form = {
				body: messages[category] || fallbackText,
				mentions: targetID ? [{ tag: targetTag, id: targetID }] : [],
				attachment: await global.utils.getStreamFromURL(img)
			};

			message.reply(form);
		} catch (e) {
			message.reply(`🥺 Category "${category}" পাওয়া যায়নি বা সমস্যা হয়েছে।

✅ Available categories:
waifu, neko, slap, hug, kick, cuddle, pat, bonk, yeet, kiss, kill, happy, poke, blush, dance, cry`);
		}
	}
};
