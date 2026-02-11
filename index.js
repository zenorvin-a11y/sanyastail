const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// === ВСТАВЬ СВОИ КЛЮЧИ СЮДА! ===
const GOOGLE_CLIENT_ID = '1067907908495-ru5eo9a1i69p7nq6qhe77eusbbrpdmml.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = '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';
// ===============================

// Настройки
app.use(session({
  secret: 'spectr-secret-' + Date.now(),
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

// Google OAuth
passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: 'https://sanyastail.onrender.com/auth/google/callback'
  },
  (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
  }
));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Данные чата
const messages = [];
const onlineUsers = new Map();

// Главная страница
app.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>🌈 СПЕКТР | ${req.user.displayName}</title>
          <style>
              body {
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  font-family: Arial;
                  margin: 0;
                  height: 100vh;
                  overflow: hidden;
              }
              .container {
                  display: flex;
                  height: 100vh;
              }
              .sidebar {
                  width: 280px;
                  background: rgba(0,0,0,0.3);
                  padding: 20px;
                  border-right: 2px solid rgba(255,255,255,0.2);
              }
              .chat-area {
                  flex: 1;
                  display: flex;
                  flex-direction: column;
              }
              .messages {
                  flex: 1;
                  padding: 20px;
                  overflow-y: auto;
                  background: rgba(0,0,0,0.2);
              }
              .message {
                  margin: 10px 0;
                  padding: 12px 15px;
                  border-radius: 15px;
                  max-width: 70%;
                  word-wrap: break-word;
              }
              .my { background: linear-gradient(135deg, #4ecdc4, #44a08d); margin-left: auto; }
              .other { background: rgba(255,255,255,0.15); }
              .input-area {
                  padding: 20px;
                  background: rgba(0,0,0,0.4);
                  display: flex;
                  gap: 10px;
              }
              #messageInput {
                  flex: 1;
                  padding: 15px;
                  border: 2px solid rgba(255,255,255,0.3);
                  border-radius: 10px;
                  background: rgba(255,255,255,0.1);
                  color: white;
                  font-size: 16px;
              }
              button {
                  padding: 15px 25px;
                  background: linear-gradient(135deg, #ff6b6b, #ee5a52);
                  color: white;
                  border: none;
                  border-radius: 10px;
                  font-weight: bold;
                  cursor: pointer;
              }
              .user-info {
                  display: flex;
                  align-items: center;
                  gap: 15px;
                  margin-bottom: 20px;
              }
              .avatar {
                  width: 60px;
                  height: 60px;
                  border-radius: 50%;
                  border: 3px solid #4ecdc4;
              }
              .online-count {
                  background: rgba(78, 205, 196, 0.2);
                  padding: 15px;
                  border-radius: 10px;
                  margin: 20px 0;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="sidebar">
                  <div class="user-info">
                      <img src="${req.user.photos[0].value}" class="avatar" alt="Avatar">
                      <div>
                          <h3>${req.user.displayName}</h3>
                          <small>${req.user.emails[0].value}</small>
                      </div>
                  </div>
                  <div class="online-count">
                      <h3>👥 Онлайн: <span id="onlineCount">1</span></h3>
                  </div>
                  <div>
                      <button onclick="logout()" style="background: #ff4444; width: 100%;">🚪 Выйти</button>
                  </div>
              </div>
              
              <div class="chat-area">
                  <div class="messages" id="messages"></div>
                  
                  <div class="input-area">
                      <input type="text" id="messageInput" placeholder="Напишите сообщение..." autocomplete="off">
                      <button onclick="sendMessage()">📤 Отправить</button>
                  </div>
              </div>
          </div>
          
          <script src="/socket.io/socket.io.js"></script>
          <script>
              const socket = io();
              const messagesDiv = document.getElementById('messages');
              const messageInput = document.getElementById('messageInput');
              const onlineCount = document.getElementById('onlineCount');
              
              // Подключение
              socket.on('connect', () => {
                  socket.emit('user_connected', {
                      id: '${req.user.id}',
                      name: '${req.user.displayName}',
                      avatar: '${req.user.photos[0].value}'
                  });
              });
              
              // Сообщения
              socket.on('load_messages', (msgs) => {
                  msgs.forEach(msg => addMessage(msg));
              });
              
              socket.on('new_message', (msg) => {
                  addMessage(msg);
              });
              
              socket.on('user_connected', (data) => {
                  onlineCount.textContent = data.count;
                  addSystemMessage(data.name + ' подключился');
              });
              
              socket.on('user_disconnected', (data) => {
                  onlineCount.textContent = data.count;
                  addSystemMessage(data.name + ' отключился');
              });
              
              // Отправка
              function sendMessage() {
                  const text = messageInput.value.trim();
                  if (!text) return;
                  
                  const message = {
                      user: {
                          id: '${req.user.id}',
                          name: '${req.user.displayName}',
                          avatar: '${req.user.photos[0].value}'
                      },
                      text: text,
                      time: new Date().toLocaleTimeString()
                  };
                  
                  socket.emit('send_message', message);
                  messageInput.value = '';
              }
              
              // Добавление сообщения
              function addMessage(msg) {
                  const isMyMessage = msg.user.id === '${req.user.id}';
                  const messageDiv = document.createElement('div');
                  messageDiv.className = 'message ' + (isMyMessage ? 'my' : 'other');
                  
                  if (!isMyMessage) {
                      messageDiv.innerHTML = \`
                          <div style="display: flex; align-items: center; margin-bottom: 5px;">
                              <img src="\${msg.user.avatar}" style="width: 30px; height: 30px; border-radius: 50%; margin-right: 10px;">
                              <strong>\${msg.user.name}</strong>
                          </div>
                          <div>\${msg.text}</div>
                          <small style="opacity: 0.7;">\${msg.time}</small>
                      \`;
                  } else {
                      messageDiv.innerHTML = \`
                          <div style="margin-bottom: 5px;"><strong>Вы</strong></div>
                          <div>\${msg.text}</div>
                          <small style="opacity: 0.7;">\${msg.time}</small>
                      \`;
                  }
                  
                  messagesDiv.appendChild(messageDiv);
                  messagesDiv.scrollTop = messagesDiv.scrollHeight;
              }
              
              function addSystemMessage(text) {
                  const div = document.createElement('div');
                  div.style.textAlign = 'center';
                  div.style.color = '#4ecdc4';
                  div.style.margin = '10px 0';
                  div.textContent = '🔔 ' + text;
                  messagesDiv.appendChild(div);
                  messagesDiv.scrollTop = messagesDiv.scrollHeight;
              }
              
              // Выход
              function logout() {
                  window.location.href = '/logout';
              }
              
              // Enter для отправки
              messageInput.addEventListener('keypress', (e) => {
                  if (e.key === 'Enter') sendMessage();
              });
              
              messageInput.focus();
          </script>
      </body>
      </html>
    `);
  } else {
    // Страница входа
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>🌈 СПЕКТР - Вход</title>
          <style>
              body {
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  height: 100vh;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  font-family: Arial;
                  text-align: center;
              }
              .login-box {
                  background: rgba(255,255,255,0.1);
                  backdrop-filter: blur(10px);
                  padding: 50px;
                  border-radius: 20px;
                  border: 2px solid rgba(255,255,255,0.2);
                  max-width: 500px;
              }
              h1 {
                  font-size: 3em;
                  margin-bottom: 20px;
                  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
                  -webkit-background-clip: text;
                  -webkit-text-fill-color: transparent;
              }
              .google-btn {
                  display: inline-flex;
                  align-items: center;
                  background: white;
                  color: #444;
                  padding: 15px 30px;
                  border-radius: 10px;
                  text-decoration: none;
                  font-weight: bold;
                  margin-top: 30px;
                  transition: 0.3s;
              }
              .google-btn:hover {
                  transform: translateY(-2px);
                  box-shadow: 0 10px 20px rgba(0,0,0,0.2);
              }
              .google-btn img {
                  width: 24px;
                  margin-right: 10px;
              }
          </style>
      </head>
      <body>
          <div class="login-box">
              <h1>🌈 СПЕКТР</h1>
              <p style="font-size: 1.2em;">Мессенджер с Google авторизацией</p>
              <p>Войдите через Google чтобы начать общение</p>
              
              <a href="/auth/google" class="google-btn">
                  <img src="https://img.icons8.com/color/48/000000/google-logo.png">
                  Войти через Google
              </a>
              
              <div style="margin-top: 30px; font-size: 0.9em; opacity: 0.7;">
                  <p>🔐 Безопасная авторизация</p>
                  <p>💬 Real-time общение</p>
                  <p>🎨 Современный дизайн</p>
              </div>
          </div>
      </body>
      </html>
    `);
  }
});

// Google аутентификация
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => res.redirect('/')
);

app.get('/logout', (req, res) => {
  req.logout(() => res.redirect('/'));
});

// WebSocket чат
io.on('connection', (socket) => {
  console.log('Новый пользователь');
  
  socket.on('user_connected', (userData) => {
    onlineUsers.set(socket.id, userData);
    
    // Отправляем историю
    socket.emit('load_messages', messages.slice(-50));
    
    // Уведомляем всех
    io.emit('user_connected', {
      name: userData.name,
      count: onlineUsers.size
    });
  });
  
  socket.on('send_message', (message) => {
    message.id = Date.now();
    messages.push(message);
    
    // Лимит сообщений
    if (messages.length > 1000) messages.shift();
    
    io.emit('new_message', message);
  });
  
  socket.on('disconnect', () => {
    const user = onlineUsers.get(socket.id);
    if (user) {
      onlineUsers.delete(socket.id);
      io.emit('user_disconnected', {
        name: user.name,
        count: onlineUsers.size
      });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('🌈 СПЕКТР с Google OAuth запущен!');
  console.log('👉 https://sanyastail.onrender.com');
});
