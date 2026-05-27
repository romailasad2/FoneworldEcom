# Quick Start Guide

## Simple 2-Step Process

### Step 1: Start Backend Server
Double-click: **`START-SERVER.bat`**

OR manually:
```bash
cd server
npm install
npm start
```

**Keep this terminal window open!** You should see:
```
Server running on http://localhost:5000
```

### Step 2: Start Frontend (in a NEW terminal)
Double-click: **`START-FRONTEND.bat`**

OR manually:
```bash
npm install
npm run dev
```

**Keep this terminal window open too!**

### Step 3: Access the Website
- **Public Site**: http://localhost:3000
- **Admin Login**: http://localhost:3000/admin/login
  - Username: `admin`
  - Password: `admin123`

---

## Important Notes

1. **You need TWO terminal windows open:**
   - One for backend (port 5000)
   - One for frontend (port 3000)

2. **Don't close the terminal windows** while using the website

3. **If login fails**, check that the backend server is running:
   - Open: http://localhost:5000/api/health
   - Should show: `{"status":"OK","message":"FoneWorld API is running"}`

4. **To stop servers**: Press `Ctrl+C` in each terminal window

---

## Troubleshooting

**"Failed to fetch" error?**
- Make sure backend server is running (Step 1)
- Check http://localhost:5000/api/health in your browser

**Port already in use?**
- Close other applications using ports 5000 or 3000
- Or change ports in server/.env and vite.config.js


