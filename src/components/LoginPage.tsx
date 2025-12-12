import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { toast } from "sonner@2.0.3";
import { Lock, User, Eye, EyeOff } from "lucide-react";
import andersenLogo from "figma:asset/c5292bdd917281e818e79b22fa402c2806ae9d2e.png";
import PrivacyPolicy from "./PrivacyPolicy";

interface LoginPageProps {
  onLogin: (user: any) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [tempUsername, setTempUsername] = useState("");
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ username, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Login failed");
        setLoading(false);
        return;
      }

      // Check if using default password
      if (password === "P@ssw0rd") {
        setTempUsername(username);
        setShowChangePassword(true);
        setLoading(false);
        toast.info("Please change your default password");
        return;
      }

      toast.success("Login successful!");
      onLogin(data.user);
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
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

    setLoading(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/auth/change-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            username: tempUsername,
            currentPassword,
            newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to change password");
        setLoading(false);
        return;
      }

      toast.success("Password changed successfully! Please login with your new password");
      setShowChangePassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPassword("");
    } catch (error) {
      console.error("Change password error:", error);
      toast.error("An error occurred while changing password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-3 sm:p-4 md:p-6 relative overflow-hidden bg-slate-900"
    >
      {/* Background Image with Blur */}
      <div className="fixed inset-0 z-0">
        <img 
          src="https://guardian.ng/cdn-cgi/image/format=auto,width=1080,fit=cover,q=45/https://cdn.guardian.ng/wp-content/uploads/2025/02/andersen-place.jpg"
          alt="Background"
          className="w-full h-full object-cover"
          style={{
            filter: 'blur(4px)',
            transform: 'scale(1.1)'
          }}
        />
      </div>
      
      {/* Dark overlay for better contrast */}
      <div className="fixed inset-0 bg-black/30 z-0" />
      
      {/* Content */}
      <Card className="w-full max-w-md shadow-2xl border-0 relative z-10 bg-white/95 backdrop-blur-sm mx-3 sm:mx-4">
        <CardHeader className="space-y-3 sm:space-y-4 pb-4 sm:pb-6 md:pb-8 px-4 sm:px-6 pt-6 sm:pt-8">
          <div className="mx-auto w-40 sm:w-48 md:w-56 h-14 sm:h-16 md:h-20 flex items-center justify-center p-3 sm:p-4">
            <img src={andersenLogo} alt="Andersen Logo" className="w-full h-full object-contain" />
          </div>
          <div className="text-center">
            <CardTitle className="text-xl sm:text-2xl md:text-3xl">Asset Management System</CardTitle>
            <CardDescription className="text-xs sm:text-sm md:text-base mt-1 sm:mt-2">
              Sign in to your account to continue
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-6 sm:pb-8">
          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm sm:text-base">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="pl-10 sm:pl-11 h-10 sm:h-11 text-sm sm:text-base"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm sm:text-base">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 sm:pl-11 pr-10 sm:pr-11 h-10 sm:h-11 text-sm sm:text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-10 sm:h-11 text-sm sm:text-base bg-gradient-to-r from-red-900 to-rose-900 hover:from-red-950 hover:to-rose-950"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            
            {/* Copyright Notice */}
            <div className="text-center mt-4 sm:mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs sm:text-sm text-gray-600">
                © 2025 Andersen Tax LLC and Andersen Tax LP.<br />
                All Rights Reserved.<br />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowPrivacyPolicy(true);
                  }}
                  className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                >
                  Privacy Policy
                </button>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Change Password Dialog */}
      <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
        <DialogContent className="max-w-md mx-3 sm:mx-4 w-[calc(100%-1.5rem)] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg md:text-xl">Change Default Password</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              For security reasons, please change your default password before continuing.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-3 sm:space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-sm sm:text-base">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="h-10 sm:h-11 text-sm sm:text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm sm:text-base">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="h-10 sm:h-11 text-sm sm:text-base"
              />
              <p className="text-xs text-gray-500">
                Must be 6-12 characters with letters, numbers, and symbols
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm sm:text-base">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-10 sm:h-11 text-sm sm:text-base"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-10 sm:h-11 text-sm sm:text-base"
              disabled={loading}
            >
              {loading ? "Changing..." : "Change Password"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Privacy Policy Dialog */}
      {showPrivacyPolicy && (
        <PrivacyPolicy onClose={() => setShowPrivacyPolicy(false)} />
      )}
    </div>
  );
}