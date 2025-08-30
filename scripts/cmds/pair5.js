const { loadImage, createCanvas } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "pair5",
    author: "xemon edit by asif",
    role: 0,
    shortDescription: "Pair matching",
    longDescription: "",
    category: "love",
    guide: "{pn} [@mention or reply (optional)]"
  },

  onStart: async function ({ api, event, usersData }) {
    let pathImg = __dirname + "/tmp/background.png";
    let pathAvt1 = __dirname + "/tmp/Avtmot.png";
    let pathAvt2 = __dirname + "/tmp/Avthai.png";

    // User 1 = message sender (command giver / reply giver)
    let id1 = event.senderID;
    let name1 = await usersData.getName(id1);

    // get thread info
    const threadInfo = await api.getThreadInfo(event.threadID);
    const allUsers = threadInfo.userInfo;
    const botID = api.getCurrentUserID();

    // detect gender of User 1
    let gender1;
    for (let u of allUsers) {
      if (u.id == id1) {
        gender1 = u.gender; // "MALE" / "FEMALE" / null
        break;
      }
    }

    // User 2 selection
    let id2;
    if (Object.keys(event.mentions).length > 0) {
      id2 = Object.keys(event.mentions)[0]; // mention priority
    } else if (event.messageReply) {
      id2 = event.messageReply.senderID; // reply priority
    } else {
      let candidates = [];
      if (gender1 == "FEMALE") {
        // pick male
        candidates = allUsers.filter(u => u.gender == "MALE" && u.id != id1 && u.id != botID).map(u => u.id);
      } else if (gender1 == "MALE") {
        // pick female
        candidates = allUsers.filter(u => u.gender == "FEMALE" && u.id != id1 && u.id != botID).map(u => u.id);
      } else {
        // pick anyone
        candidates = allUsers.filter(u => u.id != id1 && u.id != botID).map(u => u.id);
      }
      id2 = candidates[Math.floor(Math.random() * candidates.length)];
    }
    let name2 = await usersData.getName(id2);

    // random love percentage
    let rd1 = Math.floor(Math.random() * 100) + 1;
    let cc = ["0", "-1", "99,99", "-99", "-100", "101", "0,01"];
    let rd2 = cc[Math.floor(Math.random() * cc.length)];
    let djtme = [`${rd1}`, `${rd1}`, `${rd1}`, `${rd1}`, `${rd1}`, `${rd2}`, `${rd1}`, `${rd1}`, `${rd1}`, `${rd1}`];
    let tile = djtme[Math.floor(Math.random() * djtme.length)];

    // background list
    let background = [
      "https://i.postimg.cc/wjJ29HRB/background1.png",
      "https://i.postimg.cc/zf4Pnshv/background2.png",
      "https://i.postimg.cc/5tXRQ46D/background3.png",
    ];
    let rd = background[Math.floor(Math.random() * background.length)];

    // download avatars
    let getAvtmot = (
      await axios.get(`https://graph.facebook.com/${id1}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, {
        responseType: "arraybuffer",
      })
    ).data;
    fs.writeFileSync(pathAvt1, Buffer.from(getAvtmot, "utf-8"));

    let getAvthai = (
      await axios.get(`https://graph.facebook.com/${id2}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, {
        responseType: "arraybuffer",
      })
    ).data;
    fs.writeFileSync(pathAvt2, Buffer.from(getAvthai, "utf-8"));

    // download background
    let getbackground = (
      await axios.get(`${rd}`, { responseType: "arraybuffer" })
    ).data;
    fs.writeFileSync(pathImg, Buffer.from(getbackground, "utf-8"));

    // draw image
    let baseImage = await loadImage(pathImg);
    let baseAvt1 = await loadImage(pathAvt1);
    let baseAvt2 = await loadImage(pathAvt2);
    let canvas = createCanvas(baseImage.width, baseImage.height);
    let ctx = canvas.getContext("2d");
    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(baseAvt1, 100, 150, 300, 300);
    ctx.drawImage(baseAvt2, 900, 150, 300, 300);
    const imageBuffer = canvas.toBuffer();
    fs.writeFileSync(pathImg, imageBuffer);

    // clean temp files
    fs.removeSync(pathAvt1);
    fs.removeSync(pathAvt2);

    // send message
    return api.sendMessage(
      {
        body: `💘 Perfect Match Found!\n\n👤 User 1: ${name1}\n👤 User 2: ${name2}\n\n✨ Chance of being together: ${tile}%\n🥂 Wishing you both endless happiness!`,
        mentions: [
          { tag: name1, id: id1 },
          { tag: name2, id: id2 }
        ],
        attachment: fs.createReadStream(pathImg),
      },
      event.threadID,
      () => fs.unlinkSync(pathImg),
      event.messageID
    );
  },
};
