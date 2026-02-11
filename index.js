const express = require('express');
const session = require('express-session');
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// === НАСТРОЙКИ ===
const SUPABASE_URL = 'https://твой-проект.supabase.co';
const SUPABASE_KEY = 'твой-supabase-key';
const EMAIL_USER = 'zenorvin@gmail.com';
const EMAIL_PASS = 'пароль-приложения-google'; // Нужен App Password

// Инициализация Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Почтовый транспорт
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

// Middleware
app.use(express.static('public'));
app.use(express.json());
app.use(session({
  secret: 'spectr-mega-secret',
  resave: false,
  saveUninitialized: true
}));

// ================== РОУТЫ ==================

// Главная
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Регистрация
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  
  // Сохранение в Supabase
  const { data, error } = await supabase
    .from('users')
    .insert([{ username, email, password_hash: 'хеш_пароля', premium: false }]);
  
  if (error) {
    res.json({ success: false, error: error.message });
  } else {
    req.session.userId = data[0].id;
    res.json({ success: true, userId: data[0].id });
  }
});

// Логин
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  
  if (data && data.password_hash === 'хеш_пароля') { // В реальности bcrypt
    req.session.userId = data.id;
    res.json({ success: true, user: data });
  } else {
    res.json({ success: false, error: 'Неверные данные' });
  }
});

// Жалоба на пользователя
app.post('/api/report', async (req, res) => {
  const { targetUserId, reason } = req.body;
  const reporterId = req.session.userId;
  
  if (!reporterId) {
    return res.json({ success: false, error: 'Нужно войти' });
  }
  
  // Отправка жалобы на почту
  const mailOptions = {
    from: EMAIL_USER,
    to: EMAIL_USER,
    subject: '🚨 ЖАЛОБА в СПЕКТР',
    text: `Пользователь ${reporterId} пожаловался на ${targetUserId}\nПричина: ${reason}`
  };
  
  try {
    await transporter.sendMail(mailOptions);
    
    // Сохраняем в базу
    await supabase
      .from('reports')
      .insert([{ reporter_id: reporterId, target_id: targetUserId, reason }]);
    
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Покупка премиума
app.post('/api/buy-premium', async (req, res) => {
  const userId = req.session.userId;
  
  if (!userId) {
    return res.json({ success: false, error: 'Нужно войти' });
  }
  
  // Здесь интеграция с платежкой
  // Пока просто обновляем статус
  await supabase
    .from('users')
    .update({ premium: true })
    .eq('id', userId);
  
  res.json({ success: true });
});

// ================== WebSocket ==================

io.on('connection', (socket) => {
  console.log('Новое подключение:', socket.id);
  
  // Присоединение к чату
  socket.on('join_chat', async (data) => {
    const { chatId, userId } = data;
    
    // Получаем историю
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })
      .limit(100);
    
    socket.emit('chat_history', messages);
    socket.join(`chat_${chatId}`);
  });
  
  // Отправка сообщения
  socket.on('send_message', async (data) => {
    const { chatId, userId, text, type = 'text' } = data;
    
    // Сохраняем в базу
    const { data: message } = await supabase
      .from('messages')
      .insert([{
        chat_id: chatId,
        user_id: userId,
        content: text,
        type: type // 'text', 'image', 'video'
      }])
      .single();
    
    // Отправляем всем в чате
    io.to(`chat_${chatId}`).emit('new_message', message);
  });
  
  // Создание чата
  socket.on('create_chat', async (data) => {
    const { name, isGroup, userIds } = data;
    
    const { data: chat } = await supabase
      .from('chats')
      .insert([{ name, is_group: isGroup, created_by: userIds[0] }])
      .single();
    
    // Добавляем участников
    for (const userId of userIds) {
      await supabase
        .from('chat_members')
        .insert([{ chat_id: chat.id, user_id: userId }]);
    }
    
    socket.emit('chat_created', chat);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🌈 СПЕКТР 2.0 запущен на порту ${PORT}`);
});
