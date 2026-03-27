import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { toast } from "sonner@2.0.3";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import {
  FileText,
  AlertTriangle,
  Search,
  Download,
  Trash2,
  RefreshCw,
  Filter,
  Calendar,
  User,
  Activity,
  XCircle,
  CheckCircle,
  Info,
  Shield,
} from "lucide-react";

interface ErrorLog {
  id: string;
  timestamp: string;
  severity: "critical" | "error" | "warning" | "info";
  module: string;
  errorMessage: string;
  errorStack?: string;
  user?: string;
  action?: string;
  additionalInfo?: any;
}

interface AuditLog {
  id: string;
  timestamp: string;
  user?: string | null;
  action: string;
  module: string;
  details: string;
  ipAddress?: string;
  status: "success" | "failed";
  changes?: any;
}

export default function SystemLogs() {
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter states
  const [errorSearchQuery, setErrorSearchQuery] = useState("");
  const [errorSeverityFilter, setErrorSeverityFilter] = useState<string>("all");
  const [errorModuleFilter, setErrorModuleFilter] = useState<string>("all");

  const [auditSearchQuery, setAuditSearchQuery] = useState("");
  const [auditActionFilter, setAuditActionFilter] = useState<string>("all");
  const [auditModuleFilter, setAuditModuleFilter] = useState<string>("all");
  const [auditStatusFilter, setAuditStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Fetch error logs
      const errorResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/logs/errors`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (errorResponse.ok) {
        const errorData = await errorResponse.json();
        setErrorLogs(errorData.logs || []);
      }

      // Fetch audit logs
      const auditResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/logs/audit`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (auditResponse.ok) {
        const auditData = await auditResponse.json();
        console.log("Audit logs received:", auditData);
        console.log("Number of audit logs:", (auditData.logs || []).length);
        setAuditLogs(auditData.logs || []);
      } else {
        console.error("Failed to fetch audit logs:", auditResponse.status);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
      toast.error("Failed to load logs");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLogs();
    setRefreshing(false);
    toast.success("Logs refreshed successfully!");
  };

  const handleClearErrorLogs = async () => {
    if (!confirm("Are you sure you want to clear all error logs? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/logs/errors`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        toast.success("Error logs cleared successfully!");
        fetchLogs();
      } else {
        toast.error("Failed to clear error logs");
      }
    } catch (error) {
      console.error("Error clearing logs:", error);
      toast.error("An error occurred while clearing logs");
    }
  };

  const handleClearAuditLogs = async () => {
    if (!confirm("Are you sure you want to clear all audit logs? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/logs/audit`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        toast.success("Audit logs cleared successfully!");
        fetchLogs();
      } else {
        toast.error("Failed to clear audit logs");
      }
    } catch (error) {
      console.error("Error clearing logs:", error);
      toast.error("An error occurred while clearing logs");
    }
  };

  const exportToCSV = (type: "error" | "audit") => {
    let csv = "";
    let filename = "";

    if (type === "error") {
      const headers = ["Timestamp", "Severity", "Module", "Error Message", "User", "Action"];
      const rows = filteredErrorLogs.map((log) => [
        new Date(log.timestamp).toLocaleString(),
        log.severity,
        log.module,
        log.errorMessage.replace(/,/g, ";"),
        log.user || "System",
        log.action || "N/A",
      ]);
      csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
      filename = `error_logs_${Date.now()}.csv`;
    } else {
      const headers = ["Timestamp", "User", "Action", "Module", "Details", "Status"];
      const rows = filteredAuditLogs.map((log) => [
        new Date(log.timestamp).toLocaleString(),
        log.user || "System",
        log.action,
        log.module,
        log.details.replace(/,/g, ";"),
        log.status,
      ]);
      csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
      filename = `audit_logs_${Date.now()}.csv`;
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${type === "error" ? "Error" : "Audit"} logs exported!`);
  };

  // Filter error logs
  const filteredErrorLogs = errorLogs.filter((log) => {
    const matchesSearch =
      log.errorMessage.toLowerCase().includes(errorSearchQuery.toLowerCase()) ||
      log.module.toLowerCase().includes(errorSearchQuery.toLowerCase()) ||
      (log.user && log.user.toLowerCase().includes(errorSearchQuery.toLowerCase()));

    const matchesSeverity = errorSeverityFilter === "all" || log.severity === errorSeverityFilter;
    const matchesModule = errorModuleFilter === "all" || log.module === errorModuleFilter;

    return matchesSearch && matchesSeverity && matchesModule;
  });

  // Filter audit logs
  const filteredAuditLogs = (auditLogs || []).filter((log) => {
    if (!log) return false;
    
    const matchesSearch =
      !auditSearchQuery || // If search is empty, match all
      (log.user && typeof log.user === 'string' && log.user.toLowerCase().includes(auditSearchQuery.toLowerCase())) ||
      (log.action && log.action.toLowerCase().includes(auditSearchQuery.toLowerCase())) ||
      (log.details && log.details.toLowerCase().includes(auditSearchQuery.toLowerCase())) ||
      (log.module && log.module.toLowerCase().includes(auditSearchQuery.toLowerCase()));

    const matchesAction = auditActionFilter === "all" || log.action === auditActionFilter;
    const matchesModule = auditModuleFilter === "all" || log.module === auditModuleFilter;
    const matchesStatus = auditStatusFilter === "all" || log.status === auditStatusFilter;

    const result = matchesSearch && matchesAction && matchesModule && matchesStatus;
    
    // Debug logging
    if (auditLogs.length > 0 && !result) {
      console.log("Log filtered out:", {
        log,
        matchesSearch,
        matchesAction,
        matchesModule,
        matchesStatus,
        auditSearchQuery,
        auditActionFilter,
        auditModuleFilter,
        auditStatusFilter
      });
    }

    return result;
  });

  console.log("Audit logs:", auditLogs.length, "Filtered:", filteredAuditLogs.length);

  // Get unique modules and actions for filters
  const errorModules = Array.from(new Set((errorLogs || []).filter(log => log && log.module).map((log) => log.module)));
  const auditModules = Array.from(new Set((auditLogs || []).filter(log => log && log.module).map((log) => log.module)));
  const auditActions = Array.from(new Set((auditLogs || []).filter(log => log && log.action).map((log) => log.action)));

  const getSeverityBadge = (severity: string) => {
    const colors = {
      critical: "bg-red-100 text-red-700 border-red-200",
      error: "bg-orange-100 text-orange-700 border-orange-200",
      warning: "bg-yellow-100 text-yellow-700 border-yellow-200",
      info: "bg-blue-100 text-blue-700 border-blue-200",
    };
    return colors[severity as keyof typeof colors] || colors.info;
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <XCircle className="w-4 h-4" />;
      case "error":
        return <AlertTriangle className="w-4 h-4" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4" />;
      case "info":
        return <Info className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 border-blue-200">
        <FileText className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 text-sm">
          <strong>System Logs:</strong> Monitor system errors and track all user
          activities. Error logs help diagnose issues, while audit trails provide
          accountability and security oversight.
        </AlertDescription>
      </Alert>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Error Logs</p>
                <p className="text-3xl mt-2">{errorLogs.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical Errors</p>
                <p className="text-3xl mt-2 text-red-600">
                  {(errorLogs || []).filter((log) => log && log.severity === "critical").length}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Audit Logs</p>
                <p className="text-3xl mt-2">{(auditLogs || []).length}</p>
              </div>
              <Shield className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Failed Actions</p>
                <p className="text-3xl mt-2 text-orange-600">
                  {(auditLogs || []).filter((log) => log && log.status === "failed").length}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs Tabs */}
      <Tabs defaultValue="error" className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <TabsList>
            <TabsTrigger value="error" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Error Logs
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Audit Trail
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Error Logs Tab */}
        <TabsContent value="error" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <CardTitle>Error Logs</CardTitle>
                  <CardDescription>
                    System errors, exceptions, and critical issues
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => exportToCSV("error")}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button
                    onClick={handleClearErrorLogs}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear Logs
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="error-search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="error-search"
                      placeholder="Search by message, module, or user..."
                      value={errorSearchQuery}
                      onChange={(e) => setErrorSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="severity-filter">Severity</Label>
                  <Select value={errorSeverityFilter} onValueChange={setErrorSeverityFilter}>
                    <SelectTrigger id="severity-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severities</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="error-module-filter">Module</Label>
                  <Select value={errorModuleFilter} onValueChange={setErrorModuleFilter}>
                    <SelectTrigger id="error-module-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Modules</SelectItem>
                      {errorModules.map((module) => (
                        <SelectItem key={module} value={module}>
                          {module}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Error Logs Table */}
              {loading ? (
                <div className="text-center py-12 text-gray-500">
                  Loading error logs...
                </div>
              ) : filteredErrorLogs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  {errorSearchQuery || errorSeverityFilter !== "all" || errorModuleFilter !== "all"
                    ? "No error logs found matching your filters"
                    : "No error logs found"}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">Timestamp</TableHead>
                        <TableHead className="w-[120px]">Severity</TableHead>
                        <TableHead className="w-[150px]">Module</TableHead>
                        <TableHead>Error Message</TableHead>
                        <TableHead className="w-[120px]">User</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredErrorLogs.slice(0, 100).map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs">
                            {new Date(log.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getSeverityBadge(log.severity)} flex items-center gap-1 w-fit`}>
                              {getSeverityIcon(log.severity)}
                              {log.severity}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{log.module}</TableCell>
                          <TableCell className="max-w-md">
                            <div className="text-sm truncate" title={log.errorMessage}>
                              {log.errorMessage}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {log.user || <span className="text-gray-400">System</span>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {filteredErrorLogs.length > 100 && (
                    <div className="text-center py-4 text-sm text-gray-500">
                      Showing first 100 of {filteredErrorLogs.length} logs
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Trail Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <CardTitle>Audit Trail</CardTitle>
                  <CardDescription>
                    Complete history of user actions and system changes
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => exportToCSV("audit")}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button
                    onClick={handleClearAuditLogs}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear Logs
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="audit-search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="audit-search"
                      placeholder="Search by user, action, or details..."
                      value={auditSearchQuery}
                      onChange={(e) => setAuditSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="action-filter">Action</Label>
                  <Select value={auditActionFilter} onValueChange={setAuditActionFilter}>
                    <SelectTrigger id="action-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      {auditActions.map((action) => (
                        <SelectItem key={action} value={action}>
                          {action}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="audit-module-filter">Module</Label>
                  <Select value={auditModuleFilter} onValueChange={setAuditModuleFilter}>
                    <SelectTrigger id="audit-module-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Modules</SelectItem>
                      {auditModules.map((module) => (
                        <SelectItem key={module} value={module}>
                          {module}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status-filter">Status</Label>
                  <Select value={auditStatusFilter} onValueChange={setAuditStatusFilter}>
                    <SelectTrigger id="status-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Audit Logs Table */}
              {loading ? (
                <div className="text-center py-12 text-gray-500">
                  Loading audit logs...
                </div>
              ) : (auditLogs || []).length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No audit logs found in database
                </div>
              ) : filteredAuditLogs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">
                    No audit logs found matching your filters
                  </p>
                  <div className="text-sm text-gray-400 space-y-1">
                    <p>Total logs in database: {(auditLogs || []).length}</p>
                    <p>Filtered out: {(auditLogs || []).length - filteredAuditLogs.length}</p>
                    {auditSearchQuery && <p>Search: "{auditSearchQuery}"</p>}
                    {auditActionFilter !== "all" && <p>Action filter: {auditActionFilter}</p>}
                    {auditModuleFilter !== "all" && <p>Module filter: {auditModuleFilter}</p>}
                    {auditStatusFilter !== "all" && <p>Status filter: {auditStatusFilter}</p>}
                  </div>
                  <Button
                    onClick={() => {
                      setAuditSearchQuery("");
                      setAuditActionFilter("all");
                      setAuditModuleFilter("all");
                      setAuditStatusFilter("all");
                    }}
                    variant="outline"
                    size="sm"
                    className="mt-4"
                  >
                    Clear All Filters
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">Timestamp</TableHead>
                        <TableHead className="w-[120px]">User</TableHead>
                        <TableHead className="w-[150px]">Action</TableHead>
                        <TableHead className="w-[120px]">Module</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead className="w-[100px]">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAuditLogs.slice(0, 100).map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs">
                            {new Date(log.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {log.user || <span className="text-gray-400">System</span>}
                          </TableCell>
                          <TableCell className="text-sm">{log.action}</TableCell>
                          <TableCell className="text-sm">{log.module}</TableCell>
                          <TableCell className="max-w-md">
                            <div className="text-sm truncate" title={log.details}>
                              {log.details}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                log.status === "success"
                                  ? "bg-green-100 text-green-700 border-green-200 flex items-center gap-1 w-fit"
                                  : "bg-red-100 text-red-700 border-red-200 flex items-center gap-1 w-fit"
                              }
                            >
                              {log.status === "success" ? (
                                <CheckCircle className="w-3 h-3" />
                              ) : (
                                <XCircle className="w-3 h-3" />
                              )}
                              {log.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {filteredAuditLogs.length > 100 && (
                    <div className="text-center py-4 text-sm text-gray-500">
                      Showing first 100 of {filteredAuditLogs.length} logs
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}