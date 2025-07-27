module.exports = {
config: {
	name: "edit",
	author: "Tawsif~",
	category: "image",
	countDown: 5,
	role: 0,
	guide: { en: "edit <prompt> | reply to image"
}
},
onStart: async function({ message, event, args }) {
const prompt = args.join(" ");
if (!event.messageReply || !event?.messageReply?.attachments[0]?.url) { return message.reply('reply to an image');
} else if (!prompt) { return message.reply("❌ | provide a prompt");
}
const replyImageUrl = event.messageReply.attachments[0].url;	message.reaction("⏳", event.messageID);
try {
const t = new Date().getTime();
		let url = `https://tawsifz-gemini.onrender.com/edit?texts=${encodeURIComponent(prompt)}&url=${encodeURIComponent(replyImageUrl)}`;

await message.reply({ attachment: await global.utils.getStreamFromURL(url, 'edit.png'), body: `✅ | Here's your image ✨\n🕔 | Time taken: ${(new Date().getTime() -t)/1e3} seconds`,
});

	message.reaction("✅", event.messageID);
} catch (error) { message.send("❌ | " + error.message);
		}
	}
}
