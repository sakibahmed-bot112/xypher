module.exports = {
  config: {
    name: "wanted", 
    aliases:["wan"],// Name of command
    version: "1.0", // Version of command
    author: "balls", // Author of command
    countDown: 5, // Time to wait before executing command again (seconds)
    role: 0, // Role of user to use this command (0: normal user, 1: admin box chat, 2: owner bot)
    shortDescription: {
      vi: "Tạo hình ảnh Wanted dựa trên ảnh đại diện",
      en: "Generate Wanted image based on profile picture"
    },
    description: {
      vi: "Lệnh này sẽ tạo một hình ảnh Wanted dựa trên ảnh đại diện của người dùng hoặc người được nhắc đến",
      en: "This command generates a Wanted image based on the user's or mentioned user's profile picture"
    },
    category: "fun", // Category of command
    guide: {
      vi: "Sử dụng lệnh này để tạo hình ảnh Wanted dựa trên ảnh đại diện",
      en: "Use this command to generate a Wanted image based on the profile picture"
    }
  },

  onStart: async function ({ event, message, usersData }) {
    let avatarUrl;
    const senderID = event.senderID;
    const mentionedID = Object.keys(event.mentions)[0];

    if (event.type === "message_reply") {
      avatarUrl = await usersData.getAvatarUrl(event.messageReply.senderID);
    } else {
      avatarUrl = mentionedID 
        ? await usersData.getAvatarUrl(mentionedID) 
        : await usersData.getAvatarUrl(senderID);
    }

    const apiUrl = `https://api.popcat.xyz/wanted?image=${encodeURIComponent(avatarUrl)}`;
    const image = await global.utils.getStreamFromURL(apiUrl);

    message.reply({
      body: "",
      attachment: image
    });
  }
};
