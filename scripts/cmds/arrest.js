const jimp = require("jimp");
const fs = require("fs");

module.exports = {
    config: {
        name: "arrest",
        aliases: ["arrest"],
        version: "1.1",
        author: "milan-says",
        countDown: 5,
        role: 0,
        category: "image"
    },

    onStart: async function ({ message, event }) {
        const mention = Object.keys(event.mentions);
        if (mention.length == 0) return message.reply("অনুগ্রহ করে কাউকে মেনশন করো।");
        
        let firstUser, secondUser;
        
        if (mention.length === 1) {
            firstUser = event.senderID;
            secondUser = mention[0];
        } else {
            firstUser = mention[1];
            secondUser = mention[0];
        }

        const secondName = event.mentions[secondUser];

        bal(firstUser, secondUser).then(ptth => {
            message.reply({ 
                body: `${secondName} ডেন্ডিকুর কে গ্রেপতার করা হলো..!🤷‍♂️`, 
                attachment: fs.createReadStream(ptth) 
            });
        });
    }
};

async function bal(one, two) {
    let avone = await jimp.read(`https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);
    avone.circle();

    let avtwo = await jimp.read(`https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);
    avtwo.circle();

    const pth = "fak.png";
    let img = await jimp.read("https://i.imgur.com/ep1gG3r.png");
    img.resize(500, 500)
       .composite(avone.resize(100, 100), 375, 9)
       .composite(avtwo.resize(100, 100), 160, 92);

    await img.writeAsync(pth);
    return pth;
}
