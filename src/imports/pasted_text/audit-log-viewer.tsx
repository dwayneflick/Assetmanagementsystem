import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/supabase/lib/supabase";
import {
  Search,
  RefreshCw,
  Filter,
  Shield,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ─── Types ────────────────────────────────────────────────
interface AuditLog {
  id: string;
  action: string;
  table_name: string;
  record_id: string;
  old_values: object | null;
  new_values: object | null;
  ip_address: string | null;
  created_at: string;
  user: {
    id: string;
    full_name: string;
    email: string;
  } | null;
}

const PAGE_SIZE = 25;

const ACTION_COLORS: Record<string, string> = {
  "asset.created": "bg-green-100 text-green-800",
  "asset.updated": "bg-blue-100 text-blue-800",
  "asset.deleted": "bg-red-100 text-red-800",
  "incident.created": "bg-purple-100 text-purple-800",
  "incident.updated": "bg-indigo-100 text-indigo-800",
};

function getActionColor(action: string) {
  if (ACTION_COLORS[action]) return ACTION_COLORS[action];
  if (action.includes("created")) return "bg-green-100 text-green-800";
  if (action.includes("updated")) return "bg-blue-100 text-blue-800";
  if (action.includes("deleted")) return "bg-red-100 text-red-800";
  return "bg-gray-100 text-gray-700";
}

function formatAction(action: string) {
  return action
    .split(".")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" → ");
}

// ─── Component ────────────────────────────────────────────
export default function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [tableFilter, setTableFilter] = useState("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Diff viewer
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page on filter change
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, actionFilter, tableFilter]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from("audit_logs")
        .select(
          `
          id, action, table_name, record_id,
          old_values, new_values, ip_address, created_at,
          user:profiles(id, full_name, email)
        `,
          { count: "exact" }
        )
        .range(from, to)
        .order("created_at", { ascending: false });

      if (actionFilter !== "all") query = query.eq("action", actionFilter);
      if (tableFilter !== "all") query = query.eq("table_name", tableFilter);
      if (debouncedSearch) {
        query = query.or(
          `action.ilike.%${debouncedSearch}%,table_name.ilike.%${debouncedSearch}%`
        );
      }

      const { data, error, count } = await query;
      if (error) throw error;
      setLogs((data as any[]) ?? []);
      setTotal(count ?? 0);
    } catch (err) {
      console.error("Audit log fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, actionFilter, tableFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Export to CSV
  function exportCSV() {
    if (!logs.length) return;
    const headers = ["Date", "User", "Action", "Table", "Record ID", "IP Address"];
    const rows = logs.map((log) => [
      new Date(log.created_at).toLocaleString("en-NG"),
      log.user?.full_name ?? "System",
      log.action,
      log.table_name ?? "",
      log.record_id ?? "",
      log.ip_address ?? "",
    ]);

    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${v}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Get unique actions and tables for filters
  const uniqueActions = [...new Set(logs.map((l) => l.action))].sort();
  const uniqueTables = [...new Set(logs.map((l) => l.table_name).filter(Boolean))].sort();

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Shield className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {total.toLocaleString()} total events recorded
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchLogs}
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Empty state for no Supabase data */}
      {!loading && total === 0 && (
        <div className="rounded-lg border border-dashed border-gray-200 p-12 text-center">
          <Shield className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No audit logs yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Audit events will appear here as users create, update, or delete assets.
          </p>
        </div>
      )}

      {total > 0 && (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by action or table..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400 shrink-0" />
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {uniqueActions.map((a) => (
                    <SelectItem key={a} value={a}>
                      {formatAction(a)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={tableFilter} onValueChange={setTableFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="All Tables" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tables</SelectItem>
                  {uniqueTables.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Date & Time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Record ID</TableHead>
                  <TableHead>Changes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  logs.map((log) => (
                    <>
                      <TableRow
                        key={log.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() =>
                          setExpandedLog(expandedLog === log.id ? null : log.id)
                        }
                      >
                        <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString("en-NG", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-sm">
                            {log.user?.full_name ?? "System"}
                          </div>
                          {log.user?.email && (
                            <div className="text-xs text-gray-400">
                              {log.user.email}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(
                              log.action
                            )}`}
                          >
                            {formatAction(log.action)}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-gray-600">
                          {log.table_name ?? "—"}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-gray-500 max-w-[120px] truncate">
                          {log.record_id
                            ? log.record_id.slice(0, 8) + "..."
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {(log.old_values || log.new_values) ? (
                            <button className="text-xs text-indigo-600 hover:underline">
                              {expandedLog === log.id ? "Hide" : "View diff"}
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </TableCell>
                      </TableRow>

                      {/* Expanded diff row */}
                      {expandedLog === log.id && (log.old_values || log.new_values) && (
                        <TableRow key={`${log.id}-diff`} className="bg-gray-50">
                          <TableCell colSpan={6} className="p-0">
                            <div className="grid grid-cols-2 divide-x text-xs font-mono p-4 gap-4">