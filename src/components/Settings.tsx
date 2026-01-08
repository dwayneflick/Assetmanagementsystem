import { useState, useEffect } from "react";
import { User } from "../App";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { toast } from "sonner@2.0.3";
import {
  UserPlus,
  Edit,
  Key,
  Mail,
  Trash2,
  Search,
  Shield,
  Users,
  Settings as SettingsIcon,
  Copy,
  Check,
  Workflow,
  UserCircle,
  Lock,
  Database,
  FileText,
  Sparkles,
} from "lucide-react";
import WorkflowSettings from "./WorkflowSettings";
import AccessControl from "./AccessControl";
import DataManagement from "./DataManagement";
import SystemLogs from "./SystemLogs";
import AdminDemoData from "./AdminDemoData";

interface SettingsProps {
  user: User;
}

interface SystemUser {
  id: string;
  username: string;
  name: string;
  role: "admin" | "agent";
  email?: string;
  createdAt?: string;
}

export default function Settings({ user }: SettingsProps) {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showSendInvite, setShowSendInvite] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);

  // Form states
  const [newUsername, setNewUsername] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "agent">("agent");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<"admin" | "agent">("agent");
  const [editEmail, setEditEmail] = useState("");

  const [changePassword, setChangePassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "agent">("agent");
  const [inviteCredentials, setInviteCredentials] = useState<{
    email: string;
    username: string;
    password: string;
    role: string;
    emailSent?: boolean;
  } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/users`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newUsername || !newName || !newPassword) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Password validation: alphanumeric with symbols, 6-12 characters
    if (newPassword.length < 6 || newPassword.length > 12) {
      toast.error("Password must be between 6 and 12 characters");
      return;
    }

    // Check for alphanumeric and symbol requirement
    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);

    if (!hasLetter || !hasNumber || !hasSymbol) {
      toast.error("Password must contain letters, numbers, and at least one symbol");
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/users`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            username: newUsername,
            name: newName,
            role: newRole,
            email: newEmail || undefined,
            password: newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to add user");
        return;
      }

      toast.success("User added successfully!");
      setShowAddUser(false);
      resetAddForm();
      fetchUsers();
    } catch (error) {
      console.error("Error adding user:", error);
      toast.error("An error occurred while adding user");
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser || !editName) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/users/${selectedUser.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            name: editName,
            role: editRole,
            email: editEmail || undefined,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to update user");
        return;
      }

      toast.success("User updated successfully!");
      setShowEditUser(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("An error occurred while updating user");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser || !changePassword) {
      toast.error("Please enter a new password");
      return;
    }

    if (changePassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    // Password validation: alphanumeric with symbols, 6-12 characters
    if (changePassword.length < 6 || changePassword.length > 12) {
      toast.error("Password must be between 6 and 12 characters");
      return;
    }

    // Check for alphanumeric and symbol requirement
    const hasLetter = /[a-zA-Z]/.test(changePassword);
    const hasNumber = /[0-9]/.test(changePassword);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(changePassword);

    if (!hasLetter || !hasNumber || !hasSymbol) {
      toast.error("Password must contain letters, numbers, and at least one symbol");
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/users/${selectedUser.id}/password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            password: changePassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to change password");
        return;
      }

      toast.success("Password changed successfully!");
      setShowChangePassword(false);
      setSelectedUser(null);
      setChangePassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("An error occurred while changing password");
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteEmail) {
      toast.error("Please enter an email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/users/invite`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            email: inviteEmail,
            role: inviteRole,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to send invite");
        return;
      }

      if (data.emailSent) {
        toast.success(`✅ Invitation email sent to ${inviteEmail}!`);
      } else {
        toast.success(`User created! Copy credentials to share manually.`);
      }
      setShowSendInvite(false);
      setInviteEmail("");
      setInviteRole("agent");
      setInviteCredentials(data.credentials);
    } catch (error) {
      console.error("Error sending invite:", error);
      toast.error("An error occurred while sending invite");
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/users/${userId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to delete user");
        return;
      }

      toast.success("User deleted successfully!");
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("An error occurred while deleting user");
    }
  };

  const resetAddForm = () => {
    setNewUsername("");
    setNewName("");
    setNewRole("agent");
    setNewEmail("");
    setNewPassword("");
  };

  const openEditDialog = (user: SystemUser) => {
    setSelectedUser(user);
    setEditName(user.name);
    setEditRole(user.role);
    setEditEmail(user.email || "");
    setShowEditUser(true);
  };

  const openPasswordDialog = (user: SystemUser) => {
    setSelectedUser(user);
    setChangePassword("");
    setConfirmPassword("");
    setShowChangePassword(true);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl lg:text-3xl mb-2">Settings</h1>
            <p className="text-gray-600">
              {user.role === "admin" 
                ? "Manage system settings, users, and workflows" 
                : "Manage your profile and account settings"}
            </p>
          </div>

          {/* Stats Cards - Only for Admins */}
          {user.role === "admin" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Users</p>
                      <p className="text-3xl mt-2">{users.length}</p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Active users in system
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Administrators</p>
                      <p className="text-3xl mt-2">
                        {users.filter((u) => u.role === "admin").length}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        Users with full access
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Agents</p>
                      <p className="text-3xl mt-2">
                        {users.filter((u) => u.role === "agent").length}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Users with limited access
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Settings Tabs */}
          <Tabs defaultValue="profile" className="space-y-4">
            {user.role === "admin" ? (
              // Admin sees all 6 tabs - responsive layout
              <div className="w-full overflow-x-auto">
                <TabsList className="inline-flex w-full min-w-max lg:grid lg:grid-cols-6 lg:max-w-6xl">
                  <TabsTrigger value="profile" className="flex items-center gap-2 whitespace-nowrap">
                    <UserCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">My Profile</span>
                    <span className="sm:hidden">Profile</span>
                  </TabsTrigger>
                  <TabsTrigger value="users" className="flex items-center gap-2 whitespace-nowrap">
                    <Users className="w-4 h-4" />
                    <span className="hidden sm:inline">User Management</span>
                    <span className="sm:hidden">Users</span>
                  </TabsTrigger>
                  <TabsTrigger value="access-control" className="flex items-center gap-2 whitespace-nowrap">
                    <Lock className="w-4 h-4" />
                    <span className="hidden sm:inline">Access Control</span>
                    <span className="sm:hidden">Access</span>
                  </TabsTrigger>
                  <TabsTrigger value="data-management" className="flex items-center gap-2 whitespace-nowrap">
                    <Database className="w-4 h-4" />
                    <span className="hidden sm:inline">Data Management</span>
                    <span className="sm:hidden">Data</span>
                  </TabsTrigger>
                  <TabsTrigger value="logs" className="flex items-center gap-2 whitespace-nowrap">
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">Logs</span>
                    <span className="sm:hidden">Logs</span>
                  </TabsTrigger>
                  <TabsTrigger value="workflow" className="flex items-center gap-2 whitespace-nowrap">
                    <Workflow className="w-4 h-4" />
                    <span className="hidden sm:inline">Workflow Settings</span>
                    <span className="sm:hidden">Workflow</span>
                  </TabsTrigger>
                </TabsList>
              </div>
            ) : (
              // Agents see only My Profile tab
              <TabsList className="grid w-full grid-cols-1 max-w-md">
                <TabsTrigger value="profile" className="flex items-center gap-2">
                  <UserCircle className="w-4 h-4" />
                  My Profile
                </TabsTrigger>
              </TabsList>
            )}
            
            {/* My Profile Tab */}
            <TabsContent value="profile" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Profile Information Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      View and update your personal information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const newName = formData.get("profileName") as string;
                        const newEmail = formData.get("profileEmail") as string;

                        if (!newName) {
                          toast.error("Name is required");
                          return;
                        }

                        try {
                          const response = await fetch(
                            `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/users/${user.id}`,
                            {
                              method: "PUT",
                              headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${publicAnonKey}`,
                              },
                              body: JSON.stringify({
                                name: newName,
                                role: user.role,
                                email: newEmail || undefined,
                              }),
                            }
                          );

                          const data = await response.json();

                          if (!response.ok) {
                            toast.error(data.error || "Failed to update profile");
                            return;
                          }

                          toast.success("Profile updated successfully! Please refresh to see changes.");
                        } catch (error) {
                          console.error("Error updating profile:", error);
                          toast.error("An error occurred while updating profile");
                        }
                      }}
                      className="space-y-4"
                    >
                      <div>
                        <Label htmlFor="profileUsername">
                          Username
                        </Label>
                        <Input
                          id="profileUsername"
                          value={user.username}
                          disabled
                          className="bg-gray-100"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Username cannot be changed
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="profileName">
                          Full Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="profileName"
                          name="profileName"
                          defaultValue={user.name}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="profileEmail">
                          Email (Optional)
                        </Label>
                        <Input
                          id="profileEmail"
                          name="profileEmail"
                          type="email"
                          defaultValue={user.email || ""}
                          placeholder="your.email@example.com"
                        />
                      </div>
                      <div>
                        <Label>Role</Label>
                        <div className="mt-2">
                          <Badge variant={user.role === "admin" ? "default" : "secondary"} className={user.role === "admin" ? "bg-purple-100 text-purple-700" : ""}>
                            {user.role === "admin" ? "Administrator" : "Agent"}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-red-900 to-rose-900"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Update Profile
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Change Password Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>
                      Update your password to keep your account secure
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const currentPassword = formData.get("currentPassword") as string;
                        const newPassword = formData.get("newPassword") as string;
                        const confirmPassword = formData.get("confirmPassword") as string;

                        if (!currentPassword || !newPassword || !confirmPassword) {
                          toast.error("Please fill in all fields");
                          return;
                        }

                        if (newPassword !== confirmPassword) {
                          toast.error("New passwords do not match");
                          return;
                        }

                        // Password validation
                        if (newPassword.length < 6 || newPassword.length > 12) {
                          toast.error("Password must be between 6 and 12 characters");
                          return;
                        }

                        const hasLetter = /[a-zA-Z]/.test(newPassword);
                        const hasNumber = /[0-9]/.test(newPassword);
                        const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);

                        if (!hasLetter || !hasNumber || !hasSymbol) {
                          toast.error("Password must contain letters, numbers, and at least one symbol");
                          return;
                        }

                        try {
                          const response = await fetch(
                            `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/users/${user.id}/password`,
                            {
                              method: "PUT",
                              headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${publicAnonKey}`,
                              },
                              body: JSON.stringify({
                                currentPassword,
                                newPassword,
                              }),
                            }
                          );

                          const data = await response.json();

                          if (!response.ok) {
                            toast.error(data.error || "Failed to change password");
                            return;
                          }

                          toast.success("Password changed successfully!");
                          e.currentTarget.reset();
                        } catch (error) {
                          console.error("Error changing password:", error);
                          toast.error("An error occurred while changing password");
                        }
                      }}
                      className="space-y-4"
                    >
                      <div>
                        <Label htmlFor="currentPassword">
                          Current Password <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="currentPassword"
                          name="currentPassword"
                          type="password"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="newPassword">
                          New Password <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="newPassword"
                          name="newPassword"
                          type="password"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          6-12 characters with letters, numbers, and symbols
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="confirmPassword">
                          Confirm New Password <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          required
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-red-900 to-rose-900"
                      >
                        <Key className="w-4 h-4 mr-2" />
                        Update Password
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Account Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Details</CardTitle>
                  <CardDescription>
                    Your account information and registration details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-xs text-gray-600 mb-1">USERNAME</div>
                      <div className="font-medium text-gray-900">{user.username}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-xs text-gray-600 mb-1">FULL NAME</div>
                      <div className="font-medium text-gray-900">{user.name}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-xs text-gray-600 mb-1">ROLE</div>
                      <div>
                        <Badge variant={user.role === "admin" ? "default" : "secondary"} className={user.role === "admin" ? "bg-purple-100 text-purple-700" : ""}>
                          {user.role === "admin" ? "Administrator" : "Agent"}
                        </Badge>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-xs text-gray-600 mb-1">EMAIL</div>
                      <div className="font-medium text-gray-900 truncate">
                        {user.email || <span className="text-gray-400 text-sm">Not set</span>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* User Management Tab */}
            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <CardTitle>User Management</CardTitle>
                      <CardDescription>
                        {user.role === "admin" 
                          ? "Add, edit, and manage system users" 
                          : "View users and manage passwords"}
                      </CardDescription>
                    </div>
                    {user.role === "admin" && (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => setShowSendInvite(true)}
                          variant="outline"
                          size="sm"
                          className="flex-1 lg:flex-none"
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Send Invite
                        </Button>
                        <Button
                          onClick={() => setShowAddUser(true)}
                          size="sm"
                          className="flex-1 lg:flex-none"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Add User
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Search */}
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Search users by name, username, or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Users Table */}
                  {loading ? (
                    <div className="text-center py-12 text-gray-500">
                      Loading users...
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      {searchQuery ? "No users found matching your search" : "No users found"}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Username</TableHead>
                            <TableHead className="hidden md:table-cell">Name</TableHead>
                            <TableHead className="hidden lg:table-cell">Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUsers.map((u) => (
                            <TableRow key={u.id}>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">{u.username}</span>
                                  <span className="md:hidden text-xs text-gray-500">{u.name}</span>
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">{u.name}</TableCell>
                              <TableCell className="hidden lg:table-cell">
                                {u.email || <span className="text-gray-400">-</span>}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={u.role === "admin" ? "default" : "secondary"}
                                  className={
                                    u.role === "admin"
                                      ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                                      : ""
                                  }
                                >
                                  {u.role}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1 lg:gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEditDialog(u)}
                                    className="h-8 w-8 p-0"
                                    title="Edit user"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openPasswordDialog(u)}
                                    className="h-8 w-8 p-0"
                                    title="Change password"
                                  >
                                    <Key className="w-4 h-4" />
                                  </Button>
                                  {user.role === "admin" && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteUser(u.id, u.username)}
                                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      title="Delete user"
                                      disabled={u.id === user.id}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Access Control Tab */}
            <TabsContent value="access-control" className="space-y-4">
              <AccessControl />
            </TabsContent>

            {/* Data Management Tab */}
            <TabsContent value="data-management" className="space-y-4">
              <DataManagement />
            </TabsContent>

            {/* Logs Tab */}
            <TabsContent value="logs" className="space-y-4">
              <SystemLogs />
            </TabsContent>

            {/* Workflow Settings Tab */}
            <TabsContent value="workflow" className="space-y-4">
              <WorkflowSettings />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Add User Dialog */}
      <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account for the system
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div>
              <Label htmlFor="username">
                Username <span className="text-red-500">*</span>
              </Label>
              <Input
                id="username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="e.g., jdoe"
                required
              />
            </div>
            <div>
              <Label htmlFor="name">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., John Doe"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="e.g., john@example.com"
              />
            </div>
            <div>
              <Label htmlFor="role">
                Role <span className="text-red-500">*</span>
              </Label>
              <Select value={newRole} onValueChange={(value: "admin" | "agent") => setNewRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="password">
                Password <span className="text-red-500">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="6-12 characters"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Must be 6-12 characters with letters, numbers, and symbols
              </p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddUser(false);
                  resetAddForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Add User</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditUser} onOpenChange={setShowEditUser}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and role
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditUser} className="space-y-4">
            <div>
              <Label>Username</Label>
              <Input
                value={selectedUser?.username || ""}
                disabled
                className="bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Username cannot be changed
              </p>
            </div>
            <div>
              <Label htmlFor="edit-name">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email (Optional)</Label>
              <Input
                id="edit-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-role">
                Role <span className="text-red-500">*</span>
              </Label>
              <Select value={editRole} onValueChange={(value: "admin" | "agent") => setEditRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditUser(false);
                  setSelectedUser(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Set a new password for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <Label htmlFor="new-password">
                New Password <span className="text-red-500">*</span>
              </Label>
              <Input
                id="new-password"
                type="password"
                value={changePassword}
                onChange={(e) => setChangePassword(e.target.value)}
                placeholder="Min. 6 characters"
                required
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">
                Confirm Password <span className="text-red-500">*</span>
              </Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowChangePassword(false);
                  setSelectedUser(null);
                  setChangePassword("");
                  setConfirmPassword("");
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Change Password</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Send Invite Dialog */}
      <Dialog open={showSendInvite} onOpenChange={setShowSendInvite}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Invitation</DialogTitle>
            <DialogDescription>
              Send an email invitation to join the system
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSendInvite} className="space-y-4">
            <div>
              <Label htmlFor="invite-email">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="user@example.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="invite-role">
                Role <span className="text-red-500">*</span>
              </Label>
              <Select value={inviteRole} onValueChange={(value: "admin" | "agent") => setInviteRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Alert className="bg-blue-50 border-blue-200">
              <Mail className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                An invitation email will be sent with instructions to set up their account.
              </AlertDescription>
            </Alert>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowSendInvite(false);
                  setInviteEmail("");
                  setInviteRole("agent");
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Send Invite</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Invitation Credentials Dialog */}
      <Dialog open={!!inviteCredentials} onOpenChange={() => setInviteCredentials(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              Invitation Sent Successfully
            </DialogTitle>
            <DialogDescription>
              User account created! Share these credentials securely.
            </DialogDescription>
          </DialogHeader>
          
          {inviteCredentials && (
            <div className="space-y-4">
              {inviteCredentials.emailSent ? (
                <Alert className="bg-green-50 border-green-200">
                  <Check className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 text-sm">
                    ✅ <strong>Email sent successfully!</strong> The invitation has been delivered to <strong>{inviteCredentials.email}</strong>.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="bg-yellow-50 border-yellow-200">
                  <Mail className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800 text-sm">
                    📋 <strong>Email not configured.</strong> Please copy and share these credentials with <strong>{inviteCredentials.email}</strong> manually.
                  </AlertDescription>
                </Alert>
              )}

              <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200">
                <h4 className="text-sm font-medium text-gray-900">Login Credentials</h4>
                
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs text-gray-600">Email</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        value={inviteCredentials.email}
                        readOnly
                        className="bg-white text-sm"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(inviteCredentials.email);
                          toast.success("Email copied!");
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-gray-600">Username</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        value={inviteCredentials.username}
                        readOnly
                        className="bg-white text-sm"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(inviteCredentials.username);
                          toast.success("Username copied!");
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-gray-600">Temporary Password</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        value={inviteCredentials.password}
                        readOnly
                        className="bg-white text-sm font-mono"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(inviteCredentials.password);
                          toast.success("Password copied!");
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-gray-600">Role</Label>
                    <div className="mt-1">
                      <Badge
                        variant={inviteCredentials.role === "admin" ? "default" : "secondary"}
                        className={
                          inviteCredentials.role === "admin"
                            ? "bg-purple-100 text-purple-700"
                            : ""
                        }
                      >
                        {inviteCredentials.role}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <Alert className="bg-yellow-50 border-yellow-200">
                <Shield className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800 text-sm">
                  <strong>Important:</strong> Copy these credentials now. The password is temporary and should be changed on first login.
                </AlertDescription>
              </Alert>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-900">
                  <strong>To enable automated emails:</strong>
                </p>
                <ol className="text-xs text-blue-800 mt-2 space-y-1 ml-4 list-decimal">
                  <li>Sign up for a free account at <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="underline">resend.com</a></li>
                  <li>Get your API key from the dashboard</li>
                  <li>Add it as the RESEND_API_KEY environment variable</li>
                  <li>Future invites will be sent automatically!</li>
                </ol>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              onClick={() => {
                setInviteCredentials(null);
                fetchUsers(); // Refresh user list
              }}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}