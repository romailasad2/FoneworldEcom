# Fix: "Port 5000 Already in Use" Error

## The Problem
You see this error:
```
Error: listen EADDRINUSE: address already in use :::5000
```

This means port 5000 is already being used by another process (usually a previous server instance).

## Quick Fix

### Option 1: Use the STOP script (Easiest)
Double-click: **`STOP-SERVER.bat`**

This will automatically stop any server running on port 5000.

### Option 2: Manual Fix

**Step 1: Find what's using port 5000**
Open PowerShell and run:
```powershell
netstat -ano | findstr :5000
```

**Step 2: Stop the process**
Look for the PID (Process ID) in the last column, then run:
```powershell
taskkill /F /PID [PID_NUMBER]
```

Replace `[PID_NUMBER]` with the actual number you found.

### Option 3: Restart Your Computer
This will close all processes and free up the port.

## After Fixing

1. **Start the backend server:**
   ```powershell
   cd server
   npm start
   ```

2. **Verify it's working:**
   Open in browser: http://localhost:5000/api/health
   
   Should show: `{"status":"OK","message":"FoneWorld API is running"}`

3. **Then start the frontend** (in a new terminal):
   ```powershell
   npm run dev
   ```

## Prevention

The `START-SERVER.bat` file now automatically stops any existing server before starting a new one, so this error shouldn't happen again if you use that file.


