import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Button } from "./ui/button";
import { toast } from "sonner@2.0.3";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { Shield, Save, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";

export interface AgentPermissions {
  canViewStats: boolean;
  canViewUserManagement: boolean;
  canViewWorkflowSettings: boolean;
  canViewOtherUsers: boolean;
  canEditOtherUsers: boolean;
  canDeleteUsers: boolean;
  canAddUsers: boolean;
  canSendInvites: boolean;
}

export default function AccessControl() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState<AgentPermissions>({
    canViewStats: false,
    canViewUserManagement: false,
    canViewWorkflowSettings: false,
    canViewOtherUsers: false,
    canEditOtherUsers: false,
    canDeleteUsers: false,
    canAddUsers: false,
    canSendInvites: false,
  });

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/access-control`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch permissions");
      }

      const data = await response.json();
      if (data.permissions) {
        setPermissions(data.permissions);
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
      toast.error("Failed to load access control settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/access-control`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ permissions }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save permissions");
      }

      toast.success("Access control settings saved successfully!");
    } catch (error) {
      console.error("Error saving permissions:", error);
      toast.error("Failed to save access control settings");
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (key: keyof AgentPermissions) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading access control settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 border-blue-200">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 text-sm">
          <strong>Note:</strong> These settings control what features are
          available to <strong>Agents</strong>. Admins always have full access
          to all features.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Agent Permissions
          </CardTitle>
          <CardDescription>
            Configure what features and actions agents can access in the system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Settings Interface Permissions */}
          <div>
            <h3 className="text-sm font-medium mb-4 text-gray-900">
              Settings Interface
            </h3>
            <div className="space-y-4 pl-4 border-l-2 border-gray-200">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <Label htmlFor="stats" className="cursor-pointer">
                    View Stats Cards
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Show user statistics (Total Users, Admins, Agents)
                  </p>
                </div>
                <Switch
                  id="stats"
                  checked={permissions.canViewStats}
                  onCheckedChange={() => togglePermission("canViewStats")}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <Label
                    htmlFor="user-management-tab"
                    className="cursor-pointer"
                  >
                    View User Management Tab
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Access the User Management tab in Settings
                  </p>
                </div>
                <Switch
                  id="user-management-tab"
                  checked={permissions.canViewUserManagement}
                  onCheckedChange={() =>
                    togglePermission("canViewUserManagement")
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <Label
                    htmlFor="workflow-settings-tab"
                    className="cursor-pointer"
                  >
                    View Workflow Settings Tab
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Access the Workflow Settings tab in Settings
                  </p>
                </div>
                <Switch
                  id="workflow-settings-tab"
                  checked={permissions.canViewWorkflowSettings}
                  onCheckedChange={() =>
                    togglePermission("canViewWorkflowSettings")
                  }
                />
              </div>
            </div>
          </div>

          {/* User Management Permissions */}
          <div>
            <h3 className="text-sm font-medium mb-4 text-gray-900">
              User Management Actions
            </h3>
            <div className="space-y-4 pl-4 border-l-2 border-gray-200">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <Label htmlFor="view-users" className="cursor-pointer">
                    View Other Users
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    See the list of all users in the system
                  </p>
                </div>
                <Switch
                  id="view-users"
                  checked={permissions.canViewOtherUsers}
                  onCheckedChange={() => togglePermission("canViewOtherUsers")}
                  disabled={!permissions.canViewUserManagement}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <Label htmlFor="edit-users" className="cursor-pointer">
                    Edit Other Users
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Edit other users' names, emails, roles, and passwords
                  </p>
                </div>
                <Switch
                  id="edit-users"
                  checked={permissions.canEditOtherUsers}
                  onCheckedChange={() => togglePermission("canEditOtherUsers")}
                  disabled={!permissions.canViewUserManagement}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <Label htmlFor="delete-users" className="cursor-pointer">
                    Delete Users
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Remove users from the system permanently
                  </p>
                </div>
                <Switch
                  id="delete-users"
                  checked={permissions.canDeleteUsers}
                  onCheckedChange={() => togglePermission("canDeleteUsers")}
                  disabled={!permissions.canViewUserManagement}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <Label htmlFor="add-users" className="cursor-pointer">
                    Add New Users
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Create new user accounts manually
                  </p>
                </div>
                <Switch
                  id="add-users"
                  checked={permissions.canAddUsers}
                  onCheckedChange={() => togglePermission("canAddUsers")}
                  disabled={!permissions.canViewUserManagement}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <Label htmlFor="send-invites" className="cursor-pointer">
                    Send Email Invites
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Send invitation emails to new users
                  </p>
                </div>
                <Switch
                  id="send-invites"
                  checked={permissions.canSendInvites}
                  onCheckedChange={() => togglePermission("canSendInvites")}
                  disabled={!permissions.canViewUserManagement}
                />
              </div>
            </div>
          </div>

          {/* Default Permissions Alert */}
          <Alert className="bg-green-50 border-green-200">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 text-sm">
              <strong>Always Available:</strong> All users (agents and admins)
              can always edit their own profile and change their own password.
            </AlertDescription>
          </Alert>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-red-900 to-rose-900"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Permission Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Permission Summary</CardTitle>
          <CardDescription>
            Quick overview of current agent permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">
                Agents Can:
              </h4>
              <ul className="space-y-1 text-sm">
                <li className="flex items-center gap-2 text-green-600">
                  <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                  Edit their own profile
                </li>
                <li className="flex items-center gap-2 text-green-600">
                  <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                  Change their own password
                </li>
                {permissions.canViewStats && (
                  <li className="flex items-center gap-2 text-green-600">
                    <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                    View stats cards
                  </li>
                )}
                {permissions.canViewUserManagement && (
                  <li className="flex items-center gap-2 text-green-600">
                    <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                    Access User Management tab
                  </li>
                )}
                {permissions.canViewWorkflowSettings && (
                  <li className="flex items-center gap-2 text-green-600">
                    <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                    Access Workflow Settings tab
                  </li>
                )}
                {permissions.canViewOtherUsers && (
                  <li className="flex items-center gap-2 text-green-600">
                    <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                    View other users
                  </li>
                )}
                {permissions.canEditOtherUsers && (
                  <li className="flex items-center gap-2 text-green-600">
                    <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                    Edit other users
                  </li>
                )}
                {permissions.canDeleteUsers && (
                  <li className="flex items-center gap-2 text-green-600">
                    <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                    Delete users
                  </li>
                )}
                {permissions.canAddUsers && (
                  <li className="flex items-center gap-2 text-green-600">
                    <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                    Add new users
                  </li>
                )}
                {permissions.canSendInvites && (
                  <li className="flex items-center gap-2 text-green-600">
                    <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                    Send email invites
                  </li>
                )}
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">
                Agents Cannot:
              </h4>
              <ul className="space-y-1 text-sm">
                {!permissions.canViewStats && (
                  <li className="flex items-center gap-2 text-red-600">
                    <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                    View stats cards
                  </li>
                )}
                {!permissions.canViewUserManagement && (
                  <li className="flex items-center gap-2 text-red-600">
                    <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                    Access User Management tab
                  </li>
                )}
                {!permissions.canViewWorkflowSettings && (
                  <li className="flex items-center gap-2 text-red-600">
                    <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                    Access Workflow Settings tab
                  </li>
                )}
                {!permissions.canViewOtherUsers && (
                  <li className="flex items-center gap-2 text-red-600">
                    <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                    View other users
                  </li>
                )}
                {!permissions.canEditOtherUsers && (
                  <li className="flex items-center gap-2 text-red-600">
                    <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                    Edit other users
                  </li>
                )}
                {!permissions.canDeleteUsers && (
                  <li className="flex items-center gap-2 text-red-600">
                    <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                    Delete users
                  </li>
                )}
                {!permissions.canAddUsers && (
                  <li className="flex items-center gap-2 text-red-600">
                    <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                    Add new users
                  </li>
                )}
                {!permissions.canSendInvites && (
                  <li className="flex items-center gap-2 text-red-600">
                    <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                    Send email invites
                  </li>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
