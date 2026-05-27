# Branch Login Troubleshooting Guide

## Common Issues and Solutions

### Issue: Branch login doesn't work / Portal doesn't open

**Possible Causes:**

1. **Backend server not restarted**
   - The branch authentication routes are new and require a server restart
   - **Solution:** Stop the server (Ctrl+C) and restart it:
     ```bash
     cd server
     npm start
     ```

2. **Branch user credentials don't exist in database**
   - When creating a branch, make sure you filled in the username and password fields
   - **Solution:** Check if branch user was created:
     - Open admin dashboard
     - Check if the branch exists
     - If branch exists but login doesn't work, the user account might not have been created
     - Try creating the branch again with username/password

3. **Wrong credentials**
   - Make sure you're using the exact username and password set when creating the branch
   - Usernames are case-sensitive

4. **Server route not found**
   - Check browser console (F12) for errors
   - Error: "Cannot GET /api/branch-auth/login" means server needs restart

5. **Network/CORS issues**
   - Make sure backend server is running on port 5000
   - Check browser console for connection errors

## Steps to Verify Setup

1. **Check Server is Running:**
   - Open: http://localhost:5000/api/health
   - Should return: `{"status":"OK","message":"FoneWorld API is running"}`

2. **Check Branch Auth Route Exists:**
   - The route should be: `/api/branch-auth/login`
   - After server restart, this should work

3. **Verify Branch User Exists:**
   - Create a new branch from admin dashboard
   - Make sure to fill in username and password fields
   - The branch user account is created automatically

4. **Check Browser Console:**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Try logging in and check for error messages
   - Look for:
     - Network errors
     - Authentication errors
     - Token errors

## How to Test Branch Login

1. **Create a Test Branch:**
   - Login as admin
   - Go to Branches tab
   - Click "Add New Branch"
   - Fill in:
     - Branch Name: "Test Branch"
     - Address: "Test Address"
     - Phone: "1234567890"
     - Username: "testbranch"
     - Password: "testpass123"
   - Click "Create Branch"

2. **Test Login:**
   - Go to: http://localhost:5173/branch/login (or your frontend URL)
   - Enter:
     - Username: "testbranch"
     - Password: "testpass123"
   - Should redirect to branch dashboard

## Still Having Issues?

1. Check browser console (F12 → Console tab) for error messages
2. Check server terminal for error logs
3. Verify:
   - Backend server is running
   - Server has been restarted after adding branch routes
   - Branch was created with username/password
   - Credentials are correct (case-sensitive)




