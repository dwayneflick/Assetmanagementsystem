# Settings Module - User Management System

## Overview
A comprehensive Settings page that provides administrators with complete user management capabilities.

## Features Implemented

### 1. Access Control
- **Admin-Only Access**: Only users with admin role can access the Settings page
- **Access Denial UI**: Non-admin users see a clear message that they don't have permission
- **Sidebar Integration**: Settings menu item only appears for admin users

### 2. User Management Dashboard
- **User Statistics Cards**:
  - Total Users count
  - Total Administrators count
  - Total Agents count
  
### 3. User Operations

#### Add New User
- Create new user accounts with:
  - Username (required, unique)
  - Full Name (required)
  - Email (optional)
  - Role (Agent or Administrator)
  - Password (required, minimum 6 characters)
- Automatic ID generation
- Creation timestamp tracking

#### Edit User Profile
- Update user information:
  - Full Name
  - Email address
  - Role (Agent/Admin)
- Username cannot be changed (system constraint)
- Real-time validation

#### Change User Password
- Admin can reset any user's password
- Password confirmation required
- Minimum 6 character requirement
- Secure password handling

#### Delete User
- Remove user accounts from the system
- Safety Features:
  - Confirmation dialog before deletion
  - Cannot delete yourself while logged in
  - Cannot delete the last admin user
  - Permanent deletion warning

#### Send Invitation
- Send email invitations to new users
- Specify role during invitation
- Email validation
- Ready for email service integration (SendGrid, AWS SES, etc.)

### 4. User Interface Features

#### Search & Filter
- Real-time search functionality
- Search across:
  - Username
  - Full name
  - Email address
- Instant results filtering

#### User Table
- Displays all users with:
  - Username
  - Full Name
  - Email (with fallback for missing emails)
  - Role badge (color-coded)
  - Action buttons
- Mobile-responsive design:
  - Horizontal scroll on small screens
  - Condensed view on mobile
  - Hidden columns on smaller devices

#### Visual Design
- Role badges:
  - Admin: Purple badge with gradient
  - Agent: Secondary gray badge
- Action buttons with icons:
  - Edit (pencil icon)
  - Change Password (key icon)
  - Delete (trash icon, red theme)
- Beautiful gradient cards for statistics
- Modern dialog modals for all forms

### 5. Mobile Responsiveness
- Fully responsive layout
- Collapsible columns on smaller screens
- Touch-friendly action buttons
- Optimized forms for mobile input
- Responsive statistics cards (stacks on mobile)

### 6. Form Validation
- Required field indicators (red asterisk)
- Client-side validation:
  - Username uniqueness
  - Email format validation
  - Password strength (minimum 6 chars)
  - Password confirmation match
- Server-side validation:
  - Duplicate username checking
  - Role validation
  - Data integrity checks

### 7. User Experience
- Toast notifications for all actions:
  - Success messages
  - Error messages with details
  - Informational alerts
- Loading states during operations
- Empty states with helpful messages
- Confirmation dialogs for destructive actions
- Cancel buttons on all dialogs

## Backend API Endpoints

### GET /make-server-5921d82e/users
- Fetch all users
- Returns users without passwords
- No authentication required (filtered in response)

### POST /make-server-5921d82e/users
- Create new user
- Validates username uniqueness
- Auto-generates user ID
- Returns created user

### PUT /make-server-5921d82e/users/:id
- Update user profile (name, email, role)
- Finds user by ID
- Preserves username
- Returns updated user

### PUT /make-server-5921d82e/users/:id/password
- Change user password
- Validates password length
- Updates password securely
- Returns success status

### DELETE /make-server-5921d82e/users/:id
- Delete user account
- Prevents deletion of last admin
- Permanent deletion
- Returns success status

### POST /make-server-5921d82e/users/invite
- Send invitation email
- Validates email format
- Logs invitation (ready for email integration)
- Returns success with invitation details

## Security Features
1. Role-based access control (admin only)
2. Password minimum length requirement
3. Cannot delete last admin
4. Secure password storage in backend
5. Passwords never exposed in API responses
6. Username immutability after creation

## Data Model

```typescript
interface SystemUser {
  id: string;              // Auto-generated
  username: string;        // Unique, lowercase
  name: string;           // Full display name
  role: "admin" | "agent"; // User role
  email?: string;         // Optional email
  createdAt?: string;     // ISO timestamp
}
```

## Future Enhancements
1. Email service integration for invitations
2. Bulk user operations
3. User activity logs
4. Password reset via email
5. Two-factor authentication
6. User profile pictures
7. Last login tracking
8. User deactivation (soft delete)
9. Export user list to CSV
10. Advanced filtering and sorting

## Navigation
- Access: Main sidebar → Settings (admin only)
- Icon: Settings gear icon
- Location: Bottom of navigation menu

## Component Files
- `/components/Settings.tsx` - Main settings component
- `/App.tsx` - Updated with Settings route
- `/components/Sidebar.tsx` - Updated with Settings menu item
- `/supabase/functions/server/index.tsx` - User management API endpoints
