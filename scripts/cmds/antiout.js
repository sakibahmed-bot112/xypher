module.exports = {
  config: {
    name: "antiout",
    version: "3.0",
    author: "TawsiN",
    countDown: 5,
    role: 1, // Admin-only
    shortDescription: "💡 Prevent users from leaving the group!",
    longDescription:
      "The antiout feature ensures no one can leave the group. If enabled, any user who attempts to leave will be automatically re-added to the chat.",
    category: "boxchat",
    guide: "{pn} [on | off]\n\n🛠 Example:\n`{pn} on` - Enable antiout\n`{pn} off` - Disable antiout",
    envConfig: {
      deltaNext: 5
    }
  },

  onStart: async function ({ message, event, threadsData, args, role }) {
    if (role < 1) {
      return message.reply("🚫 **Permission Denied!** Only admins can use this command.");
    }

    if (!["on", "off"].includes(args[0])) {
      return message.reply(
        "❌ **Invalid Argument!**\nPlease use `on` or `off`.\n\n🛠 Example:\n`{pn} on` to enable antiout\n`{pn} off` to disable it."
      );
    }

    const isEnabled = args[0] === "on";
    await threadsData.set(event.threadID, isEnabled, "settings.antiout");

    return message.reply(
      `❗𝗔𝗻𝘁𝗶𝗼𝘂𝘁 𝗳𝗲𝘁𝘂𝗿𝗲 𝘂𝗽𝗱𝗮𝘁𝗲𝗱 ▶\n𝗦𝘁𝗮𝘁𝘂𝘀 : ${isEnabled ? "- 𝐄𝐍𝐀𝐁𝐋𝐄𝐃 ✅ " : "❌ Disabled"}\n\n➡️ -𝗨𝘀𝗲𝗿𝘀 𝘄𝗵𝗼 𝗮𝘁𝘁𝗲𝗺𝗽𝘁 𝘁𝗼 𝗹𝗲𝗮𝘃𝗲 ${
        isEnabled ? "𝘄𝗶𝗹𝗹 𝗯𝗲 𝗮𝘂𝘁𝗼𝗺𝗮𝘁𝗶𝗰𝗰𝗮𝗹𝗹𝘆 𝗮𝗱𝗱𝗲𝗱 𝗯𝗮𝗰𝗸..!🚮" : "𝗰𝗮𝗻 𝗻𝗼𝘄 𝗹𝗲𝗮𝘃𝗲 𝗳𝗿𝗲𝗹𝗹𝘆."
        
      }`
    );
  },

  onEvent: async function ({ api, event, threadsData }) {
    const antiout = await threadsData.get(event.threadID, "settings.antiout");
    if (!antiout || !event.logMessageData || !event.logMessageData.leftParticipantFbId) return;

    const userId = event.logMessageData.leftParticipantFbId;

    try {
      // Check if the user is already in the group
      const threadInfo = await api.getThreadInfo(event.threadID);
      const isUserInChat = threadInfo.participantIDs.includes(userId);

      if (!isUserInChat) {
        await api.addUserToGroup(userId, event.threadID);

        // Send a stylish re-add message
        api.sendMessage(
          `-𝗢𝗼𝗽𝘀 𝗹𝗼𝗼𝗸𝘀 𝗹𝗶𝗸𝗲 𝘀𝗼𝗺𝗲𝗼𝗻𝗲 𝘁𝗶𝗿𝗲𝗱 𝘁𝗼 𝗹𝗲𝗮𝘃𝗲.!🎀\𝗨𝘀𝗲𝗿: [${userId}] ➡️(https://facebook.com/${userId})\n\n🔰 𝗕𝘂𝘁 𝗱𝗼𝗻'𝘁 𝘄𝗼𝗿𝗿𝘆, 𝗜 𝗯𝗿𝗼𝘂𝗴𝗵𝘁 𝘁𝗵𝗲𝗺 𝗯𝗮𝗰𝗸🛐`,
          event.threadID
        );
      }
    } catch (error) {
      console.error(`⚠ Failed to re-add user ${userId}:`, error);
      api.sendMessage(
        `🚨 **Error:** Could not add the user back.\n\n❗ 𝗣𝗼𝘀𝘀𝗶𝗯𝗹𝗲 𝗿𝗲𝗮𝘀𝗼𝗻𝘀 :\n- 𝗕𝗼𝘁 𝗹𝗮𝗰𝗸𝘀 𝗮𝗱𝗺𝗶𝗻 𝗽𝗿𝗶𝘃𝗶𝗹𝗲𝗴𝘀.\n- 𝗨𝘀𝗲𝗿 𝗯𝗹𝗼𝗰𝗸𝗲𝗱 𝘁𝗵𝗲 𝗯𝗼𝘁.\n\n𝗣𝗹𝗲𝗮𝘀𝗲 𝗰𝗵𝗲𝗸 𝗮𝗻𝗱 𝘁𝗿𝘆 𝗮𝗴𝗮𝗶𝗻.`,
        event.threadID
      );
    }
  }
};
