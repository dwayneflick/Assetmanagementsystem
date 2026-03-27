import { useState, useCallback, lazy, Suspense, startTransition, useEffect } from "react";
import LoginPage from "./components/LoginPage";
import Sidebar from "./components/Sidebar";
import Notifications from "./components/Notifications";
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

export type UserRole = "admin" | "agent" | "viewer";

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Set favicon
  useEffect(() => {
    const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement || document.createElement('link');
    link.type = 'image/png';
    link.rel = 'icon';
    link.href = faviconImage;
    document.getElementsByTagName('head')[0].appendChild(link);
    
    // Also set the page title
    document.title = 'Andersen Asset Management System';
  }, []);

  // Check for saved session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const handleLogout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("user");
    setCurrentPage("dashboard");
  }, []);

  const handleNavigate = useCallback((page: string) => {
    startTransition(() => {
      setCurrentPage(page);
    });
    setSidebarOpen(false); // Close sidebar on mobile after navigation
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const handleOpenSidebar = useCallback(() => {
    setSidebarOpen(true);
  }, []);

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
    // Restrict viewer role to only allowed pages
    const effectivePage =
      user.role === "viewer" && !VIEWER_ALLOWED_PAGES.includes(currentPage)
        ? "dashboard"
        : currentPage;

    switch (effectivePage) {
      case "dashboard":
        return <Dashboard user={user} />;
      case "assets":
        return <AssetManagement user={user} />;
      case "faulty-assets":
        return <FaultyAssets user={user} />;
      case "incidents":
        return <IncidentReports user={user} />;
      case "software":
        return <SoftwareManagement user={user} />;
      case "it-issue-logs":
        return <ITIssueLogs user={user} />;
      case "deregistration":
        return <Deregistration user={user} />;
      case "it-maintenance-log":
        return <ITMaintenanceLog user={user} />;
      case "knowledge-base":
        return <KnowledgeBase user={user} />;
      case "reports":
        return <Reports user={user} />;
      case "settings":
        return <Settings user={user} />;
      default:
        return <Dashboard user={user} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
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
        {/* Mobile header */}
        <header className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenSidebar}
            className="p-2"
          >
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
        
        {/* Desktop header with notifications */}
        <header className="hidden lg:flex bg-white border-b border-gray-200 p-4 items-center justify-end">
          <Notifications user={user} />
        </header>
        
        <main className="flex-1 overflow-auto">
          <Suspense fallback={
            <div className="flex flex-col justify-center items-center h-full space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-gradient-to-r from-red-900 to-rose-900" style={{ color: '#7f1d1d' }} />
              <p className="text-gray-600 text-sm">Loading...</p>
            </div>
          }>
            {renderPage()}
          </Suspense>
        </main>
      </div>
      <Toaster />
    </div>
  );
}