import { useState, useCallback, lazy, Suspense, startTransition, useEffect, useRef } from "react";
import { isTestMode, toggleTestMode } from "./utils/testMode";
import LoginPage from "./components/LoginPage";
import Sidebar from "./components/Sidebar";
import Notifications from "./components/Notifications";
import EnvModeBanner from "./components/EnvModeBanner";
import { Toaster } from "./components/ui/sonner";
import { Menu, Loader2 } from "lucide-react";
import { Button } from "./components/ui/button";
import faviconImage from "figma:asset/c5292bdd917281e818e79b22fa402c2806ae9d2e.png";

// Lazy load all major components for code splitting and better performance
const Dashboard = lazy(() => import("./components/Dashboard"));
const AssetManagement = lazy(() => import("./components/AssetManagement"));
const FaultyAssets = lazy(() => import("./components/FaultyAssets"));
const IncidentReports = lazy(() => import("./components/IncidentReports"));
const SoftwareManagement = lazy(() => import("./components/SoftwareManagement"));
const ITIssueLogs = lazy(() => import("./components/ITIssueLogs"));
const Deregistration = lazy(() => import("./components/Deregistration"));
const ITMaintenanceLog = lazy(() => import("./components/ITMaintenanceLog"));
const KnowledgeBase = lazy(() => import("./components/KnowledgeBase"));
const Reports = lazy(() => import("./components/Reports"));
const Settings = lazy(() => import("./components/Settings"));
const AuditLogViewer = lazy(() => import("./components/AuditLogViewer"));

export type UserRole = "admin" | "agent" | "viewer";

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
}

// ─── Paths that should NEVER get the X-Env header (always production) ────────
const PROD_ONLY_PATHS = ["/auth/", "/users", "/users/"];

function shouldInjectTestHeader(url: string): boolean {
  if (!url.includes("make-server-5921d82e")) return false;
  return !PROD_ONLY_PATHS.some((path) => url.includes(path));
}

// ─── Session timeout constants ─────────────────────────────
const TIMEOUT_MS       = 30 * 60 * 1000; // 30 minutes
const WARN_MS          = 25 * 60 * 1000; // Warn at 25 min (5 min remaining)
const CHECK_INTERVAL_MS = 30 * 1000;     // Check every 30 seconds

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [testMode, setTestMode] = useState(isTestMode());
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [timeoutCountdown, setTimeoutCountdown] = useState(300); // seconds remaining
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Set favicon & title ─────────────────────────────────
  useEffect(() => {
    const link =
      (document.querySelector("link[rel~='icon']") as HTMLLinkElement) ||
      document.createElement("link");
    link.type = "image/png";
    link.rel = "icon";
    link.href = faviconImage;
    document.getElementsByTagName("head")[0].appendChild(link);
    document.title = "Andersen Asset Management System";
  }, []);

  // ─── Restore session ─────────────────────────────────────
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // ─── Listen for env mode changes ─────────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setTestMode(detail.testMode);
    };
    window.addEventListener("envModeChange", handler);
    return () => window.removeEventListener("envModeChange", handler);
  }, []);

  /**
   * Fetch interceptor — transparently injects X-Env: test header
   * on all data API calls when test mode is active.
   * Auth/user routes are excluded (always use production namespace).
   */
  useEffect(() => {
    const originalFetch = window.fetch.bind(window);

    if (testMode) {
      window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;

        if (shouldInjectTestHeader(url)) {
          const existingHeaders =
            init?.headers instanceof Headers
              ? Object.fromEntries((init.headers as Headers).entries())
              : (init?.headers as Record<string, string>) || {};

          init = {
            ...init,
            headers: {
              ...existingHeaders,
              "X-Env": "test",
            },
          };
        }

        return originalFetch(input as any, init);
      };
    } else {
      // Restore original fetch when switching back to production
      window.fetch = originalFetch;
    }

    return () => {
      window.fetch = originalFetch;
    };
  }, [testMode]);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("lastActivity", String(Date.now()));
  };

  const handleLogout = useCallback((reason?: string) => {
    setUser(null);
    setShowTimeoutWarning(false);
    localStorage.removeItem("user");
    localStorage.removeItem("lastActivity");
    setCurrentPage("dashboard");
    if (reason === "timeout") {
      // Toast shown after state resets, deferred via setTimeout
      setTimeout(() => {
        const event = new CustomEvent("session-timeout-toast");
        window.dispatchEvent(event);
      }, 100);
    }
  }, []);

  // ─── Listen for timeout toast event (fired after logout resets state) ──
  useEffect(() => {
    const onTimeout = () => {
      // We can't use sonner here since Toaster isn't mounted when logged out
      // Use a native alert as fallback, or show it before logout
    };
    window.addEventListener("session-timeout-toast", onTimeout);
    return () => window.removeEventListener("session-timeout-toast", onTimeout);
  }, []);

  // ─── Session timeout logic ────────────────────────────────
  useEffect(() => {
    if (!user) return;

    // Initialise lastActivity if not already set
    if (!localStorage.getItem("lastActivity")) {
      localStorage.setItem("lastActivity", String(Date.now()));
    }

    const resetActivity = () => {
      localStorage.setItem("lastActivity", String(Date.now()));
      if (showTimeoutWarning) {
        setShowTimeoutWarning(false);
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
      }
    };

    const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"] as const;
    ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, resetActivity, { passive: true }));

    const checker = setInterval(() => {
      const last = parseInt(localStorage.getItem("lastActivity") || "0", 10);
      const elapsed = Date.now() - last;

      if (elapsed >= TIMEOUT_MS) {
        clearInterval(checker);
        handleLogout("timeout");
      } else if (elapsed >= WARN_MS && !showTimeoutWarning) {
        const remaining = Math.ceil((TIMEOUT_MS - elapsed) / 1000);
        setTimeoutCountdown(remaining);
        setShowTimeoutWarning(true);
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, resetActivity));
      clearInterval(checker);
    };
  }, [user, handleLogout, showTimeoutWarning]);

  // ─── Countdown ticker when warning is visible ─────────────
  useEffect(() => {
    if (!showTimeoutWarning) {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      return;
    }
    countdownRef.current = setInterval(() => {
      setTimeoutCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [showTimeoutWarning]);

  const handleNavigate = useCallback((page: string) => {
    startTransition(() => {
      setCurrentPage(page);
    });
    setSidebarOpen(false);
  }, []);

  const handleCloseSidebar = useCallback(() => { setSidebarOpen(false); }, []);
  const handleOpenSidebar = useCallback(() => { setSidebarOpen(true); }, []);

  if (!user) {
    return (
      <>
        <LoginPage onLogin={handleLogin} />
        <Toaster />
      </>
    );
  }

  const VIEWER_ALLOWED_PAGES = ["dashboard", "assets", "faulty-assets"];

  const renderPage = () => {
    const effectivePage =
      user.role === "viewer" && !VIEWER_ALLOWED_PAGES.includes(currentPage)
        ? "dashboard"
        : currentPage;

    switch (effectivePage) {
      case "dashboard":         return <Dashboard user={user} />;
      case "assets":            return <AssetManagement user={user} />;
      case "faulty-assets":     return <FaultyAssets user={user} />;
      case "incidents":         return <IncidentReports user={user} />;
      case "software":          return <SoftwareManagement user={user} />;
      case "it-issue-logs":     return <ITIssueLogs user={user} />;
      case "deregistration":    return <Deregistration user={user} />;
      case "it-maintenance-log":return <ITMaintenanceLog user={user} />;
      case "knowledge-base":    return <KnowledgeBase user={user} />;
      case "reports":           return <Reports user={user} />;
      case "settings":          return <Settings user={user} />;
      case "audit-log":         return <AuditLogViewer />;
      default:                  return <Dashboard user={user} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* ─── Session timeout warning modal ─── */}
      {showTimeoutWarning && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-900 to-rose-900 px-6 py-5 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold leading-tight">Session Expiring Soon</h2>
                  <p className="text-white/80 text-sm">You'll be logged out due to inactivity</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-6 text-center">
              {/* Countdown ring */}
              <div className="mx-auto mb-4 w-20 h-20 rounded-full border-4 border-rose-100 flex items-center justify-center bg-rose-50">
                <div className="text-center">
                  <div className="text-2xl font-bold text-rose-900 leading-none">
                    {Math.floor(timeoutCountdown / 60)}:{String(timeoutCountdown % 60).padStart(2, "0")}
                  </div>
                  <div className="text-xs text-rose-600 mt-0.5">remaining</div>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                Your session will automatically expire due to <strong>30 minutes of inactivity</strong>.
                Move your mouse or press any key to stay logged in.
              </p>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => handleLogout()}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Log out now
              </button>
              <button
                onClick={() => {
                  localStorage.setItem("lastActivity", String(Date.now()));
                  setShowTimeoutWarning(false);
                }}
                className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-red-900 to-rose-900 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Stay logged in
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        user={user}
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={handleCloseSidebar}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ── Test environment banner (shown to all when test mode active) ── */}
        <EnvModeBanner user={user} />

        {/* Mobile header */}
        <header className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handleOpenSidebar} className="p-2">
            <Menu className="w-6 h-6" />
          </Button>
          <div className="flex items-center space-x-3">
            <Notifications user={user} />
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs">AM</span>
              </div>
              <h1 className="text-sm">Asset MS</h1>
            </div>
          </div>
        </header>

        {/* Desktop header */}
        <header className="hidden lg:flex bg-white border-b border-gray-200 p-4 items-center justify-between gap-4">
          {/* Environment toggle — admins only, sits in desktop header */}
          {(user.role === "admin" || user.name === "Admin" || user.name === "Kingsley") && (
            <EnvToggleButton testMode={testMode} />
          )}
          <div className="ml-auto">
            <Notifications user={user} />
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <Suspense
            fallback={
              <div className="flex flex-col justify-center items-center h-full space-y-4">
                <Loader2
                  className="w-12 h-12 animate-spin"
                  style={{ color: "#7f1d1d" }}
                />
                <p className="text-gray-600 text-sm">Loading…</p>
              </div>
            }
          >
            {renderPage()}
          </Suspense>
        </main>
      </div>
      <Toaster />
    </div>
  );
}

// ─── Inline env toggle pill for desktop header ─────────────
function EnvToggleButton({ testMode }: { testMode: boolean }) {
  const handleClick = () => {
    toggleTestMode();
    setTimeout(() => window.location.reload(), 400);
  };

  return (
    <button
      onClick={handleClick}
      title={testMode ? "Currently in TEST mode — click to switch to Production" : "Currently in PRODUCTION mode — click to switch to Test"}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
        ${testMode
          ? "bg-amber-100 border-amber-400 text-amber-800 hover:bg-amber-200"
          : "bg-green-50 border-green-300 text-green-800 hover:bg-green-100"
        }
      `}
    >
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${testMode ? "bg-amber-500 animate-pulse" : "bg-green-500"}`} />
      {testMode ? "TEST MODE" : "PRODUCTION"}
      <span className="opacity-60 font-normal">— click to switch</span>
    </button>
  );
}