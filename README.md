# The Beacon - Disaster Preparedness & Response Education System

A comprehensive web application for schools and colleges to educate students about disaster preparedness and response.

## Project Structure

```
BEACON/
├── backend/                    # Node.js/Express backend
│   ├── config/
│   │   ├── database.js        # MongoDB connection
│   │   └── config.js          # App configuration
│   ├── models/                # MongoDB models
│   │   ├── User.js
│   │   ├── Quiz.js
│   │   ├── Resource.js
│   │   ├── Alert.js
│   │   └── DrillSchedule.js
│   ├── routes/                # API routes
│   │   ├── auth.js
│   │   ├── admin.js
│   │   ├── user.js
│   │   ├── quiz.js
│   │   ├── chatbot.js
│   │   └── alerts.js
│   ├── middleware/            # Custom middleware
│   │   └── auth.js
│   ├── services/              # Business logic
│   │   ├── scrapingService.js
│   │   ├── geminiService.js
│   │   └── notificationService.js
│   ├── uploads/               # File uploads directory
│   ├── package.json
│   └── server.js             # Main server file
├── frontend/                  # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── admin/
│   │   │   └── user/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   ├── utils/
│   │   └── App.js
│   ├── package.json
│   └── tailwind.config.js
└── docs/                      # Documentation
    └── API.md
```

## Features

- **Authentication**: Simple login/signup for students and admins
- **Admin Dashboard**: Resource management, drill scheduling, quiz creation
- **User Dashboard**: Learning modules, quizzes, community Q&A
- **AI Chatbot**: Google Gemini-powered disaster awareness assistant
- **Real-time Alerts**: Web scraping from ISRO, NDMA, IMD
- **Gamification**: Leaderboards and timed quizzes
- **Community**: Forum-style discussions

## Tech Stack

- **Frontend**: React, TailwindCSS
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **AI**: Google Gemini API
- **Web Scraping**: Puppeteer, Cheerio
- **Notifications**: Web Push API

## Getting Started

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## Environment Variables

Create `.env` files in both backend and frontend directories with required configurations.
