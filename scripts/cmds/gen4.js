const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "gen4",
  aliases: ["g4"],
  version: "1.6.9",
  author: "Nazrul",
  role: 0,
  description: "Generate 4 unique image",
  category: "ai image",
  countDown: 3,
  guide: {
    en: "{pn} [your prompt text]"
  }
};

module.exports.onStart = async ({ message, event, args }) => {
  const prompt = args.join(" ");
  if (!prompt) return message.reply("• Provide a prompt!");

  const api = "https://www.noobs-apis.run.place" + "/nazrul/gen4?prompt=" + encodeURIComponent(prompt);
  message.reaction("⏳",event.messageID);
  try {
    const { data } = await axios.get(api);
    if (!data?.images?.length) return message.reply("• Failed to generate image. Try again.");

    const ok = await Promise.all(data.images.map(async (url, index) => {
      const imgRes = await axios.get(url, { responseType: "stream" });
      const filePath = path.join(__dirname, `gen4_${event.senderID}_${Date.now()}_${index}.png`);
      const writer = fs.createWriteStream(filePath);
      imgRes.data.pipe(writer);
      await new Promise(resolve => writer.on("finish", resolve));

      const stream = fs.createReadStream(filePath);
      stream.on("close", () => fs.unlinkSync(filePath));

      return stream;
    }));
    message.reaction("✅",event.messageID);
    await message.reply({
      body: `✅ Here's your generated images!"`,
      attachment: ok
    });

  } catch (error) {
    console.error("GEN4 error:", error);
    return message.reply(`❌ Failed to generate images!`);
  }
};
