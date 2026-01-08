# 🔐 Password Change Feature - User Guide

## ✅ Status: FULLY IMPLEMENTED

All users (both Admins and Agents) can now change their own passwords!

---

## 🎯 How to Change Your Password

### For All Users (Admins & Agents):

1. **Login to the system**
2. **Click "Settings"** in the sidebar
3. You'll see the **"Change Password"** section
4. **Fill in the form:**
   - Current Password
   - New Password
   - Confirm New Password
5. **Click "Update Password"**

---

## 📋 Password Requirements

✅ **Length**: 6-12 characters  
✅ **Must contain**: Letters (a-z, A-Z)  
✅ **Must contain**: Numbers (0-9)  
✅ **Must contain**: At least one symbol (!@#$%^&*...)  

### ✅ Valid Examples:
- `Pass123!`
- `MyP@ssw0rd`
- `Secure#99`

### ❌ Invalid Examples:
- `pass123` (no symbol)
- `Password!` (no number)
- `12345!` (no letters)
- `Pass!` (too short)

---

## 🎨 Interface Details

### For Agents:
When agents access Settings, they see:
- ✅ **Change Password** card (full form)
- ✅ **Account Information** card (username, name, role)
- ❌ No user management features

### For Admins:
When admins access Settings, they see:
- ✅ **Full User Management** (add, edit, delete users)
- ✅ **Send Invites** via email
- ✅ **Workflow Settings**
- ✅ **Change Any User's Password** (via user table actions)
- ✅ **Change Their Own Password** (in the main interface)

---

## 🔒 Security Features

1. **Current Password Verification**: Users must provide their current password to change it
2. **Password Strength Requirements**: Enforced on both frontend and backend
3. **Confirmation Field**: Prevents typos by requiring password re-entry
4. **Admin Override**: Admins can reset user passwords without current password

---

## 💡 Common Scenarios

### Scenario 1: First Login (Invited User)
```
1. Login with temporary password from email
2. Go to Settings
3. Change password immediately (as recommended)
4. Logout and login with new password
```

### Scenario 2: Regular Password Change
```
1. Go to Settings
2. Enter current password
3. Enter new password (meeting requirements)
4. Confirm new password
5. Click "Update Password"
6. Success! Continue using new password
```

### Scenario 3: Forgot Password (Admin Help)
```
1. Contact administrator
2. Admin resets your password via Settings
3. Admin shares new temporary password
4. Login and change password immediately
```

---

## 🎯 Quick Access

**For Agents**: Settings → Change Password Card  
**For Admins**: Settings → User Management → Change Password (or own password at top)

---

## 📊 What Happens Behind the Scenes

### User Changes Own Password:
```
Frontend sends:
{
  currentPassword: "old password",
  newPassword: "new password"
}

Backend verifies:
1. User exists
2. Current password matches
3. New password meets requirements
4. Updates password in database
```

### Admin Changes User Password:
```
Frontend sends:
{
  password: "new password"
}

Backend:
1. Admin permission verified
2. No current password check needed
3. New password validated
4. Updates password in database
```

---

## ⚠️ Important Notes

1. **Case Sensitive**: Passwords are case-sensitive
2. **No Password Recovery**: There's no automated password recovery - contact admin
3. **Temporary Passwords**: Always change temporary passwords on first login
4. **Security Best Practice**: Change passwords every 90 days
5. **Unique Passwords**: Don't reuse old passwords

---

## 🆘 Troubleshooting

### "Current password is incorrect"
- ✅ Check for typos
- ✅ Verify caps lock is off
- ✅ Contact admin if you forgot password

### "Password must contain letters, numbers, and symbols"
- ✅ Add at least one letter (a-z, A-Z)
- ✅ Add at least one number (0-9)
- ✅ Add at least one symbol (!@#$%...)

### "Passwords do not match"
- ✅ Retype both password fields carefully
- ✅ Ensure no extra spaces

### "Password must be between 6 and 12 characters"
- ✅ Count your characters
- ✅ Make it longer (if too short) or shorter (if too long)

---

## ✨ New Features Summary

### What's New:

1. ✅ **Agent Self-Service**: Agents can change their own passwords
2. ✅ **Dedicated UI**: Clean, simple interface for non-admins
3. ✅ **Account Info Display**: Users can view their account details
4. ✅ **Current Password Verification**: Enhanced security
5. ✅ **Dual Mode Backend**: Supports both admin and self-service changes

---

**Last Updated**: December 12, 2025  
**Feature Status**: ✅ Production Ready  
**Available To**: All Users (Admins & Agents)
