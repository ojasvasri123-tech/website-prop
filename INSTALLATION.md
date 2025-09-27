# The Beacon - Installation Guide

This guide will help you set up and run The Beacon disaster preparedness web application on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (version 16.0 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** (version 4.4 or higher) - [Download here](https://www.mongodb.com/try/download/community)
- **Git** - [Download here](https://git-scm.com/downloads)
- **Google Gemini API Key** (optional, for AI chatbot) - [Get it here](https://makersuite.google.com/app/apikey)

## Step 1: Clone the Repository

```bash
git clone <your-repository-url>
cd BEACON
```

## Step 2: Backend Setup

### 2.1 Install Backend Dependencies

```bash
cd backend
npm install
```

### 2.2 Environment Configuration

Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/beacon

# Server
PORT=5000
NODE_ENV=development

# Google Gemini API (Optional - for AI chatbot)
GEMINI_API_KEY=your_gemini_api_key_here

# Web Push Notifications (Optional)
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_EMAIL=your_email@example.com

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### 2.3 Generate VAPID Keys (Optional)

If you want to enable push notifications, generate VAPID keys:

```bash
node -e "console.log(require('web-push').generateVAPIDKeys())"
```

Add the generated keys to your `.env` file.

### 2.4 Start MongoDB

Make sure MongoDB is running on your system:

**Windows:**
```bash
mongod
```

**macOS (with Homebrew):**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

### 2.5 Start the Backend Server

```bash
npm run dev
```

The backend server will start on `http://localhost:5000`

## Step 3: Frontend Setup

### 3.1 Install Frontend Dependencies

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
npm install
```

### 3.2 Environment Configuration (Optional)

Create a `.env` file in the `frontend` directory:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_VAPID_PUBLIC_KEY=your_vapid_public_key
```

### 3.3 Start the Frontend Development Server

```bash
npm start
```

The frontend will start on `http://localhost:3000`

## Step 4: Verify Installation

1. Open your browser and go to `http://localhost:3000`
2. You should see The Beacon homepage
3. Try registering a new account
4. Check the backend logs to ensure everything is working

## Step 5: Create Admin Account

To access admin features:

1. Register a regular account first
2. Connect to MongoDB and update the user's role:

```bash
mongo beacon
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "admin" } }
)
```

3. Log out and log back in to access admin features at `/admin`

## Step 6: Optional Configurations

### 6.1 Google Gemini API Setup

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your backend `.env` file as `GEMINI_API_KEY`
4. Restart the backend server

### 6.2 Push Notifications Setup

1. Generate VAPID keys (see step 2.3)
2. Add them to both backend and frontend `.env` files
3. Restart both servers
4. Enable notifications in the app settings

## Troubleshooting

### Common Issues

**1. MongoDB Connection Error**
- Ensure MongoDB is running
- Check the connection string in `.env`
- Verify MongoDB is accessible on port 27017

**2. Port Already in Use**
- Change the PORT in backend `.env` file
- Update REACT_APP_API_URL in frontend `.env` accordingly

**3. CORS Errors**
- Ensure FRONTEND_URL is correctly set in backend `.env`
- Check that both servers are running

**4. Dependencies Installation Issues**
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and `package-lock.json`, then run `npm install` again

**5. Gemini API Errors**
- Verify your API key is correct
- Check if you have sufficient quota
- The app will work with fallback responses if API key is not configured

### Logs and Debugging

**Backend Logs:**
- Check the terminal where you ran `npm run dev`
- Look for database connection messages
- API request/response logs will appear here

**Frontend Logs:**
- Open browser developer tools (F12)
- Check the Console tab for JavaScript errors
- Check the Network tab for API call failures

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production` in backend `.env`
2. Build the frontend: `cd frontend && npm run build`
3. Use a process manager like PM2 for the backend
4. Set up a reverse proxy with Nginx
5. Use a production MongoDB instance
6. Enable HTTPS for security

## Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Verify all prerequisites are installed correctly
3. Ensure all environment variables are set properly
4. Check that both MongoDB and the servers are running

## Default Test Data

The application will create some mock disaster alerts for demonstration purposes. In production, these would be replaced with real data from government sources.

## Next Steps

After successful installation:

1. Explore the user dashboard
2. Try taking a quiz
3. Check out the AI chatbot
4. Test the admin panel (if you created an admin account)
5. Customize the application for your institution's needs

Congratulations! You have successfully installed The Beacon. 🎉
