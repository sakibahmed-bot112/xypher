const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
    config: {
        name: "art",
        aliases: ["aiart", "genart"],
        version: "1.0",
        author: "Mostakim",
        countDown: 15,
        role: 0,
        shortDescription: "AI Generated Art",
        longDescription: "Get AI-generated images based on your prompt",
        category: "fun",
        guide: {
            en: "{pn} prompt - limit (e.g. art a dog - 5)",
        },
    },

    onStart: async function ({ api, event, args }) {
        const queryAndLength = args.join(" ").split("-");
        const prompt = queryAndLength[0]?.trim();
        const length = parseInt(queryAndLength[1]?.trim()) || 5;

        if (!prompt) {
            return api.sendMessage("❌ | Please provide a prompt like: art a cat - 4", event.threadID, event.messageID);
        }

        try {
            const waitMsg = await api.sendMessage("⏳ | Generating art, please wait...", event.threadID);
            const res = await axios.get(`https://www.x-noobs-apis.42web.io/art?name=${encodeURIComponent(prompt)}`);
            const imgLinks = res.data;

            if (!imgLinks || imgLinks.length === 0) {
                return api.sendMessage("❌ | No images found for that prompt.", event.threadID, event.messageID);
            }

            const files = [];
            const selectedImages = imgLinks.slice(0, length);

            for (let i = 0; i < selectedImages.length; i++) {
                const imgBuffer = await axios.get(selectedImages[i], { responseType: "arraybuffer" });
                const filePath = path.join(__dirname, "cache", `art_${i + 1}.jpg`);
                await fs.outputFile(filePath, imgBuffer.data);
                files.push(fs.createReadStream(filePath));
            }

            await api.unsendMessage(waitMsg.messageID);
            return api.sendMessage({
                body: `✅ | Here's your generated art for: "${prompt}"\n🖼️ | Total Images: ${selectedImages.length}`,
                attachment: files,
            }, event.threadID, event.messageID);

        } catch (err) {
            console.error(err);
            return api.sendMessage(`❌ | Error: ${err.message}`, event.threadID, event.messageID);
        }
    },
};
