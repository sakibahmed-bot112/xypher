const fs = require('fs');
const path = require('path');
const { drive, getStreamFromURL } = global.utils;

const hotDataFilePath = path.join(__dirname, 'vdo.json');

// Read hot data, always returns { videos: [], sent: [] }
function readHotData() {
	try {
		const data = fs.readFileSync(hotDataFilePath, 'utf8');
		const parsed = JSON.parse(data);

		// Backward compatibility if vdo.json was just an array
		if (Array.isArray(parsed)) {
			return { videos: parsed, sent: [] };
		} else if (typeof parsed === 'object') {
			return {
				videos: Array.isArray(parsed.videos) ? parsed.videos : [],
				sent: Array.isArray(parsed.sent) ? parsed.sent : [],
			};
		}
		return { videos: [], sent: [] };
	} catch (error) {
		return { videos: [], sent: [] };
	}
}

function writeHotData({ videos, sent }) {
	fs.writeFileSync(
		hotDataFilePath,
		JSON.stringify({ videos, sent }, null, 2),
		'utf8'
	);
}

module.exports = {
	config: {
		name: 'hot',
		version: '2.0',
		author: 'Kshitiz (fixed by Copilot Chat)',
		role: 1,
		shortDescription: { en: 'Manage videos' },
		longDescription: { en: 'Add and send videos' },
		category: 'custom',
		guide: {
			en:
				'   {pn} add: Reply to a video to add it to the video collection' +
				'\n   {pn} send: Send a random video from the video collection',
		},
	},

	onStart: async function ({ args, message, event }) {
		let hotData = readHotData(); // { videos: [], sent: [] }

		switch ((args[0] || '').toLowerCase()) {
			case 'add': {
				if (
					event.messageReply &&
					Array.isArray(event.messageReply.attachments)
				) {
					const videoAttachment = event.messageReply.attachments.find(
						att => att.type === 'video'
					);

					if (!videoAttachment) {
						return message.reply('Reply to a video to add it to the video collection.');
					}
					try {
						const fileName = `hot_${Date.now()}.mp4`;
						const infoFile = await drive.uploadFile(
							fileName,
							'application/octet-stream',
							await getStreamFromURL(videoAttachment.url)
						);

						hotData.videos.push(infoFile.id);
						writeHotData(hotData);
						return message.reply('Video added to the hot collection.');
					} catch (err) {
						return message.reply('Failed to upload video. Please try again.');
					}
				} else {
					return message.reply('Please reply to a video to add it to the video collection.');
				}
			}

			case 'send': {
				const { videos, sent } = hotData;

				if (!videos.length) {
					return message.reply('The video collection is empty.');
				}

				// Reset sent list if all have been sent
				let unsent = videos.filter(id => !sent.includes(id));
				if (unsent.length === 0) {
					hotData.sent = [];
					unsent = videos.slice();
				}

				// Pick a random unsent video
				const chosenId = unsent[Math.floor(Math.random() * unsent.length)];

				try {
					const videoStream = await drive.getFile(chosenId, 'stream', true);
					await message.reply({ attachment: [videoStream] });
					hotData.sent.push(chosenId);
					writeHotData(hotData);
				} catch (err) {
					return message.reply('Failed to send video. It may be missing.');
				}
				break;
			}

			default:
				message.reply(
					'Invalid usage.\nUse:\n- hot add (reply to a video)\n- hot send'
				);
		}
	},
};
