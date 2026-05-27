# Quick Setup Guide

## Important: Backend Server Must Be Running!

The admin login requires the backend server to be running. Follow these steps:

### Step 1: Install Backend Dependencies

```bash
cd server
npm install
```

### Step 2: Start the Backend Server

```bash
# In the server directory
npm start
```

You should see:
```
Server running on http://localhost:5000
API endpoints available at http://localhost:5000/api
Connected to SQLite database
Database initialized successfully
```

### Step 3: Start the Frontend (in a NEW terminal)

```bash
# In the root directory (not in server folder)
npm run dev
```

### Step 4: Access the Admin Panel

1. Go to: http://localhost:3000/admin/login
2. Login with:
   - Username: `admin`
   - Password: `admin123`

## Troubleshooting

### "Failed to fetch" or "Cannot connect to server" Error

This means the backend server is not running. Make sure:

1. ✅ You've installed backend dependencies: `cd server && npm install`
2. ✅ The backend server is running: `cd server && npm start`
3. ✅ The server is running on port 5000 (check the terminal output)
4. ✅ No other application is using port 5000

### Check if Server is Running

Open your browser and go to: http://localhost:5000/api/health

You should see: `{"status":"OK","message":"FoneWorld API is running"}`

If you get an error, the server is not running.

### Port Already in Use

If port 5000 is already in use, you can change it:

1. Create `server/.env` file:
```env
PORT=5001
JWT_SECRET=your-secret-key
```

2. Update `src/services/api.js` or create `.env` in root:
```env
VITE_API_URL=http://localhost:5001/api
```

3. Restart both servers

## Running Both Servers

You need TWO terminal windows:

**Terminal 1 (Backend):**
```bash
cd server
npm start
```

**Terminal 2 (Frontend):**
```bash
npm run dev
```

Both must be running simultaneously!


