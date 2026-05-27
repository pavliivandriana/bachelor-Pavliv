# Розроблення веб-застосунку для створення та обміну списками бажань (wishlist) із можливістю підписки на оновлення

**Кваліфікаційна робота освітнього рівня «Бакалавр»**
Спеціальність 122 — Комп'ютерні науки
ПЗВО «ІТ СТЕП Університет»

---

## Автор

**Павлів Андріана Андріївна**

## Науковий керівник

**Яковлєв Микола Костянтинович** — магістр, Senior Engineer Typescript/Node JS, Intellias

---

## Опис проекту

Веб-застосунок для створення, зберігання та обміну списками бажань із повним соціальним функціоналом.

Основні можливості:
- Створення бажань з автоматичним заповненням даних товару за URL-посиланням з будь-якого інтернет-магазину
- Система підписок на профілі інших користувачів та персональна стрічка новин
- Бронювання подарунків — дозволяє уникнути дублювання при купівлі подарунків
- Система актуалізації бажань з автоматичними email-нагадуваннями та одноразовими токенами підтвердження
- Антивішліст — перелік товарів, які користувач не хоче отримувати
- Система досягнень, гнучке налаштування приватності
- Верифікація email при реєстрації

**Стек технологій:**
- Frontend: React 18, TypeScript, Tailwind CSS, Framer Motion, React Router v7, Vite
- Backend: Node.js, Express.js, Mongoose, Nodemailer, Multer, JWT
- База даних: MongoDB

---

## Встановлення та запуск

### Вимоги

- [Node.js](https://nodejs.org/) версії 18 або вище
- [MongoDB](https://www.mongodb.com/try/download/community) (локально) або рядок підключення MongoDB Atlas

---

### 1. Клонування репозиторію

```bash
git clone https://github.com/your-username/bachelor-Pavliv.git
cd bachelor-Pavliv
```

---

### 2. Налаштування бекенду

```bash
cd backend
npm install
```

Створіть файл `.env` на основі `.env.example`:

```bash
cp .env.example .env
```

Відкрийте `.env` та заповніть значення:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/wishlist
JWT_SECRET=будь-який-довгий-рядок
CLIENT_URL=http://localhost:5173
```

Для роботи email-нагадувань (необов'язково) додайте SMTP-налаштування:

```
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=your@gmail.com
EMAIL_VERIFICATION_DEV_MODE=true
```

> Якщо `EMAIL_VERIFICATION_DEV_MODE=true` — OTP-коди та посилання нагадувань виводитимуться у консоль замість реального надсилання листів.

Запустіть бекенд:

```bash
npm run dev
```

Сервер запуститься на `http://localhost:5000`

---

### 3. Налаштування фронтенду

Відкрийте новий термінал у кореневій папці проекту:

```bash
npm install
npm run dev
```

Застосунок відкриється на `http://localhost:5173`

---

### 4. Структура проекту

```
├── src/                  # Фронтенд (React + TypeScript)
│   └── app/
│       ├── components/   # UI-компоненти
│       ├── pages/        # Сторінки застосунку
│       ├── store/        # Глобальний стан (Context API)
│       └── i18n/         # Переклади (UA / EN)
├── backend/              # Бекенд (Node.js + Express)
│   └── src/
│       ├── models/       # Mongoose-моделі
│       ├── routes/       # API-маршрути
│       ├── utils/        # Допоміжні модулі
│       └── scheduler.js  # Планувальник email-нагадувань
└── README.md
```
