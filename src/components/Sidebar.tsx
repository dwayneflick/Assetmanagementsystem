import { User } from "../App";
import { Button } from "./ui/button";
import {
  LayoutDashboard,
  Package,
  AlertTriangle,
  Code,
  ShoppingCart,
  UserMinus,
  BookOpen,
  FileText,
  LogOut,
  Settings,
  UserCheck,
  X,
  FileWarning,
} from "lucide-react";
import andersenLogo from "figma:asset/c5292bdd917281e818e79b22fa402c2806ae9d2e.png";

interface SidebarProps {
  user: User;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ user, currentPage, onNavigate, onLogout, isOpen, onClose }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "assets", label: "Asset Management", icon: Package },
    { id: "asset-handover", label: "Asset Handover", icon: UserCheck },
    { id: "incidents", label: "Incident Reports", icon: AlertTriangle },
    { id: "software", label: "Software", icon: Code },
    { id: "it-issue-logs", label: "IT Issue Logs", icon: FileWarning },
    { id: "purchase-orders", label: "Purchase Orders", icon: ShoppingCart },
    { id: "deregistration", label: "IT Deregistration", icon: UserMinus },
    { id: "knowledge-base", label: "Knowledge Base", icon: BookOpen },
    { id: "reports", label: "Reports", icon: FileText },
  ];

  // Add Settings for admin users only
  const adminMenuItems = user.role === "admin" 
    ? [{ id: "settings", label: "Settings", icon: Settings }]
    : [];

  const allMenuItems = [...menuItems, ...adminMenuItems];

  return (
    <>
      {/* Sidebar - hidden on mobile by default, shown when isOpen is true */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col shadow-2xl
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col space-y-2 w-full">
              <div className="bg-white rounded-lg p-2 mb-2 w-full">
                <img 
                  src={andersenLogo}
                  alt="Andersen Logo"
                  className="h-10 w-auto object-contain mx-auto"
                  onError={(e) => {
                    // Fallback if image fails to load
                    console.error('Logo failed to load:', andersenLogo);
                  }}
                />
              </div>
              <div className="text-center">
                <p className="text-sm text-white font-medium">Asset Management System</p>
              </div>
            </div>
            {/* Close button for mobile */}
            <button
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-gray-700 rounded-lg transition-colors absolute right-4 top-4"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-4 p-3 bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-300 truncate">{user.name}</p>
            <p className="text-xs text-gray-400 capitalize mt-1">
              {user.role}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {allMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-red-900/80 to-rose-900/80 shadow-lg backdrop-blur-sm"
                    : "hover:bg-gray-700"
                }`}
              >
                <div className="w-8 h-8 bg-[#1a1f3a] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-white hover:bg-gray-700"
            onClick={onLogout}
          >
            <LogOut className="w-5 h-5 mr-3 flex-shrink-0" />
            <span className="truncate">Logout</span>
          </Button>
        </div>
      </div>
    </>
  );
}