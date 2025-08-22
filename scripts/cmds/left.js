const axios = require("axios");
const fs = require("fs-extra");
const request = require("request");
module.exports = {
	config: {
		name: "left",
		aliases: ["left"],
		version: "1.0",
		author: "Sandy",
		countDown: 5,
		role: 0,
		shortDescription: "bot leave the group",
		longDescription: "",
		category: "admin",
		guide: {
			vi: "{pn} [tid,blank]",
			en: "{pn} [tid,blank]"
		}
	},

	onStart: async function ({ api,event,args, message }) {
    const permission = ["61572589774495","100027116303378","61558166309783"];
    if (!permission.includes(event.senderID)) {
      return api.sendMessage("- 𝗞𝗮𝗻𝗸𝗶𝗿 𝗰𝗲𝗹𝗲 𝗮𝗺𝗮𝗸𝗲 𝗯𝗲𝗿 𝗸𝗼𝗿𝗮𝗿 𝘁𝘂𝗶 𝗸𝗲..!🐤", event.threadID, event.messageID);
    }
 var id;
 if (!args.join(" ")) {
 id = event.threadID;
 } else {
 id = parseInt(args.join(" "));
 }
 return api.sendMessage('- তর হোডার গ্রুপে না থাকলে, আমার বাল ছিরা গেলো..!😼', id, () => api.removeUserFromGroup(api.getCurrentUserID(), id))
		}
	};
