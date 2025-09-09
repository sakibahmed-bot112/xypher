const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "mj2",
    version: "1.8",
    author: "@RI F AT",
    countDown: 12,
    longDescription: {
      en: "Generate a Midjourney-style image and select U1–U4 individually.",
    },
    category: "ai",
    role: 2,
    guide: {
      en: "midjourney <prompt>\nGenerates image and allows U1–U4 selection.",
    },
  },

  onStart: async function ({ api, event, args, message }) {
    if (!args.length) return message.reply("Please provide a prompt to generate your image.");

    const prompt = encodeURIComponent(args.join(" "));
    const apiUrl = `https://nigajourney-4oaw.onrender.com/mj?prompt=${prompt}`;

    message.reply("⚡", async () => {
      try {
        const response = await axios.get(apiUrl, { responseType: "arraybuffer" });
        if (!response || !response.data) return message.reply("⚠ The API didn’t return an image.");

        const fullBuffer = Buffer.from(response.data, "binary");
        const fullImagePath = path.join(__dirname, "mj_full.png");
        fs.writeFileSync(fullImagePath, fullBuffer);

        const image = await loadImage(fullImagePath);
        const { width, height } = image;
        const subWidth = width / 2;
        const subHeight = height / 2;

        const subImages = [];
        for (let row = 0; row < 2; row++) {
          for (let col = 0; col < 2; col++) {
            const canvas = createCanvas(subWidth, subHeight);
            const ctx = canvas.getContext("2d");
            ctx.drawImage(image, col * subWidth, row * subHeight, subWidth, subHeight, 0, 0, subWidth, subHeight);

            const subPath = path.join(__dirname, `mj_u${row * 2 + col + 1}.png`);
            const out = fs.createWriteStream(subPath);
            const stream = canvas.createPNGStream();
            stream.pipe(out);
            await new Promise((resolve) => out.on("finish", resolve));
            subImages.push(subPath);
          }
        }

        message.reply(
          {
            body: "Midjourney process completed ✨\n\n❏ Action: U1, U2, U3, U4",
            attachment: fs.createReadStream(fullImagePath),
          },
          async (err, info) => {
            if (err) return console.error("Error sending image:", err);

            const selected = new Set();

            const listener = async (error, replyEvent) => {
              if (
                replyEvent.type === "message_reply" &&
                replyEvent.messageReply.messageID === info.messageID
              ) {
                const input = replyEvent.body.trim().toUpperCase();
                if (/^U[1-4]$/.test(input)) {
                  const index = parseInt(input[1]) - 1;

                  if (selected.has(input)) {
                    return message.reply(`You've already selected ${input}.`);
                  }

                  selected.add(input);
                  await message.reply({
                    body: `Here is your selected image: ${input}`,
                    attachment: fs.createReadStream(subImages[index]),
                  });
                } else {
                  return message.reply("❌ Invalid option. Use U1, U2, U3, or U4.");
                }
              }
            };

            const mqttListener = api.listenMqtt(listener);

            
            setTimeout(() => {
              fs.unlinkSync(fullImagePath);
              subImages.forEach(img => fs.existsSync(img) && fs.unlinkSync(img));
              api.removeListener("message", mqttListener);
            }, 5 * 60 * 1000);
          }
        );
      } catch (error) {
        console.error("API Error:", error.message);
        message.reply("..");
      }
    });
  },
};
