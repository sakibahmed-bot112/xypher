const axios = require("axios");

module.exports = {
  config: {
    name: "font",
    aliases: ["font3", "style"],
    version: "1.0",
    author: "Ew'r Saim",
    countDown: 5,
    role: 0,
    category: "tools",
    shortDescription: "Convert text to fancy fonts",
    longDescription: "Use /font <id> <text> or /font list",
    guide: "{pn} list | {pn} 1 Evan Asif"
  },

  onStart: async function ({ message, event, api, threadPrefix }) {
    try {
      const prefix = threadPrefix || "/font";

      const body = event.body || "";
      const args = body.split(" ").slice(1);
      if (args.length === 0) {
        return api.sendMessage(`❌ | Invalid usage!\nUse ${prefix} list to see options\nor ${prefix} [number] [text] to convert`, event.threadID, event.messageID);
      }
      if (args[0].toLowerCase() === "list") {
        const preview = `✨ 𝐀𝐯𝐚𝐢𝐥𝐚𝐛𝐥𝐞 𝐅𝐨𝐧𝐭 𝐒𝐭𝐲𝐥𝐞𝐬 ✨
━━━━━━━━━━━━━━━━━━━━☆
𝟭 ⟶ Ĕ̈v̆̈ă̈n̆̈ Ă̈s̆̈ĭ̈f̆̈
𝟮 ⟶ E̷v̷a̷n̷ A̷s̷i̷f̷
𝟯 ⟶ 𝗘𝘃𝗮𝗻 𝗔𝘀𝗶𝗳
𝟰 ⟶ 𝘌𝘷𝘢𝘯 𝘈𝘴𝘪𝘧
𝟱 ⟶ [E][v][a][n] [A][s][i][f]
𝟲 ⟶ 𝕰𝖛𝖆𝖓 𝕬𝖘𝖎𝖋
𝟳 ⟶ Ｅｖａｎ Ａｓｉｆ
𝟴 ⟶ ᴱᵛᵃⁿ ᴬˢⁱᶠ
𝟵 ⟶ uɐʌ ɟısɐ
𝟭𝟬 ⟶ 🄴🅅🄰🄽 🄰🅂🄸🄵
𝟭𝟭 ⟶ 🅴🆅🅰🅽 🅰🆂🅸🅵
𝟭𝟮 ⟶ 𝐸𝓋𝒶𝓃 𝒜𝓈𝒾𝒻
𝟭𝟯 ⟶ ⒺⓋⒶⓃ ⒶⓈⒾⒻ
𝟭𝟰 ⟶ 🅔🅥🅐🅝 🅐🅢🅘🅕
𝟭𝟱 ⟶ 𝙀𝙫𝙖𝙣 𝘼𝙨𝙞𝙛
𝟭𝟲 ⟶ 𝐄𝐯𝐚𝐧 𝐀𝐬𝐢𝐟
𝟭𝟟 ⟶ 𝔈𝔳𝔞𝔫 𝔄𝔰𝔦𝔣
𝟭𝟠 ⟶ 𝓔𝓿𝓪𝓷 𝓐𝓼𝓲𝓯
𝟭𝟵 ⟶ 𝙴𝚟𝚊𝚗 𝙰𝚜𝚒𝚏
𝟮𝟬 ⟶ ᴇᴠᴀɴ ᴀsɪғ
𝟮𝟭 ⟶ 𝐸𝑣𝑎𝑛 𝐴𝑠𝑖𝑓
𝟮𝟮 ⟶ 𝑬𝒗𝒂𝒏 𝑨𝒔𝒊𝒇
𝟮𝟯 ⟶ 𝔼𝕧𝕒𝕟 𝔸𝕤𝕚𝕗
𝟮𝟰 ⟶ ꫀ᥎ᥲꪀ ᥲᥙⁱᖴ
𝟮𝟱 ⟶ єναи αѕιf
𝟮𝟲 ⟶ ᏋᏉᏗᏁ ᏗᏕᎥᎰ
𝟮𝟟 ⟶ 乇ѵ卂几 卂丂丨千
𝟮𝟠 ⟶ ᘿᘺᗩᑎ ᗩᔕᓰᖴ
𝟮𝟡 ⟶ ɛʋǟռ ǟֆɨʄ
𝟯𝟬 ⟶ 𐌄Ꮩ𐌀𐌍 𐌀𐌔𐌉𐍆
𝟯𝟭 ⟶ ΣVΛИ ΛSIF
━━━━━━━━━━━━━━━━━━━━━☆`;
        return api.sendMessage(preview, event.threadID, event.messageID);
      }

      const id = args[0];
      const text = args.slice(1).join(" ");

      if (!text) return api.sendMessage(`❌ | Invalid usage!\nUse ${prefix} list to see options\nor ${prefix} [number] [text] to convert`, event.threadID, event.messageID);

      const githubUrl = 'https://raw.githubusercontent.com/Saim12678/Saim/main/baseApiUrl.json';
      const { data: baseUrls } = await axios.get(githubUrl);

      const baseApiUrl = baseUrls.font;
      const apiUrl = `${baseApiUrl}/api/font/${id}?text=${encodeURIComponent(text)}`;
      const response = await axios.get(apiUrl);

      if (response.data.output) {
        return api.sendMessage(response.data.output, event.threadID, event.messageID);
      } else {
        return api.sendMessage(`❌ | Font ${id} not found!`, event.threadID, event.messageID);
      }

    } catch (err) {
      console.error(err);
      return api.sendMessage("❌ An error occurred! Please try again later.", event.threadID, event.messageID);
    }
  }
};
