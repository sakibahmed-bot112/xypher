const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "araara",
    aliases: ["nude"],
    version: "2.1",
    author: "Eren Yeager",
    countDown: 5,
    role: 2,
    shortDescription: "Get random SFW anime images",
    longDescription: "Fetches cute anime images from your personal API",
    category: "anime",
    guide: {
      en: "{pn} [count]"
    }
  },

  onStart: async function ({ message, args }) {
    try {
      // Get number of images (default 1, max 5)
      const count = Math.min(Math.max(parseInt(args[0]) || 1, 1), 5);
      
      // Your single API endpoint
      const API_URL = "https://mahis-global-api.onrender.com/api/araara";
      
      const images = [];
      
      // Fetch multiple times from the same API
      for (let i = 0; i < count; i++) {
        const response = await axios.get(API_URL);
        images.push(response.data.url); // Adjust based on your API response
      }

      // Prepare attachments
      const attachments = await Promise.all(
        images.map(async (url) => {
          const imagePath = path.join(__dirname, 'cache', `araara_${Date.now()}_${Math.random().toString(36).substr(2,9)}.jpg`);
          const writer = fs.createWriteStream(imagePath);
          const response = await axios.get(url, { responseType: 'stream' });
          response.data.pipe(writer);
          
          return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(fs.createReadStream(imagePath)));
            writer.on('error', reject);
          });
        })
      );

      message.reply({
        body: `Yeah Bby Here is your cute image 🥵${count > 1 ? 's' : ''}!`,
        attachment: attachments
      });

    } catch (error) {
      console.error('Error in araara command:', error);
      message.reply("Araara~ Couldn't fetch images. Please try again later!");
    }
  }
};
