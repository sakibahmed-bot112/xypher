const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

async function pollUntilComplete(pollingUrl, maxAttempts = 20, interval = 5000) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await axios.get(pollingUrl, { timeout: 15000 });
      const data = res.data;

      if (data.status === "completed") {
        if (Array.isArray(data.results)) return data.results;
        if (Array.isArray(data.urls)) return data.urls;
        if (Array.isArray(data.image_urls)) return data.image_urls;
      }
    } catch (err) {
      console.warn("Polling error:", err.message);
    }
    await delay(interval);
  }
  throw new Error("Timeout: Image not ready after multiple attempts.");
}

async function getSafeUsername(api, userID) {
  try {
    const userInfo = await api.getUserInfo(userID);
    const rawName = userInfo[userID]?.name || "user";
    return rawName.replace(/[^a-zA-Z0-9]/g, "_");
  } catch {
    return "user";
  }
}

module.exports = {
  config: {
    name: "midjourney",
    aliases: ["mj"],
    version: "1.4",
    author: "Amit Max ⚡",
    role: 2,
    shortDescription: "Generate images using MidJourney Proxy API",
    category: "IMAGE",
    guide: `
{pn} <prompt> [--ar W:H] [--q 1-5] [--v 1-6] [--niji] [--style raw]
Tag: {pn} @user <prompt>
Examples:
{pn} A cat with sunglasses --ar 3:2 --q 2
{pn} anime girl --niji --q 4
{pn} cyberpunk city --ar 16:9
{pn} @John cool dragon wallpaper
`
  },

  onStart: async function ({ api, event, args }) {
    let mentionID = null;
    let prompt = args.join(" ").trim();

    if (event.mentions && Object.keys(event.mentions).length > 0) {
      mentionID = Object.keys(event.mentions)[0];
      const mentionName = event.mentions[mentionID];
      prompt = prompt.replace(mentionName, "").trim();
    }

    if (!prompt)
      return api.sendMessage(
        "❌ Please provide a prompt.\nExample: mj cute cat --ar 3:2",
        event.threadID,
        event.messageID
      );

    const username = await getSafeUsername(api, event.senderID);

    const waitMsg = await api.sendMessage(
      `🎨 Generating your image... Please wait ⏳`,
      event.threadID,
      event.messageID
    );

    try {
      const startRes = await axios.get("https://api.oculux.xyz/api/mj-proxy-pub", {
        params: { prompt, usePolling: "true" },
        timeout: 90000,
      });

      const data = startRes.data;
      let imageUrls = [];

      if (data.status === "completed") {
        if (Array.isArray(data.results)) imageUrls = data.results;
        else if (Array.isArray(data.urls)) imageUrls = data.urls;
        else if (Array.isArray(data.image_urls)) imageUrls = data.image_urls;
      } else if (data.status === "processing" && data.pollingUrl) {
        imageUrls = await pollUntilComplete(data.pollingUrl);
      } else {
        return api.sendMessage("❌ Error: Image not generated.", event.threadID, waitMsg.messageID);
      }

      if (!imageUrls || imageUrls.length === 0)
        return api.sendMessage("❌ No image received.", event.threadID, waitMsg.messageID);

      if (imageUrls.length === 1) {
        const imgUrl = imageUrls[0];
        const imgPath = path.join(__dirname, `cache/mj_single_${username}.jpg`);
        const imgResp = await axios.get(imgUrl, { responseType: "arraybuffer" });
        await fs.writeFile(imgPath, imgResp.data);

        return api.sendMessage(
          {
            body: `✅ Done!`,
            attachment: fs.createReadStream(imgPath),
            mentions: mentionID ? [{ tag: event.mentions[mentionID], id: mentionID }] : []
          },
          event.threadID,
          () => fs.existsSync(imgPath) && fs.unlinkSync(imgPath),
          waitMsg.messageID
        );
      }

      await fs.ensureDir(path.join(__dirname, "cache"));
      const filePaths = [];

      for (let i = 0; i < 4; i++) {
        const imgUrl = imageUrls[i];
        const imgPath = path.join(__dirname, `cache/mj_${username}_${i}.jpg`);
        const imgResp = await axios.get(imgUrl, { responseType: "arraybuffer" });
        await fs.writeFile(imgPath, imgResp.data);
        filePaths.push(imgPath);
      }

      const canvasSize = 1024;
      const canvas = createCanvas(canvasSize, canvasSize);
      const ctx = canvas.getContext("2d");
      const images = await Promise.all(filePaths.map((f) => loadImage(f)));
      const half = canvasSize / 2;
      ctx.drawImage(images[0], 0, 0, half, half);
      ctx.drawImage(images[1], half, 0, half, half);
      ctx.drawImage(images[2], 0, half, half, half);
      ctx.drawImage(images[3], half, half, half, half);

      const outPath = path.join(__dirname, `cache/mj_combined_${username}.jpg`);
      const outStream = fs.createWriteStream(outPath);
      const stream = canvas.createJPEGStream();
      stream.pipe(outStream);

      outStream.on("finish", () => {
        api.sendMessage(
          {
            body: `✅ Done!\nChoose: U1, U2, U3, U4, V1, V2, V3, V4, or U-ALL`,
            attachment: fs.createReadStream(outPath),
            mentions: mentionID ? [{ tag: event.mentions[mentionID], id: mentionID }] : []
          },
          event.threadID,
          (err, info) => {
            if (err) console.log(err);

            global.GoatBot.onReply.set(info.messageID, {
              commandName: "midjourney",
              author: event.senderID,
              images: imageUrls,
              mentionID
            });

            setTimeout(() => {
              [...filePaths, outPath].forEach((p) => fs.existsSync(p) && fs.unlinkSync(p));
            }, 60000);
          },
          waitMsg.messageID
        );
      });
    } catch (err) {
      console.error("Error:", err);
      api.sendMessage("❌ Failed. Try again.", event.threadID, waitMsg.messageID);
    }
  },

  onReply: async function ({ api, event, Reply }) {
    if (event.senderID !== Reply.author) return;

    const input = event.body.trim().toUpperCase();
    const upscaleMap = { U1: 0, U2: 1, U3: 2, U4: 3 };
    const variationMap = { V1: 0, V2: 1, V3: 2, V4: 3 };

    // --- Handle U-ALL / U ALL ---
    if (input === "U-ALL" || input === "U ALL") {
      try {
        const attachments = [];
        for (let i = 0; i < 4; i++) {
          const url = Reply.images[i];
          if (!url) continue;

          const tempPath = path.join(__dirname, `cache/mj_select_${Reply.author}_${i}.jpg`);
          const imgResp = await axios.get(url, { responseType: "arraybuffer" });
          await fs.writeFile(tempPath, imgResp.data);
          attachments.push(fs.createReadStream(tempPath));

          setTimeout(() => fs.existsSync(tempPath) && fs.unlinkSync(tempPath), 30000);
        }

        return api.sendMessage(
          {
            body: `✨ Selected: ALL`,
            attachment: attachments,
            mentions: Reply.mentionID ? [{ tag: "Tagged User", id: Reply.mentionID }] : []
          },
          event.threadID,
          event.messageID
        );
      } catch (err) {
        console.error("Error sending all images:", err);
        return api.sendMessage("❌ Failed to send all images.", event.threadID, event.messageID);
      }
    }

    // --- Handle U1..U4 (Upscale) ---
    if (upscaleMap[input] !== undefined) {
      try {
        const idx = upscaleMap[input];
        const url = Reply.images[idx];
        if (!url) return api.sendMessage("❌ Image not found.", event.threadID, event.messageID);

        const tempPath = path.join(__dirname, `cache/mj_upscale_${Reply.author}.jpg`);
        const imgResp = await axios.get(url, { responseType: "arraybuffer" });
        await fs.writeFile(tempPath, imgResp.data);

        return api.sendMessage(
          {
            body: `✨ Upscaled: ${input}`,
            attachment: fs.createReadStream(tempPath),
            mentions: Reply.mentionID ? [{ tag: "Tagged User", id: Reply.mentionID }] : []
          },
          event.threadID,
          () => fs.existsSync(tempPath) && fs.unlinkSync(tempPath)
        );
      } catch (err) {
        console.error("Error sending upscale:", err);
        return api.sendMessage("❌ Failed to send upscaled image.", event.threadID, event.messageID);
      }
    }

    // --- Handle V1..V4 (Variation) ---
    if (variationMap[input] !== undefined) {
      try {
        const idx = variationMap[input];
        const url = Reply.images[idx];
        if (!url) return api.sendMessage("❌ Image not found.", event.threadID, event.messageID);

        const tempPath = path.join(__dirname, `cache/mj_variation_${Reply.author}.jpg`);
        const imgResp = await axios.get(url, { responseType: "arraybuffer" });
        await fs.writeFile(tempPath, imgResp.data);

        return api.sendMessage(
          {
            body: `✨ Variation: ${input}`,
            attachment: fs.createReadStream(tempPath),
            mentions: Reply.mentionID ? [{ tag: "Tagged User", id: Reply.mentionID }] : []
          },
          event.threadID,
          () => fs.existsSync(tempPath) && fs.unlinkSync(tempPath)
        );
      } catch (err) {
        console.error("Error sending variation:", err);
        return api.sendMessage("❌ Failed to send variation image.", event.threadID, event.messageID);
      }
    }

    return api.sendMessage(
      "❌ Type U1, U2, U3, U4, V1, V2, V3, V4 or U-ALL",
      event.threadID,
      event.messageID
    );
  }
};
