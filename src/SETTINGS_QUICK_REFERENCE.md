# Settings Module - Quick Reference Card

## Access
**Who**: Administrators only (Admin, Kingsley)  
**Where**: Sidebar → Settings (gear icon)  
**Default Password**: P@ssw0rd

---

## Quick Actions

| Action | Button Location | Icon |
|--------|----------------|------|
| Add User | Top right | <UserPlus> |
| Send Invite | Top right | <Mail> |
| Edit User | Actions column | <Edit> |
| Change Password | Actions column | <Key> |
| Delete User | Actions column | <Trash> |
| Search Users | Top of table | <Search> |

---

## User Operations

### ➕ Add New User
1. Click **Add User**
2. Fill: Username*, Name*, Email, Role*, Password*
3. Click **Add User**

*Required fields

### ✏️ Edit User Profile
1. Click **Edit** icon (pencil)
2. Update: Name, Email, Role
3. Click **Save Changes**

### 🔑 Change Password
1. Click **Key** icon
2. Enter new password (min. 6 chars)
3. Confirm password
4. Click **Change Password**

### 🗑️ Delete User
1. Click **Trash** icon (red)
2. Confirm deletion
3. User permanently removed

⚠️ Cannot delete: yourself, last admin

### 📧 Send Invitation
1. Click **Send Invite**
2. Enter email address
3. Select role
4. Click **Send Invite**

---

## User Roles

### 👑 Administrator
✅ Full system access  
✅ Manage users  
✅ Delete records  
✅ Access Settings  

### 👤 Agent
✅ View and edit records  
✅ Create new entries  
❌ Delete records  
❌ Access Settings  
❌ Manage users  

---

## Rules & Restrictions

| Rule | Reason |
|------|--------|
| Usernames are unique | Prevents conflicts |
| Minimum 6 char password | Security requirement |
| Cannot delete yourself | Safety measure |
| Cannot delete last admin | System protection |
| Username cannot change | System constraint |

---

## Statistics Dashboard

📊 **Total Users** - All system users  
🛡️ **Administrators** - Full access users  
👥 **Agents** - Limited access users  

---

## Search Functionality

Search by:
- Username
- Full Name  
- Email Address

🔍 Real-time filtering as you type

---

## Mobile Tips

📱 **On Small Screens:**
- Scroll table horizontally
- Tap action icons
- Forms optimized for touch
- Stats cards stack vertically

---

## Common Workflows

### New Employee Onboarding
1. Add User → Enter details
2. Set role: Agent
3. Set temp password
4. Send credentials securely
5. User changes password on first login

### Employee Promotion
1. Edit User
2. Change role: Agent → Administrator
3. Save changes

### Employee Offboarding
1. Find user in table
2. Delete user
3. Confirm removal

### Password Reset Request
1. Find user
2. Change Password
3. Provide new temp password
4. User changes on next login

---

## Error Messages

| Message | Meaning | Solution |
|---------|---------|----------|
| Access Denied | Not an admin | Login as admin |
| Username exists | Duplicate username | Choose different |
| Cannot delete last admin | Only 1 admin left | Create another admin first |
| Passwords don't match | Confirmation mismatch | Re-enter passwords |
| Failed to load users | Backend error | Refresh page |

---

## Best Practices

✅ **DO:**
- Change default passwords immediately
- Use strong, unique passwords
- Maintain 2+ admin accounts
- Review users regularly
- Add email addresses
- Remove inactive users

❌ **DON'T:**
- Share admin credentials
- Use simple passwords
- Delete last admin
- Delete yourself while logged in
- Forget to document changes

---

## Security Checklist

- [ ] Changed all default passwords
- [ ] At least 2 admin accounts active
- [ ] All passwords are 6+ characters
- [ ] Inactive users removed
- [ ] Roles match responsibilities
- [ ] Email addresses added for key users

---

## Shortcuts & Tips

💡 **Quick Search**: Click in search box, start typing  
💡 **View Details**: Click on user row for full info  
💡 **Keyboard**: Tab through forms, Enter to submit  
💡 **Cancel**: Esc key closes dialogs  
💡 **Mobile**: Use landscape mode for better table view  

---

## Support

📖 Full Guide: `SETTINGS_USER_GUIDE.md`  
🔧 Technical Docs: `SETTINGS_MODULE.md`  
📋 System Features: `SYSTEM_FEATURES.md`  

---

## Version Info

**Module**: Settings / User Management  
**Access Level**: Administrator Only  
**Component**: `/components/Settings.tsx`  
**API Endpoints**: `/make-server-5921d82e/users/*`  

---

## Emergency Procedures

### All Admins Locked Out
1. Contact system administrator
2. Backend access required
3. Create new admin via server

### Accidental User Deletion
1. User data is permanently deleted
2. Recreate user account
3. Reset all permissions
4. Prevention: Confirm before deleting

### Password Forgotten
1. Admin resets password
2. Provide temporary password
3. User changes on next login
4. Alternative: Send invite email

---

**Last Updated**: December 2025  
**For**: Asset Management System  
**Platform**: Figma Make
