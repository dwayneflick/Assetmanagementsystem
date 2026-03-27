import { useState, useEffect, useMemo } from "react";
import { User } from "../App";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import {
  Package,
  Laptop,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Activity,
  Settings,
  X,
  UserMinus,
  Calendar,
  HardDrive,
  Timer,
  Star,
  Bug,
  AlertTriangle,
} from "lucide-react";

// ─── CSS Bar Chart ────────────────────────────────────────────────────────────
// Pure HTML/CSS replacement for recharts BarChart.
// Eliminates recharts' global SVG-defs counter that causes duplicate-key warnings.
interface CssBarEntry {
  [key: string]: any;
}

function CssBarChart({
  data,
  valueKey,
  labelKey,
  colorFn,
  height = 260,
  formatValue,
}: {
  data: CssBarEntry[];
  valueKey: string;
  labelKey: string;
  colorFn?: (entry: CssBarEntry, index: number) => string;
  height?: number;
  formatValue?: (v: number) => string;
}) {
  const max = Math.max(...data.map((d) => Number(d[valueKey]) || 0), 1);
  const barAreaH = height - 48; // reserve space for labels below

  if (data.length === 0) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-sm text-gray-400">
        No data
      </div>
    );
  }

  return (
    <div style={{ height }} className="w-full flex flex-col">
      {/* bar area */}
      <div className="flex items-end gap-2 flex-1 px-2" style={{ height: barAreaH }}>
        {data.map((entry, i) => {
          const val = Number(entry[valueKey]) || 0;
          const pct = (val / max) * 100;
          const color = colorFn ? colorFn(entry, i) : "#3b82f6";
          return (
            <div
              key={`${entry[labelKey]}-${i}`}
              className="flex flex-col items-center flex-1 h-full justify-end group"
              title={`${entry[labelKey]}: ${formatValue ? formatValue(val) : val}`}
            >
              {/* value label above bar */}
              <span className="text-xs font-semibold text-gray-600 mb-1">
                {formatValue ? formatValue(val) : val}
              </span>
              {/* bar */}
              <div
                className="w-full rounded-t transition-all duration-500"
                style={{
                  height: `${Math.max(pct, 2)}%`,
                  backgroundColor: color,
                  minHeight: 4,
                }}
              />
            </div>
          );
        })}
      </div>
      {/* x-axis labels */}
      <div className="flex gap-2 px-2 mt-2" style={{ height: 36 }}>
        {data.map((entry, i) => (
          <div key={`lbl-${i}`} className="flex-1 flex items-start justify-center">
            <span
              className="text-xs text-gray-500 text-center leading-tight"
              style={{ wordBreak: "break-word", maxWidth: "100%" }}
            >
              {entry[labelKey]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface DashboardProps {
  user: User;
}

interface Asset {
  id: string;
  assetName: string;
  serviceTag?: string;
  productType: string;
  assetState: string;
  cost: number;
  warrantyExpiry?: string;
  createdAt: string;
  department?: string;
  operatingSystem?: string;
}

interface Software {
  id: string;
  softwareName: string;
  expiryDate?: string;
  renewalDate?: string;
  status?: string;
}

interface Incident {
  id: string;
  incidentId: string;
  category: string;
  status: string;
  createdAt: string;
}

interface ITIssue {
  id: string;
  issueId: string;
  category: string;
  status: string;
  severity: string;
  downtime?: string;
  createdAt: string;
}

interface Deregistration {
  id: string;
  reason: string;
  createdAt: string;
}

interface AnalyticCard {
  id: string;
  title: string;
  enabled: boolean;
  category: "default" | "advanced";
}

const ANALYTICS_CONFIG: AnalyticCard[] = [
  { id: "totalLaptopIncidents", title: "Total Laptop Incidents", enabled: true, category: "default" },
  { id: "totalITIssueLogs", title: "Total IT Issue Logs", enabled: true, category: "default" },
  { id: "highestIssues", title: "Highest Issues Faced", enabled: true, category: "default" },
  { id: "totalStaffExited", title: "Total Staff Exited", enabled: true, category: "default" },
  { id: "softwareExpired", title: "Software Expired", enabled: true, category: "default" },
  { id: "totalWindowsSystems", title: "Total Windows Systems", enabled: false, category: "advanced" },
  { id: "systemTypeBreakdown", title: "System Type Breakdown", enabled: false, category: "advanced" },
  { id: "laptopPerDepartment", title: "Laptops per Department", enabled: false, category: "advanced" },
  { id: "inProgressITIssues", title: "In Progress IT Issues", enabled: false, category: "advanced" },
  { id: "totalDowntime", title: "Total Downtime", enabled: false, category: "advanced" },
  { id: "poorRatings", title: "Total Poor Ratings", enabled: false, category: "advanced" },
];

const STATE_COLORS: Record<string, string> = {
  "In Use": "#10b981",
  Unassigned: "#f59e0b",
  Faulty: "#ef4444",
  Retired: "#6b7280",
  Disposed: "#9ca3af",
};

const PALETTE = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function Dashboard({ user }: DashboardProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [software, setSoftware] = useState<Software[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [itIssues, setITIssues] = useState<ITIssue[]>([]);
  const [deregistrations, setDeregistrations] = useState<Deregistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [analyticsConfig, setAnalyticsConfig] = useState<AnalyticCard[]>(ANALYTICS_CONFIG);

  useEffect(() => {
    fetchData();
    loadAnalyticsPreferences();
  }, []);

  const loadAnalyticsPreferences = () => {
    const saved = localStorage.getItem(`analytics_config_${user.id}`);
    if (saved) {
      try { setAnalyticsConfig(JSON.parse(saved)); } catch {}
    }
  };

  const saveAnalyticsPreferences = (config: AnalyticCard[]) => {
    localStorage.setItem(`analytics_config_${user.id}`, JSON.stringify(config));
    setAnalyticsConfig(config);
  };

  const toggleAnalytic = (id: string) => {
    const updated = analyticsConfig.map((item) =>
      item.id === id ? { ...item, enabled: !item.enabled } : item
    );
    saveAnalyticsPreferences(updated);
  };

  const fetchData = async () => {
    try {
      const [assetsRes, softwareRes, incidentsRes, itIssuesRes, deregRes] = await Promise.all([
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/assets`, { headers: { Authorization: `Bearer ${publicAnonKey}` } }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/software`, { headers: { Authorization: `Bearer ${publicAnonKey}` } }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/incidents`, { headers: { Authorization: `Bearer ${publicAnonKey}` } }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/it-issues`, { headers: { Authorization: `Bearer ${publicAnonKey}` } }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/deregistrations`, { headers: { Authorization: `Bearer ${publicAnonKey}` } }),
      ]);
      const [assetsData, softwareData, incidentsData, itIssuesData, deregData] = await Promise.all([
        assetsRes.json(), softwareRes.json(), incidentsRes.json(), itIssuesRes.json(), deregRes.json(),
      ]);
      setAssets(assetsData.assets || []);
      setSoftware(softwareData.software || []);
      setIncidents(incidentsData.incidents || []);
      setITIssues(itIssuesData.issues || []);
      setDeregistrations(deregData.deregistrations || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const dashboardMetrics = useMemo(() => {
    const totalAssets = assets.length;
    const totalInUse = assets.filter((a) => a.assetState === "In Use/Active").length;
    const totalUnassigned = assets.filter((a) => a.assetState === "Unassigned").length;
    const totalFaulty = assets.filter((a) => a.assetState === "Faulty").length;
    const totalRetired = assets.filter((a) => a.assetState === "Retired").length;
    const totalDisposed = assets.filter((a) => a.assetState === "Disposed").length;
    const totalCost = assets.reduce((sum, asset) => sum + (asset.cost || 0), 0);

    const today = new Date();
    const expiredAssets = assets.filter((a) => a.warrantyExpiry && new Date(a.warrantyExpiry) < today);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newAssets = assets.filter((a) => new Date(a.createdAt) > thirtyDaysAgo);

    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);
    const expiringSoftware = software.filter((s) => {
      if (!s.expiryDate) return false;
      const d = new Date(s.expiryDate);
      return d > today && d < sixtyDaysFromNow;
    });

    const assetStateData = [
      { name: "In Use", value: totalInUse },
      { name: "Unassigned", value: totalUnassigned },
      { name: "Faulty", value: totalFaulty },
      { name: "Retired", value: totalRetired },
      { name: "Disposed", value: totalDisposed },
    ].filter((item) => item.value > 0);

    const assetTypeData = [
      { type: "Hardware", count: assets.filter((a) => a.productType === "Hardware").length },
      { type: "Software", count: assets.filter((a) => a.productType === "Software").length },
      { type: "Network", count: assets.filter((a) => a.productType === "Network").length },
    ].filter((item) => item.count > 0);

    return {
      totalAssets, totalInUse, totalUnassigned, totalFaulty, totalRetired, totalDisposed,
      totalCost, expiredAssets, newAssets, expiringSoftware, assetStateData, assetTypeData, today,
    };
  }, [assets, software]);

  const advancedMetrics = useMemo(() => {
    const today = dashboardMetrics.today;

    const totalLaptopIncidents = incidents.filter((inc) =>
      inc.category?.toLowerCase().includes("laptop") || inc.category?.toLowerCase().includes("hardware")
    ).length;

    const totalITIssueLogs = itIssues.length;

    const issuesByCategory: Record<string, number> = {};
    [...incidents, ...itIssues].forEach((item) => {
      const cat = item.category || "Other";
      issuesByCategory[cat] = (issuesByCategory[cat] || 0) + 1;
    });
    const highestIssue = Object.entries(issuesByCategory).sort((a, b) => b[1] - a[1])[0];

    const totalStaffExited = deregistrations.filter((d) =>
      d.reason?.toLowerCase().includes("exit") ||
      d.reason?.toLowerCase().includes("resignation") ||
      d.reason?.toLowerCase().includes("terminated")
    ).length;

    const softwareExpired = software.filter((s) => s.expiryDate && new Date(s.expiryDate) < today).length;
    const totalWindowsSystems = assets.filter((a) => a.operatingSystem?.toLowerCase().includes("windows")).length;

    const systemTypes: Record<string, number> = {};
    assets.forEach((a) => {
      const os = a.operatingSystem || "Unknown";
      systemTypes[os] = (systemTypes[os] || 0) + 1;
    });

    const laptopsByDept: Record<string, number> = {};
    assets.filter((a) => a.assetName?.toLowerCase().includes("laptop")).forEach((l) => {
      const dept = l.department || "Unassigned";
      laptopsByDept[dept] = (laptopsByDept[dept] || 0) + 1;
    });

    const inProgressITIssues = itIssues.filter((i) => i.status === "In Progress" || i.status === "Open").length;

    const parseDowntime = (s?: string) => {
      if (!s) return 0;
      let h = 0;
      const hm = s.match(/(\d+)\s*hour/i); if (hm) h += parseInt(hm[1]);
      const dm = s.match(/(\d+)\s*day/i); if (dm) h += parseInt(dm[1]) * 24;
      return h;
    };
    const totalDowntime = itIssues.reduce((sum, i) => sum + parseDowntime(i.downtime), 0);
    const poorRatings = itIssues.filter((i) => i.severity === "Critical" || i.severity === "High").length;

    const issuesByCategoryData = Object.entries(issuesByCategory).map(([name, value]) => ({ name, value }));
    const systemTypesData = Object.entries(systemTypes).map(([name, value]) => ({ name, value }));
    const laptopsByDeptData = Object.entries(laptopsByDept).map(([name, value]) => ({ name, value }));

    return {
      totalLaptopIncidents, totalITIssueLogs, highestIssue, totalStaffExited, softwareExpired,
      totalWindowsSystems, inProgressITIssues, totalDowntime, poorRatings,
      issuesByCategoryData, systemTypesData, laptopsByDeptData,
    };
  }, [assets, software, incidents, itIssues, deregistrations, dashboardMetrics.today]);

  const {
    totalAssets, totalInUse, totalUnassigned, totalFaulty,
    totalCost, expiredAssets, newAssets, expiringSoftware, assetStateData, assetTypeData,
  } = dashboardMetrics;

  const {
    totalLaptopIncidents, totalITIssueLogs, highestIssue, totalStaffExited, softwareExpired,
    totalWindowsSystems, inProgressITIssues, totalDowntime, poorRatings,
    issuesByCategoryData, systemTypesData, laptopsByDeptData,
  } = advancedMetrics;

  const originalStatCards = [
    { title: "Total Assets", value: totalAssets, icon: Package, color: "bg-blue-500", change: `${newAssets.length} new this month` },
    { title: "Assets In Use", value: totalInUse, icon: CheckCircle, color: "bg-green-500", change: `${totalUnassigned} unassigned` },
    { title: "Faulty Assets", value: totalFaulty, icon: AlertCircle, color: "bg-red-500", change: "Needs attention" },
    { title: "Total Cost", value: `₦${totalCost.toLocaleString()}`, icon: DollarSign, color: "bg-purple-500", change: "All assets" },
    { title: "Expired Warranties", value: expiredAssets.length, icon: Clock, color: "bg-orange-500", change: "Requires renewal" },
    { title: "Software Expiring Soon", value: expiringSoftware.length, icon: Activity, color: "bg-indigo-500", change: "Next 60 days" },
  ];

  const getAnalyticCard = (id: string) => {
    switch (id) {
      case "totalLaptopIncidents": return { title: "Total Laptop Incidents", value: totalLaptopIncidents, icon: Laptop, color: "bg-red-500", change: "Hardware issues" };
      case "totalITIssueLogs": return { title: "Total IT Issue Logs", value: totalITIssueLogs, icon: Bug, color: "bg-orange-500", change: "All IT issues" };
      case "highestIssues": return { title: "Highest Issues Faced", value: highestIssue?.[0] || "None", subValue: highestIssue?.[1] ? `${highestIssue[1]} occurrences` : "", icon: AlertTriangle, color: "bg-yellow-500", change: "Most common issue", isText: true };
      case "totalStaffExited": return { title: "Total Staff Exited", value: totalStaffExited, icon: UserMinus, color: "bg-purple-500", change: "Deregistrations" };
      case "softwareExpired": return { title: "Software Expired", value: softwareExpired, icon: Calendar, color: "bg-pink-500", change: "Needs renewal" };
      case "totalWindowsSystems": return { title: "Total Windows Systems", value: totalWindowsSystems, icon: HardDrive, color: "bg-cyan-500", change: `Out of ${totalAssets} assets` };
      case "inProgressITIssues": return { title: "In Progress IT Issues", value: inProgressITIssues, icon: Activity, color: "bg-indigo-500", change: "Active issues" };
      case "totalDowntime": return { title: "Total Downtime", value: `${totalDowntime}h`, icon: Timer, color: "bg-rose-500", change: "From IT issues" };
      case "poorRatings": return { title: "Total Poor Ratings", value: poorRatings, icon: Star, color: "bg-amber-500", change: "Critical/High severity" };
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const enabledAnalytics = analyticsConfig.filter((a) => a.enabled);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl mb-2">Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600">
          Welcome back, {user.name}! Here's an overview of your asset management system.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {originalStatCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">{stat.title}</p>
                    <p className="text-2xl sm:text-3xl mb-2 truncate">{stat.value}</p>
                    <p className="text-xs text-gray-500 truncate">{stat.change}</p>
                  </div>
                  <div className={`${stat.color} p-2 sm:p-3 rounded-lg flex-shrink-0 ml-2`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts — pure CSS, no recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Asset Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <CssBarChart
              data={assetStateData}
              valueKey="value"
              labelKey="name"
              colorFn={(entry) => STATE_COLORS[entry.name] ?? "#6b7280"}
              height={280}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Asset Type Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <CssBarChart
              data={assetTypeData}
              valueKey="count"
              labelKey="type"
              colorFn={(_, i) => PALETTE[i % PALETTE.length]}
              height={280}
            />
          </CardContent>
        </Card>
      </div>

      {/* Recent Assets and Expired Warranties */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">New Assets (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              {newAssets.length === 0 ? (
                <p className="text-gray-500 text-sm">No new assets added recently</p>
              ) : (
                newAssets.slice(0, 5).map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{asset.assetName}</p>
                      <p className="text-xs text-gray-500 truncate">{asset.productType}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm">₦{asset.cost?.toLocaleString() || 0}</p>
                      <p className="text-xs text-gray-500">{new Date(asset.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Expired Warranties</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              {expiredAssets.length === 0 ? (
                <p className="text-gray-500 text-sm">No expired warranties</p>
              ) : (
                expiredAssets.slice(0, 5).map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{asset.assetName}</p>
                      <p className="text-xs text-gray-500 truncate">{asset.productType}</p>
                      {asset.serviceTag && (
                        <p className="text-xs font-mono text-blue-600 truncate mt-0.5">{asset.serviceTag}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm text-red-600">Expired</p>
                      <p className="text-xs text-gray-500">{new Date(asset.warrantyExpiry!).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-8"></div>

      {/* Advanced Analytics */}
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl mb-2">Advanced Analytics</h2>
            <p className="text-sm sm:text-base text-gray-600">
              Customize additional metrics to track what matters most to you.
            </p>
          </div>
          <Button
            onClick={() => setShowSettings(!showSettings)}
            className="bg-gradient-to-r from-red-900 to-rose-900 hover:from-red-800 hover:to-rose-800 flex-shrink-0"
          >
            <Settings className="w-4 h-4 mr-2" />
            Customize
          </Button>
        </div>

        {showSettings && (
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Customize Analytics</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-gray-600">Select which analytics you want to see on your dashboard</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm mb-3 text-gray-700">Default Analytics</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {analyticsConfig.filter((a) => a.category === "default").map((analytic) => (
                      <label key={analytic.id} className="flex items-center gap-2 p-3 bg-white rounded-lg border cursor-pointer hover:bg-gray-50">
                        <input type="checkbox" checked={analytic.enabled} onChange={() => toggleAnalytic(analytic.id)} className="w-4 h-4 text-blue-600 rounded" />
                        <span className="text-sm">{analytic.title}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm mb-3 text-gray-700">Advanced Analytics</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {analyticsConfig.filter((a) => a.category === "advanced").map((analytic) => (
                      <label key={analytic.id} className="flex items-center gap-2 p-3 bg-white rounded-lg border cursor-pointer hover:bg-gray-50">
                        <input type="checkbox" checked={analytic.enabled} onChange={() => toggleAnalytic(analytic.id)} className="w-4 h-4 text-blue-600 rounded" />
                        <span className="text-sm">{analytic.title}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {enabledAnalytics.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {enabledAnalytics.map((analytic) => {
              const cardData = getAnalyticCard(analytic.id);
              if (!cardData) return null;
              const Icon = cardData.icon;
              return (
                <Card key={analytic.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">{cardData.title}</p>
                        <p className="text-2xl sm:text-3xl mb-2 truncate">{cardData.value}</p>
                        {"subValue" in cardData && cardData.subValue && (
                          <p className="text-xs sm:text-sm text-gray-700 mb-1">{cardData.subValue as string}</p>
                        )}
                        <p className="text-xs text-gray-500 truncate">{cardData.change}</p>
                      </div>
                      <div className={`${cardData.color} p-2 sm:p-3 rounded-lg flex-shrink-0 ml-2`}>
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Advanced Charts — also CSS-based */}
        {(analyticsConfig.find((a) => a.id === "systemTypeBreakdown")?.enabled ||
          analyticsConfig.find((a) => a.id === "laptopPerDepartment")?.enabled ||
          analyticsConfig.find((a) => a.id === "highestIssues")?.enabled) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {analyticsConfig.find((a) => a.id === "systemTypeBreakdown")?.enabled && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">System Type Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <CssBarChart
                    data={systemTypesData}
                    valueKey="value"
                    labelKey="name"
                    colorFn={(_, i) => PALETTE[i % PALETTE.length]}
                    height={280}
                  />
                </CardContent>
              </Card>
            )}

            {analyticsConfig.find((a) => a.id === "laptopPerDepartment")?.enabled && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Laptops per Department</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <CssBarChart
                    data={laptopsByDeptData}
                    valueKey="value"
                    labelKey="name"
                    colorFn={() => "#3b82f6"}
                    height={280}
                  />
                </CardContent>
              </Card>
            )}

            {analyticsConfig.find((a) => a.id === "highestIssues")?.enabled && issuesByCategoryData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Issues by Category</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <CssBarChart
                    data={issuesByCategoryData}
                    valueKey="value"
                    labelKey="name"
                    colorFn={() => "#f59e0b"}
                    height={280}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
