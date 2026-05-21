const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const https = require('https');

function getMediaAttachment(url) {
  return new Promise((resolve) => {
    if (!url || typeof url !== 'string' || !url.startsWith('https://api.telegram.org/file/bot')) {
      resolve(url);
      return;
    }
    
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        console.error(`Media download failed: ${res.statusCode}`);
        resolve(url);
        return;
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', (err) => {
        console.error("Media download stream error:", err);
        resolve(url);
      });
    }).on('error', (err) => {
      console.error("Media download request error:", err);
      resolve(url);
    });
  });
}

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// Call sessions memory storage
const activeCallSessions = new Map();

// API endpoint to check call status
app.get('/api/call-status/:chatId', (req, res) => {
  const chatId = req.params.chatId;
  const status = activeCallSessions.get(chatId) || 'inactive';
  res.json({ status });
});

// JSON BAZA YUKLASH FUNKSIYASI
const dbPath = path.join(__dirname, 'db.json');
function loadDb() {
  try {
    if (!fs.existsSync(dbPath)) {
      const initialDb = {
        contacts: {},
        savedGifs: [
          "https://media.giphy.com/media/l0Exd3XQ1FpG8g7lK/giphy.gif",
          "https://media.giphy.com/media/3o7abKhOpu0NXS3HWM/giphy.gif",
          "https://media.giphy.com/media/d31w24psGYeekCZy/giphy.gif"
        ],
        savedStickers: [
          "https://api.telegram.org/file/bot8862096129:AAElvj7naYtnhehF66GgFBua_12tngCbd34/stickers/file_4.webp",
          "https://api.telegram.org/file/bot8862096129:AAElvj7naYtnhehF66GgFBua_12tngCbd34/stickers/file_7.webp"
        ]
      };
      fs.writeFileSync(dbPath, JSON.stringify(initialDb, null, 2));
    }
    const data = fs.readFileSync(dbPath, 'utf8');
    const parsed = JSON.parse(data);
    if (!parsed.savedGifs) {
      parsed.savedGifs = [
        "https://media.giphy.com/media/l0Exd3XQ1FpG8g7lK/giphy.gif",
        "https://media.giphy.com/media/3o7abKhOpu0NXS3HWM/giphy.gif",
        "https://media.giphy.com/media/d31w24psGYeekCZy/giphy.gif"
      ];
      fs.writeFileSync(dbPath, JSON.stringify(parsed, null, 2));
    }
    if (!parsed.savedStickers) {
      parsed.savedStickers = [
        "https://api.telegram.org/file/bot8862096129:AAElvj7naYtnhehF66GgFBua_12tngCbd34/stickers/file_4.webp",
        "https://api.telegram.org/file/bot8862096129:AAElvj7naYtnhehF66GgFBua_12tngCbd34/stickers/file_7.webp"
      ];
      fs.writeFileSync(dbPath, JSON.stringify(parsed, null, 2));
    }
    return parsed;
  } catch (err) {
    console.error("Db yuklashda xato:", err);
    return { contacts: {}, savedGifs: [] };
  }
}

function saveDb(db) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error("Db saqlashda xato:", err);
  }
}

// REACT STATIK FAYLLARINI EXPRESS ORQALI SERVE QILISH
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const TELEGRAM_TOKEN = '8862096129:AAElvj7naYtnhehF66GgFBua_12tngCbd34';
const bot = new TelegramBot(TELEGRAM_TOKEN, { 
  polling: true,
  request: { agentOptions: { family: 4 } }
});

io.on('connection', (socket) => {
  console.log('Frontend ulandi:', socket.id);

  // Tarixni uzatish
  const db = loadDb();
  socket.emit('CHAT_HISTORY', Object.values(db.contacts));
  socket.emit('SAVED_GIFS', db.savedGifs || []);
  socket.emit('SAVED_STICKERS', db.savedStickers || []);

  socket.on('SEND_REPLY', (data) => {
    const { chatId, text } = data;
    bot.sendMessage(chatId, text)
      .then((sentMsg) => {
        const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const db = loadDb();
        if (db.contacts[chatId]) {
          const newMsg = {
            id: sentMsg.message_id,
            text: text,
            time: time,
            isMe: true,
            type: 'text'
          };
          db.contacts[chatId].messages.push(newMsg);
          db.contacts[chatId].lastMessage = text;
          db.contacts[chatId].time = time;
          saveDb(db);
          io.emit('CHAT_HISTORY', Object.values(db.contacts));
        }
      })
      .catch(err => console.error(err));
  });

  socket.on('MARK_READ', (data) => {
    const { chatId } = data;
    const db = loadDb();
    if (db.contacts[chatId]) {
      db.contacts[chatId].unreadCount = 0;
      saveDb(db);
      io.emit('CHAT_HISTORY', Object.values(db.contacts));
    }
  });

  // --- WEBRTC SIGNALING ---
  socket.on('START_CALL', (data) => {
    const { chatId, callLink } = data;
    
    // Set call session active
    activeCallSessions.set(chatId, 'active');
    
    // tunnel.txt dan global manzilni o'qiymiz
    let finalCallLink = callLink;
    try {
      const tunnelPath = path.join(__dirname, 'tunnel.txt');
      if (fs.existsSync(tunnelPath)) {
        const tunnelUrl = fs.readFileSync(tunnelPath, 'utf8').trim();
        if (tunnelUrl) {
          finalCallLink = `${tunnelUrl}/call/${chatId}`;
        }
      }
    } catch (err) {
      console.error("Tunnel faylini o'qishda xato:", err);
    }
    
    bot.sendMessage(chatId, `📹 Menejer sizni video suhbatga taklif qilmoqda!\n\nQo'shilish uchun quyidagi tugmani bosing:\n\n${finalCallLink}`, {
        reply_markup: {
          inline_keyboard: [[
            {
              text: '📹 Video suhbatga qo\'shilish',
              url: finalCallLink
            }
          ]]
        }
      })
      .catch(err => console.error(err));
    
    socket.join(`call-${chatId}`);
  });

  socket.on('JOIN_ROOM', (data) => {
    socket.join(`call-${data.chatId}`);
    socket.to(`call-${data.chatId}`).emit('CLIENT_JOINED');
  });

  socket.on('WEBRTC_OFFER', (data) => {
    socket.to(`call-${data.chatId}`).emit('WEBRTC_OFFER', data.offer);
  });

  socket.on('WEBRTC_ANSWER', (data) => {
    socket.to(`call-${data.chatId}`).emit('WEBRTC_ANSWER', data.answer);
  });

  socket.on('WEBRTC_ICE_CANDIDATE', (data) => {
    socket.to(`call-${data.chatId}`).emit('WEBRTC_ICE_CANDIDATE', data.candidate);
  });

  socket.on('END_CALL', (data) => {
    const { chatId } = data;
    activeCallSessions.set(chatId, 'ended');
    socket.to(`call-${chatId}`).emit('CALL_ENDED');
  });

  socket.on('SEND_MEDIA', async (data) => {
    const { chatId, base64, filename } = data;
    try {
      const base64Content = base64.split(';base64,').pop();
      const buffer = Buffer.from(base64Content, 'base64');
      
      // Telegramga rasmni yuborish
      const sentMsg = await bot.sendPhoto(chatId, buffer);
      
      const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      const largestPhoto = sentMsg.photo[sentMsg.photo.length - 1];
      const mediaUrl = await bot.getFileLink(largestPhoto.file_id);
      
      const db = loadDb();
      if (db.contacts[chatId]) {
        const newMsg = {
          id: sentMsg.message_id,
          text: '[Rasm]',
          time: time,
          isMe: true,
          type: 'photo',
          mediaUrl: mediaUrl
        };
        db.contacts[chatId].messages.push(newMsg);
        db.contacts[chatId].lastMessage = '[Rasm]';
        db.contacts[chatId].time = time;
        saveDb(db);
        
        io.emit('CHAT_HISTORY', Object.values(db.contacts));
      }
    } catch (err) {
      console.error("Medyani telegramga yuborishda xato:", err);
    }
  });

  socket.on('SAVE_GIF', (data) => {
    const { gifUrl } = data;
    const db = loadDb();
    db.savedGifs = db.savedGifs || [];
    if (!db.savedGifs.includes(gifUrl)) {
      db.savedGifs.push(gifUrl);
      saveDb(db);
    }
    io.emit('SAVED_GIFS', db.savedGifs);
  });

  socket.on('SEND_SAVED_GIF', async (data) => {
    const { chatId, gifUrl } = data;
    try {
      const attachment = await getMediaAttachment(gifUrl);
      let fileOptions = {};
      if (Buffer.isBuffer(attachment)) {
        fileOptions = {
          filename: 'animation.mp4',
          contentType: 'video/mp4'
        };
      }
      const sentMsg = await bot.sendAnimation(chatId, attachment, {}, fileOptions);
      const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      
      let finalGifUrl = gifUrl;
      try {
        if (sentMsg.animation) {
          finalGifUrl = await bot.getFileLink(sentMsg.animation.file_id);
        }
      } catch (e) {
        console.error("Havolani olishda xato:", e);
      }

      const db = loadDb();
      if (db.contacts[chatId]) {
        const newMsg = {
          id: sentMsg.message_id,
          text: '[GIF]',
          time: time,
          isMe: true,
          type: 'gif',
          mediaUrl: finalGifUrl
        };
        db.contacts[chatId].messages.push(newMsg);
        db.contacts[chatId].lastMessage = '[GIF]';
        db.contacts[chatId].time = time;
        saveDb(db);
        
        io.emit('CHAT_HISTORY', Object.values(db.contacts));
      }
    } catch (err) {
      console.error("GIF yuborishda xato:", err);
    }
  });

  socket.on('DELETE_MESSAGE', (data) => {
    const { chatId, messageId } = data;
    const db = loadDb();
    if (db.contacts[chatId]) {
      db.contacts[chatId].messages = db.contacts[chatId].messages.filter(m => m.id !== messageId);
      if (db.contacts[chatId].messages.length > 0) {
        db.contacts[chatId].lastMessage = db.contacts[chatId].messages[db.contacts[chatId].messages.length - 1].text;
      } else {
        db.contacts[chatId].lastMessage = '';
      }
      saveDb(db);
      io.emit('CHAT_HISTORY', Object.values(db.contacts));
    }
  });

  socket.on('CLEAR_HISTORY', (data) => {
    const { chatId } = data;
    const db = loadDb();
    if (db.contacts[chatId]) {
      db.contacts[chatId].messages = [];
      db.contacts[chatId].lastMessage = '';
      db.contacts[chatId].unreadCount = 0;
      saveDb(db);
      io.emit('CHAT_HISTORY', Object.values(db.contacts));
    }
  });

  socket.on('DELETE_SAVED_GIF', (data) => {
    const { gifUrl } = data;
    const db = loadDb();
    db.savedGifs = db.savedGifs || [];
    db.savedGifs = db.savedGifs.filter(url => url !== gifUrl);
    saveDb(db);
    io.emit('SAVED_GIFS', db.savedGifs);
  });

  socket.on('SAVE_STICKER', (data) => {
    const { stickerUrl, fileId } = data;
    const db = loadDb();
    db.savedStickers = db.savedStickers || [];
    const exists = db.savedStickers.some(item => {
      if (typeof item === 'string') return item === stickerUrl;
      return item.url === stickerUrl;
    });
    if (!exists) {
      db.savedStickers.push({
        url: stickerUrl,
        fileId: fileId || null
      });
      saveDb(db);
    }
    io.emit('SAVED_STICKERS', db.savedStickers);
  });

  socket.on('DELETE_SAVED_STICKER', (data) => {
    const { stickerUrl } = data;
    const db = loadDb();
    db.savedStickers = db.savedStickers || [];
    db.savedStickers = db.savedStickers.filter(item => {
      if (typeof item === 'string') return item !== stickerUrl;
      return item.url !== stickerUrl;
    });
    saveDb(db);
    io.emit('SAVED_STICKERS', db.savedStickers);
  });

  socket.on('SEND_SAVED_STICKER', async (data) => {
    const { chatId, stickerUrl, fileId } = data;
    try {
      let attachment;
      let fileOptions = {};
      
      if (fileId) {
        attachment = fileId;
      } else {
        attachment = await getMediaAttachment(stickerUrl);
        if (Buffer.isBuffer(attachment)) {
          const isWebm = stickerUrl && stickerUrl.endsWith('.webm');
          fileOptions = {
            filename: isWebm ? 'sticker.webm' : 'sticker.webp',
            contentType: isWebm ? 'video/webm' : 'image/webp'
          };
        }
      }
      const sentMsg = await bot.sendSticker(chatId, attachment, {}, fileOptions);
      const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      
      let finalStickerUrl = stickerUrl;
      try {
        if (sentMsg.sticker) {
          finalStickerUrl = await bot.getFileLink(sentMsg.sticker.file_id);
        }
      } catch (e) { 
        console.error("Havolani olishda xato:", e);
      }

      const db = loadDb();
      if (db.contacts[chatId]) {
        const newMsg = {
          id: sentMsg.message_id,
          text: '[Stiker]',
          time: time,
          isMe: true,
          type: 'sticker',
          mediaUrl: finalStickerUrl,
          fileId: sentMsg.sticker ? sentMsg.sticker.file_id : null
        };
        db.contacts[chatId].messages.push(newMsg);
        db.contacts[chatId].lastMessage = '[Stiker]';
        db.contacts[chatId].time = time;
        saveDb(db);
        
        io.emit('CHAT_HISTORY', Object.values(db.contacts));
      }
    } catch (err) {
      console.error("Stiker yuborishda xato:", err);
    }
  });
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id.toString();
  const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  
  let messageType = 'text';
  let mediaUrl = null;
  let text = msg.text || '';

  if (msg.photo && msg.photo.length > 0) {
    messageType = 'photo';
    const largestPhoto = msg.photo[msg.photo.length - 1];
    try {
      mediaUrl = await bot.getFileLink(largestPhoto.file_id);
      text = msg.caption || '[Rasm]';
    } catch (err) {
      console.error("Rasm havolasini olishda xato:", err);
      text = '[Rasm]';
    }
  } else if (msg.animation) {
    messageType = 'gif';
    try {
      mediaUrl = await bot.getFileLink(msg.animation.file_id);
      text = msg.caption || '[GIF]';
    } catch (err) {
      console.error("GIF havolasini olishda xato:", err);
      text = '[GIF]';
    }
  } else if (msg.sticker) {
    if (msg.sticker.is_video) {
      messageType = 'video_sticker';
      try {
        mediaUrl = await bot.getFileLink(msg.sticker.file_id);
        text = '[Stiker]';
      } catch (err) {
        console.error("Video stiker havolasini olishda xato:", err);
        text = '[Stiker]';
      }
    } else if (msg.sticker.is_animated && msg.sticker.thumbnail) {
      messageType = 'sticker';
      try {
        mediaUrl = await bot.getFileLink(msg.sticker.thumbnail.file_id);
        text = '[Stiker]';
      } catch (err) {
        console.error("Animated stiker thumbnail havolasini olishda xato:", err);
        text = '[Stiker]';
      }
    } else {
      messageType = 'sticker';
      try {
        mediaUrl = await bot.getFileLink(msg.sticker.file_id);
        text = '[Stiker]';
      } catch (err) {
        console.error("Stiker havolasini olishda xato:", err);
        text = '[Stiker]';
      }
    }
  } else if (msg.document && msg.document.mime_type && msg.document.mime_type.startsWith('video/')) {
    messageType = 'gif';
    try {
      mediaUrl = await bot.getFileLink(msg.document.file_id);
      text = msg.caption || '[GIF]';
    } catch (err) {
      console.error("Video-hujjat havolasini olishda xato:", err);
      text = '[GIF]';
    }
  }

  const db = loadDb();
  
  if (!db.contacts[chatId]) {
    db.contacts[chatId] = {
      chatId: chatId,
      name: msg.chat.first_name || 'Telegram Mijoz',
      lastMessage: text,
      time: time,
      source: 'telegram',
      unreadCount: 0,
      messages: []
    };
  }
  
  const newMsg = {
    id: msg.message_id,
    text: text,
    time: time,
    isMe: false,
    type: messageType,
    mediaUrl: mediaUrl,
    fileId: msg.sticker ? msg.sticker.file_id : null
  };
  
  db.contacts[chatId].messages.push(newMsg);
  db.contacts[chatId].lastMessage = text;
  db.contacts[chatId].time = time;
  db.contacts[chatId].unreadCount += 1;
  
  saveDb(db);

  const newLead = {
    id: `task-tg-${Date.now()}`,
    title: msg.chat.first_name || "Yangi Telegram Mijoz",
    description: `📞 Manba: Telegram Bot \n💬 Xabar: ${text}`,
    assignedTo: "Bot",
    deadline: "Yangi so'rov",
    price: "0 so'm",
    lastUpdated: "Hozir",
    color: "#AE00FF",
    columnId: "col-1"
  };

  io.emit('NEW_LEAD_CREATED', newLead);
  
  io.emit('CHAT_MESSAGE', {
    chatId: chatId,
    name: db.contacts[chatId].name,
    text: text,
    time: time,
    source: 'telegram',
    isMe: false,
    id: msg.message_id,
    type: messageType,
    mediaUrl: mediaUrl
  });
});

app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    res.sendFile(path.join(distPath, 'index.html'));
  } else {
    next();
  }
});

const { spawn } = require('child_process');
let cloudflareProcess = null;

function startAutoTunnel() {
  console.log("Qurilma uchun avtomatik Cloudflare Tunnel ishga tushmoqda...");
  const child = spawn('npx', ['--yes', 'cloudflared', 'tunnel', '--url', 'http://localhost:3001'], {
    shell: true
  });
  
  cloudflareProcess = child;

  child.stdout.on('data', (data) => {
    handleTunnelOutput(data.toString());
  });

  child.stderr.on('data', (data) => {
    handleTunnelOutput(data.toString());
  });

  child.on('close', (code) => {
    console.log(`Cloudflare Tunnel yopildi, kod: ${code}. Qayta ishga tushmoqda...`);
    setTimeout(startAutoTunnel, 5000);
  });
}

function handleTunnelOutput(text) {
  const match = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
  if (match) {
    const url = match[0];
    console.log(`\n🚀 [Cloudflare Tunnel] Global havola yaratildi: ${url}`);
    const tunnelPath = path.join(__dirname, 'tunnel.txt');
    try {
      fs.writeFileSync(tunnelPath, url);
    } catch (e) {
      console.error("Tunnel manzilini tunnel.txt ga yozishda xato:", e);
    }
  }
}

// Avtomatik tunnelni parallel ravishda boshlash
startAutoTunnel();

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Backend server ${PORT} portida ishga tushdi.`);
});
