const { loadImage, createCanvas } = require("canvas");
const fs = require("fs");
const { Chess } = require("chess.js"); // Using chess.js for better rule handling

module.exports.config = {
  name: "chess",
  aliases: ["chessplay"],
  version: "2.1.0",
  role: 0,
  author: "TawsiN",
  description: { en: "Play chess with AI opponents of various skill levels" },
  category: "game's",
  countDown: 5,
  guide: "chess [ai_level/ai_name] - Start game with AI level/name"
};

// AI Difficulty Levels with Names and Descriptions
const AI_LEVELS = {
  beginner: {
    name: "Felix",
    title: "Beginner",
    description: "Very random, weak moves",
    depth: 1,
    randomness: 0.8,
    taunts: ["Hmm, let me think...", "Interesting move!", "🤔"]
  },
  novice: {
    name: "Ava",
    title: "Novice", 
    description: "Slightly better, avoids blunders",
    depth: 1,
    randomness: 0.6,
    taunts: ["Not bad!", "I see what you're doing", "🙂"]
  },
  club: {
    name: "Oliver",
    title: "Club Player",
    description: "Recognizes basic tactics",
    depth: 2,
    randomness: 0.4,
    taunts: ["Nice try!", "That's risky...", "😏"]
  },
  advanced: {
    name: "Emma",
    title: "Advanced",
    description: "Plays more positionally",
    depth: 2,
    randomness: 0.2,
    taunts: ["Solid move", "Let's see...", "🎯"]
  },
  cm: {
    name: "Lucas",
    title: "Candidate Master",
    description: "Basic strategy + some tactics",
    depth: 3,
    randomness: 0.1,
    taunts: ["Predictable", "I expected that", "⚡"]
  },
  fm: {
    name: "Sofia",
    title: "FIDE Master",
    description: "Stronger, understands pawn structure",
    depth: 3,
    randomness: 0.05,
    taunts: ["Interesting choice", "Bold move", "🔥"]
  },
  im: {
    name: "Alexander",
    title: "International Master",
    description: "Very competent, defends well",
    depth: 4,
    randomness: 0.02,
    taunts: ["Is that your best?", "Impressive", "💪"]
  },
  gm: {
    name: "Magnus",
    title: "Grandmaster",
    description: "Highest level, nearly optimal",
    depth: 4,
    randomness: 0.01,
    taunts: ["Weak", "Did you really just blunder?", "👑"]
  }
};

// AI Name to Level mapping
const AI_NAMES = {};
Object.keys(AI_LEVELS).forEach(level => {
  AI_NAMES[AI_LEVELS[level].name.toLowerCase()] = level;
});

// Piece values for evaluation
const PIECE_VALUES = {
  'p': 100, 'n': 320, 'b': 330, 'r': 500, 'q': 900, 'k': 20000
};

// Position evaluation tables
const PAWN_TABLE = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5,  5, 10, 25, 25, 10,  5,  5],
  [0,  0,  0, 20, 20,  0,  0,  0],
  [5, -5,-10,  0,  0,-10, -5,  5],
  [5, 10, 10,-20,-20, 10, 10,  5],
  [0,  0,  0,  0,  0,  0,  0,  0]
];

const KNIGHT_TABLE = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-30,  0, 10, 15, 15, 10,  0,-30],
  [-30,  5, 15, 20, 20, 15,  5,-30],
  [-30,  0, 15, 20, 20, 15,  0,-30],
  [-30,  5, 10, 15, 15, 10,  5,-30],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50]
];

// Initialize game data
const startBoard = ({ aiLevel, userId, playerName }) => {
  const chess = new Chess();
  const aiConfig = AI_LEVELS[aiLevel];

  // Randomize player color
  const playerColor = Math.random() < 0.5 ? 'white' : 'black';

  return {
    chess,
    userId,
    playerName: playerName || 'Player',
    aiLevel,
    aiName: aiConfig.name,
    aiTitle: aiConfig.title,
    aiDescription: aiConfig.description,
    gameOn: true,
    gameOver: false,
    playerColor,
    lastMove: null,
    moveHistory: [],
    gameResult: null,
    startTime: Date.now(),
    lastMessageID: null // Store last message ID for unsending
  };
};

// Enhanced move parsing with better validation
const parseMove = (moveStr) => {
  if (!moveStr || typeof moveStr !== 'string') return null;

  // Clean the input - remove extra spaces and convert to lowercase
  const cleanMove = moveStr.trim().toLowerCase().replace(/\s+/g, ' ');

  let from, to;

  // Handle different move formats
  if (cleanMove.includes(' ')) {
    // Format: "e2 e4" or "e2  e4"
    const parts = cleanMove.split(' ').filter(part => part.length > 0);
    if (parts.length >= 2) {
      from = parts[0];
      to = parts[1];
    }
  } else if (cleanMove.includes('-')) {
    // Format: "e2-e4"
    const parts = cleanMove.split('-');
    if (parts.length >= 2) {
      from = parts[0];
      to = parts[1];
    }
  } else if (cleanMove.length === 4) {
    // Format: "e2e4"
    from = cleanMove.substring(0, 2);
    to = cleanMove.substring(2, 4);
  } else if (cleanMove.length === 5 && cleanMove[2] === ' ') {
    // Format: "e2 e4" with single space
    from = cleanMove.substring(0, 2);
    to = cleanMove.substring(3, 5);
  }

  // Validate square format
  const isValidSquare = (square) => {
    if (!square || square.length !== 2) return false;
    const file = square[0];
    const rank = square[1];
    return file >= 'a' && file <= 'h' && rank >= '1' && rank <= '8';
  };

  if (!isValidSquare(from) || !isValidSquare(to)) return null;

  return { from, to };
};

// Evaluate position
const evaluatePosition = (chess) => {
  if (chess.isCheckmate()) {
    return chess.turn() === 'w' ? -9999 : 9999;
  }

  if (chess.isDraw()) return 0;

  let score = 0;
  const board = chess.board();

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece) {
        const pieceValue = PIECE_VALUES[piece.type] || 0;
        let positionValue = 0;

        // Add position bonuses
        if (piece.type === 'p') {
          positionValue = piece.color === 'w' ? PAWN_TABLE[i][j] : PAWN_TABLE[7-i][j];
        } else if (piece.type === 'n') {
          positionValue = piece.color === 'w' ? KNIGHT_TABLE[i][j] : KNIGHT_TABLE[7-i][j];
        }

        const totalValue = pieceValue + positionValue;
        score += piece.color === 'w' ? totalValue : -totalValue;
      }
    }
  }

  return score;
};

// Minimax algorithm with alpha-beta pruning
const minimax = (chess, depth, alpha, beta, isMaximizing) => {
  if (depth === 0 || chess.isGameOver()) {
    return evaluatePosition(chess);
  }

  const moves = chess.moves();

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      chess.move(move);
      const eval = minimax(chess, depth - 1, alpha, beta, false);
      chess.undo();
      maxEval = Math.max(maxEval, eval);
      alpha = Math.max(alpha, eval);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      chess.move(move);
      const eval = minimax(chess, depth - 1, alpha, beta, true);
      chess.undo();
      minEval = Math.min(minEval, eval);
      beta = Math.min(beta, eval);
      if (beta <= alpha) break;
    }
    return minEval;
  }
};

// AI move selection based on level
const getAIMove = (data) => {
  const { chess, aiLevel } = data;
  const aiConfig = AI_LEVELS[aiLevel];
  const moves = chess.moves();

  if (moves.length === 0) return null;

  // For beginner and novice levels, use more randomness
  if (aiLevel === 'beginner' || aiLevel === 'novice') {
    if (Math.random() < aiConfig.randomness) {
      return moves[Math.floor(Math.random() * moves.length)];
    }
  }

  // For higher levels, use minimax with evaluation
  let bestMove = moves[0];
  let bestScore = -Infinity;

  for (const move of moves) {
    chess.move(move);
    let score;

    if (aiLevel === 'beginner' || aiLevel === 'novice') {
      // Simple evaluation for lower levels
      score = evaluatePosition(chess) + (Math.random() - 0.5) * 200;
    } else {
      // Use minimax for higher levels
      const aiColor = data.playerColor === 'white' ? 'black' : 'white';
      const isMaximizing = aiColor === 'white';
      score = minimax(chess, aiConfig.depth, -Infinity, Infinity, isMaximizing);
    }

    chess.undo();

    // Add randomness based on level
    if (Math.random() < aiConfig.randomness) {
      score += (Math.random() - 0.5) * 100;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
};

// Get AI taunt based on level
const getAITaunt = (aiLevel) => {
  const aiConfig = AI_LEVELS[aiLevel];
  if (Math.random() < 0.3) { // 30% chance to taunt
    return aiConfig.taunts[Math.floor(Math.random() * aiConfig.taunts.length)];
  }
  return null;
};

// Handle player move
const handleMove = (data, moveStr) => {
  const { chess, playerColor } = data;
  const parsedMove = parseMove(moveStr);

  if (!parsedMove) {
    return { success: false, message: "Invalid move format! Use format like 'e2 e4', 'e2-e4', or 'e2e4'" };
  }

  const { from, to } = parsedMove;

  // Check if it's player's turn
  const playerTurn = playerColor === 'white' ? 'w' : 'b';
  if (chess.turn() !== playerTurn) {
    return { success: false, message: "It's not your turn!" };
  }

  // Attempt the move
  try {
    const move = chess.move({ from, to, promotion: 'q' }); // Auto-promote to queen

    if (!move) {
      return { success: false, message: "Illegal move! Try again." };
    }

    data.lastMove = move;
    data.moveHistory.push(move.san);

    // Check for game over
    if (chess.isGameOver()) {
      data.gameOver = true;
      data.gameOn = false;

      if (chess.isCheckmate()) {
        data.gameResult = chess.turn() === (playerColor === 'white' ? 'b' : 'w') ? 'player_wins' : 'ai_wins';
      } else if (chess.isDraw()) {
        data.gameResult = 'draw';
      }

      return { success: true, message: getGameOverMessage(data.gameResult), gameOver: true };
    }

    return { success: true, message: "Move accepted! AI is thinking..." };

  } catch (error) {
    return { success: false, message: "Invalid move! Please try again." };
  }
};

// Process AI move
const processAIMove = (data) => {
  const { chess } = data;

  // AI move
  const aiMove = getAIMove(data);
  if (aiMove) {
    const aiMoveObj = chess.move(aiMove);
    data.lastMove = aiMoveObj;
    data.moveHistory.push(aiMoveObj.san);

    // Check for game over after AI move
    if (chess.isGameOver()) {
      data.gameOver = true;
      data.gameOn = false;

      if (chess.isCheckmate()) {
        const playerTurn = data.playerColor === 'white' ? 'w' : 'b';
        data.gameResult = chess.turn() === playerTurn ? 'ai_wins' : 'player_wins';
      } else if (chess.isDraw()) {
        data.gameResult = 'draw';
      }

      const taunt = getAITaunt(data.aiLevel);
      const tauntText = taunt ? ` ${taunt}` : '';

      return { 
        success: true, 
        message: `${data.aiName} played ${aiMoveObj.san}${tauntText}\n${getGameOverMessage(data.gameResult)}`, 
        gameOver: true 
      };
    }

    const checkStatus = chess.inCheck() ? ' - Check!' : '';
    const taunt = getAITaunt(data.aiLevel);
    const tauntText = taunt ? ` ${taunt}` : '';

    return { 
      success: true, 
      message: `${data.aiName} played ${aiMoveObj.san}${checkStatus}${tauntText}` 
    };
  }

  return { success: false, message: "AI could not make a move!" };
};

// Get game over message
const getGameOverMessage = (result) => {
  switch (result) {
    case 'player_wins': return '🎉 You win!';
    case 'ai_wins': return '😔 AI wins!';
    case 'draw': return '🤝 Draw!';
    default: return 'Game over!';
  }
};

// Parse AI level from input
const parseAILevel = (input) => {
  if (!input) return 'beginner';

  const normalized = input.toLowerCase().trim();

  // Check if it's a level name
  if (AI_LEVELS[normalized]) return normalized;

  // Check if it's an AI name
  if (AI_NAMES[normalized]) return AI_NAMES[normalized];

  // Check for partial matches
  for (const level in AI_LEVELS) {
    if (level.startsWith(normalized) || AI_LEVELS[level].name.toLowerCase().startsWith(normalized)) {
      return level;
    }
  }

  return 'beginner'; // Default
};

// Render the chess board
const displayBoard = async (data) => {
  const canvas = createCanvas(800, 950); // Extra height for info
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = '#2C3E50';
  ctx.fillRect(0, 0, 800, 950);

  // Player info header
  ctx.fillStyle = '#34495E';
  ctx.fillRect(50, 20, 700, 60);

  // Draw player names
  ctx.fillStyle = '#ECF0F1';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'left';

  const playerName = data.playerName;
  const aiName = `${data.aiName} (${data.aiTitle})`;

  if (data.playerColor === 'white') {
    ctx.fillText(`${playerName} (You) - White`, 70, 45);
    ctx.textAlign = 'right';
    ctx.fillText(`${aiName} - Black`, 730, 45);
  } else {
    ctx.fillText(`${playerName} (You) - Black`, 70, 45);
    ctx.textAlign = 'right';
    ctx.fillText(`${aiName} - White`, 730, 45);
  }

  // Turn indicator
  ctx.fillStyle = '#E74C3C';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  const currentTurn = data.chess.turn();
  const isPlayerTurn = (data.playerColor === 'white' && currentTurn === 'w') || 
                       (data.playerColor === 'black' && currentTurn === 'b');
  const turnText = isPlayerTurn ? 'Your Turn' : 'AI Turn';
  ctx.fillText(turnText, 400, 65);

  // Board background
  ctx.fillStyle = '#34495E';
  ctx.fillRect(50, 90, 700, 700);

  // Draw board squares
  const squareSize = 80;
  const boardOffset = 60;
  const boardTop = 100;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const x = boardOffset + col * squareSize;
      const y = boardTop + row * squareSize;

      // Alternate colors
      ctx.fillStyle = (row + col) % 2 === 0 ? '#F0D9B5' : '#B58863';
      ctx.fillRect(x, y, squareSize, squareSize);

      // Highlight last move
      if (data.lastMove) {
        const fromFile = data.lastMove.from.charCodeAt(0) - 97;
        const fromRank = 8 - parseInt(data.lastMove.from[1]);
        const toFile = data.lastMove.to.charCodeAt(0) - 97;
        const toRank = 8 - parseInt(data.lastMove.to[1]);

        if ((row === fromRank && col === fromFile) || (row === toRank && col === toFile)) {
          ctx.fillStyle = 'rgba(255, 255, 0, 0.6)';
          ctx.fillRect(x, y, squareSize, squareSize);
        }
      }
    }
  }

  // Draw coordinates
  ctx.fillStyle = '#ECF0F1';
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';

  // Files (a-h)
  for (let col = 0; col < 8; col++) {
    const letter = String.fromCharCode(97 + col);
    ctx.fillText(letter, boardOffset + col * squareSize + squareSize/2, boardTop + 8 * squareSize + 20);
  }

  // Ranks (1-8)
  ctx.textAlign = 'left';
  for (let row = 0; row < 8; row++) {
    const number = 8 - row;
    ctx.fillText(number.toString(), boardOffset - 20, boardTop + row * squareSize + squareSize/2 + 5);
  }

  // Draw pieces with better white piece visibility
  ctx.font = '50px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const pieceSymbols = {
    'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
    'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
  };

  const board = data.chess.board();
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece) {
        const x = boardOffset + col * squareSize + squareSize / 2;
        const y = boardTop + row * squareSize + squareSize / 2;

        const symbol = pieceSymbols[piece.color === 'w' ? piece.type.toUpperCase() : piece.type.toLowerCase()];

        if (piece.color === 'w') {
          // White pieces - black outline for visibility
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.strokeText(symbol, x, y);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(symbol, x, y);
        } else {
          // Black pieces - white outline for visibility
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1;
          ctx.strokeText(symbol, x, y);
          ctx.fillStyle = '#000000';
          ctx.fillText(symbol, x, y);
        }
      }
    }
  }

  // Game info panel
  ctx.fillStyle = '#34495E';
  ctx.fillRect(50, 820, 700, 120);

  // AI info
  ctx.fillStyle = '#ECF0F1';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`AI: ${data.aiName} (${data.aiTitle})`, 70, 850);

  ctx.font = '14px Arial';
  ctx.fillStyle = '#BDC3C7';
  ctx.fillText(data.aiDescription, 70, 875);

  // Game status
  const status = data.chess.inCheck() ? 'Check!' : 
                 data.gameOver ? getGameOverMessage(data.gameResult) : 
                 isPlayerTurn ? 'Your turn' : 'AI thinking...';

  ctx.font = 'bold 16px Arial';
  ctx.fillStyle = data.chess.inCheck() ? '#E74C3C' : '#2ECC71';
  ctx.textAlign = 'right';
  ctx.fillText(status, 730, 850);

  // Move count
  ctx.font = '12px Arial';
  ctx.fillStyle = '#95A5A6';
  ctx.fillText(`Move ${Math.floor(data.moveHistory.length / 2) + 1}`, 730, 870);

  // Last move
  if (data.lastMove) {
    ctx.fillText(`Last: ${data.lastMove.san}`, 730, 890);
  }

  const path = __dirname + "/cache/chess.png";
  fs.writeFileSync(path, canvas.toBuffer("image/png"));
  return [fs.createReadStream(path)];
};

// Unsend previous message
const unsendPreviousBoard = async (message, data) => {
  if (data.lastMessageID) {
    try {
      await message.unsend(data.lastMessageID);
    } catch (error) {
      // Ignore unsend errors
    }
  }
};

// Reply handler
module.exports.onReply = async ({ message, event, api, Reply }) => {
  const { body, threadID, messageID, senderID } = event;
  const { author } = Reply;

  if (author !== senderID) return;

  if (!global.game) global.game = {};
  if (!global.game.chess) global.game.chess = new Map();

  const gameKey = `${threadID}_${senderID}`;
  const data = global.game.chess.get(gameKey);

  if (!data || !data.gameOn) {
    return api.sendMessage("No active game found! Use 'chess' to start a new game.", threadID, messageID);
  }

  const result = handleMove(data, body.trim());

  if (!result.success) {
    return api.sendMessage(result.message, threadID, messageID);
  }

  // Unsend previous board
  await unsendPreviousBoard(message, data);

  // Send board after player move
  api.sendMessage({
    body: result.message,
    attachment: await displayBoard(data)
  }, threadID, async (error, info) => {
    if (error) return;

    data.lastMessageID = info.messageID;

    if (result.gameOver) {
      global.game.chess.delete(gameKey);
      return;
    }

    // Process AI move after a short delay
    setTimeout(async () => {
      const aiResult = processAIMove(data);

      if (aiResult.success) {
        // Unsend previous board
        await unsendPreviousBoard(message, data);

        // Send updated board with AI move
        api.sendMessage({
          body: aiResult.message,
          attachment: await displayBoard(data)
        }, threadID, (error, info) => {
          if (!error) {
            data.lastMessageID = info.messageID;

            if (aiResult.gameOver) {
              global.game.chess.delete(gameKey);
            } else {
              global.GoatBot.onReply.set(info.messageID, {
                commandName: "chess",
                author: senderID,
                messageID: info.messageID
              });
            }
          }
        });
      }
    }, 1000); // 1 second delay for AI move
  });
};

// Start handler
module.exports.onStart = async ({ message, event, api, args, usersData }) => {
  const { threadID, messageID, senderID } = event;

  if (!global.game) global.game = {};
  if (!global.game.chess) global.game.chess = new Map();

  const gameKey = `${threadID}_${senderID}`;
  const existingGame = global.game.chess.get(gameKey);

  // If user has an active game, continue it
  if (existingGame && existingGame.gameOn) {
    return api.sendMessage({
      body: `You already have an active game against ${existingGame.aiName}!\nEnter your move (e.g., 'e2 e4'):`,
      attachment: await displayBoard(existingGame)
    }, threadID, (error, info) => {
      if (!error) {
        existingGame.lastMessageID = info.messageID;
        global.GoatBot.onReply.set(info.messageID, {
          commandName: "chess",
          author: senderID,
          messageID: info.messageID
        });
      }
    }, messageID);
  }

  // Parse AI level from arguments
  const aiLevel = parseAILevel(args.join(' '));
  const aiConfig = AI_LEVELS[aiLevel];

  // Get player name
  let playerName = 'Player';
  try {
    const userData = await usersData.get(senderID);
    playerName = userData.name || 'Player';
  } catch (error) {
    // Use default name
  }

  // Create new game
  const newData = startBoard({ aiLevel, userId: senderID, playerName });
  global.game.chess.set(gameKey, newData);

  const colorText = newData.playerColor === 'white' ? 'White (you go first)' : 'Black (AI goes first)';

  // If player is black, AI goes first
  if (newData.playerColor === 'black') {
    const aiResult = processAIMove(newData);

    return api.sendMessage({
      body: `New chess game started!\n🎯 Opponent: ${aiConfig.name} (${aiConfig.title})\n📝 ${aiConfig.description}\n🎨 You are playing as ${colorText}\n\n${aiResult.message}\n\nEnter your move (e.g., 'e2 e4'):`,
      attachment: await displayBoard(newData)
    }, threadID, (error, info) => {
      if (!error) {
        newData.lastMessageID = info.messageID;
        global.GoatBot.onReply.set(info.messageID, {
          commandName: "chess",
          author: senderID,
          messageID: info.messageID
        });
      }
    }, messageID);
  } else {
    // Player is white, they go first
    return api.sendMessage({
      body: `New chess game started!\n🎯 Opponent: ${aiConfig.name} (${aiConfig.title})\n📝 ${aiConfig.description}\n🎨 You are playing as ${colorText}\n\nEnter your move (e.g., 'e2 e4'):`,
      attachment: await displayBoard(newData)
    }, threadID, (error, info) => {
      if (!error) {
        newData.lastMessageID = info.messageID;
        global.GoatBot.onReply.set(info.messageID, {
          commandName: "chess",
          author: senderID,
          messageID: info.messageID
        });
      }
    }, messageID);
  }
};
