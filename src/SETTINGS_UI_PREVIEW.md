# Settings Page - UI Preview & Layout

## Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  🔧 System Settings                          [Send Invite] [Add User]  │
│  Manage users, roles, and system configuration                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Total Users  │  │ Adminis...   │  │ Agents       │         │
│  │     5        │  │     2        │  │     3        │         │
│  │ 👥 Active... │  │ 🛡️ Users... │  │ 👥 Users... │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│  User Management                                                 │
│  Add, edit, and manage system users                              │
│                                                                   │
│  🔍 [Search users by name, username, or email...]               │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Username  │ Name     │ Email           │ Role  │ Actions│   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ admin     │ Admin    │ -               │[ADMIN]│ ✏️🔑🗑️ │   │
│  │ kingsley  │ Kingsley │ -               │[ADMIN]│ ✏️🔑🗑️ │   │
│  │ lateef    │ Lateef   │ -               │[AGENT]│ ✏️🔑🗑️ │   │
│  │ kelvin    │ Kelvin   │ -               │[AGENT]│ ✏️🔑🗑️ │   │
│  │ mosun     │ Mosun    │ -               │[AGENT]│ ✏️🔑🗑️ │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Color Scheme

### Statistics Cards
- **Background**: White with subtle shadow
- **Border**: Light gray (#e5e7eb)
- **Title**: Gray (#6b7280)
- **Number**: Large, bold, dark gray (#111827)
- **Icon**: Blue (#3b82f6)

### User Table
- **Header**: Light gray background (#f9fafb)
- **Rows**: White with hover effect
- **Borders**: Light gray (#e5e7eb)
- **Search**: White with focus ring (blue)

### Role Badges
- **Admin Badge**: 
  - Background: Purple gradient (#c084fc to #a855f7)
  - Text: White
  - Border: Transparent
  
- **Agent Badge**:
  - Background: Gray (#e5e7eb)
  - Text: Dark gray (#374151)
  - Border: Transparent

### Action Buttons
- **Edit (Pencil)**: Gray, hover blue
- **Password (Key)**: Gray, hover blue
- **Delete (Trash)**: Red (#ef4444), hover darker red
- **Disabled Delete**: Gray with reduced opacity

### Primary Buttons
- **Add User**: Blue gradient (#3b82f6 to #2563eb)
- **Send Invite**: Outlined, gray border
- **Submit**: Blue gradient
- **Cancel**: Gray, outlined

## Dialog Layouts

### Add User Dialog
```
┌─────────────────────────────────────┐
│ Add New User                    [×] │
│ Create a new user account           │
├─────────────────────────────────────┤
│                                     │
│ Username *                          │
│ [________________]                  │
│                                     │
│ Full Name *                         │
│ [________________]                  │
│                                     │
│ Email (Optional)                    │
│ [________________]                  │
│                                     │
│ Role *                              │
│ [Agent ▼]                           │
│                                     │
│ Password *                          │
│ [________________]                  │
│ Password must be at least 6 chars   │
│                                     │
├─────────────────────────────────────┤
│            [Cancel]  [Add User]     │
└─────────────────────────────────────┘
```

### Edit User Dialog
```
┌─────────────────────────────────────┐
│ Edit User                       [×] │
│ Update user information             │
├─────────────────────────────────────┤
│                                     │
│ Username                            │
│ [admin___________] (disabled)       │
│ Username cannot be changed          │
│                                     │
│ Full Name *                         │
│ [Admin___________]                  │
│                                     │
│ Email (Optional)                    │
│ [________________]                  │
│                                     │
│ Role *                              │
│ [Administrator ▼]                   │
│                                     │
├─────────────────────────────────────┤
│         [Cancel]  [Save Changes]    │
└─────────────────────────────────────┘
```

### Change Password Dialog
```
┌─────────────────────────────────────┐
│ Change Password                 [×] │
│ Set a new password for Admin        │
├─────────────────────────────────────┤
│                                     │
│ New Password *                      │
│ [________________]                  │
│                                     │
│ Confirm Password *                  │
│ [________________]                  │
│                                     │
├─────────────────────────────────────┤
│       [Cancel]  [Change Password]   │
└─────────────────────────────────────┘
```

### Send Invitation Dialog
```
┌─────────────────────────────────────┐
│ Send Invitation                 [×] │
│ Send email invitation to join       │
├─────────────────────────────────────┤
│                                     │
│ Email Address *                     │
│ [user@example.com]                  │
│                                     │
│ Role *                              │
│ [Agent ▼]                           │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ ℹ️ An invitation email will │   │
│ │   be sent with setup        │   │
│ │   instructions.             │   │
│ └─────────────────────────────┘   │
│                                     │
├─────────────────────────────────────┤
│         [Cancel]  [Send Invite]     │
└─────────────────────────────────────┘
```

## Mobile Layout (< 768px)

### Header
```
┌─────────────────────────────────────┐
│ 🔧 System Settings                  │
│ Manage users, roles...              │
│                                     │
│ [Send Invite]                       │
│ [Add User]                          │
└─────────────────────────────────────┘
```

### Stats Cards (Stacked)
```
┌─────────────────────────────────────┐
│ Total Users                         │
│       5                             │
│ 👥 Active users in system           │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Administrators                      │
│       2                             │
│ 🛡️ Users with full access           │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Agents                              │
│       3                             │
│ 👥 Users with limited access        │
└─────────────────────────────────────┘
```

### User Table (Horizontal Scroll)
```
┌─────────────────────────────────────┐
│ User Management                     │
│ 🔍 [Search...]                      │
│                                     │
│ ← Swipe to view all columns →      │
│ ┌─────────────────────────────┐   │
│ │Username  │ Role  │ Actions  │   │
│ │ admin    │[ADMIN]│ ✏️🔑🗑️   │   │
│ │ Lateef   │       │          │   │
│ └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

## Visual States

### Empty State
```
┌─────────────────────────────────────┐
│                                     │
│            🔍                       │
│     No users found                  │
│                                     │
└─────────────────────────────────────┘
```

### Loading State
```
┌─────────────────────────────────────┐
│                                     │
│            ⏳                       │
│     Loading users...                │
│                                     │
└─────────────────────────────────────┘
```

### Access Denied State
```
┌─────────────────────────────────────┐
│ ⚠️ Access Denied. Only             │
│    administrators can access        │
│    settings.                        │
└─────────────────────────────────────┘
```

## Toast Notifications

### Success Messages
```
✅ User added successfully!
✅ User updated successfully!
✅ Password changed successfully!
✅ User deleted successfully!
✅ Invitation sent to user@example.com!
```

### Error Messages
```
❌ Please fill in all required fields
❌ Password must be at least 6 characters
❌ Passwords do not match
❌ Username already exists
❌ Cannot delete the last admin user
❌ Failed to load users
❌ Please enter a valid email address
```

### Info Messages
```
ℹ️ Please change your default password
```

## Interactive Elements

### Hover Effects
- **Table Rows**: Background changes to light gray (#f9fafb)
- **Buttons**: Slightly darker shade
- **Action Icons**: Color change (blue for edit/key, red for delete)
- **Cards**: Subtle shadow increase

### Focus States
- **Inputs**: Blue ring around field
- **Buttons**: Blue outline
- **Select**: Blue border

### Disabled States
- **Delete Self**: Trash icon grayed out, no hover effect
- **Submit with Errors**: Button grayed out
- **Username Field in Edit**: Gray background, no cursor

## Responsive Breakpoints

- **Desktop**: > 1024px - Full layout, all columns visible
- **Tablet**: 768px - 1024px - Condensed layout, some columns hidden
- **Mobile**: < 768px - Stacked cards, horizontal scroll table

## Accessibility Features

- **ARIA Labels**: All buttons and icons have descriptive labels
- **Keyboard Navigation**: Tab through forms, Enter to submit
- **Color Contrast**: WCAG AA compliant
- **Focus Indicators**: Visible focus rings on all interactive elements
- **Screen Reader**: Descriptive text for all actions
- **Required Fields**: Asterisk (*) and aria-required attribute

## Animation & Transitions

- **Dialog Open/Close**: Fade in/out (200ms)
- **Button Hover**: Color transition (150ms)
- **Table Row Hover**: Background transition (100ms)
- **Toast Notifications**: Slide in from top-right (300ms)
- **Loading States**: Subtle pulse animation

## Typography

- **Page Title**: 2xl (24px), bold, gray-900
- **Card Title**: 3xl (30px), bold, gray-900
- **Card Description**: sm (14px), gray-600
- **Table Headers**: sm (14px), semi-bold, gray-700
- **Table Data**: sm (14px), regular, gray-900
- **Labels**: sm (14px), medium, gray-700
- **Helper Text**: xs (12px), gray-500

## Icons Used

- ⚙️ Settings (gear icon) - Navigation
- 👥 Users - Statistics
- 🛡️ Shield - Admin role
- ➕ UserPlus - Add user
- 📧 Mail - Send invite
- ✏️ Edit - Edit user
- 🔑 Key - Change password
- 🗑️ Trash - Delete user
- 🔍 Search - Search functionality
- ℹ️ Info - Informational alerts
- ⚠️ Warning - Access denied
- ✅ Check - Success
- ❌ X - Error
- ⏳ Loading - Processing

## Component Hierarchy

```
Settings
├── Header Section
│   ├── Title & Description
│   └── Action Buttons (Send Invite, Add User)
├── Statistics Cards Section
│   ├── Total Users Card
│   ├── Administrators Card
│   └── Agents Card
└── User Management Card
    ├── Search Bar
    └── User Table
        ├── Table Header
        └── Table Body
            └── User Rows
                └── Action Buttons
```

## Z-Index Layers

1. Base Page: z-0
2. Sticky Headers: z-10
3. Dropdown Menus: z-20
4. Dialogs/Modals: z-50
5. Toast Notifications: z-100

This ensures proper stacking and visibility of UI elements.
