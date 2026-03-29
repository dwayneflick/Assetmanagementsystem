import { cachedFetch, invalidateCache } from "../utils/cache";
import { useState, useEffect } from "react";
import {
  Plus, Eye, Edit, Trash2, Search, Filter, Download,
  RefreshCw, X as XIcon, ChevronLeft, ChevronRight,
  UserMinus, Clock, CheckCircle2, AlertCircle, XCircle,
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { toast } from "sonner@2.0.3";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { User } from "../App";

interface DeregistrationProps {
  user: User;
}

interface DeregistrationRecord {
  id: string;
  refNumber?: string;
  assetType: string;
  assetTag?: string;
  assetName: string;
  serialNumber?: string;
  userName: string;
  department?: string;
  location?: string;
  condition?: string;
  reason?: string;
  disposalMethod?: string;
  replacementRequired?: string;
  returnDate?: string;
  deregisteredBy: string;
  itOfficer?: string;
  dateOfDeregistration?: string;
  status: string;
  comments?: string;
  createdAt: string;
  updatedAt?: string;
}

const ASSET_TYPES = [
  "Laptop", "Desktop", "Monitor", "Printer", "Phone",
  "Tablet", "Server", "Network Equipment", "UPS",
  "Software", "Accessories", "Other",
];

const REASONS = [
  "Employee Exit", "Asset Disposal", "Transfer", "Upgrade",
  "Damaged/Unrepairable", "End of Life", "Stolen/Lost",
  "Redundant", "Reassignment", "Other",
];

const DISPOSAL_METHODS = [
  "Reassigned", "Disposed/Scrapped", "Returned to Vendor",
  "Donated", "Written Off", "Archived", "Repaired & Returned", "Other",
];

const CONDITIONS = ["Excellent", "Good", "Fair", "Poor", "Damaged", "Non-functional"];

const STATUSES = ["Pending", "In Progress", "Completed", "Cancelled"];

const PAGE_SIZE = 10;

function generateRefNumber(index: number) {
  return `DEREG-${String(index + 1).padStart(4, "0")}`;
}

export default function Deregistration({ user }: DeregistrationProps) {
  const [records, setRecords] = useState<DeregistrationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selected, setSelected] = useState<DeregistrationRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const emptyForm: Partial<DeregistrationRecord> = {
    assetType: "Laptop",
    assetTag: "",
    assetName: "",
    serialNumber: "",
    userName: "",
    department: "",
    location: "",
    condition: "Good",
    reason: "Employee Exit",
    disposalMethod: "Reassigned",
    replacementRequired: "No",
    returnDate: "",
    deregisteredBy: user.name,
    itOfficer: "",
    dateOfDeregistration: new Date().toISOString().split("T")[0],
    status: "Pending",
    comments: "",
  };

  const [formData, setFormData] = useState<Partial<DeregistrationRecord>>(emptyForm);

  useEffect(() => { fetchRecords(); }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await cachedFetch<{ deregistrations: any[] }>(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/deregistrations`,
        { headers: { Authorization: `Bearer ${publicAnonKey}` } },
        30_000
      );
      setRecords(data.deregistrations || []);
    } catch (err) {
      console.error("Error fetching deregistrations:", err);
      toast.error("Failed to load deregistration records");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const required: { field: keyof DeregistrationRecord; label: string }[] = [
      { field: "assetType", label: "Asset Type" },
      { field: "assetName", label: "Asset Name" },
      { field: "userName", label: "User Name" },
      { field: "deregisteredBy", label: "Deregistered By" },
      { field: "status", label: "Status" },
      { field: "dateOfDeregistration", label: "Date of Deregistration" },
    ];
    const missing = required.filter(
      ({ field }) => !formData[field] || String(formData[field]).trim() === ""
    );
    if (missing.length > 0) {
      toast.error(`Please fill in: ${missing.map((f) => f.label).join(", ")}`);
      return false;
    }
    return true;
  };

  const handleAdd = async () => {
    if (!validateForm()) return;
    try {
      const refNumber = generateRefNumber(records.length);
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/deregistrations`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${publicAnonKey}` },
          body: JSON.stringify({ ...formData, refNumber }),
        }
      );
      if (!res.ok) throw new Error("Failed to create");
      toast.success("Deregistration record created successfully");
      invalidateCache(`https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/deregistrations`);
      setShowAddDialog(false);
      setFormData(emptyForm);
      fetchRecords();
    } catch (err) {
      console.error("Error creating deregistration:", err);
      toast.error("Failed to create deregistration record");
    }
  };

  const handleEdit = async () => {
    if (!validateForm() || !selected) return;
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/deregistrations/${selected.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${publicAnonKey}` },
          body: JSON.stringify(formData),
        }
      );
      if (!res.ok) throw new Error("Failed to update");
      toast.success("Deregistration record updated successfully");
      invalidateCache(`https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/deregistrations`);
      setShowEditDialog(false);
      setSelected(null);
      setFormData(emptyForm);
      fetchRecords();
    } catch (err) {
      console.error("Error updating deregistration:", err);
      toast.error("Failed to update deregistration record");
    }
  };

  const handleDelete = async (id: string, ref: string) => {
    if (!window.confirm(`Delete record ${ref || id}? This cannot be undone.`)) return;
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/deregistrations/${id}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${publicAnonKey}` } }
      );
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Deregistration record deleted");
      invalidateCache(`https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/deregistrations`);
      fetchRecords();
    } catch (err) {
      console.error("Error deleting deregistration:", err);
      toast.error("Failed to delete deregistration record");
    }
  };

  const openEdit = (rec: DeregistrationRecord) => {
    setSelected(rec);
    setFormData({ ...rec });
    setShowEditDialog(true);
  };

  const openView = (rec: DeregistrationRecord) => {
    setSelected(rec);
    setShowViewDialog(true);
  };

  const exportCSV = () => {
    const headers = [
      "Ref #", "Asset Type", "Asset Tag", "Asset Name", "Serial Number",
      "User Name", "Department", "Location", "Condition",
      "Reason", "Disposal Method", "Replacement Required",
      "Return Date", "Date of Deregistration", "Deregistered By",
      "IT Officer", "Status", "Comments", "Created At",
    ];
    const rows = filtered.map((r) => [
      r.refNumber || r.id,
      r.assetType, r.assetTag || "", r.assetName, r.serialNumber || "",
      r.userName, r.department || "", r.location || "", r.condition || "",
      r.reason || "", r.disposalMethod || "", r.replacementRequired || "",
      r.returnDate || "", r.dateOfDeregistration || "", r.deregisteredBy,
      r.itOfficer || "", r.status, r.comments || "",
      new Date(r.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((row) => row.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `IT_Deregistration_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported to CSV");
  };

  // ── Filtering & pagination ────────────────────────────
  const filtered = records.filter((r) => {
    const search = searchTerm.toLowerCase();
    const matchSearch =
      !searchTerm ||
      (r.refNumber || "").toLowerCase().includes(search) ||
      r.assetName.toLowerCase().includes(search) ||
      r.userName.toLowerCase().includes(search) ||
      (r.assetTag || "").toLowerCase().includes(search) ||
      (r.serialNumber || "").toLowerCase().includes(search) ||
      (r.department || "").toLowerCase().includes(search) ||
      r.assetType.toLowerCase().includes(search);
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchType = typeFilter === "all" || r.assetType === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // ── Stats ─────────────────────────────────────────────
  const stats = {
    total: records.length,
    pending: records.filter((r) => r.status === "Pending").length,
    inProgress: records.filter((r) => r.status === "In Progress").length,
    completed: records.filter((r) => r.status === "Completed").length,
    cancelled: records.filter((r) => r.status === "Cancelled").length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "In Progress": return "bg-blue-100 text-blue-800 border-blue-200";
      case "Completed": return "bg-green-100 text-green-800 border-green-200";
      case "Cancelled": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getTypeColor = (type: string) => {
    const map: Record<string, string> = {
      Laptop: "bg-indigo-100 text-indigo-800",
      Desktop: "bg-purple-100 text-purple-800",
      Monitor: "bg-cyan-100 text-cyan-800",
      Printer: "bg-orange-100 text-orange-800",
      Phone: "bg-pink-100 text-pink-800",
      Tablet: "bg-violet-100 text-violet-800",
      Server: "bg-red-100 text-red-800",
      "Network Equipment": "bg-teal-100 text-teal-800",
      Software: "bg-blue-100 text-blue-800",
      UPS: "bg-amber-100 text-amber-800",
    };
    return map[type] || "bg-gray-100 text-gray-700";
  };

  const canDelete = user.role === "admin" || user.name === "Admin" || user.name === "Kingsley";

  // ── Form fields (shared Add/Edit) ─────────────────────
  const FormFields = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Row 1 */}
      <div className="space-y-1.5">
        <Label>Type of Asset <span className="text-red-500">*</span></Label>
        <Select value={formData.assetType || ""} onValueChange={(v) => setFormData({ ...formData, assetType: v })}>
          <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
          <SelectContent>{ASSET_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Asset Name / Description <span className="text-red-500">*</span></Label>
        <Input value={formData.assetName || ""} onChange={(e) => setFormData({ ...formData, assetName: e.target.value })} placeholder="e.g., HP EliteBook 840 G8" />
      </div>

      {/* Row 2 */}
      <div className="space-y-1.5">
        <Label>Asset Tag</Label>
        <Input value={formData.assetTag || ""} onChange={(e) => setFormData({ ...formData, assetTag: e.target.value })} placeholder="e.g., AMS-0042" />
      </div>
      <div className="space-y-1.5">
        <Label>Serial Number</Label>
        <Input value={formData.serialNumber || ""} onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })} placeholder="e.g., SN123456789" />
      </div>

      {/* Row 3 */}
      <div className="space-y-1.5">
        <Label>User Name (Asset Holder) <span className="text-red-500">*</span></Label>
        <Input value={formData.userName || ""} onChange={(e) => setFormData({ ...formData, userName: e.target.value })} placeholder="Full name of person" />
      </div>
      <div className="space-y-1.5">
        <Label>Department</Label>
        <Input value={formData.department || ""} onChange={(e) => setFormData({ ...formData, department: e.target.value })} placeholder="e.g., Finance, IT, HR" />
      </div>

      {/* Row 4 */}
      <div className="space-y-1.5">
        <Label>Location / Office</Label>
        <Input value={formData.location || ""} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="e.g., Lagos Head Office" />
      </div>
      <div className="space-y-1.5">
        <Label>Asset Condition</Label>
        <Select value={formData.condition || ""} onValueChange={(v) => setFormData({ ...formData, condition: v })}>
          <SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger>
          <SelectContent>{CONDITIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {/* Row 5 */}
      <div className="space-y-1.5">
        <Label>Reason for Deregistration</Label>
        <Select value={formData.reason || ""} onValueChange={(v) => setFormData({ ...formData, reason: v })}>
          <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
          <SelectContent>{REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Disposal Method</Label>
        <Select value={formData.disposalMethod || ""} onValueChange={(v) => setFormData({ ...formData, disposalMethod: v })}>
          <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
          <SelectContent>{DISPOSAL_METHODS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {/* Row 6 */}
      <div className="space-y-1.5">
        <Label>Replacement Required</Label>
        <Select value={formData.replacementRequired || "No"} onValueChange={(v) => setFormData({ ...formData, replacementRequired: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Yes">Yes</SelectItem>
            <SelectItem value="No">No</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Date of Deregistration <span className="text-red-500">*</span></Label>
        <Input type="date" value={formData.dateOfDeregistration || ""} onChange={(e) => setFormData({ ...formData, dateOfDeregistration: e.target.value })} />
      </div>

      {/* Row 7 */}
      <div className="space-y-1.5">
        <Label>Return Date (Asset physically returned)</Label>
        <Input type="date" value={formData.returnDate || ""} onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <Label>Status <span className="text-red-500">*</span></Label>
        <Select value={formData.status || "Pending"} onValueChange={(v) => setFormData({ ...formData, status: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {/* Row 8 */}
      <div className="space-y-1.5">
        <Label>Deregistered By <span className="text-red-500">*</span></Label>
        <Input value={formData.deregisteredBy || ""} onChange={(e) => setFormData({ ...formData, deregisteredBy: e.target.value })} placeholder="IT staff name" />
      </div>
      <div className="space-y-1.5">
        <Label>IT Officer / Approved By</Label>
        <Input value={formData.itOfficer || ""} onChange={(e) => setFormData({ ...formData, itOfficer: e.target.value })} placeholder="Approving officer name" />
      </div>

      {/* Comments – full width */}
      <div className="space-y-1.5 col-span-1 sm:col-span-2">
        <Label>Comments / Notes</Label>
        <Textarea
          value={formData.comments || ""}
          onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
          placeholder="Any additional notes or remarks…"
          rows={3}
        />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: "#7f1d1d", borderTopColor: "transparent" }} />
          <p className="mt-4 text-gray-600">Loading deregistration records…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ── Header ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl mb-1">IT Deregistration</h1>
          <p className="text-gray-500 text-sm">Track and manage IT asset deregistration requests</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={fetchRecords} className="gap-1.5">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Button
            className="bg-gradient-to-r from-red-900 to-rose-900 hover:from-red-800 hover:to-rose-800 gap-1.5"
            size="sm"
            onClick={() => { setFormData({ ...emptyForm, deregisteredBy: user.name }); setShowAddDialog(true); }}
          >
            <Plus className="w-4 h-4" /> New Deregistration
          </Button>
        </div>
      </div>

      {/* ── Stats Cards ─────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Records", value: stats.total, icon: UserMinus, color: "text-gray-700", bg: "bg-gray-50", border: "border-gray-200" },
          { label: "Pending", value: stats.pending, icon: Clock, color: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-200" },
          { label: "In Progress", value: stats.inProgress, icon: AlertCircle, color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
          { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-green-700", bg: "bg-green-50", border: "border-green-200" },
          { label: "Cancelled", value: stats.cancelled, icon: XCircle, color: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
        ].map((s) => (
          <Card key={s.label} className={`${s.bg} border ${s.border}`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</p>
                <p className={`text-3xl mt-1 ${s.color}`}>{s.value}</p>
              </div>
              <s.icon className={`w-8 h-8 ${s.color} opacity-60`} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Search & Filters ─────────────────────────── */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by ref #, asset name, user, tag, department…"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="pl-9"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <XIcon className="w-4 h-4" />
                </button>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-1.5 whitespace-nowrap">
              <Filter className="w-4 h-4" /> Filters {showFilters ? "▲" : "▼"}
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t">
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Filter by Status</Label>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Filter by Asset Type</Label>
                <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {ASSET_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="ghost" size="sm" onClick={() => { setStatusFilter("all"); setTypeFilter("all"); setSearchTerm(""); setCurrentPage(1); }}>
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Table ───────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2 px-4 pt-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Deregistration Records
              <span className="ml-2 text-sm text-gray-400 font-normal">({filtered.length} record{filtered.length !== 1 ? "s" : ""})</span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="whitespace-nowrap">Ref #</TableHead>
                  <TableHead className="whitespace-nowrap">Asset Type</TableHead>
                  <TableHead className="whitespace-nowrap">Asset Name</TableHead>
                  <TableHead className="hidden md:table-cell whitespace-nowrap">Asset Tag</TableHead>
                  <TableHead className="whitespace-nowrap">User Name</TableHead>
                  <TableHead className="hidden lg:table-cell whitespace-nowrap">Department</TableHead>
                  <TableHead className="hidden lg:table-cell whitespace-nowrap">Reason</TableHead>
                  <TableHead className="hidden xl:table-cell whitespace-nowrap">Disposal Method</TableHead>
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-12 text-gray-400">
                      <UserMinus className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p>No deregistration records found</p>
                      {(searchTerm || statusFilter !== "all" || typeFilter !== "all") && (
                        <p className="text-xs mt-1">Try adjusting your search or filters</p>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((rec) => (
                    <TableRow key={rec.id} className="hover:bg-gray-50">
                      <TableCell className="font-mono text-xs font-semibold text-gray-700">
                        {rec.refNumber || rec.id.slice(0, 10)}
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${getTypeColor(rec.assetType)}`}>{rec.assetType}</Badge>
                      </TableCell>
                      <TableCell className="font-medium max-w-[180px] truncate" title={rec.assetName}>
                        {rec.assetName}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-gray-500">
                        {rec.assetTag || <span className="text-gray-300">—</span>}
                      </TableCell>
                      <TableCell className="text-sm">{rec.userName}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-gray-500">
                        {rec.department || <span className="text-gray-300">—</span>}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-gray-500">
                        {rec.reason || <span className="text-gray-300">—</span>}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell text-sm text-gray-500">
                        {rec.disposalMethod || <span className="text-gray-300">—</span>}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {rec.dateOfDeregistration
                          ? new Date(rec.dateOfDeregistration).toLocaleDateString("en-GB")
                          : <span className="text-gray-300">—</span>}
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs border ${getStatusColor(rec.status)}`}>{rec.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openView(rec)} className="h-8 w-8 p-0" title="View">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => openEdit(rec)} className="h-8 w-8 p-0" title="Edit">
                            <Edit className="w-4 h-4" />
                          </Button>
                          {canDelete && (
                            <Button
                              size="sm" variant="ghost"
                              onClick={() => handleDelete(rec.id, rec.refNumber || rec.id)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-gray-500">
                Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Add Dialog ──────────────────────────────── */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-3xl w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New IT Deregistration</DialogTitle>
            <DialogDescription>Record a new IT asset deregistration. Fields marked * are required.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <FormFields />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button className="bg-gradient-to-r from-red-900 to-rose-900 hover:from-red-800 hover:to-rose-800" onClick={handleAdd}>
              Create Record
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ─────────────────────────────── */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Deregistration — {selected?.refNumber || selected?.id}</DialogTitle>
            <DialogDescription>Update the deregistration record details.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <FormFields />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => { setShowEditDialog(false); setSelected(null); }}>Cancel</Button>
            <Button className="bg-gradient-to-r from-red-900 to-rose-900 hover:from-red-800 hover:to-rose-800" onClick={handleEdit}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── View Dialog ─────────────────────────────── */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Deregistration Details — {selected?.refNumber || selected?.id}</DialogTitle>
            <DialogDescription>Full details of this deregistration record</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 py-2">
              {/* Status & Type row */}
              <div className="flex flex-wrap gap-2 items-center">
                <Badge className={`border ${getStatusColor(selected.status)}`}>{selected.status}</Badge>
                <Badge className={getTypeColor(selected.assetType)}>{selected.assetType}</Badge>
                {selected.replacementRequired === "Yes" && (
                  <Badge className="bg-orange-100 text-orange-800 border-orange-200">Replacement Required</Badge>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {[
                  { label: "Reference Number", value: selected.refNumber || selected.id },
                  { label: "Asset Name", value: selected.assetName },
                  { label: "Asset Tag", value: selected.assetTag },
                  { label: "Serial Number", value: selected.serialNumber },
                  { label: "User Name", value: selected.userName },
                  { label: "Department", value: selected.department },
                  { label: "Location / Office", value: selected.location },
                  { label: "Condition at Deregistration", value: selected.condition },
                  { label: "Reason", value: selected.reason },
                  { label: "Disposal Method", value: selected.disposalMethod },
                  { label: "Replacement Required", value: selected.replacementRequired },
                  { label: "Date of Deregistration", value: selected.dateOfDeregistration ? new Date(selected.dateOfDeregistration).toLocaleDateString("en-GB") : undefined },
                  { label: "Return Date", value: selected.returnDate ? new Date(selected.returnDate).toLocaleDateString("en-GB") : undefined },
                  { label: "Deregistered By", value: selected.deregisteredBy },
                  { label: "IT Officer / Approved By", value: selected.itOfficer },
                  { label: "Record Created", value: new Date(selected.createdAt).toLocaleString() },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                    <p className="text-gray-800">{value || <span className="text-gray-300 italic">Not provided</span>}</p>
                  </div>
                ))}
              </div>

              {selected.comments && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Comments / Notes</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{selected.comments}</p>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>Close</Button>
            <Button
              className="bg-gradient-to-r from-red-900 to-rose-900 hover:from-red-800 hover:to-rose-800"
              onClick={() => { setShowViewDialog(false); if (selected) openEdit(selected); }}
            >
              <Edit className="w-4 h-4 mr-2" /> Edit Record
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}