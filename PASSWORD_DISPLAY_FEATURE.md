# Password Display Feature

## Overview
Added functionality to display the admin password in the Settings page. Since passwords are encrypted (hashed) in the database, this feature shows:
- **Default password** if it's still being used (with show/hide toggle)
- **Masked password** if the password has been changed from default

## Features Added

### 1. Backend Endpoint
**New endpoint**: `GET /api/auth/password-info`

- Checks if the current password is the default password (`admin123`)
- Returns password information including:
  - `isDefault`: Boolean indicating if default password is still in use
  - `defaultPassword`: The default password value (only if still default)
  - `message`: Descriptive message about password status

**Security Note**: This endpoint only reveals the password if it's still the default. Once changed, the actual password cannot be retrieved (as it's hashed).

### 2. Frontend Changes

#### Settings Component (`src/components/Admin/Settings.jsx`)
- Added password info state and loading
- Displays password in "Current Account Information" section
- Shows/hides password with toggle button (eye icon)
- Automatically refreshes password info after password updates

#### API Service (`src/services/api.js`)
- Added `authAPI.getPasswordInfo()` method to fetch password information

#### Styling (`src/components/Admin/Settings.css`)
- Added styles for password display
- Added styles for password toggle button
- Different styling for visible vs masked password

## How It Works

### Display Logic

1. **If password is still default (`admin123`)**:
   - Shows masked password by default: `••••••••`
   - Eye icon button to show/hide password
   - When shown: displays `admin123` in red text
   - Shows note: "(Default password)"

2. **If password has been changed**:
   - Shows masked password: `••••••••`
   - No show/hide button (password cannot be retrieved)
   - Shows note: "(Encrypted - cannot be displayed)"

### Security

- **Default Password**: Can be shown because it's known (admin123)
- **Changed Password**: Cannot be shown because it's hashed in database
- **Best Practice**: Users should change the default password for security

## Usage

1. Navigate to Admin Dashboard → Settings tab
2. View "Current Account Information" section
3. See password status:
   - If default: Click eye icon to reveal password
   - If changed: Password is masked and cannot be revealed

## Example Display

```
Current Account Information
────────────────────────────
Username: admin
Password: •••••••• 👁️ (Default password)
Account Created: January 1, 2024
```

When eye icon is clicked (if default password):
```
Password: admin123 🚫 (Default password)
```

## Files Modified

1. `server/routes/auth.js` - Added `/password-info` endpoint
2. `src/services/api.js` - Added `getPasswordInfo()` method
3. `src/components/Admin/Settings.jsx` - Added password display
4. `src/components/Admin/Settings.css` - Added password styles

## Testing

To test:
1. Start backend server: `cd server && npm start`
2. Open Settings page in admin dashboard
3. Verify password display:
   - Should show masked password
   - If default: Should have eye icon
   - Click eye icon to toggle visibility

## Notes

- The password can only be shown if it's still the default password
- Once changed, the password cannot be retrieved (security feature)
- This is intended for development/testing purposes to easily access the default password




