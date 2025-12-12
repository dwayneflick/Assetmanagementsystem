import { useState, useEffect } from "react";
import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";
import AssetManagement from "./components/AssetManagement";
import IncidentReports from "./components/IncidentReports";
import SoftwareManagement from "./components/SoftwareManagement";
import ITIssueLogs from "./components/ITIssueLogs";
import PurchaseOrders from "./components/PurchaseOrders";
import Deregistration from "./components/Deregistration";
import KnowledgeBase from "./components/KnowledgeBase";
import Reports from "./components/Reports";
import AssetHandover from "./components/AssetHandover";
import Settings from "./components/Settings";
import Sidebar from "./components/Sidebar";
import Notifications from "./components/Notifications";
import { Toaster } from "./components/ui/sonner";
import { Menu } from "lucide-react";
import { Button } from "./components/ui/button";

export type UserRole = "admin" | "agent";

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

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    setCurrentPage("dashboard");
  };

  if (!user) {
    return (
      <>
        <LoginPage onLogin={handleLogin} />
        <Toaster />
      </>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard user={user} />;
      case "assets":
        return <AssetManagement user={user} />;
      case "incidents":
        return <IncidentReports user={user} />;
      case "software":
        return <SoftwareManagement user={user} />;
      case "it-issue-logs":
        return <ITIssueLogs user={user} />;
      case "purchase-orders":
        return <PurchaseOrders user={user} />;
      case "deregistration":
        return <Deregistration user={user} />;
      case "knowledge-base":
        return <KnowledgeBase user={user} />;
      case "reports":
        return <Reports user={user} />;
      case "asset-handover":
        return <AssetHandover user={user} />;
      case "settings":
        return <Settings user={user} />;
      default:
        return <Dashboard user={user} />;
    }
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    setSidebarOpen(false); // Close sidebar on mobile after navigation
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
        onClose={() => setSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
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
          {renderPage()}
        </main>
      </div>
      <Toaster />
    </div>
  );
}