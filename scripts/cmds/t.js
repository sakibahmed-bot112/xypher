const util = require('util');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const request = require('request');

module.exports = {
  config: {
    name: "t",
    aliases: [],
    version: "8.0",
    author: "Eren",
    description: "Mega tools with clean direct blur JPG",
    category: "tools",
    guide: `
Examples:
• {pn} -console console.log("Eren ❤️")
• {pn} -eval 1+2+3
• {pn} -ascii Eren
• {pn} -json {"name":"Eren","age":16}
• {pn} -cmdcheck <full goatbot command js file>
• {pn} -jscheck if(true){console.log('ok')}
• {pn} -api https://jsonplaceholder.typicode.com/todos/1
• {pn} -length Hello World
• {pn} -reverse Hello
• {pn} -upper hello
• {pn} -lower HELLO
• {pn} -blur 70 <image url>
or reply to an image and type:
• {pn} -blur 70
`
  },

  onStart: async function ({ message, args, event }) {
    const type = args[0];
    const code = args.slice(1).join(" ");
    let output = "";

    try {
      switch (type) {
        case "-console":
          {
            const logs = [];
            const fakeConsole = { log: (...a) => logs.push(a.join(" ")) };
            eval(`(function(console){${code}})(fakeConsole)`);
            output = logs.join("\n") || "No output";
          }
          break;

        case "-eval":
          output = util.inspect(eval(code));
          break;

        case "-ascii":
          output = `
   ___ _  _ ___ ___ 
  / __| || |_ _|_ _|
 | (_ | __ || | | | 
  \\___|_||_|___|___|
          
${code}`;
          break;

        case "-json":
          output = JSON.stringify(JSON.parse(code), null, 2);
          break;

        case "-cmdcheck":
          output = checkGoatBotCommand(code);
          break;

        case "-jscheck":
          try {
            eval(`(()=>{${code}})()`);
            output = "✅ No syntax error detected in JS code.";
          } catch (err) {
            output = `❌ JS Error: ${err.message}`;
          }
          break;

        case "-api":
          {
            const res = await axios.get(code);
            output = util.inspect(res.data).slice(0, 2000) || "No data.";
          }
          break;

        case "-length":
          output = `Length: ${code.length} characters.`;
          break;

        case "-reverse":
          output = code.split("").reverse().join("");
          break;

        case "-upper":
          output = code.toUpperCase();
          break;

        case "-lower":
          output = code.toLowerCase();
          break;

        case "-blur":
          {
            let blurLevel = parseInt(args[1]) || 10;
            let fileUrl = args[2];

            if (isNaN(blurLevel)) {
              blurLevel = parseInt(args[0]) || 10;
              fileUrl = args.slice(1).join(" ");
            }

            if (!fileUrl && event.messageReply?.attachments[0]?.url) {
              fileUrl = event.messageReply.attachments[0].url;
            }

            if (!fileUrl) {
              return message.reply("❌ Provide a URL or reply to an image/video.");
            }

            if (blurLevel > 100) blurLevel = 100;

            const apiUrl = `https://blur-exe.onrender.com/blur?url=${encodeURIComponent(fileUrl)}&blur=${blurLevel}`;
            const tempPath = path.join(__dirname, `temp_blur_${Date.now()}.jpg`);

            const writeStream = fs.createWriteStream(tempPath);

            request.get(apiUrl)
              .on('error', () => {
                if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
                return message.reply("❌ Failed to download from blur API.");
              })
              .pipe(writeStream)
              .on('finish', () => {
                message.send({
                  attachment: fs.createReadStream(tempPath)
                }).then(() => fs.unlinkSync(tempPath));
              });

            return;
          }

        default:
          return message.reply(`Unknown or missing type. Try:
!t -console console.log("Eren ❤️")
!t -eval 1+2+3
!t -ascii Eren
!t -json {"name":"Eren","age":16}
!t -cmdcheck <file>
!t -jscheck if(true){console.log('ok')}
!t -api <url>
!t -length Hello World
!t -reverse Hello
!t -upper hello
!t -lower HELLO
!t -blur 70 <url> or reply`);
      }

      return message.reply("✅ Output:\n" + output);

    } catch (e) {
      return message.reply("❌ Error:\n" + e.message);
    }
  }
};

function checkGoatBotCommand(code) {
  const errors = [];
  if (!/config\s*:\s*{/.test(code)) errors.push("❌ Missing `config` object.");
  if (!/name\s*:\s*["']/.test(code)) errors.push("❌ `config.name` missing.");
  if (!/version\s*:\s*["']/.test(code)) errors.push("❌ `config.version` missing.");
  if (!/author\s*:\s*["']/.test(code)) errors.push("❌ `config.author` missing.");
  if (!/onStart\s*:\s*async/.test(code)) errors.push("❌ Missing `onStart` function.");
  return errors.length === 0 ? "✅ Command looks perfect!" : errors.join("\n");
}
