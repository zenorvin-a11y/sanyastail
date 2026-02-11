const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>🌈 СПЕКТР | Современный мессенджер</title>
        <link rel="icon" href="https://img.icons8.com/color/96/000000/rainbow.png" type="image/png">
        <meta name="description" content="Современный мессенджер с красивым дизайном. Быстро, безопасно, бесплатно.">
        <style>
            body {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                font-family: Arial, sans-serif;
                text-align: center;
                padding: 50px;
                min-height: 100vh;
            }
            .container {
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                padding: 40px;
                border-radius: 20px;
                max-width: 800px;
                margin: 0 auto;
                border: 2px solid rgba(255, 255, 255, 0.2);
            }
            h1 {
                font-size: 4em;
                margin-bottom: 20px;
                background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #feca57);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            .features {
                display: flex;
                justify-content: center;
                gap: 20px;
                margin: 30px 0;
                flex-wrap: wrap;
            }
            .feature {
                background: rgba(255, 255, 255, 0.15);
                padding: 20px;
                border-radius: 10px;
                width: 180px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🌈 СПЕКТР</h1>
            <p style="font-size: 1.2em; opacity: 0.9;">Современный мессенджер для всех цветов радуги</p>
            
            <div class="features">
                <div class="feature">
                    <div style="font-size: 2em;">🚀</div>
                    <h3>Быстро</h3>
                    <p>Мгновенные сообщения</p>
                </div>
                <div class="feature">
                    <div style="font-size: 2em;">🔒</div>
                    <h3>Безопасно</h3>
                    <p>Шифрование данных</p>
                </div>
                <div class="feature">
                    <div style="font-size: 2em;">🎨</div>
                    <h3>Красиво</h3>
                    <p>Современный дизайн</p>
                </div>
            </div>
            
            <div style="margin-top: 40px; background: rgba(0,0,0,0.2); padding: 20px; border-radius: 10px;">
                <h3>✨ Особенности</h3>
                <p>• Real-time чат • Групповые беседы • Голосовые сообщения • Темы оформления</p>
                <p>• История сообщений • Уведомления • Мультиплатформенность</p>
            </div>
            
            <div style="margin-top: 30px; font-size: 0.9em; opacity: 0.7;">
                <p>Создано с ❤️ для современного общения</p>
                <p>Ссылка: https://spectr.onrender.com (после переименования)</p>
            </div>
        </div>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('🌈 СПЕКТР запущен на порту ' + PORT);
});
