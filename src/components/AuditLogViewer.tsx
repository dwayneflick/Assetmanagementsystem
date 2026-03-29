import { cachedFetch } from "../utils/cache";
import { useState, useEffect, useCallback, useMemo, Fragment } from "react";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import {
  Search,
  RefreshCw,
  Filter,
  Shield,
  Download,
  ChevronLeft,
  ChevronRight,
  X as XIcon,
} from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
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
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";

// ─── Types ────────────────────────────────────────────────
interface AuditLog {
  id: string;
  user: string;
  action: string;
  module: string;
  details: string;
  status: "success" | "failed";
  ipAddress?: string;
  timestamp?: string;
  createdAt?: string;
  changes?: any;
}

const PAGE_SIZE = 25;

const ACTION_COLORS: Record<string, string> = {
  Create: "bg-green-100 text-green-800",
  Update: "bg-blue-100 text-blue-800",
  Delete: "bg-red-100 text-red-800",
  Login: "bg-purple-100 text-purple-800",
  Logout: "bg-gray-100 text-gray-700",
  Upload: "bg-indigo-100 text-indigo-800",
  "Password Changed": "bg-amber-100 text-amber-800",
};

function getActionColor(action: string) {
  if (ACTION_COLORS[action]) return ACTION_COLORS[action];
  if (action.toLowerCase().includes("create")) return "bg-green-100 text-green-800";
  if (action.toLowerCase().includes("update") || action.toLowerCase().includes("edit")) return "bg-blue-100 text-blue-800";
  if (action.toLowerCase().includes("delete")) return "bg-red-100 text-red-800";
  if (action.toLowerCase().includes("login")) return "bg-purple-100 text-purple-800";
  if (action.toLowerCase().includes("password")) return "bg-amber-100 text-amber-800";
  return "bg-gray-100 text-gray-700";
}

function getStatusColor(status: string) {
  return status === "success"
    ? "bg-green-100 text-green-800"
    : "bg-red-100 text-red-800";
}

function getLogDate(log: AuditLog): string {
  return log.timestamp || log.createdAt || "";
}

// ─── Component ────────────────────────────────────────────
export default function AuditLogViewer() {
  const [allLogs, setAllLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const apiBase = `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e`;
  const headers = { Authorization: `Bearer ${publicAnonKey}` };

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page on filter change
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, actionFilter, moduleFilter, statusFilter]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await cachedFetch<{ logs: any[] }>(
        `${apiBase}/audit-logs`,
        { headers },
        60_000
      );
      setAllLogs(data.logs || []);
    } catch (err) {
      console.error("Audit log fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Client-side filtering
  const filteredLogs = useMemo(() => {
    return allLogs.filter((log) => {
      if (actionFilter !== "all" && log.action !== actionFilter) return false;
      if (moduleFilter !== "all" && log.module !== moduleFilter) return false;
      if (statusFilter !== "all" && log.status !== statusFilter) return false;
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        const searchable = [log.user, log.action, log.module, log.details, log.ipAddress]
          .join(" ")
          .toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      return true;
    });
  }, [allLogs, actionFilter, moduleFilter, statusFilter, debouncedSearch]);

  const totalPages = Math.ceil(filteredLogs.length / PAGE_SIZE);
  const pagedLogs = filteredLogs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const uniqueActions = useMemo(() => [...new Set(allLogs.map((l) => l.action).filter(Boolean))].sort(), [allLogs]);
  const uniqueModules = useMemo(() => [...new Set(allLogs.map((l) => l.module).filter(Boolean))].sort(), [allLogs]);

  const activeFilterCount = [
    actionFilter !== "all",
    moduleFilter !== "all",
    statusFilter !== "all",
    debouncedSearch !== "",
  ].filter(Boolean).length;

  function clearFilters() {
    setSearch("");
    setActionFilter("all");
    setModuleFilter("all");
    setStatusFilter("all");
  }

  // Export to CSV
  function exportCSV() {
    if (!filteredLogs.length) return;
    const headers = ["Date & Time", "User", "Action", "Module", "Details", "Status", "IP Address"];
    const rows = filteredLogs.map((log) => [
      new Date(getLogDate(log)).toLocaleString("en-NG"),
      log.user ?? "System",
      log.action,
      log.module ?? "",
      log.details ?? "",
      log.status ?? "",
      log.ipAddress ?? "",
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Shield className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Audit Log</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {filteredLogs.length.toLocaleString()} of {allLogs.length.toLocaleString()} events
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            disabled={!filteredLogs.length}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Button variant="outline" size="icon" onClick={fetchLogs} title="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by user, action, module, details..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <Filter className="w-4 h-4 text-gray-400 shrink-0" />
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {uniqueActions.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={moduleFilter} onValueChange={setModuleFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="All Modules" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  {uniqueModules.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-red-600 hover:text-red-700">
                  <XIcon className="w-4 h-4 mr-1" /> Clear
                  <Badge className="ml-1 bg-red-100 text-red-800 text-xs px-1">{activeFilterCount}</Badge>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Empty state */}
      {!loading && allLogs.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-200 p-12 text-center">
          <Shield className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No audit logs yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Audit events will appear here as users perform actions in the system.
          </p>
        </div>
      )}

      {/* No results from filters */}
      {!loading && allLogs.length > 0 && filteredLogs.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center">
          <p className="text-gray-500">No logs match your current filters.</p>
          <Button variant="ghost" onClick={clearFilters} className="mt-2 text-indigo-600">Clear filters</Button>
        </div>
      )}

      {/* Table */}
      {(loading || filteredLogs.length > 0) && (
        <>
          <div className="border rounded-lg overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="whitespace-nowrap">Date & Time</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <TableCell key={j}>
                            <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    pagedLogs.map((log) => {
                      const dateStr = getLogDate(log);
                      const isExpanded = expandedLog === log.id;
                      return (
                        <Fragment key={log.id}>
                          <TableRow
                            className={`hover:bg-gray-50 cursor-pointer ${log.changes ? "" : ""}`}
                            onClick={() => log.changes && setExpandedLog(isExpanded ? null : log.id)}
                          >
                            <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                              {dateStr
                                ? new Date(dateStr).toLocaleString("en-NG", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "—"}
                            </TableCell>
                            <TableCell>
                              <span className="font-medium text-sm">{log.user ?? "System"}</span>
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                                {log.action}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">{log.module ?? "—"}</TableCell>
                            <TableCell className="text-sm text-gray-700 max-w-[280px]">
                              <span className="line-clamp-2">{log.details ?? "—"}</span>
                              {log.changes && (
                                <button className="text-xs text-indigo-600 hover:underline block mt-0.5">
                                  {isExpanded ? "Hide changes" : "View changes"}
                                </button>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                                {log.status ?? "—"}
                              </span>
                            </TableCell>
                            <TableCell className="font-mono text-xs text-gray-500">
                              {log.ipAddress ?? "—"}
                            </TableCell>
                          </TableRow>

                          {/* Expanded changes row */}
                          {isExpanded && log.changes && (
                            <TableRow key={`${log.id}-changes`} className="bg-indigo-50">
                              <TableCell colSpan={7} className="p-4">
                                <div className="text-xs font-mono">
                                  <p className="font-semibold text-indigo-700 mb-2">Changes:</p>
                                  <pre className="bg-white border border-indigo-100 rounded p-3 overflow-auto max-h-48 text-gray-700 whitespace-pre-wrap">
                                    {JSON.stringify(log.changes, null, 2)}
                                  </pre>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredLogs.length)} of {filteredLogs.length}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 0}
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages - 1}
                >
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}