const { createCanvas } = require("canvas");
const fs = require("fs-extra");

const sessions = new Map();

function drawBoard(board, winIndices = [], firstPlayerMark = "❌") {
  const size = 240;
  const tile = 80;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#1a0033";
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 30; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 1.5 + 0.5;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
    grad.addColorStop(0, "rgba(180,0,255,0.9)");
    grad.addColorStop(0.6, "rgba(180,0,255,0.2)");
    grad.addColorStop(1, "rgba(180,0,255,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fill();
  }

  ctx.strokeStyle = "#b400ffcc";
  ctx.lineWidth = 2;
  for (let i = 1; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(i * tile, 0);
    ctx.lineTo(i * tile, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * tile);
    ctx.lineTo(size, i * tile);
    ctx.stroke();
  }

  const isFirstX = firstPlayerMark === "❌";
  const glowMap = {
    "❌": isFirstX ? "#ffffff" : "#ff1a1a",
    "⭕": isFirstX ? "#ff1a1a" : "#ffffff"
  };

  for (let i = 0; i < 9; i++) {
    const x = (i % 3) * tile;
    const y = Math.floor(i / 3) * tile;

    ctx.save();
    ctx.shadowColor = "rgba(180,0,255,0.6)";
    ctx.shadowBlur = 12;
    ctx.strokeStyle = "rgba(180,0,255,0.7)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 3, y + 3, tile - 6, tile - 6);
    ctx.restore();

    ctx.font = "bold 14px Arial";
    ctx.fillStyle = "rgba(180,0,255,0.6)";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText((i + 1).toString(), x + 6, y + 6);

    if (winIndices.includes(i)) {
      ctx.save();
      ctx.strokeStyle = "rgba(180,0,255,0.95)";
      ctx.lineWidth = 4;
      ctx.shadowColor = "#b400ff";
      ctx.shadowBlur = 20;
      ctx.strokeRect(x + 3, y + 3, tile - 6, tile - 6);
      ctx.restore();
    }
  }

  ctx.font = "bold 48px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 0; i < 9; i++) {
    const mark = board[i];
    if (!mark) continue;
    const cx = (i % 3) * tile + tile / 2;
    const cy = Math.floor(i / 3) * tile + tile / 2;

    const glow = glowMap[mark];
    ctx.shadowColor = glow;
    ctx.shadowBlur = 18;
    ctx.fillStyle = glow;
    ctx.fillText(mark, cx, cy);
    ctx.shadowBlur = 0;
  }

  return canvas.toBuffer();
}

function checkWinner(board) {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (const [a,b,c] of wins) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return [board[a], [a,b,c]];
    }
  }
  if (board.every(v => v)) return ["draw", []];
  return [null, []];
}

function clearOldSession(p1, p2, threadID) {
  for (const [key, session] of sessions.entries()) {
    if (session.threadID !== threadID) continue;
    if (session.players.includes(p1) && session.players.includes(p2)) {
      const fp = `./tmp/${session.sessionID}.png`;
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
      sessions.delete(key);
    }
  }
}

module.exports = {
  config: {
    name: "tic",
    version: "4.0",
    author: "Asif",
    role: 0,
    category: "game",
    shortDescription: "Tic Tac Toe with purple glow",
    longDescription: "Play tic tac toe with player-specific glow and purple star background",
    guide: "{pn} @friend"
  },

  onStart: async ({ event, message, usersData }) => {
    const mention = Object.keys(event.mentions)[0];
    const p1 = event.senderID;
    const p2 = mention;
    if (!p2) return message.reply("Please tag a friend to play.");
    if (p1 === p2) return message.reply("You can't play with yourself.");
    clearOldSession(p1, p2, event.threadID);

    const name1 = await usersData.getName(p1);
    const name2 = await usersData.getName(p2);
    const marks = Math.random() < 0.5
      ? { [p1]: "❌", [p2]: "⭕" }
      : { [p1]: "⭕", [p2]: "❌" };

    const sessionID = `${p1}_${p2}_${Date.now()}`;
    const key = `${event.threadID}_${sessionID}`;
    const board = Array(9).fill("");
    const buffer = drawBoard(board, [], marks[p1]);
    const imgPath = `./tmp/${sessionID}.png`;
    fs.writeFileSync(imgPath, buffer);

    const replyMsg = await message.reply({
      body: `🎮 Tic Tac Toe\n\n${name1}: ${marks[p1]}\n${name2}: ${marks[p2]}\n🎲 ${name1} starts.\n\nReply with 1-9 to make your move.`,
      attachment: fs.createReadStream(imgPath)
    });

    sessions.set(key, {
      threadID: event.threadID,
      players: [p1, p2],
      marks,
      turn: p1,
      sessionID,
      lastMsgID: replyMsg.messageID,
      firstPlayerMark: marks[p1],
      board
    });
  },

  onChat: async ({ event, message, usersData, api }) => {
    if (!event.messageReply) return;

    const num = parseInt(event.body);
    const u = event.senderID;
    if (isNaN(num) || num < 1 || num > 9) return;

    let sessionFound = null;
    for (const [key, s] of sessions.entries()) {
      if (s.threadID !== event.threadID) continue;
      if (s.lastMsgID === event.messageReply.messageID) {
        sessionFound = { key, s };
        break;
      }
    }

    if (!sessionFound) return;

    const { key, s } = sessionFound;

    if (!s.players.includes(u)) {
      return message.reply("- খেলার মাঝে চুলপাকনামি করবি, তাপরাইয়া বয়রা বানাইয়া পেলবো..!😡");
    }

    const { board, turn, marks, sessionID, lastMsgID, firstPlayerMark } = s;
    const idx = num - 1;
    const imgPath = `./tmp/${sessionID}.png`;

    if (turn !== u) return message.reply("⏳ Please wait for your turn.");
    if (board[idx]) return message.reply("❌ That spot is already taken!");

    board[idx] = marks[u];
    const [winner, winCells] = checkWinner(board);

    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    const buf = drawBoard(board, winCells, firstPlayerMark);
    fs.writeFileSync(imgPath, buf);

    if (lastMsgID) {
      try { await api.unsendMessage(lastMsgID); } catch {}
    }

    if (winner === "draw") {
      const p1Name = await usersData.getName(s.players[0]);
      const p2Name = await usersData.getName(s.players[1]);
      await message.reply({
        body: `- মগা দুইটা (${p1Name} & ${p2Name}) মুর্খ খেলা পারে না Draw করে..!😹`,
        attachment: fs.createReadStream(imgPath)
      });
      fs.unlinkSync(imgPath);
      sessions.delete(key);
      return;
    }

    if (winner) {
      const nm = await usersData.getName(u);
      await message.reply({
        body: `🎉 Congratulations you are win: ${nm}\n🆔 UID: ${u}`
      });
      fs.unlinkSync(imgPath);
      sessions.delete(key);
      return;
    }

    const next = s.players.find(pl => pl !== u);
    s.board = board;
    s.turn = next;

    const nextName = await usersData.getName(next);
    const snt = await message.reply({
      body: `✅ Move saved.\n🔁 ${nextName}, your turn.`,
      attachment: fs.createReadStream(imgPath)
    });

    s.lastMsgID = snt.messageID;
    sessions.set(key, s);
  }
};
