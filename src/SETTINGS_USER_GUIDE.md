# Settings Module - User Guide

## Accessing Settings

### For Administrators
1. Log in with an admin account (admin, kingsley)
2. Look for the **Settings** menu item at the bottom of the sidebar (gear icon)
3. Click on **Settings** to access the user management page

### For Agents
- Agents (lateef, kelvin, mosun) cannot access the Settings page
- The Settings menu item will not appear in their sidebar
- Attempting to access Settings shows an "Access Denied" message

## Default Admin Accounts
- **Username**: admin | **Password**: P@ssw0rd
- **Username**: kingsley | **Password**: P@ssw0rd

## Managing Users

### Adding a New User

1. Click the **"Add User"** button at the top right
2. Fill in the required information:
   - **Username**: Must be unique (letters, numbers, underscore)
   - **Full Name**: User's display name
   - **Email**: Optional, for notifications and invitations
   - **Role**: Choose between Agent or Administrator
   - **Password**: Minimum 6 characters
3. Click **"Add User"** to create the account
4. The new user can immediately log in with their credentials

**Tips:**
- Usernames are automatically converted to lowercase
- Choose strong passwords for security
- Admins have full access; Agents have limited permissions

### Editing User Information

1. Find the user in the table
2. Click the **pencil icon** (Edit) in the Actions column
3. Update the information:
   - Full Name
   - Email address
   - Role (Agent ↔ Administrator)
4. Click **"Save Changes"**

**Note:** Username cannot be changed once created

### Changing a User's Password

1. Find the user in the table
2. Click the **key icon** (Change Password) in the Actions column
3. Enter the new password (minimum 6 characters)
4. Re-enter the password to confirm
5. Click **"Change Password"**

**Use Cases:**
- User forgot their password
- Security requirement to reset password
- Initial password change from default P@ssw0rd

### Deleting a User

1. Find the user in the table
2. Click the **trash icon** (Delete) in the Actions column
3. Confirm the deletion in the popup dialog
4. The user will be permanently removed

**Important Restrictions:**
- You cannot delete yourself while logged in
- You cannot delete the last administrator
- Deletion is permanent and cannot be undone
- Consider the impact before deleting users

### Sending Invitations

1. Click the **"Send Invite"** button at the top
2. Enter the recipient's email address
3. Select their role (Agent or Administrator)
4. Click **"Send Invite"**
5. An invitation email will be sent with setup instructions

**Note:** Email functionality requires email service integration (e.g., SendGrid, AWS SES)

## Searching for Users

Use the search bar at the top of the user table to find users by:
- Username
- Full name
- Email address

The search updates in real-time as you type.

## Understanding User Roles

### Administrator
- Full access to all modules
- Can view and access Settings
- Can add, edit, and delete users
- Can delete assets and records
- Can change user passwords
- Can send invitations

### Agent
- Can access all operational modules
- Can create and edit records
- **Cannot** delete assets or records
- **Cannot** access Settings
- **Cannot** manage users
- Limited to day-to-day operations

## User Statistics

The Settings dashboard shows:
- **Total Users**: All users in the system
- **Administrators**: Users with full permissions
- **Agents**: Users with limited permissions

## Mobile Usage

Settings is fully responsive and works on mobile devices:
- Swipe horizontally to view full table on small screens
- Action buttons are touch-friendly
- Forms are optimized for mobile input
- Statistics cards stack vertically on mobile

## Best Practices

### Security
1. Change default passwords immediately after first login
2. Use strong passwords (mix of letters, numbers, symbols)
3. Regularly review user accounts
4. Remove inactive users promptly
5. Keep at least 2 administrators for redundancy

### User Management
1. Use descriptive full names for easy identification
2. Add email addresses for important users
3. Assign roles based on job responsibilities
4. Document any special access requirements
5. Review permissions periodically

### Password Management
1. Establish a password policy (length, complexity)
2. Require password changes for security incidents
3. Don't share admin passwords
4. Use password managers for secure storage
5. Change passwords when users leave the organization

## Common Tasks

### Promoting an Agent to Administrator
1. Edit the user
2. Change role from "Agent" to "Administrator"
3. Save changes
4. User will have admin access on next login

### Demoting an Administrator to Agent
1. Edit the user
2. Change role from "Administrator" to "Agent"
3. Save changes
4. Ensure at least one admin remains

### Bulk Password Reset
Currently, passwords must be reset individually:
1. Open each user's password change dialog
2. Set a temporary password
3. Inform users to change password on next login

### Recovering from Locked Out Admin
If all admins are locked out:
1. Contact system administrator
2. Backend access may be needed
3. New admin user can be created via server
4. Prevention: Always maintain 2+ admin accounts

## Troubleshooting

### "Access Denied" message
- **Cause**: You're logged in as an Agent
- **Solution**: Log in with an Administrator account

### "Username already exists"
- **Cause**: Attempting to create user with existing username
- **Solution**: Choose a different username

### "Cannot delete the last admin user"
- **Cause**: Trying to delete the only remaining administrator
- **Solution**: Create another admin account first

### "Failed to load users"
- **Cause**: Backend connection issue
- **Solution**: Check internet connection, refresh page

### Changes not appearing
- **Solution**: Refresh the page or re-navigate to Settings

## Support

For additional help or issues not covered in this guide:
1. Check the system logs for error details
2. Contact your system administrator
3. Review the technical documentation in SETTINGS_MODULE.md

## Keyboard Shortcuts

While no specific shortcuts exist, standard browser shortcuts work:
- **Ctrl/Cmd + F**: Find in page
- **Tab**: Navigate between form fields
- **Enter**: Submit forms
- **Esc**: Close dialogs

## Data Privacy

- Passwords are never displayed in the interface
- User data is stored securely in the backend
- Only administrators can view user information
- Deleted users are permanently removed
