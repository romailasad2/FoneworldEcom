# Clear Branch Tokens

If you're experiencing issues with branch authentication, try clearing the browser's localStorage:

## Method 1: Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Run these commands:
```javascript
localStorage.removeItem('branch_token')
localStorage.removeItem('branch_user')
localStorage.removeItem('admin_token')
localStorage.removeItem('admin_user')
console.log('All tokens cleared')
```
4. Refresh the page

## Method 2: Application Tab
1. Open browser DevTools (F12)
2. Go to Application tab (Chrome) or Storage tab (Firefox)
3. Find "Local Storage" → your domain
4. Delete:
   - `branch_token`
   - `branch_user`
   - `admin_token` (if you want to clear admin too)
   - `admin_user` (if you want to clear admin too)
5. Refresh the page

## Method 3: Incognito/Private Window
Open the app in an incognito/private window to test with a clean state.




