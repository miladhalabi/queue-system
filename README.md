# QueueFlow Management System

A real-time, production-ready queue management system with bilingual support (English & Arabic), Telegram bot integration, and a sleek dark mode.

## 🚀 Features

### **For Clients**
*   **Multi-Channel Join**: Join via the Web interface or a Telegram bot.
*   **Real-time Tracking**: Live position updates via WebSockets.
*   **Bilingual Support**: Instant toggle between English and Arabic with full RTL support.
*   **Smart Notifications**: Automatic Telegram alerts when you reach #1 in line and when you are called.
*   **Persistent Sessions**: Stay in the queue even if you refresh your browser or restart your device.

### **For Admins**
*   **Secure Dashboard**: Protected by JWT authentication.
*   **Queue Management**: Call the next person, skip users with reasons, and view the active queue.
*   **Tickets History**: View a detailed log of past tickets (Served, Skipped, Left).
*   **Global Settings**: Toggle whether a "Reason for Visit" is required for joining the queue.
*   **Live Statistics**: Monitor current waiting counts and total served clients for the day.

## 🛠 Tech Stack

*   **Frontend**: React 19, Vite, Tailwind CSS 4, Zustand, Socket.IO Client.
*   **Backend**: Node.js, Express, Prisma ORM, Socket.IO, Telegraf (Telegram Bot API).
*   **Database**: PostgreSQL.
*   **Security**: JWT, BcryptJS, Helmet, Morgan.

## 📦 Getting Started

### **Prerequisites**
*   Node.js (v18+)
*   PostgreSQL running locally.

### **1. Clone and Install**
```bash
# Install root dependencies
npm install

# Install server and client dependencies
npm run install:all
```

### **2. Environment Setup**
Create a `.env` file in the `server` directory:
```env
DATABASE_URL="postgresql://admin:root@localhost:5432/queue-system?schema=public"
SHADOW_DATABASE_URL="postgresql://admin:root@localhost:5432/queue-system-shadow?schema=public"
JWT_SECRET="your_secure_secret"
TELEGRAM_BOT_TOKEN="your_bot_token"
```

### **3. Database Initialization**
```bash
# Run migrations and generate Prisma client
npm run build
```

### **4. Seeding Default Admin**
```bash
cd server
node prisma/seed.js
```
**Default Admin Credentials:**
*   **Username**: `admin`
*   **Password**: `admin123`

## 🏃 Running the Application

### **Development Mode**
Starts both the backend and frontend with hot-reloading.
```bash
npm run dev
```

### **Production Mode**
Builds the frontend and starts the Express server which serves the static files.
```bash
npm start
```

### **Testing/Simulation**
Adds 10 mock clients to the queue for testing purposes.
```bash
npm run simulate
```

## 🤖 Telegram Bot Integration

1.  Create a bot via [@BotFather](https://t.me/botfather).
2.  Add the token to your `server/.env`.
3.  The bot supports:
    *   `/start`: Welcome and main menu.
    *   **Join Queue ➕**: Instant ticket generation.
    *   **Join with Reason 📝**: Conversational flow to capture visit purpose.
    *   **Check Status ℹ️**: Real-time rank and ticket info.
    *   **Leave Queue ❌**: Exit the line remotely.

## 📁 Project Structure

```text
├── client/              # React Frontend (Vite)
│   ├── src/
│   │   ├── components/  # UI Components
│   │   ├── store/       # Zustand State Management
│   │   ├── i18n/        # Translation files (EN/AR)
│   │   └── main.jsx     # Entry point
├── server/              # Node.js Backend
│   ├── src/
│   │   ├── config/      # DB and Bot initialization
│   │   ├── controllers/ # Business logic
│   │   ├── routes/      # API Endpoints
│   │   ├── services/    # Notifications & Bot Handlers
│   │   └── middleware/  # Auth & Security
│   ├── prisma/          # Schema and Migrations
│   └── index.js         # Server bootstrap
├── simulate.js          # Load testing script
└── PLAN.md              # Original project roadmap
```

## 📄 License
© 2026 QueueFlow Management System. All rights reserved.
