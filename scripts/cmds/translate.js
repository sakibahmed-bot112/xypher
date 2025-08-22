const axios = require('axios');
const defaultEmojiTranslate = "🌐";

module.exports = {
  config: {
    name: "translate",
    aliases: ["trans"],
    version: "1.6",
    author: "NTKhang + Fixed by Asif",
    countDown: 5,
    role: 0,
    description: {
      en: "Translate text to the desired language"
    },
    category: "utility",
    guide: {
      en: "{pn} hello -> bn\n{pn} -r on | off"
    }
  },

  onStart: async function ({ message, event, args, threadsData }) {
    const { body = "" } = event;
    let content;
    let langCodeTrans;
    const langOfThread = await threadsData.get(event.threadID, "data.lang") || "en";

    if (event.messageReply) {
      content = event.messageReply.body;
      langCodeTrans = detectLangCode(body, args, langOfThread);
    } else {
      content = body;
      langCodeTrans = detectLangCode(body, args, langOfThread);
    }

    if (!content) return message.reply("⚠️ Please enter text to translate.");
    translateAndSendMessage(content, langCodeTrans, message);
  }
};

function detectLangCode(body, args, defaultLang) {
  let lastIndexSeparator = body.lastIndexOf("->");
  if (lastIndexSeparator === -1) lastIndexSeparator = body.lastIndexOf("=>");

  if (lastIndexSeparator !== -1) {
    return body.slice(lastIndexSeparator + 2).trim();
  }
  if ((args[0] || "").match(/^[a-z]{2,3}$/i)) {
    return args[0].trim();
  }
  return defaultLang;
}

async function translate(text, langCode) {
  try {
    const res = await axios.get(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${langCode}&dt=t&q=${encodeURIComponent(text)}`
    );

    const translated = res.data[0].map(item => item[0]).join('');
    const detectedLang = res.data[2] || "auto";

    return { text: translated, lang: detectedLang };
  } catch (err) {
    return { text: "❌ Translation failed.", lang: "error" };
  }
}

async function translateAndSendMessage(content, langCodeTrans, message) {
  const { text, lang } = await translate(content.trim(), langCodeTrans.trim());
  return message.reply(`${text}\n\n🌐 Translate from ${lang} to ${langCodeTrans}`);
}
