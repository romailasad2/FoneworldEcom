# Testing Admin Settings Functionality

This document describes how to test the Admin Settings feature.

## Prerequisites

1. Backend server must be running on port 5000
2. Frontend should be running (optional, for UI testing)
3. Default admin credentials:
   - Username: `admin`
   - Password: `admin123`

## Test Scripts

### Option 1: Node.js Test Script

```bash
# Make sure backend server is running
cd server
npm start

# In another terminal, run the test
node test-settings-api.js
```

### Option 2: Shell Script Test

```bash
# Make script executable (Linux/Mac)
chmod +x test-settings.sh

# Run the test
./test-settings.sh
```

### Option 3: Manual Testing via Browser

1. Start the backend server:
   ```bash
   cd server
   npm start
   ```

2. Start the frontend:
   ```bash
   npm run dev
   ```

3. Open browser and go to: `http://localhost:3000/admin/login`

4. Login with credentials:
   - Username: `admin`
   - Password: `admin123`

5. Navigate to Settings tab in the Admin Dashboard

6. Test scenarios:
   - **View Current Info**: Should display current username and account creation date
   - **Update Username**: 
     - Enter current password
     - Enter new username
     - Should update successfully and show success message
   - **Update Password**:
     - Enter current password
     - Enter new password (min 6 characters)
     - Confirm new password
     - Should update successfully and show success message

## Expected Behavior

### ✅ Success Cases

1. **Load Settings Page**:
   - Should show current username
   - Should show account creation date
   - Forms should be enabled

2. **Update Username**:
   - Requires current password
   - New username must be different from current
   - Shows success message
   - Updates displayed username
   - Token is refreshed automatically

3. **Update Password**:
   - Requires current password
   - New password must be at least 6 characters
   - Confirmation must match
   - Shows success message
   - Form is cleared after success

### ❌ Error Cases (Should show appropriate error messages)

1. **Missing current password**: "Current password is required"
2. **Wrong current password**: "Current password is incorrect"
3. **Username already exists**: "Username already exists"
4. **Password too short**: "New password must be at least 6 characters long"
5. **Passwords don't match**: "New password and confirm password do not match"
6. **Server error**: "Failed to update username/password"

## API Endpoints Tested

1. `GET /api/auth/me` - Get current admin user info
2. `PUT /api/auth/update` - Update admin credentials
3. `GET /api/auth/verify` - Verify authentication token
4. `POST /api/auth/login` - Login (for testing)

## Troubleshooting

### Error: "Failed to load user information"

- Check if backend server is running
- Check browser console for errors
- Verify admin token is valid in localStorage
- Try logging out and logging back in

### Error: "Cannot read properties of null (reading 'username')"

- This should be fixed with the latest updates
- Make sure you're using the latest code
- Clear browser cache and refresh
- Check if `/api/auth/me` endpoint is working (test with curl/Postman)

### Error: "Cannot connect to server"

- Ensure backend server is running on port 5000
- Check if port 5000 is not being used by another application
- Verify API URL in `src/services/api.js`




