import { useState, useEffect } from "react";
import { FlaskConical, AlertTriangle, Trash2, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { isTestMode, toggleTestMode } from "../utils/testMode";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { toast } from "sonner@2.0.3";
import { User } from "../App";

interface EnvModeBannerProps {
  user: User;
}

export default function EnvModeBanner({ user }: EnvModeBannerProps) {
  const [testMode, setTestMode] = useState(isTestMode());
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setTestMode(detail.testMode);
    };
    window.addEventListener("envModeChange", handler);
    return () => window.removeEventListener("envModeChange", handler);
  }, []);

  const canToggle = user.role === "admin" || user.name === "Admin" || user.name === "Kingsley";

  const handleToggle = () => {
    const next = toggleTestMode();
    if (next) {
      toast.info("Switched to TEST environment — data changes are isolated from production", { duration: 4000 });
    } else {
      toast.success("Switched to PRODUCTION environment", { duration: 3000 });
    }
    // Reload to ensure all cached data refreshes
    setTimeout(() => window.location.reload(), 800);
  };

  const handleClearTestData = async () => {
    if (!window.confirm("Clear ALL test data? This will permanently delete all records in the test environment. Production data is safe.")) return;
    setClearing(true);
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/clear-all-data`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "X-Env": "test",
          },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to clear test data");
      toast.success(`Test data cleared — ${data.deleted} records removed`);
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      console.error("Clear test data error:", err);
      toast.error("Failed to clear test data");
    } finally {
      setClearing(false);
    }
  };

  if (!testMode) return null;

  return (
    <div className="w-full bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-between gap-3 z-50 shadow-sm flex-shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <FlaskConical className="w-4 h-4 flex-shrink-0" />
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="font-bold text-sm tracking-wide uppercase">TEST ENVIRONMENT</span>
          <span className="text-xs opacity-75 hidden sm:inline">
            — All data changes are isolated. Production data is safe.
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-1 ml-1">
          <AlertTriangle className="w-3.5 h-3.5 opacity-70" />
          <span className="text-xs font-medium opacity-80">Not visible to clients</span>
        </div>
      </div>

      {canToggle && (
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClearTestData}
            disabled={clearing}
            className="h-7 px-2 text-amber-950 hover:bg-amber-600 hover:text-white text-xs gap-1"
            title="Clear all test data"
          >
            {clearing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Clear Test Data</span>
          </Button>
          <Button
            size="sm"
            onClick={handleToggle}
            className="h-7 px-3 bg-amber-950 hover:bg-amber-900 text-amber-100 text-xs font-semibold"
          >
            → Switch to Production
          </Button>
        </div>
      )}
    </div>
  );
}
