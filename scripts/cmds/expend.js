const axios = require("axios");

module.exports.config = {
    name: "expend",
    aliases: [],
    version: "3.0",
    author: "hassan/ api credit Evan/mahi",
    countDown: 3, 
    role: 0,
    longDescription: {
        en: "Expend your images"
    },
    category: "tools",
    guide: {
        en: "{pn} [ratio] (reply to an image)\nUse '{pn} help' for ratio info"
    } 
};

module.exports.onStart = async ({ api, event, args }) => {
    try {
        const ratio = args.join(" ") || "1:1";

        if (ratio.toLowerCase() === "help") {
            return api.sendMessage(
                `📌 Expend Command Help:\n\n` +
                `To use this command, reply to an image with:\n` +
                `› expend [ratio]\n\n` +
                `📋 Available Ratios:\n` +
                `› 1:1  - Square\n` +
                `› 16:9 - Widescreen\n` +
                `› 9:16 - Portrait\n` +
                `› 4:3  - Standard\n` +
                `› 3:4  - Vertical\n\n` +
                `💡 Example:\n` +
                `› expend 16:9 (reply to image)`,
                event.threadID,
                event.messageID
            );
        }

        if (!event.messageReply || !event.messageReply.attachments || !event.messageReply.attachments[0]) {
            return api.sendMessage("𝘗𝘭𝘦𝘢𝘴𝘦 𝘳𝘦𝘱𝘭𝘺 𝘵𝘰 𝘢𝘯 𝘪𝘮𝘢𝘨𝘦 𝘸𝘪𝘵𝘩 𝘵𝘩𝘪𝘴 𝘤𝘮𝘥.", event.threadID, event.messageID);
        }

        const hasan = event.messageReply.attachments[0].url;
        
        const apiUrl = `https://expend-xyz.up.railway.app/expend?imageUrl=${encodeURIComponent(hasan)}&ratio=${ratio}`;

        const response = await axios.get(apiUrl, {
            responseType: 'stream'
        });

        api.sendMessage({
            body: "𝐇𝐞𝐫𝐞 𝐢𝐬 𝐲𝐨𝐮𝐫 𝐞𝐱𝐩𝐞𝐧𝐝𝐞𝐝 𝐢𝐦𝐚𝐠𝐞",
            attachment: response.data
        }, event.threadID, event.messageID);

    } catch (e) {
        api.sendMessage(`Error: ${e.message}`, event.threadID, event.messageID);
    }
};
