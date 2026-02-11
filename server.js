const express = require('express');
const session = require('express-session');
const multer = require('multer');
const nodemailer = require('nodemailer');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Папки для файлов
const uploadsDir = 'uploads';
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// Настройка загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Настройка почты
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'zenorvin@gmail.com', // ТВОЯ ПОЧТА
    pass: 'твой-пароль-от-почты' // ПАРОЛЬ ОТ ПОЧТЫ!
  }
});

// Базы данных (временно в памяти)
const users = {};
const chats = {};
const groups = {};
const channels = {};

// Сессии
app.use(session({
  secret: 'spectr-secret-key',
  resave: false,
  saveUninitialized: true
}));

// Статические файлы
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Главная страница
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Загрузка файлов
app.post('/upload', upload.single('file'), (req, res) => {
  res.json({ url: '/uploads/' + req.file.filename });
});

// Отправка жалобы на почту
app.post('/report', (req, res) => {
  const mailOptions = {
    from: 'zenorvin@gmail.com',
    to: 'zenorvin@gmail.com',
    subject: 'ЖАЛОБА в СПЕКТР',
    text: `Жалоба от пользователя\nВремя: ${new Date()}\nДетали: ${req.body.details}`
  };
  
  transporter.sendMail(mailOptions);
  res.json({ success: true });
});

// WebSocket
io.on('connection', (socket) => {
  console.log('Новый пользователь');
  
  // Регистрация
  socket.on('register', (data) => {
    users[socket.id] = data;
    socket.emit('registered', { id: socket.id, ...data });
  });
  
  // Личное сообщение
  socket.on('private_message', (data) => {
    io.to(data.to).emit('private_message', {
      from: socket.id,
      message: data.message,
      file: data.file
    });
  });
  
  // Групповое сообщение
  socket.on('group_message', (data) => {
    if (groups[data.groupId]) {
      io.to(data.groupId).emit('group_message', {
        from: socket.id,
        groupId: data.groupId,
        message: data.message
      });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🌈 СПЕКТР ПРО запущен на ${PORT}`);
});
