import { useState, useEffect } from "react";
import { User } from "../App";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { toast } from "sonner@2.0.3";
import { FileText, Download, TrendingUp, DollarSign, Package, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [assetsResponse, softwareResponse, incidentsResponse] = await Promise.all([
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/assets`, {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/software`, {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/incidents`, {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }),
      ]);

      const assetsData = await assetsResponse.json();
      const softwareData = await softwareResponse.json();
      const incidentsData = await incidentsResponse.json();

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

  // Asset Analytics
  const assetsByDepartment = assets.reduce((acc, asset) => {
    const dept = asset.department || "Unassigned";
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const departmentData = Object.entries(assetsByDepartment).map(([name, count]) => ({
    name,
    count,
  }));

  const assetsByType = assets.reduce((acc, asset) => {
    acc[asset.productType] = (acc[asset.productType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeData = Object.entries(assetsByType).map(([name, count]) => ({
    name,
    count,
  }));

  const assetsByState = assets.reduce((acc, asset) => {
    acc[asset.assetState] = (acc[asset.assetState] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const stateData = Object.entries(assetsByState).map(([name, value]) => ({
    name,
    value,
  }));

  // Cost Analytics
  const totalAssetCost = assets.reduce((sum, asset) => sum + (asset.cost || 0), 0);
  const avgAssetCost = assets.length > 0 ? totalAssetCost / assets.length : 0;

  const costByDepartment = assets.reduce((acc, asset) => {
    const dept = asset.department || "Unassigned";
    acc[dept] = (acc[dept] || 0) + (asset.cost || 0);
    return acc;
  }, {} as Record<string, number>);

  const costData = Object.entries(costByDepartment).map(([name, cost]) => ({
    name,
    cost,
  }));

  // Incident Analytics
  const incidentsByType = incidents.reduce((acc, incident) => {
    acc[incident.incidentType] = (acc[incident.incidentType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const incidentTypeData = Object.entries(incidentsByType).map(([name, count]) => ({
    name,
    count,
  }));

  const incidentsBySeverity = incidents.reduce((acc, incident) => {
    acc[incident.impactSeverity] = (acc[incident.impactSeverity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const severityData = Object.entries(incidentsBySeverity).map(([name, value]) => ({
    name,
    value,
  }));

  // Monthly asset creation trend (last 6 months)
  const getLast6Months = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push({
        month: date.toLocaleString("default", { month: "short" }),
        year: date.getFullYear(),
        key: `${date.getFullYear()}-${date.getMonth()}`,
      });
    }
    return months;
  };

  const last6Months = getLast6Months();
  const assetTrendData = last6Months.map((month) => {
    const count = assets.filter((asset) => {
      const assetDate = new Date(asset.createdAt);
      return (
        `${assetDate.getFullYear()}-${assetDate.getMonth()}` === month.key
      );
    }).length;
    return {
      month: month.month,
      count,
    };
  });

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers.map((header) => JSON.stringify(row[header] || "")).join(",")
      ),
    ].join("\n");

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
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Assets</p>
                <p className="text-3xl mb-2">{assets.length}</p>
                <p className="text-xs text-gray-500">Across all departments</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Cost</p>
                <p className="text-3xl mb-2">₦{(totalAssetCost / 1000000).toFixed(1)}M</p>
                <p className="text-xs text-gray-500">Asset investments</p>
              </div>
              <div className="bg-green-500 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Incidents</p>
                <p className="text-3xl mb-2">{incidents.length}</p>
                <p className="text-xs text-gray-500">Reported issues</p>
              </div>
              <div className="bg-red-500 p-3 rounded-lg">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Avg Asset Cost</p>
                <p className="text-3xl mb-2">₦{(avgAssetCost / 1000).toFixed(0)}K</p>
                <p className="text-xs text-gray-500">Per asset</p>
              </div>
              <div className="bg-purple-500 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overview Report */}
      {reportType === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Asset Acquisition Trend (Last 6 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={assetTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} name="Assets" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Asset Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stateData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stateData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Assets Report */}
      {reportType === "assets" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Assets by Department</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={departmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assets by Type</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, count }) => `${name}: ${count}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Financial Report */}
      {reportType === "financial" && (
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Cost by Department (₦)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={costData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `₦${value.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="cost" fill="#10b981" name="Total Cost" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Incidents Report */}
      {reportType === "incidents" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Incidents by Type</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={incidentTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Incidents by Severity</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}