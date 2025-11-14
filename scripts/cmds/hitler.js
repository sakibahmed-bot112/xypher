const DIG = require('discord-image-generation');
const https = require('https');
const fs = require('fs');

module.exports = {
  config: {
    name: 'hitler',
    version: '1.1',
    author: 'EDEN',
    description: 'Generates an image with Hitler effect applied to the mentioned or replied user avatar.',
    category: 'fun',
    usage: '{prefix}hitler [@mention | reply]',
  },

  onStart: async function ({ event, api }) {
    try {
      // ✅ Mention check
      let targetID;
      if (Object.keys(event.mentions).length > 0) {
        targetID = Object.keys(event.mentions)[0];
      }
      // ✅ Reply check
      else if (event.type === "message_reply") {
        targetID = event.messageReply.senderID;
      }
      // ✅ Default: command sender
      else {
        targetID = event.senderID;
      }

      // Get avatar
      const avatarUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const avatar = await fetchImage(avatarUrl);

      // Apply Hitler effect
      const hitlerImage = await new DIG.Hitler().getImage(avatar);
      const pathHitler = __dirname + '/cache/hitler.png';
      fs.writeFileSync(pathHitler, hitlerImage);

      // Send message
      api.sendMessage({
        attachment: fs.createReadStream(pathHitler),
        body: `${targetID == event.senderID ? "This guy" : "This user"} is worse than Hitler!`
      }, event.threadID, (err) => {
        if (err) console.error(err);
        fs.unlinkSync(pathHitler); // remove temp file
      });

    } catch (e) {
      console.error(e);
      api.sendMessage("❌ Error generating image.", event.threadID);
    }
  }
};

// Helper: fetch image buffer
function fetchImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 302 && res.headers.location) {
        fetchImage(res.headers.location).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to fetch image. Status code: ${res.statusCode}`));
        return;
      }
      let data = Buffer.from([]);
      res.on('data', (chunk) => { data = Buffer.concat([data, chunk]); });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}
