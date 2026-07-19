const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();

const allowedOrigins = (process.env.FRONTEND_URL || process.env.CORS_ORIGIN || '*')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: allowedOrigins.includes('*') ? '*' : allowedOrigins,
  methods: ['GET', 'POST']
};

app.use(cors(corsOptions));

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'rowcomplete-backend',
    socketPath: '/socket.io/'
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    connections: io.engine.clientsCount
  });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: corsOptions,
  transports: ['polling', 'websocket']
});

// Store rooms in memory
const rooms = {};

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function calculateScores(room) {
  // Ensure all players have an answers object
  room.players.forEach(p => {
    if (!room.round.answers[p.id]) room.round.answers[p.id] = {};
  });

  room.round.scores = {};
  room.round.readyPlayers = [];

  const allAnswersByColumn = {};

  for (const playerId in room.round.answers) {
    room.round.scores[playerId] = {};
    for (const [col, ans] of Object.entries(room.round.answers[playerId])) {
      const cleanAns = ans.trim().toLowerCase();
      if (!allAnswersByColumn[col]) allAnswersByColumn[col] = [];
      if (cleanAns) {
        allAnswersByColumn[col].push(cleanAns);
      }
    }
  }

  for (const playerId in room.round.answers) {
    for (const [col, ans] of Object.entries(room.round.answers[playerId])) {
      const cleanAns = ans.trim().toLowerCase();
      let points = 0;
      if (cleanAns) {
        const count = allAnswersByColumn[col].filter(a => a === cleanAns).length;
        if (count === 1) points = 10;
        else if (count > 1) points = 5;
      }
      room.round.scores[playerId][col] = {
        answer: ans.trim(),
        points: points
      };
    }
  }
}

const rateLimits = {};
function isRateLimited(socketId) {
  const now = Date.now();
  if (!rateLimits[socketId]) {
    rateLimits[socketId] = { count: 1, lastTime: now };
    return false;
  }
  
  if (now - rateLimits[socketId].lastTime > 1000) {
    rateLimits[socketId] = { count: 1, lastTime: now };
    return false;
  }
  
  rateLimits[socketId].count++;
  if (rateLimits[socketId].count > 20) { // Max 20 messages per second
    return true;
  }
  return false;
}

io.on('connection', (socket) => {
  socket.playerId = socket.handshake.auth?.playerId || socket.id;
  console.log('A user connected:', socket.id, 'with playerId:', socket.playerId);

  // Rate Limiting Middleware
  socket.use(([event, ...args], next) => {
    if (isRateLimited(socket.playerId)) {
      return next(new Error('Rate limit exceeded'));
    }
    next();
  });

  socket.on('createRoom', ({ playerName, isArabic, customColumns }, callback) => {
    // String Length Limits
    playerName = String(playerName).substring(0, 30);
    const safeColumns = (customColumns || []).map(col => String(col).substring(0, 30)).slice(0, 10);

    const standardColumns = isArabic
      ? ['اسم', 'حيوان', 'نبات', 'جماد', 'بلاد/عاصمة']
      : ['Name', 'Animal', 'Plant', 'Object', 'Country/Capital'];

    const roomId = generateRoomCode();
    
    // Initialize room state
    rooms[roomId] = {
      id: roomId,
      hostId: socket.playerId,
      players: [
        { id: socket.playerId, name: playerName, isHost: true, totalScore: 0 }
      ],
      settings: {
        timeLimit: 60,
        standardColumns,
        customColumns: safeColumns
      },
      status: 'lobby', // lobby, playing, reviewing, finished
      usedLetters: []
    };

    socket.join(roomId);
    callback({ success: true, roomId, roomState: rooms[roomId] });
  });

  socket.on('joinRoom', ({ roomId, playerName }, callback) => {
    const room = rooms[roomId];
    if (!room) {
      return callback({ success: false, message: 'Room not found' });
    }
    
    playerName = String(playerName).substring(0, 30);

    if (room.status !== 'lobby') {
      return callback({ success: false, message: 'Game already started' });
    }

    if (room.players.length >= 10) {
      return callback({ success: false, message: 'Room is full (max 10 players)' });
    }

    const newPlayer = { id: socket.playerId, name: playerName, isHost: false, totalScore: 0 };
    room.players.push(newPlayer);
    socket.join(roomId);

    // Notify others in the room
    io.to(roomId).emit('roomUpdated', room);
    
    callback({ success: true, roomState: room });
  });

  socket.on('updateSettings', ({ roomId, settings }) => {
    const room = rooms[roomId];
    if (room && room.hostId === socket.playerId) {
      room.settings = { ...room.settings, ...settings };
      io.to(roomId).emit('roomUpdated', room);
    }
  });

  socket.on('addColumn', ({ roomId, columnName }) => {
    const room = rooms[roomId];
    if (room && room.status === 'lobby' && room.hostId === socket.playerId) {
      const safeColumn = String(columnName).substring(0, 30);
      room.settings.customColumns.push(safeColumn);
      io.to(roomId).emit('roomUpdated', room);
    }
  });

  socket.on('startGame', ({ roomId }) => {
    const room = rooms[roomId];
    if (room && room.status === 'lobby' && room.hostId === socket.playerId) {
      room.status = 'playing';
      room.currentTurnIndex = 0; // The first player in the array
      room.round = {
        letter: null,
        endTime: null,
        answers: {}
      };
      io.to(roomId).emit('roomUpdated', room);
    }
  });

  socket.on('selectLetter', ({ roomId, letter }) => {
    const room = rooms[roomId];
    if (room && room.status === 'playing') {
      const currentPlayer = room.players[room.currentTurnIndex];
      if (currentPlayer.id === socket.playerId) {
        room.round.letter = letter;
        room.usedLetters.push(letter);
        
        const newEndTime = Date.now() + (room.settings.timeLimit * 1000);
        room.round.endTime = newEndTime;
        
        io.to(roomId).emit('roomUpdated', room);
        
        // Auto end round when time is up
        setTimeout(() => {
          const currentRoom = rooms[roomId];
          // Only end the round if this timeout belongs to the current round!
          if (currentRoom && currentRoom.status === 'playing' && currentRoom.round.endTime === newEndTime) {
            currentRoom.status = 'reviewing';
            calculateScores(currentRoom);
            io.to(roomId).emit('roomUpdated', currentRoom);
          }
        }, room.settings.timeLimit * 1000);
      }
    }
  });

  socket.on('submitAnswers', ({ roomId, answers }) => {
    const room = rooms[roomId];
    if (room && room.status === 'playing') {
      // String limit for answers
      const safeAnswers = {};
      for (const col in answers) {
        safeAnswers[col] = String(answers[col] || '').substring(0, 50);
      }

      room.round.answers[socket.playerId] = safeAnswers;
      
      // If all players have submitted, move to reviewing early
      if (Object.keys(room.round.answers).length === room.players.length) {
        room.status = 'reviewing';
        calculateScores(room);
        io.to(roomId).emit('roomUpdated', room);
      }
    }
  });

  socket.on('editScore', ({ roomId, targetPlayerId, column, points }) => {
    const room = rooms[roomId];
    if (room && room.status === 'reviewing' && room.hostId === socket.playerId) {
      if (room.round.scores[targetPlayerId] && room.round.scores[targetPlayerId][column]) {
        room.round.scores[targetPlayerId][column].points = points;
        io.to(roomId).emit('roomUpdated', room);
      }
    }
  });

  socket.on('playerReady', ({ roomId }) => {
    const room = rooms[roomId];
    if (room && room.status === 'reviewing') {
      if (!room.round.readyPlayers.includes(socket.playerId)) {
        room.round.readyPlayers.push(socket.playerId);
        
        // If all players are ready, move to next round
        if (room.round.readyPlayers.length === room.players.length) {
          // Accumulate scores for the global scoreboard
          room.players.forEach(p => {
            if (room.round.scores[p.id]) {
              const roundTotal = Object.values(room.round.scores[p.id]).reduce((sum, item) => sum + item.points, 0);
              p.totalScore += roundTotal;
            }
          });
          
          // Move to next player's turn
          room.currentTurnIndex = (room.currentTurnIndex + 1) % room.players.length;
          room.status = 'playing';
          room.round = {
            letter: null,
            endTime: null,
            answers: {}
          };
        }
        io.to(roomId).emit('roomUpdated', room);
      }
    }
  });

  socket.on('endGame', ({ roomId }) => {
    const room = rooms[roomId];
    if (room && room.hostId === socket.playerId) {
      // Tally the last round's scores if we are in reviewing phase
      if (room.status === 'reviewing') {
        room.players.forEach(p => {
          if (room.round.scores[p.id]) {
            const roundTotal = Object.values(room.round.scores[p.id]).reduce((sum, item) => sum + item.points, 0);
            p.totalScore += roundTotal;
          }
        });
      }
      room.status = 'finished';
      io.to(roomId).emit('roomUpdated', room);
    }
  });

  socket.on('playAgain', ({ roomId }) => {
    const room = rooms[roomId];
    if (room && room.hostId === socket.playerId && room.status === 'finished') {
      room.status = 'lobby';
      room.usedLetters = [];
      room.currentTurnIndex = 0;
      room.round = {
        letter: null,
        endTime: null,
        answers: {},
        scores: {},
        readyPlayers: []
      };
      // Reset player total scores
      room.players.forEach(p => p.totalScore = 0);
      io.to(roomId).emit('roomUpdated', room);
    }
  });

  socket.on('rejoinRoom', ({ roomId }) => {
    const room = rooms[roomId];
    if (room) {
      const playerExists = room.players.some(p => p.id === socket.playerId);
      if (playerExists) {
        socket.join(roomId);
        socket.emit('roomUpdated', room);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id, 'playerId:', socket.playerId);
    const playerId = socket.playerId;
    
    // Delay removal by 5 seconds to allow for page refresh / reconnection
    setTimeout(() => {
      let isReconnected = false;
      for (let [id, s] of io.sockets.sockets) {
        if (s.playerId === playerId) {
          isReconnected = true;
          break;
        }
      }
      
      if (isReconnected) return;

      // Remove user from any room they were in
      for (const roomId in rooms) {
        const room = rooms[roomId];
        const playerIndex = room.players.findIndex(p => p.id === playerId);
        
        if (playerIndex !== -1) {
          const isHost = room.players[playerIndex].isHost;
          room.players.splice(playerIndex, 1);
          
          if (room.players.length === 0) {
            delete rooms[roomId];
          } else {
            if (isHost) {
              room.players[0].isHost = true;
              room.hostId = room.players[0].id;
            }
            io.to(roomId).emit('roomUpdated', room);
          }
        }
      }
    }, 5000);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});
