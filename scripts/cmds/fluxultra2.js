const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "fluxultra2",
  version: "1.0",
  role: 0,
  author: "Amit Max ⚡",
  description: "Generate AI image using FluxUltra",
  category: "𝗜𝗠𝗔𝗚𝗘 𝗚𝗘𝗡𝗘𝗥𝗔𝗧𝗢𝗥",
  guide: "{pn} [prompt]\nExample: {pn} a cute dog with sunglasses",
  countDown: 15,
};

module.exports.onStart = async ({ event, args, api }) => {
  const apiUrl = "https://zaikyoov3.koyeb.app/api/fluxultra";
  let userPrompt = args.join(" ");

  if (!userPrompt) {
    return api.sendMessage("Please provide a prompt.\nExample: fluxultra a dragon in space", event.threadID, event.messageID);
  }

  const prompt = `Amit Max ⚡, ${userPrompt}`; 

  try {
    const waitMsg = await api.sendMessage("Generating your image, please wait...⏳", event.threadID);
    api.setMessageReaction("⏰", event.messageID, () => {}, true);

    const response = await axios({
      url: `${apiUrl}?prompt=${encodeURIComponent(prompt)}`,
      method: "GET",
      responseType: "stream"
    });

    const imgPath = path.join(__dirname, "cache", `flux_${Date.now()}.png`);
    const writer = fs.createWriteStream(imgPath);

    response.data.pipe(writer);

    writer.on("finish", () => {
      api.sendMessage({
        body: `Here is your AI-generated image for: "${userPrompt}" (8k quality)`,
        attachment: fs.createReadStream(imgPath)
      }, event.threadID, () => fs.unlinkSync(imgPath));

      api.setMessageReaction("✅", event.messageID, () => {}, true);
      api.unsendMessage(waitMsg.messageID);
    });

    writer.on("error", err => {
      throw new Error("Error saving image stream.");
    });
  } catch (err) {
    console.error("Error in fluxultra command:", err);
    api.sendMessage("Failed to generate image. Try again later.", event.threadID, event.messageID);
  }
};
