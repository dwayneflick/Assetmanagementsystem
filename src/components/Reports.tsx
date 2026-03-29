import { useState, useEffect } from "react";
import { User } from "../App";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { toast } from "sonner@2.0.3";
import { Download, TrendingUp, DollarSign, Package, AlertCircle } from "lucide-react";
// recharts fully removed — CssBarChart replaces all charts to eliminate SVG duplicate-key warnings

// ─── Shared CSS chart helpers ─────────────────────────────────────────────────
const PALETTE = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

interface CssBarEntry { [key: string]: any; }

function CssBarChart({
  data, valueKey, labelKey, colorFn, height = 260, formatValue,
}: {
  data: CssBarEntry[];
  valueKey: string;
  labelKey: string;
  colorFn?: (entry: CssBarEntry, index: number) => string;
  height?: number;
  formatValue?: (v: number) => string;
}) {
  const max = Math.max(...data.map((d) => Number(d[valueKey]) || 0), 1);
  if (data.length === 0) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-sm text-gray-400">
        No data
      </div>
    );
  }
  return (
    <div style={{ height }} className="w-full flex flex-col">
      <div className="flex items-end gap-2 flex-1 px-2">
        {data.map((entry, i) => {
          const val = Number(entry[valueKey]) || 0;
          const pct = (val / max) * 100;
          const color = colorFn ? colorFn(entry, i) : "#3b82f6";
          return (
            <div
              key={`bar-${i}-${entry[labelKey]}`}
              className="flex flex-col items-center flex-1 h-full justify-end"
              title={`${entry[labelKey]}: ${formatValue ? formatValue(val) : val}`}
            >
              <span className="text-xs font-semibold text-gray-600 mb-1">
                {formatValue ? formatValue(val) : val}
              </span>
              <div
                className="w-full rounded-t transition-all duration-500"
                style={{ height: `${Math.max(pct, 2)}%`, backgroundColor: color, minHeight: 4 }}
              />
            </div>
          );
        })}
      </div>
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

// Mini line-trend chart (CSS only)
function CssTrendChart({ data, valueKey, labelKey, height = 200 }: {
  data: CssBarEntry[]; valueKey: string; labelKey: string; height?: number;
}) {
  const vals = data.map((d) => Number(d[valueKey]) || 0);
  const max = Math.max(...vals, 1);
  const chartH = height - 36;

  const points = vals.map((v, i) => ({
    x: data.length === 1 ? 50 : (i / (data.length - 1)) * 100,
    y: 100 - (v / max) * 100,
    v,
    label: data[i][labelKey],
  }));

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div style={{ height }} className="w-full flex flex-col">
      <div style={{ height: chartH }} className="relative w-full px-2">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          {/* grid lines */}
          {[0, 25, 50, 75, 100].map((y) => (
            <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#e5e7eb" strokeWidth="0.5" />
          ))}
          {/* area fill */}
          <polyline
            points={`0,100 ${polyline} 100,100`}
            fill="#3b82f620"
            stroke="none"
          />
          {/* line */}
          <polyline
            points={polyline}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          {/* dots */}
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="2" fill="#3b82f6" vectorEffect="non-scaling-stroke" />
          ))}
        </svg>
      </div>
      <div className="flex gap-1 px-2 mt-1" style={{ height: 30 }}>
        {data.map((entry, i) => (
          <div key={i} className="flex-1 flex items-start justify-center">
            <span className="text-xs text-gray-500 text-center leading-tight">
              {entry[labelKey]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface ReportsProps {
  user: User;
}

interface Asset {
  id: string;
  assetName: string;
  productType: string;
  assetState: string;
  cost: number;
  department: string;
  unit?: string;
  createdAt: string;
  warrantyExpiry?: string;
}

interface Software {
  id: string;
  softwareName: string;
  expiryDate?: string;
  renewalDate?: string;
}

interface Incident {
  id: string;
  incidentType: string;
  impactSeverity: string;
  status: string;
  estimatedCost: number;
  dateOfIncident: string;
}

export default function Reports({ user }: ReportsProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [software, setSoftware] = useState<Software[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState("overview");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [assetsRes, softwareRes, incidentsRes] = await Promise.all([
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/assets`, { headers: { Authorization: `Bearer ${publicAnonKey}` } }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/software`, { headers: { Authorization: `Bearer ${publicAnonKey}` } }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/incidents`, { headers: { Authorization: `Bearer ${publicAnonKey}` } }),
      ]);
      const [assetsData, softwareData, incidentsData] = await Promise.all([assetsRes.json(), softwareRes.json(), incidentsRes.json()]);
      setAssets(assetsData.assets || []);
      setSoftware(softwareData.software || []);
      setIncidents(incidentsData.incidents || []);
    } catch (error) {
      console.error("Error fetching report data:", error);
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  // ── Derived data ──────────────────────────────────────────────────────────

  const totalAssetCost = assets.reduce((sum, a) => sum + (a.cost || 0), 0);
  const avgAssetCost = assets.length > 0 ? totalAssetCost / assets.length : 0;

  const departmentData = Object.entries(
    assets.reduce((acc, a) => { const d = a.department || "Unassigned"; acc[d] = (acc[d] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([name, count]) => ({ name, count }));

  const typeData = Object.entries(
    assets.reduce((acc, a) => { acc[a.productType] = (acc[a.productType] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([name, count]) => ({ name, count }));

  const stateData = Object.entries(
    assets.reduce((acc, a) => { acc[a.assetState] = (acc[a.assetState] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const costData = Object.entries(
    assets.reduce((acc, a) => { const d = a.department || "Unassigned"; acc[d] = (acc[d] || 0) + (a.cost || 0); return acc; }, {} as Record<string, number>)
  ).map(([name, cost]) => ({ name, cost }));

  const unitData = Object.entries(
    assets.reduce((acc, a) => { const u = a.unit || "Unassigned"; acc[u] = (acc[u] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([name, count]) => ({ name, count }));

  const costByUnitData = Object.entries(
    assets.reduce((acc, a) => { const u = a.unit || "Unassigned"; acc[u] = (acc[u] || 0) + (a.cost || 0); return acc; }, {} as Record<string, number>)
  ).map(([name, cost]) => ({ name, cost }));

  const incidentTypeData = Object.entries(
    incidents.reduce((acc, i) => { acc[i.incidentType] = (acc[i.incidentType] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([name, count]) => ({ name, count }));

  const severityData = Object.entries(
    incidents.reduce((acc, i) => { acc[i.impactSeverity] = (acc[i.impactSeverity] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  // Last 6 months trend
  const assetTrendData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    return {
      month: date.toLocaleString("default", { month: "short" }),
      count: assets.filter((a) => {
        const d = new Date(a.createdAt);
        return `${d.getFullYear()}-${d.getMonth()}` === key;
      }).length,
    };
  });

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) { toast.error("No data to export"); return; }
    const headers = Object.keys(data[0]);
    const csvContent = [headers.join(","), ...data.map((row) => headers.map((h) => JSON.stringify(row[h] || "")).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success("Report exported successfully");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl mb-1 sm:mb-2 break-words">Reports & Analytics</h1>
          <p className="text-sm sm:text-base text-gray-600">Generate insights and export data</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Overview</SelectItem>
              <SelectItem value="assets">Assets Report</SelectItem>
              <SelectItem value="financial">Financial Report</SelectItem>
              <SelectItem value="incidents">Incidents Report</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => {
              if (reportType === "assets") exportToCSV(assets, "assets-report");
              else if (reportType === "incidents") exportToCSV(incidents, "incidents-report");
              else if (reportType === "financial") exportToCSV(costData, "financial-report");
              else toast.info("Select a specific report type to export");
            }}
            className="bg-gradient-to-r from-red-900 to-rose-900 hover:from-red-800 hover:to-rose-800 whitespace-nowrap text-sm sm:text-base w-full sm:w-auto"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          { label: "Total Assets", value: assets.length, sub: "Across all departments", Icon: Package, bg: "bg-blue-500" },
          { label: "Total Cost", value: `₦${(totalAssetCost / 1000000).toFixed(1)}M`, sub: "Asset investments", Icon: DollarSign, bg: "bg-green-500" },
          { label: "Total Incidents", value: incidents.length, sub: "Reported issues", Icon: AlertCircle, bg: "bg-red-500" },
          { label: "Avg Asset Cost", value: `₦${(avgAssetCost / 1000).toFixed(0)}K`, sub: "Per asset", Icon: TrendingUp, bg: "bg-purple-500" },
        ].map(({ label, value, sub, Icon, bg }) => (
          <Card key={label}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{label}</p>
                  <p className="text-3xl mb-2">{value}</p>
                  <p className="text-xs text-gray-500">{sub}</p>
                </div>
                <div className={`${bg} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Overview ─────────────────────────────────────────────────────────── */}
      {reportType === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Asset Acquisition Trend (Last 6 Months)</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <CssTrendChart data={assetTrendData} valueKey="count" labelKey="month" height={280} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Asset Status Distribution</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <CssBarChart
                data={stateData}
                valueKey="value"
                labelKey="name"
                colorFn={(_, i) => PALETTE[i % PALETTE.length]}
                height={280}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Assets Report ────────────────────────────────────────────────────── */}
      {reportType === "assets" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Assets by Department</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <CssBarChart
                data={departmentData}
                valueKey="count"
                labelKey="name"
                colorFn={() => "#3b82f6"}
                height={280}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assets by Unit</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <CssBarChart
                data={unitData}
                valueKey="count"
                labelKey="name"
                colorFn={(_, i) => PALETTE[i % PALETTE.length]}
                height={280}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assets by Type</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <CssBarChart
                data={typeData}
                valueKey="count"
                labelKey="name"
                colorFn={(_, i) => PALETTE[i % PALETTE.length]}
                height={280}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Financial Report ──────────────────────────────────────────────────── */}
      {reportType === "financial" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Cost by Department (₦)</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <CssBarChart
                data={costData}
                valueKey="cost"
                labelKey="name"
                colorFn={() => "#10b981"}
                height={360}
                formatValue={(v) => `₦${(v / 1000).toFixed(0)}K`}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cost by Unit (₦)</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <CssBarChart
                data={costByUnitData}
                valueKey="cost"
                labelKey="name"
                colorFn={(_, i) => PALETTE[i % PALETTE.length]}
                height={360}
                formatValue={(v) => `₦${(v / 1000).toFixed(0)}K`}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Incidents Report ──────────────────────────────────────────────────── */}
      {reportType === "incidents" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Incidents by Type</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <CssBarChart
                data={incidentTypeData}
                valueKey="count"
                labelKey="name"
                colorFn={() => "#ef4444"}
                height={280}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Incidents by Severity</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <CssBarChart
                data={severityData}
                valueKey="value"
                labelKey="name"
                colorFn={(_, i) => PALETTE[i % PALETTE.length]}
                height={280}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}