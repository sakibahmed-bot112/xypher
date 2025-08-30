const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "pair6",
    countDown: 10,
    role: 0,
    shortDescription: {
      en: "Get to know your partner",
    },
    longDescription: {
      en: "Know your destiny and find who you are meant to be with",
    },
    category: "love",
    guide: {
      en: "{pn} or mention/reply someone",
    }
  },

  onStart: async function ({ api, event, usersData }) {
    const { loadImage, createCanvas } = require("canvas");
    let pathImg = __dirname + "/assets/background.png";
    let pathAvt1 = __dirname + "/assets/any.png";
    let pathAvt2 = __dirname + "/assets/avatar.png";

    // Sender info
    var id1 = event.senderID;
    var name1 = await usersData.getName(id1);

    // Target selection
    let id2;

    // ১. মেনশন চেক
    if (event.mentions && Object.keys(event.mentions).length > 0) {
      id2 = Object.keys(event.mentions)[0];
    }
    // ২. রিপ্লাই চেক
    else if (event.type === "message_reply" && event.messageReply) {
      if (event.messageReply.senderID) id2 = event.messageReply.senderID;
      else if (event.messageReply.sender && event.messageReply.sender.id) id2 = event.messageReply.sender.id;
    }

    // ৩. কোনো mention বা reply না থাকলে random selection
    if (!id2) {
      var ThreadInfo = await api.getThreadInfo(event.threadID);
      var all = ThreadInfo.userInfo;
      const botID = api.getCurrentUserID();
      let candidates = [];

      let gender1;
      for (let c of all) {
        if (c.id == id1) gender1 = c.gender;
      }

      if (gender1 == "FEMALE") {
        for (let u of all) {
          if (u.gender == "MALE" && u.id !== id1 && u.id !== botID) candidates.push(u.id);
        }
      } else if (gender1 == "MALE") {
        for (let u of all) {
          if (u.gender == "FEMALE" && u.id !== id1 && u.id !== botID) candidates.push(u.id);
        }
      } else {
        for (let u of all) {
          if (u.id !== id1 && u.id !== botID) candidates.push(u.id);
        }
      }

      id2 = candidates[Math.floor(Math.random() * candidates.length)];
    }

    // Second user info
    var name2 = await usersData.getName(id2);

    // Percentage calculation
    var rd1 = Math.floor(Math.random() * 100) + 1;
    var cc = ["0", "-1", "99,99", "-99", "-100", "101", "0,01"];
    var rd2 = cc[Math.floor(Math.random() * cc.length)];
    var arr = [`${rd1}`, `${rd1}`, `${rd1}`, `${rd1}`, `${rd1}`, `${rd2}`, `${rd1}`, `${rd1}`, `${rd1}`, `${rd1}`];
    var tile = arr[Math.floor(Math.random() * arr.length)];

    // Background
    var background = "https://i.ibb.co/RBRLmRt/Pics-Art-05-14-10-47-00.jpg";

    // Get avatars
    let getAvt1 = (
      await axios.get(`https://graph.facebook.com/${id1}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
        { responseType: "arraybuffer" }
      )
    ).data;
    fs.writeFileSync(pathAvt1, Buffer.from(getAvt1, "utf-8"));

    let getAvt2 = (
      await axios.get(`https://graph.facebook.com/${id2}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
        { responseType: "arraybuffer" }
      )
    ).data;
    fs.writeFileSync(pathAvt2, Buffer.from(getAvt2, "utf-8"));

    // Get background
    let getBackground = (
      await axios.get(background, { responseType: "arraybuffer" })
    ).data;
    fs.writeFileSync(pathImg, Buffer.from(getBackground, "utf-8"));

    // Create canvas
    let baseImage = await loadImage(pathImg);
    let baseAvt1 = await loadImage(pathAvt1);
    let baseAvt2 = await loadImage(pathAvt2);
    let canvas = createCanvas(baseImage.width, baseImage.height);
    let ctx = canvas.getContext("2d");
    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(baseAvt1, 111, 175, 330, 330);
    ctx.drawImage(baseAvt2, 1018, 173, 330, 330);

    const imageBuffer = canvas.toBuffer();
    fs.writeFileSync(pathImg, imageBuffer);
    fs.removeSync(pathAvt1);
    fs.removeSync(pathAvt2);

    // Send final message
    return api.sendMessage({
      body: `💖✨ Love Destiny Report ✨💖

👤 **${name1}**  
💞 is destined to be with  
👤 **${name2}**

🌟 **Love Compatibility:** ${tile}% 🌟

💌 Fate has brought you two together… Could this be the start of something magical? 💫`,
      mentions: [
        { tag: `${name2}`, id: id2 },
        { tag: `${name1}`, id: id1 }
      ],
      attachment: fs.createReadStream(pathImg)
    }, event.threadID,
      () => fs.unlinkSync(pathImg),
      event.messageID);
  }
};
