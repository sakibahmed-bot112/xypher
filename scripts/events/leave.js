const { drive } = global.utils;

module.exports = {
  config: {
    name: "leave",
    version: "1.7",
    author: "eden",
    category: "events"
  },

  langs: {
    en: {
      session1: "🌅 𝗠𝗢𝗥𝗡𝗜𝗡𝗚 𝗩𝗜𝗕𝗘𝗦 ☀️",
      session2: "🍱 𝙉𝙊𝙊𝙉 𝙎𝙐𝙉𝙉𝙔 𝙏𝙄𝙈𝙀 ☀️",
      session3: "🌇 𝘼𝙁𝙏𝙀𝙍𝙉𝙊𝙊𝙉 𝘾𝙃𝙄𝙇𝙇 🌞",
      session4: "🌆 𝑬𝒂𝒓𝒍𝒚 𝑬𝒗𝒆𝒏𝒊𝒏𝒈 🌙",
      session5: "🌃 𝕯𝖊𝖊𝖕 𝖓𝖎𝖌𝖍𝖙 𝕾𝖎𝖑𝖊𝖓𝖈𝖊 🌌",
      leaveType1: "🚪 𝗟𝗘𝗙𝗧",
      leaveType2: "🛑 𝗪𝗔𝗦 𝗞𝗜𝗖𝗞𝗘𝗗 𝗙𝗥𝗢𝗠",
      defaultLeaveMessage: `
╭━━━━━━━━━━━━━━╮
┃ 🕹️ 𝗠𝗲𝗺𝗯𝗲𝗿 𝗟𝗲𝗳𝘁 🕹️
┃────────────────
┃ 👤 𝗡𝗮𝗺𝗲 : {userNameTag}
┃ 📤 𝗦𝘁𝗮𝘁𝘂𝘀 : {type} the group
┃ 💬 𝗚𝗿𝗼𝘂𝗽 : {threadName}
┃ 🕒 𝗧𝗶𝗺𝗲 : {time} ({session})
╰━━━━━━━━━━━━━━╯`
    }
  },

  onStart: async ({ threadsData, message, event, api, usersData, getLang }) => {
    if (event.logMessageType !== "log:unsubscribe") return;

    const { threadID } = event;
    const threadData = await threadsData.get(threadID);
    if (!threadData?.settings?.sendLeaveMessage) return;

    const { leftParticipantFbId } = event.logMessageData;
    if (leftParticipantFbId === api.getCurrentUserID()) return;

    const threadName = threadData.threadName || "this group";

    // ✅ Get user name or fallback to last 5 digits of ID
    let userName = await usersData.getName(leftParticipantFbId);
    if (!userName) userName = `User-${leftParticipantFbId.slice(-5)}`;

    // Dhaka time 12h
    const bangladeshTime12h = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Dhaka",
      hour12: true,
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit"
    });

    const dhakaHour = parseInt(new Date().toLocaleString("en-US", {
      timeZone: "Asia/Dhaka",
      hour12: false,
      hour: "2-digit"
    }));

    const session =
      dhakaHour >= 0 && dhakaHour <= 10 ? getLang("session1") :
      dhakaHour >= 11 && dhakaHour <= 12 ? getLang("session2") :
      dhakaHour >= 13 && dhakaHour <= 18 ? getLang("session3") :
      dhakaHour === 19 ? getLang("session4") :
      getLang("session5");

    let leaveMessage = threadData.data.leaveMessage || getLang("defaultLeaveMessage");

    const form = {
      body: leaveMessage
        .replace(/\{userNameTag\}/g, `@${userName}`)
        .replace(/\{userName\}/g, userName)
        .replace(/\{type\}/g, leftParticipantFbId === event.author ? getLang("leaveType1") : getLang("leaveType2"))
        .replace(/\{threadName\}|\{boxName\}/g, threadName)
        .replace(/\{time\}/g, bangladeshTime12h)
        .replace(/\{session\}/g, session)
    };

    if (leaveMessage.includes("{userNameTag}")) {
      form.mentions = [{
        id: leftParticipantFbId,
        tag: userName
      }];
    }

    // Full leave videos array
    const leaveVideos = [
      "17tGvbWdcxgUKAWDN0Zk151XL3XmI3i-k",
      "18STu2xcXSi-SP8utpDdSpOyA7EJEYcU9",
      "18SGdkknAOIdxDeJkyOg22MwYLUa9HKyB",
      "18J3EFEwCye1_204hyeg48_3Gg0j26niC",
      "18HkjnCElht-QJQTFaWs2MmTwhA1wj9Xy",
      "18AhLAh9jdC45zTv9r8o9GdMhuuEzH2zD",
      "180c6lHeD3f0x6fCC9aTeouekachDt8xQ",
      "19xGnVk43vdYrm-z45xDeTpn9MQOqfcMm",
      "1AJ_eVwWX_xVRJRlBNLbtQzyRLCBR5aNG",
      "1ABGLFKV2EjKtMc1xMombfaaKrvV1HDMx",
      "1A2532UPoppgFPuZns9VgQVp0oZWPbIK6",
      "19y1urBiBel1jgRPM8VXub1_lRd57BTTb",
      "19y-dILbf6W6Mk5jBfhomMRM1sgel0np0",
      "19xW0cHhdDugtlHClIoJToy6zwo807IiS",
      "1Ahgifkd5RywdKZzgdoJyNcOy005VQkqj",
      "1Aq0FN1g7MwE4ovsojyGtM1TO9XpuBowY",
      "1ApmnqwAs5wD5qcGEQCmKGc7b8vVJPLLG",
      "1Am8eosYHwFFb2_G_9b4_MYLV8BQWhm73",
      "1AkN_8hMpVt57NXPKu8fqbomGanja1",
      "1AkN_8hMpVt57NXPKu8fqbomGanja2",
      "1DEL2KiFbaJjgVkGeHQOvUybyq6ImUUJX",
      "1E5I9OMELd5NBmRRfqmWPvVgTiFzbB7bN",
      "1E2AHa0RmHaFxZFFTIlv_h99yJ9aa35sK",
      "1DtbBlQyYwX1JeearO2LYSM7NFXQ5MGsP",
      "1DtJ9GmKZTT7zgp_9imIZqkZe3Y4XpA4q",
      "1DrEOVw9vwPKrxr_CaeKPbUTFjqE5JtHw",
      "1DieHZzJgFMuFrmkzI-ubc9qlGeqPSp3u",
      "1DfhU31mVibXf07gLqBT_Rax4-MYOH5_y",
      "1DWxUsY1frAGCVOXlA6dL2NK-oK2m-uU_",
      "1DV1vCrZ942O1zhJH62XMC4d1tm4AplZx",
      "1DTHxPajMZ3yKb_hp9N93l0BAqmIrwcnu",
      "1DLlcsGBbvHgj-WaDjQAsJxhXu3J6qwhW"
    ];

    try {
      const randomId = leaveVideos[Math.floor(Math.random() * leaveVideos.length)];
      const attachment = await drive.getFile(randomId, "stream");
      if (attachment) form.attachment = attachment;
    } catch (err) {
      console.error("[leave.js] Failed to get leave video:", err.message);
    }

    message.send(form);
  }
};
