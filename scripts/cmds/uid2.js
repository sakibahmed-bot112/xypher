module.exports = {
  config: {
    name: "uid2",
    version: "1.0.0",
    permission: 0,
    credits: "Elon",
    prefix: 'awto',
    description: "Inbox",
    category: "without prefix",
    cooldowns: 5
  },

  onStart: async function({ api, event, usersData }) {
    let uid;

    // Determine the user ID based on the type of event
    if (event.type === "message_reply") {
      uid = event.messageReply.senderID;
    } else if (Object.keys(event.mentions).length > 0) {
      uid = Object.keys(event.mentions)[0];
    } else {
      uid = event.senderID;
    }

    try {
      // Get the name of the user
      let name = await usersData.getName(uid);
      const msg = `[ ▶️]➡️ 𝐍𝐚𝐦𝐞: ${name}\n[ ▶️]➡️ 𝐈𝐃: ${uid}`;

      // Call the shareContact function
      await api.shareContact(msg, uid, event.threadID);

      // ✅ Avatar fetch & send part removed.

    } catch (error) {
      api.sendMessage("Error sharing contact: " + error.message, event.threadID, event.messageID);
    }
  }
};
