const jimp = require("jimp");
const fs = require("fs");
const path = require("path");

module.exports = {
    config: {
        name: "marry2",
        aliases: ["marry2"],
        version: "4.0",
        author: "TawsiN",
        countDown: 5,
        role: 0,
        shortDescription: "Propose marriage 💍",
        longDescription: "Creates a cute image showing two users as a couple ❤",
        category: "love",
        guide: "{pn} @tag\n{pn} @user1 @user2\n{pn} (reply to someone)"
    },

    onStart: async function ({ message, event, usersData, args }) {
        try {
            let one, two;
            const mentions = Object.keys(event.mentions);

            // Case 1: Reply to someone's message
            if (event.type === "message_reply") {
                one = event.senderID;
                two = event.messageReply.senderID;
            }
            // Case 2: Mentioning 2 users
            else if (mentions.length === 2) {
                one = mentions[0];
                two = mentions[1];
            }
            // Case 3: Mentioning 1 user
            else if (mentions.length === 1) {
                one = event.senderID;
                two = mentions[0];
            }
            // Case 4: Using args (IDs or tags)
            else if (args.length === 2 && !mentions.length) {
                one = args[0].replace(/[@<>]/g, "");
                two = args[1].replace(/[@<>]/g, "");
            } else {
                return message.reply("❌ Please tag 1 or 2 users, reply to someone, or provide 2 user IDs.");
            }

            if (!one || !two) return message.reply("⚠ Could not detect both users properly.");

            const imagePath = await createMarriageImage(one, two);

            const loveMessages = [
                "💞 Two hearts, one soul.",
                "💍 This union is now eternal!",
                "💘 Cupid just approved this match!",
                "💖 Love is in the air!",
                "🌹 Bound by fate, sealed by code.",
                "🫶 They look perfect together!",
                "💕 A match made in bot-heaven!",
                "❤ Together, forever.",
                "🥺 I ship them harder than Titanic.",
                "✨ Soulmates found. Please stand by.",
                "🕊 They just broke the single-player mode.",
                "💓 Love levels: 99999999+",
                "🎉 Happily ever after starts here.",
                "💫 A couple written in the stars.",
                "🔐 Locked in love mode.",
                "🌈 Their love is brighter than my screen!",
                "🔥 The temperature just went up in here!",
                "🧡 It's not just love... it's true love.",
                "🎮 Relationship status: Player 2 joined.",
                "🌸 They go together like code and coffee.",
                "🥰 So cute it gave the bot a heart attack.",
                "🖤 Emo but in love.",
                "📸 Picture-perfect couple right here!",
                "🌟 Universe ships this couple.",
                "🧩 Two perfect pieces of a love puzzle.",
                "🐾 Even cats approve this pairing.",
                "🚀 Off to the honeymoon on Mars!",
                "📝 Just married! Signing in love code.",
                "🔮 Future prediction: Lots of cuddles.",
                "💬 When love becomes the best command ever."
            ];

            const randomMessage = loveMessages[Math.floor(Math.random() * loveMessages.length)];

            const nameOne = await usersData.getName(one);
            const nameTwo = await usersData.getName(two);

            message.reply({
                body: `「 💍 ${nameOne} + ${nameTwo} 」\n💖 ${randomMessage}`,
                attachment: fs.createReadStream(imagePath)
            }, () => {
                fs.unlinkSync(imagePath); // Cleanup image after sending
            });

        } catch (err) {
            console.error("Marry Command Error:", err);
            message.reply("💔 Oops! Couldn't create the love photo. Try again later.");
        }
    }
};

async function createMarriageImage(one, two) {
    const fileName = `marry_${one}_${two}_${Date.now()}.png`;
    const filePath = path.join(__dirname, "cache", fileName);

    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    const urlOne = `https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    const urlTwo = `https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    const bgURL = "https://i.imgur.com/qyn1vO1.jpg"; // You can change this background if you'd like!

    const [avOne, avTwo, bg] = await Promise.all([
        jimp.read(urlOne),
        jimp.read(urlTwo),
        jimp.read(bgURL)
    ]);

    avOne.circle();
    avTwo.circle();

    bg.resize(432, 280)
      .composite(avOne.resize(60, 60), 189, 15)
      .composite(avTwo.resize(60, 60), 122, 25);

    await bg.writeAsync(filePath);
    return filePath;
    }
