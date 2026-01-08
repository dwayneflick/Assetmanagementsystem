import { useState, useEffect, useMemo } from "react";
import { User } from "../App";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import {
  Package,
  Laptop,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Activity,
  Settings,
  X,
  UserMinus,
  Calendar,
  HardDrive,
  BarChart3,
  Timer,
  Star,
  Bug,
  AlertTriangle,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

interface DashboardProps {
  user: User;
}

interface Asset {
  id: string;
  assetName: string;
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
      setAnalyticsConfig(JSON.parse(saved));
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
      const [assetsResponse, softwareResponse, incidentsResponse, itIssuesResponse, deregResponse] = await Promise.all([
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/assets`, {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/software`, {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/incidents`, {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/it-issues`, {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/deregistrations`, {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }),
      ]);

      const [assetsData, softwareData, incidentsData, itIssuesData, deregData] = await Promise.all([
        assetsResponse.json(),
        softwareResponse.json(),
        incidentsResponse.json(),
        itIssuesResponse.json(),
        deregResponse.json(),
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

  // Memoize expensive calculations to prevent unnecessary recomputations
  const dashboardMetrics = useMemo(() => {
    // Original Dashboard Metrics
    const totalAssets = assets.length;
    const totalInUse = assets.filter((a) => a.assetState === "In Use/Active").length;
    const totalUnassigned = assets.filter((a) => a.assetState === "Unassigned").length;
    const totalFaulty = assets.filter((a) => a.assetState === "Faulty").length;
    const totalRetired = assets.filter((a) => a.assetState === "Retired").length;
    const totalDisposed = assets.filter((a) => a.assetState === "Disposed").length;

    const totalCost = assets.reduce((sum, asset) => sum + (asset.cost || 0), 0);

    // Calculate expired assets (warranty expired)
    const today = new Date();
    const expiredAssets = assets.filter((a) => {
      if (!a.warrantyExpiry) return false;
      return new Date(a.warrantyExpiry) < today;
    });

    // Get new assets (created in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newAssets = assets.filter((a) => new Date(a.createdAt) > thirtyDaysAgo);

    // Software expiring soon (within 60 days)
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);
    const expiringSoftware = software.filter((s) => {
      if (!s.expiryDate) return false;
      const expiryDate = new Date(s.expiryDate);
      return expiryDate > today && expiryDate < sixtyDaysFromNow;
    });

    // Asset state distribution for pie chart
    const assetStateData = [
      { name: "In Use", value: totalInUse, color: "#10b981" },
      { name: "Unassigned", value: totalUnassigned, color: "#f59e0b" },
      { name: "Faulty", value: totalFaulty, color: "#ef4444" },
      { name: "Retired", value: totalRetired, color: "#6b7280" },
      { name: "Disposed", value: totalDisposed, color: "#9ca3af" },
    ].filter((item) => item.value > 0);

    // Asset type distribution for bar chart
    const assetTypeData = [
      { type: "Hardware", count: assets.filter((a) => a.productType === "Hardware").length },
      { type: "Software", count: assets.filter((a) => a.productType === "Software").length },
      { type: "Network", count: assets.filter((a) => a.productType === "Network").length },
    ];

    return {
      totalAssets,
      totalInUse,
      totalUnassigned,
      totalFaulty,
      totalRetired,
      totalDisposed,
      totalCost,
      expiredAssets,
      newAssets,
      expiringSoftware,
      assetStateData,
      assetTypeData,
      today,
    };
  }, [assets, software]);

  // Memoize advanced analytics calculations
  const advancedMetrics = useMemo(() => {
    const today = dashboardMetrics.today;

    const totalLaptopIncidents = incidents.filter((inc) => 
      inc.category?.toLowerCase().includes("laptop") || 
      inc.category?.toLowerCase().includes("hardware")
    ).length;

    const totalITIssueLogs = itIssues.length;

    // Highest issues faced - count by category
    const issuesByCategory: Record<string, number> = {};
    [...incidents, ...itIssues].forEach((item) => {
      const category = item.category || "Other";
      issuesByCategory[category] = (issuesByCategory[category] || 0) + 1;
    });
    const highestIssue = Object.entries(issuesByCategory).sort((a, b) => b[1] - a[1])[0];

    const totalStaffExited = deregistrations.filter((d) => 
      d.reason?.toLowerCase().includes("exit") || 
      d.reason?.toLowerCase().includes("resignation") ||
      d.reason?.toLowerCase().includes("terminated")
    ).length;

    const softwareExpired = software.filter((s) => {
      if (!s.expiryDate) return false;
      return new Date(s.expiryDate) < today;
    }).length;

    const totalWindowsSystems = assets.filter((a) => 
      a.operatingSystem?.toLowerCase().includes("windows")
    ).length;

    // System type breakdown
    const systemTypes: Record<string, number> = {};
    assets.forEach((asset) => {
      const os = asset.operatingSystem || "Unknown";
      systemTypes[os] = (systemTypes[os] || 0) + 1;
    });

    // Laptops per department
    const laptopsByDept: Record<string, number> = {};
    assets.filter((a) => a.assetName?.toLowerCase().includes("laptop")).forEach((laptop) => {
      const dept = laptop.department || "Unassigned";
      laptopsByDept[dept] = (laptopsByDept[dept] || 0) + 1;
    });

    const inProgressITIssues = itIssues.filter((issue) => 
      issue.status === "In Progress" || issue.status === "Open"
    ).length;

    // Calculate total downtime
    const calculateDowntime = (downtimeStr?: string): number => {
      if (!downtimeStr) return 0;
      const hoursMatch = downtimeStr.match(/(\d+)\s*hour/i);
      const daysMatch = downtimeStr.match(/(\d+)\s*day/i);
      let hours = 0;
      if (hoursMatch) hours += parseInt(hoursMatch[1]);
      if (daysMatch) hours += parseInt(daysMatch[1]) * 24;
      return hours;
    };

    const totalDowntime = itIssues.reduce((sum, issue) => sum + calculateDowntime(issue.downtime), 0);

    // Poor ratings - count critical/high severity issues
    const poorRatings = itIssues.filter((issue) => 
      issue.severity === "Critical" || issue.severity === "High"
    ).length;

    // Chart data
    const issuesByCategoryData = Object.entries(issuesByCategory).map(([name, value]) => ({
      name,
      value,
    }));

    const systemTypesData = Object.entries(systemTypes).map(([name, value]) => ({
      name,
      value,
    }));

    const laptopsByDeptData = Object.entries(laptopsByDept).map(([name, value]) => ({
      name,
      value,
    }));

    return {
      totalLaptopIncidents,
      totalITIssueLogs,
      highestIssue,
      totalStaffExited,
      softwareExpired,
      totalWindowsSystems,
      inProgressITIssues,
      totalDowntime,
      poorRatings,
      issuesByCategoryData,
      systemTypesData,
      laptopsByDeptData,
    };
  }, [assets, software, incidents, itIssues, deregistrations, dashboardMetrics.today]);

  // Extract metrics for easier access
  const {
    totalAssets,
    totalInUse,
    totalUnassigned,
    totalFaulty,
    totalRetired,
    totalDisposed,
    totalCost,
    expiredAssets,
    newAssets,
    expiringSoftware,
    assetStateData,
    assetTypeData,
  } = dashboardMetrics;

  const {
    totalLaptopIncidents,
    totalITIssueLogs,
    highestIssue,
    totalStaffExited,
    softwareExpired,
    totalWindowsSystems,
    inProgressITIssues,
    totalDowntime,
    poorRatings,
    issuesByCategoryData,
    systemTypesData,
    laptopsByDeptData,
  } = advancedMetrics;

  const originalStatCards = [
    {
      title: "Total Assets",
      value: totalAssets,
      icon: Package,
      color: "bg-blue-500",
      change: `${newAssets.length} new this month`,
    },
    {
      title: "Assets In Use",
      value: totalInUse,
      icon: CheckCircle,
      color: "bg-green-500",
      change: `${totalUnassigned} unassigned`,
    },
    {
      title: "Faulty Assets",
      value: totalFaulty,
      icon: AlertCircle,
      color: "bg-red-500",
      change: "Needs attention",
    },
    {
      title: "Total Cost",
      value: `₦${totalCost.toLocaleString()}`,
      icon: DollarSign,
      color: "bg-purple-500",
      change: "All assets",
    },
    {
      title: "Expired Warranties",
      value: expiredAssets.length,
      icon: Clock,
      color: "bg-orange-500",
      change: "Requires renewal",
    },
    {
      title: "Software Expiring Soon",
      value: expiringSoftware.length,
      icon: Activity,
      color: "bg-indigo-500",
      change: "Next 60 days",
    },
  ];

  const getAnalyticCard = (id: string) => {
    switch (id) {
      case "totalLaptopIncidents":
        return {
          title: "Total Laptop Incidents",
          value: totalLaptopIncidents,
          icon: Laptop,
          color: "bg-red-500",
          change: "Hardware issues",
        };
      case "totalITIssueLogs":
        return {
          title: "Total IT Issue Logs",
          value: totalITIssueLogs,
          icon: Bug,
          color: "bg-orange-500",
          change: "All IT issues",
        };
      case "highestIssues":
        return {
          title: "Highest Issues Faced",
          value: highestIssue?.[0] || "None",
          subValue: highestIssue?.[1] ? `${highestIssue[1]} occurrences` : "",
          icon: AlertTriangle,
          color: "bg-yellow-500",
          change: "Most common issue",
          isText: true,
        };
      case "totalStaffExited":
        return {
          title: "Total Staff Exited",
          value: totalStaffExited,
          icon: UserMinus,
          color: "bg-purple-500",
          change: "Deregistrations",
        };
      case "softwareExpired":
        return {
          title: "Software Expired",
          value: softwareExpired,
          icon: Calendar,
          color: "bg-pink-500",
          change: "Needs renewal",
        };
      case "totalWindowsSystems":
        return {
          title: "Total Windows Systems",
          value: totalWindowsSystems,
          icon: HardDrive,
          color: "bg-cyan-500",
          change: `Out of ${totalAssets} assets`,
        };
      case "inProgressITIssues":
        return {
          title: "In Progress IT Issues",
          value: inProgressITIssues,
          icon: Activity,
          color: "bg-indigo-500",
          change: "Active issues",
        };
      case "totalDowntime":
        return {
          title: "Total Downtime",
          value: `${totalDowntime}h`,
          icon: Timer,
          color: "bg-rose-500",
          change: "From IT issues",
        };
      case "poorRatings":
        return {
          title: "Total Poor Ratings",
          value: poorRatings,
          icon: Star,
          color: "bg-amber-500",
          change: "Critical/High severity",
        };
      default:
        return null;
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

      {/* Original Stats Grid */}
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

      {/* Original Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Asset Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Asset Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={assetStateData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {assetStateData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Asset Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Asset Type Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={assetTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Assets and Expired Assets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* New Assets */}
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
                  <div
                    key={asset.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{asset.assetName}</p>
                      <p className="text-xs text-gray-500 truncate">{asset.productType}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm">₦{asset.cost?.toLocaleString() || 0}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(asset.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Expired Assets */}
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
                  <div
                    key={asset.id}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{asset.assetName}</p>
                      <p className="text-xs text-gray-500 truncate">{asset.productType}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm text-red-600">Expired</p>
                      <p className="text-xs text-gray-500">
                        {new Date(asset.warrantyExpiry!).toLocaleDateString()}
                      </p>
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

      {/* Advanced Analytics Section */}
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

        {/* Analytics Settings Panel */}
        {showSettings && (
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Customize Analytics</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-gray-600">
                Select which analytics you want to see on your dashboard
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Default Analytics */}
                <div>
                  <h4 className="text-sm mb-3 text-gray-700">
                    Default Analytics
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {analyticsConfig
                      .filter((a) => a.category === "default")
                      .map((analytic) => (
                        <label
                          key={analytic.id}
                          className="flex items-center gap-2 p-3 bg-white rounded-lg border cursor-pointer hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={analytic.enabled}
                            onChange={() => toggleAnalytic(analytic.id)}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className="text-sm">{analytic.title}</span>
                        </label>
                      ))}
                  </div>
                </div>

                {/* Advanced Analytics */}
                <div>
                  <h4 className="text-sm mb-3 text-gray-700">
                    Advanced Analytics
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {analyticsConfig
                      .filter((a) => a.category === "advanced")
                      .map((analytic) => (
                        <label
                          key={analytic.id}
                          className="flex items-center gap-2 p-3 bg-white rounded-lg border cursor-pointer hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={analytic.enabled}
                            onChange={() => toggleAnalytic(analytic.id)}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className="text-sm">{analytic.title}</span>
                        </label>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Advanced Stats Grid */}
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
                        {cardData.subValue && (
                          <p className="text-xs sm:text-sm text-gray-700 mb-1">{cardData.subValue}</p>
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

        {/* Advanced Charts - Only show if corresponding analytics are enabled */}
        {(analyticsConfig.find((a) => a.id === "systemTypeBreakdown")?.enabled ||
          analyticsConfig.find((a) => a.id === "laptopPerDepartment")?.enabled ||
          analyticsConfig.find((a) => a.id === "highestIssues")?.enabled) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* System Type Breakdown Chart */}
            {analyticsConfig.find((a) => a.id === "systemTypeBreakdown")?.enabled && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">System Type Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={systemTypesData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {systemTypesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"][index % 5]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Laptops per Department Chart */}
            {analyticsConfig.find((a) => a.id === "laptopPerDepartment")?.enabled && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Laptops per Department</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={laptopsByDeptData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Highest Issues Faced Chart */}
            {analyticsConfig.find((a) => a.id === "highestIssues")?.enabled && issuesByCategoryData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Issues by Category</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={issuesByCategoryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}