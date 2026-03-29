import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { toast } from "sonner@2.0.3";
import { Lock, User, Eye, EyeOff, ShieldCheck, KeyRound, CheckCircle2, AlertCircle } from "lucide-react";
import andersenLogo from "figma:asset/c5292bdd917281e818e79b22fa402c2806ae9d2e.png";
import PrivacyPolicy from "./PrivacyPolicy";
import { logger } from "../utils/logger";

interface LoginPageProps {
  onLogin: (user: any) => void;
}

// Password strength helper
function getPasswordStrength(pwd: string): { score: number; label: string; color: string } {
  if (!pwd) return { score: 0, label: "", color: "bg-gray-200" };
  const hasLetter = /[a-zA-Z]/.test(pwd);
  const hasUpper = /[A-Z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd);
  const long = pwd.length >= 10;

  const score = [hasLetter, hasUpper, hasNumber, hasSymbol, long].filter(Boolean).length;
  if (score <= 2) return { score, label: "Weak", color: "bg-red-500" };
  if (score === 3) return { score, label: "Fair", color: "bg-amber-500" };
  if (score === 4) return { score, label: "Good", color: "bg-blue-500" };
  return { score, label: "Strong", color: "bg-green-500" };
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

  // First-login password change state
  const [pendingUser, setPendingUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const strength = getPasswordStrength(newPassword);

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
        await logger.audit(
          username || "Unknown",
          "Login",
          "Authentication",
          `Login failed: ${data.error || "Invalid credentials"}`,
          "failed"
        );
        toast.error(data.error || "Login failed");
        setLoading(false);
        return;
      }

      // If mustChangePassword is set, OR still using default password → force change
      if (data.user.mustChangePassword || password === "P@ssw0rd") {
        setPendingUser(data.user);
        setLoading(false);
        return;
      }

      // Normal login
      await logger.audit(
        data.user.name || username,
        "Login",
        "Authentication",
        "User logged in successfully",
        "success"
      );

      toast.success("Login successful!");
      onLogin(data.user);
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  const handleFirstLoginPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
    if (!hasLetter || !hasNumber || !hasSymbol) {
      toast.error("Password must contain letters, numbers, and at least one symbol");
      return;
    }

    setChangingPw(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/users/${pendingUser.id}/password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ password: newPassword }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to change password");
        setChangingPw(false);
        return;
      }

      // Write audit log for first-login password change
      await logger.audit(
        pendingUser.name || pendingUser.username,
        "Password Changed",
        "Authentication",
        "User changed password on first login",
        "success"
      );

      // Write audit log for the login itself
      await logger.audit(
        pendingUser.name || pendingUser.username,
        "Login",
        "Authentication",
        "User logged in successfully (first login)",
        "success"
      );

      toast.success("Password updated! Welcome to Andersen AMS.");

      // Mark mustChangePassword as false in the local user object before passing it up
      onLogin({ ...pendingUser, mustChangePassword: false });
    } catch (error) {
      console.error("Password change error:", error);
      toast.error("An error occurred while changing your password");
    } finally {
      setChangingPw(false);
    }
  };

  // ── First-login force-change screen ────────────────────────
  if (pendingUser) {
    const requirements = [
      { met: newPassword.length >= 6, label: "At least 6 characters" },
      { met: /[a-zA-Z]/.test(newPassword), label: "Contains a letter" },
      { met: /[0-9]/.test(newPassword), label: "Contains a number" },
      { met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword), label: "Contains a symbol (!@#…)" },
      { met: newPassword === confirmPassword && newPassword.length > 0, label: "Passwords match" },
    ];
    const allMet = requirements.every((r) => r.met);

    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-900">
        {/* Blurred background */}
        <div className="fixed inset-0 z-0">
          <img
            src="https://guardian.ng/cdn-cgi/image/format=auto,width=1080,fit=cover,q=45/https://cdn.guardian.ng/wp-content/uploads/2025/02/andersen-place.jpg"
            alt="Background"
            className="w-full h-full object-cover"
            style={{ filter: "blur(4px)", transform: "scale(1.1)" }}
          />
        </div>
        <div className="fixed inset-0 bg-black/50 z-0" />

        <div className="relative z-10 w-full max-w-md">
          <Card className="shadow-2xl border-0 bg-white/97 backdrop-blur-sm">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-900 to-rose-900 rounded-t-xl px-6 py-6 text-white text-center">
              <div className="mx-auto w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold leading-tight">Set Your Password</h2>
              <p className="text-white/80 text-sm mt-1">
                Welcome, <span className="font-semibold">{pendingUser.name}</span>! You must set a new password before continuing.
              </p>
            </div>

            <CardContent className="px-6 py-6">
              <form onSubmit={handleFirstLoginPasswordChange} className="space-y-5">
                {/* New password */}
                <div className="space-y-1.5">
                  <Label htmlFor="newPwd">New Password</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="newPwd"
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                      className="pl-10 pr-10"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Strength bar */}
                  {newPassword && (
                    <div className="space-y-1 pt-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-colors ${
                              i <= strength.score ? strength.color : "bg-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-xs font-medium ${
                        strength.score <= 2 ? "text-red-600" :
                        strength.score === 3 ? "text-amber-600" :
                        strength.score === 4 ? "text-blue-600" : "text-green-600"
                      }`}>
                        {strength.label}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPwd">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="confirmPwd"
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Requirements checklist */}
                <div className="bg-gray-50 rounded-lg p-3 space-y-1.5 border border-gray-100">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Password requirements</p>
                  {requirements.map((req) => (
                    <div key={req.label} className="flex items-center gap-2">
                      {req.met ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                      )}
                      <span className={`text-xs ${req.met ? "text-green-700 font-medium" : "text-gray-500"}`}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>

                <Button
                  type="submit"
                  disabled={changingPw || !allMet}
                  className="w-full bg-gradient-to-r from-red-900 to-rose-900 hover:from-red-950 hover:to-rose-950 disabled:opacity-50"
                >
                  {changingPw ? "Setting password…" : "Set Password & Continue"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Normal login screen ─────────────────────────────────────
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
          style={{ filter: "blur(4px)", transform: "scale(1.1)" }}
        />
      </div>

      {/* Dark overlay */}
      <div className="fixed inset-0 bg-black/30 z-0" />

      {/* Card */}
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
              {loading ? "Signing in…" : "Sign In"}
            </Button>

            {/* Copyright Notice */}
            <div className="text-center mt-4 sm:mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs sm:text-sm text-gray-600">
                © {new Date().getFullYear()} Andersen Tax LLC and Andersen Tax LP.<br />
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

      {/* Privacy Policy Dialog */}
      {showPrivacyPolicy && (
        <PrivacyPolicy onClose={() => setShowPrivacyPolicy(false)} />
      )}
    </div>
  );
}
