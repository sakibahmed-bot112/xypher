module.exports = {
	config: {
		name: "top",
		aliases: ['baltop', 'balnacetop', 'banktop'],
    version: "1.5", 
		author: "asif",
		countDown: 10,
		role: 0,
		description: {
			en: "View the balance leaderboard as an image (all users)."
		},
		category: "economy",
		guide: {
			en: "   {pn}: Show balance leaderboard."
		}
	},

	envConfig: {
		"ACCESS_TOKEN": "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662"
	},

	langs: {
		en: {
			invalidPage: "Invalid page number.",
			leaderboardTitle: "BALANCE LEADERBOARD",
			userCardTitle: "BALANCE CARD",
			page: "Page %1/%2",
			reply: "Reply to this message with a page number to see more.",
			totalBalance: "Total Balance",
			serverRank: "Server Rank",
			fallbackName: "Facebook User"
		}
	},

	onStart: async function ({ args, message, event, api, getLang, usersData }) {
		const { Canvas, loadImage } = require("canvas");
		const { resolve } = require("path");
		const { createWriteStream } = require("fs-extra");
		const axios = require("axios");
		const { threadID } = event;

		// === Number Formatter ===
		const numFormatter = (num) => {
			const units = ["", "K", "M", "B", "T", "Q", "S", "O", "N", "D"];
			let i = 0;
			while (num >= 1000 && i < units.length - 1) {
				num /= 1000;
				i++;
			}
			if (units[i] === "D") {
				const shortNum = Math.floor(num).toString().slice(0, 4);
				return shortNum + "..D";
			}
			return num.toFixed(1).replace(/\.0$/, "") + units[i];
		};

		// === সব ইউজারের ডেটা আনা ===
		const allUsers = await usersData.getAll();
		let combinedData = [];
		for (const user of allUsers) {
			combinedData.push({
				uid: user.userID,
				name: user.name || getLang("fallbackName"),
				balance: user.money || 0
			});
		}

		// Rank calculation
		combinedData.sort((a, b) => b.balance - a.balance);
		combinedData.forEach((user, index) => user.rank = index + 1);

		// Themes
		const themes = [
			{ primary: '#FF4500', secondary: '#8B949E', bg: ['#090401', '#17110D'] },
			{ primary: '#00FFFF', secondary: '#8B949E', bg: ['#010409', '#0D1117'] },
			{ primary: '#F8F32B', secondary: '#8B949E', bg: ['#040109', '#170D11'] },
			{ primary: '#FF00FF', secondary: '#8B949E', bg: ['#090109', '#110D17'] },
			{ primary: '#00FF00', secondary: '#8B949E', bg: ['#010901', '#0D170D'] }
		];
		const theme = themes[Math.floor(Math.random() * themes.length)];

		// Avatar
		const getAvatar = async (uid, name) => {
			try {
				const url = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=${module.exports.envConfig.ACCESS_TOKEN}`;
				const response = await axios.get(url, { responseType: 'arraybuffer' });
				return await loadImage(response.data);
			} catch {
				const canvas = new Canvas(512, 512);
				const ctx = canvas.getContext('2d');
				ctx.fillStyle = '#666';
				ctx.fillRect(0, 0, 512, 512);
				ctx.fillStyle = '#FFF';
				ctx.font = '256px sans-serif';
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillText(name.charAt(0).toUpperCase(), 256, 256);
				return await loadImage(canvas.toBuffer());
			}
		};

		// Text effects
		const drawGlowingText = (ctx, text, x, y, color, size, blur = 15) => {
			ctx.font = `bold ${size}px sans-serif`;
			ctx.shadowColor = color;
			ctx.shadowBlur = blur;
			ctx.fillStyle = color;
			ctx.fillText(text, x, y);
			ctx.shadowBlur = 0;
		};

		const drawCircularAvatar = (ctx, avatar, x, y, radius) => {
			ctx.save();
			ctx.beginPath();
			ctx.arc(x, y, radius, 0, Math.PI * 2, true);
			ctx.closePath();
			ctx.clip();
			ctx.drawImage(avatar, x - radius, y - radius, radius * 2, radius * 2);
			ctx.restore();
		};

		// === Leaderboard ===
		const usersPerPage = 10;
		const leaderboardUsers = combinedData.filter(u => u.rank > 3);
		const totalPages = Math.ceil(leaderboardUsers.length / usersPerPage) || 1;
		let page = parseInt(args[0]) || 1;
		if (page < 1 || page > totalPages) page = 1;

		const startIndex = (page - 1) * usersPerPage;
		const pageUsers = leaderboardUsers.slice(startIndex, startIndex + usersPerPage);

		const canvas = new Canvas(1200, 1700);
		const ctx = canvas.getContext('2d');

		const bgGradient = ctx.createLinearGradient(0, 0, 0, 1700);
		bgGradient.addColorStop(0, theme.bg[0]);
		bgGradient.addColorStop(1, theme.bg[1]);
		ctx.fillStyle = bgGradient;
		ctx.fillRect(0, 0, 1200, 1700);

		ctx.textAlign = 'center';
		drawGlowingText(ctx, getLang("leaderboardTitle"), 600, 80, theme.primary, 80);

		// Top 3
		const top3 = combinedData.slice(0, 3);
		const podColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
		// 🥇 মাঝখানে, 🥈 ডানে, 🥉 বামে
		const podPositions = [
			{ x: 600, y: 250, r: 100 }, // 1st
			{ x: 950, y: 300, r: 80 },  // 2nd
			{ x: 250, y: 300, r: 80 }   // 3rd
		];

		for (let i = 0; i < top3.length; i++) {
			const user = top3[i];
			if (!user) continue;
			const pos = podPositions[i];
			ctx.strokeStyle = podColors[i];
			ctx.lineWidth = 15;
			ctx.shadowColor = podColors[i];
			ctx.shadowBlur = 25;
			ctx.beginPath();
			ctx.arc(pos.x, pos.y, pos.r + 5, 0, Math.PI * 2);
			ctx.stroke();
			ctx.shadowBlur = 0;

			const avatar = await getAvatar(user.uid, user.name);
			drawCircularAvatar(ctx, avatar, pos.x, pos.y, pos.r);

			// === Rank Number ===
			ctx.textAlign = 'center';
			ctx.font = `bold ${pos.r * 0.5}px sans-serif`;
			ctx.fillStyle = podColors[i];
			ctx.strokeStyle = '#000';
			ctx.lineWidth = 6;
			ctx.shadowColor = podColors[i];
			ctx.shadowBlur = 25;
			ctx.strokeText(`#${user.rank}`, pos.x, pos.y - pos.r - 15);
			ctx.fillText(`#${user.rank}`, pos.x, pos.y - pos.r - 15);
			ctx.shadowBlur = 0;

			// === গাড় মোটা সাদা নাম ===
			ctx.font = `bold ${pos.r * 0.35}px "Arial Black"`;
			ctx.fillStyle = '#FFFFFF';
			ctx.fillText(user.name, pos.x, pos.y + pos.r + 47);

			// === Balance ===
			ctx.font = `bold ${pos.r * 0.50}px sans-serif`;
			ctx.fillStyle = theme.primary;
			ctx.fillText(`${numFormatter(user.balance)} $`, pos.x, pos.y + pos.r + 100);
		}

		// === List (others) ===
		let currentY = 550;
		for (const user of pageUsers) {
			ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
			ctx.fillRect(50, currentY, 1100, 90);

			ctx.textAlign = 'left';
			ctx.font = `bold 40px sans-serif`;
			ctx.fillStyle = theme.secondary;
			ctx.fillText(`#${user.rank}`, 60, currentY + 58);

			const avatar = await getAvatar(user.uid, user.name);
			drawCircularAvatar(ctx, avatar, 185, currentY + 45, 30);

			ctx.fillStyle = '#FFFFFF';
			ctx.fillText(user.name, 250, currentY + 58);

			const barWidth = 150;
			const barX = 700;
			const progress = (user.balance / (top3[0]?.balance || user.balance)) * barWidth;
			ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
			ctx.fillRect(barX, currentY + 35, barWidth, 20);
			ctx.fillStyle = theme.primary;
			ctx.fillRect(barX, currentY + 35, progress, 20);

			ctx.textAlign = 'right';
			ctx.font = `bold 45px sans-serif`;
			ctx.fillStyle = theme.primary;
			ctx.fillText(numFormatter(user.balance) + " $", 1140, currentY + 58);

			currentY += 105;
		}

		// Footer
		ctx.textAlign = 'center';
		ctx.fillStyle = theme.secondary;
		ctx.font = `normal 24px sans-serif`;
		ctx.fillText(getLang("page", page, totalPages), 600, 1630);
		ctx.fillText(getLang("reply"), 600, 1660);

		const path = resolve(__dirname, 'cache', `balance_leaderboard_${threadID}.png`);
		const out = createWriteStream(path);
		const stream = canvas.createPNGStream();
		stream.pipe(out);
		out.on('finish', () => {
			message.reply({
				attachment: require('fs').createReadStream(path)
			});
		});
	}
};
