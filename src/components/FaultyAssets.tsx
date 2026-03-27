import { useState, useEffect, useMemo } from "react";
import { User } from "../App";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Card, CardContent } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { toast } from "sonner@2.0.3";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Recycle,
  Search,
  RefreshCw,
  Clock,
  Archive,
} from "lucide-react";

interface FaultyAssetsProps {
  user: User;
}

interface Asset {
  id: string;
  assetName: string;
  serviceTag: string;
  product: string;
  productType: string;
  assetState: string;
  user: string;
  department: string;
  site: string;
  vendor: string;
  os: string;
  serialNumber: string;
  createdAt: string;
}

interface FaultyRecord {
  id: string;
  assetId: string;
  assetName: string;
  assetTag: string;
  product: string;
  productType: string;
  department: string;
  assignedUser: string;
  repairStatus: "Pending" | "Repaired" | "Beyond Repair" | "Disposed";
  reportedDate: string;
  resolvedDate?: string;
  technicianName: string;
  faultDescription: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

const REPAIR_STATUSES = ["Pending", "Repaired", "Beyond Repair", "Disposed"] as const;

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  "Pending": {
    label: "Pending",
    color: "text-yellow-700",
    bg: "bg-yellow-100",
    icon: Clock,
  },
  "Repaired": {
    label: "Repaired",
    color: "text-green-700",
    bg: "bg-green-100",
    icon: CheckCircle2,
  },
  "Beyond Repair": {
    label: "Beyond Repair",
    color: "text-red-700",
    bg: "bg-red-100",
    icon: XCircle,
  },
  "Disposed": {
    label: "Disposed",
    color: "text-purple-700",
    bg: "bg-purple-100",
    icon: Archive,
  },
};

export default function FaultyAssets({ user }: FaultyAssetsProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [records, setRecords] = useState<FaultyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Dialog state
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FaultyRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<FaultyRecord | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [repairStatus, setRepairStatus] = useState<string>("");
  const [reportedDate, setReportedDate] = useState("");
  const [resolvedDate, setResolvedDate] = useState("");
  const [technicianName, setTechnicianName] = useState("");
  const [faultDescription, setFaultDescription] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");

  const isViewer = user.role === "viewer";
  const canDelete =
    user.role === "admin" ||
    user.name === "Admin" ||
    user.name === "Kingsley";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assetsRes, recordsRes] = await Promise.all([
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/assets`, {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/faulty-assets`, {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }),
      ]);

      const [assetsData, recordsData] = await Promise.all([
        assetsRes.json(),
        recordsRes.json(),
      ]);

      const allAssets: Asset[] = assetsData.assets || [];
      setAssets(allAssets.filter((a) => a.assetState === "Faulty"));
      setRecords(recordsData.records || []);
    } catch (err) {
      console.error("Error fetching faulty assets data:", err);
      toast.error("Failed to load faulty assets data");
    } finally {
      setLoading(false);
    }
  };

  const faultyAssets = useMemo(
    () => assets.filter((a) => a.assetState === "Faulty"),
    [assets]
  );

  const selectedAsset = useMemo(
    () => faultyAssets.find((a) => a.id === selectedAssetId),
    [faultyAssets, selectedAssetId]
  );

  const filteredRecords = useMemo(() => {
    let list = records;
    if (activeTab !== "all") {
      list = list.filter((r) => r.repairStatus === activeTab);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.assetName?.toLowerCase().includes(q) ||
          r.assetTag?.toLowerCase().includes(q) ||
          r.product?.toLowerCase().includes(q) ||
          r.department?.toLowerCase().includes(q) ||
          r.technicianName?.toLowerCase().includes(q)
      );
    }
    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [records, activeTab, search]);

  const counts = useMemo(
    () => ({
      all: records.length,
      "Pending": records.filter((r) => r.repairStatus === "Pending").length,
      "Repaired": records.filter((r) => r.repairStatus === "Repaired").length,
      "Beyond Repair": records.filter((r) => r.repairStatus === "Beyond Repair").length,
      "Disposed": records.filter((r) => r.repairStatus === "Disposed").length,
    }),
    [records]
  );

  const openAddForm = () => {
    setEditingRecord(null);
    setSelectedAssetId("");
    setRepairStatus("");
    setReportedDate(new Date().toISOString().slice(0, 10));
    setResolvedDate("");
    setTechnicianName(user.name);
    setFaultDescription("");
    setResolutionNotes("");
    setShowForm(true);
  };

  const openEditForm = (record: FaultyRecord) => {
    setEditingRecord(record);
    setSelectedAssetId(record.assetId);
    setRepairStatus(record.repairStatus);
    setReportedDate(record.reportedDate || "");
    setResolvedDate(record.resolvedDate || "");
    setTechnicianName(record.technicianName || "");
    setFaultDescription(record.faultDescription || "");
    setResolutionNotes(record.resolutionNotes || "");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId && !editingRecord) {
      toast.error("Please select a faulty asset");
      return;
    }
    if (!repairStatus) {
      toast.error("Please select a repair status");
      return;
    }
    if (!faultDescription.trim()) {
      toast.error("Please enter a fault description");
      return;
    }

    setSaving(true);
    try {
      const asset = selectedAsset || faultyAssets.find((a) => a.id === (editingRecord?.assetId));
      const payload: Partial<FaultyRecord> = {
        assetId: asset?.id || editingRecord?.assetId || "",
        assetName: asset?.assetName || editingRecord?.assetName || "",
        assetTag: asset?.serviceTag || editingRecord?.assetTag || "",
        product: asset?.product || editingRecord?.product || "",
        productType: asset?.productType || editingRecord?.productType || "",
        department: asset?.department || editingRecord?.department || "",
        assignedUser: asset?.user || editingRecord?.assignedUser || "",
        repairStatus: repairStatus as FaultyRecord["repairStatus"],
        reportedDate,
        resolvedDate: resolvedDate || undefined,
        technicianName,
        faultDescription,
        resolutionNotes: resolutionNotes || undefined,
      };

      let res: Response;
      if (editingRecord) {
        res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/faulty-assets/${editingRecord.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${publicAnonKey}`,
            },
            body: JSON.stringify(payload),
          }
        );
      } else {
        res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/faulty-assets`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${publicAnonKey}`,
            },
            body: JSON.stringify(payload),
          }
        );
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save record");

      toast.success(editingRecord ? "Record updated!" : "Record logged successfully!");
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      console.error("Save faulty record error:", err);
      toast.error(err.message || "Failed to save record");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record: FaultyRecord) => {
    if (!confirm(`Delete record for ${record.assetName}?`)) return;
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/faulty-assets/${record.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      }
      toast.success("Record deleted");
      fetchData();
    } catch (err: any) {
      console.error("Delete faulty record error:", err);
      toast.error(err.message || "Failed to delete record");
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const cfg = statusConfig[status];
    if (!cfg) return <Badge variant="outline">{status}</Badge>;
    const Icon = cfg.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
        <Icon className="w-3 h-3" />
        {cfg.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading faulty assets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl mb-1 flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-red-700" />
            Faulty Assets
          </h1>
          <p className="text-sm text-gray-600">
            Track and manage assets with faults — pending, repaired, beyond repair, or disposed.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="flex items-center gap-1"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          {!isViewer && (
            <Button
              onClick={openAddForm}
              className="bg-gradient-to-r from-red-900 to-rose-900 hover:from-red-950 hover:to-rose-950 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Log Faulty Asset
            </Button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { key: "all", label: "Total Records", color: "bg-gray-100 text-gray-700", border: "border-gray-300" },
          { key: "Pending", label: "Pending", color: "bg-yellow-100 text-yellow-700", border: "border-yellow-300" },
          { key: "Repaired", label: "Repaired", color: "bg-green-100 text-green-700", border: "border-green-300" },
          { key: "Beyond Repair", label: "Beyond Repair", color: "bg-red-100 text-red-700", border: "border-red-300" },
          { key: "Disposed", label: "Disposed", color: "bg-purple-100 text-purple-700", border: "border-purple-300" },
        ].map((s) => (
          <Card
            key={s.key}
            className={`cursor-pointer border-2 transition-all ${activeTab === s.key ? s.border + " shadow-md" : "border-transparent"}`}
            onClick={() => setActiveTab(s.key)}
          >
            <CardContent className="p-4">
              <p className={`text-2xl font-bold ${s.color.split(" ")[1]}`}>
                {counts[s.key as keyof typeof counts] ?? 0}
              </p>
              <p className="text-xs text-gray-600 mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Faulty Assets from Asset Management (unlogged) */}
      {!isViewer && faultyAssets.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-amber-800 mb-2">
            ⚠️ {faultyAssets.length} asset{faultyAssets.length !== 1 ? "s" : ""} marked as Faulty in Asset Management
          </p>
          <div className="flex flex-wrap gap-2">
            {faultyAssets.map((a) => (
              <span key={a.id} className="text-xs bg-amber-100 text-amber-700 border border-amber-300 px-2 py-1 rounded">
                {a.assetName} <span className="font-mono opacity-75">({a.serviceTag || "No Tag"})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search by name, tag, department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tabs + Table */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          <TabsTrigger value="Pending">Pending ({counts["Pending"]})</TabsTrigger>
          <TabsTrigger value="Repaired">Repaired ({counts["Repaired"]})</TabsTrigger>
          <TabsTrigger value="Beyond Repair">Beyond Repair ({counts["Beyond Repair"]})</TabsTrigger>
          <TabsTrigger value="Disposed">Disposed ({counts["Disposed"]})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {filteredRecords.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <ShieldAlert className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No records found</p>
              {!isViewer && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={openAddForm}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Log First Record
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Record ID</TableHead>
                    <TableHead>Asset Name</TableHead>
                    <TableHead>Asset Tag</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Assigned User</TableHead>
                    <TableHead>Repair Status</TableHead>
                    <TableHead>Reported Date</TableHead>
                    <TableHead>Technician</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id} className="hover:bg-gray-50">
                      <TableCell className="font-mono text-xs text-gray-500">{record.id}</TableCell>
                      <TableCell className="font-medium">{record.assetName}</TableCell>
                      <TableCell>
                        <span className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                          {record.assetTag || "—"}
                        </span>
                      </TableCell>
                      <TableCell>{record.product || "—"}</TableCell>
                      <TableCell>{record.department || "—"}</TableCell>
                      <TableCell>{record.assignedUser || "—"}</TableCell>
                      <TableCell><StatusBadge status={record.repairStatus} /></TableCell>
                      <TableCell>{record.reportedDate ? new Date(record.reportedDate).toLocaleDateString() : "—"}</TableCell>
                      <TableCell>{record.technicianName || "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingRecord(record)}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {!isViewer && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditForm(record)}
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(record)}
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add/Edit Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-700" />
              {editingRecord ? "Update Faulty Asset Record" : "Log Faulty Asset"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {/* Asset Selection */}
            {!editingRecord && (
              <div className="space-y-2">
                <Label>Faulty Asset <span className="text-red-500">*</span></Label>
                <Select value={selectedAssetId} onValueChange={setSelectedAssetId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a faulty asset" />
                  </SelectTrigger>
                  <SelectContent>
                    {faultyAssets.length === 0 ? (
                      <SelectItem value="none" disabled>No faulty assets found</SelectItem>
                    ) : (
                      faultyAssets.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.assetName} — {a.serviceTag || "No Tag"} ({a.department || "N/A"})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {selectedAsset && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm space-y-1">
                    <p><span className="text-gray-500">Asset Tag:</span> <span className="font-mono font-medium">{selectedAsset.serviceTag || "—"}</span></p>
                    <p><span className="text-gray-500">Product:</span> {selectedAsset.product || "—"}</p>
                    <p><span className="text-gray-500">Department:</span> {selectedAsset.department || "—"}</p>
                    <p><span className="text-gray-500">Assigned To:</span> {selectedAsset.user || "—"}</p>
                  </div>
                )}
              </div>
            )}

            {editingRecord && (
              <div className="bg-gray-50 border rounded p-3 text-sm space-y-1">
                <p><span className="text-gray-500">Asset:</span> <strong>{editingRecord.assetName}</strong></p>
                <p><span className="text-gray-500">Tag:</span> <span className="font-mono">{editingRecord.assetTag || "—"}</span></p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Repair Status */}
              <div className="space-y-2">
                <Label>Repair Status <span className="text-red-500">*</span></Label>
                <Select value={repairStatus} onValueChange={setRepairStatus} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {REPAIR_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Technician */}
              <div className="space-y-2">
                <Label>Technician Name <span className="text-red-500">*</span></Label>
                <Input
                  value={technicianName}
                  onChange={(e) => setTechnicianName(e.target.value)}
                  placeholder="Enter technician name"
                  required
                />
              </div>

              {/* Reported Date */}
              <div className="space-y-2">
                <Label>Date Reported <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={reportedDate}
                  onChange={(e) => setReportedDate(e.target.value)}
                  required
                />
              </div>

              {/* Resolved Date */}
              <div className="space-y-2">
                <Label>Date Resolved</Label>
                <Input
                  type="date"
                  value={resolvedDate}
                  onChange={(e) => setResolvedDate(e.target.value)}
                />
              </div>
            </div>

            {/* Fault Description */}
            <div className="space-y-2">
              <Label>Fault Description <span className="text-red-500">*</span></Label>
              <Textarea
                value={faultDescription}
                onChange={(e) => setFaultDescription(e.target.value)}
                placeholder="Describe the fault or issue..."
                rows={3}
                required
              />
            </div>

            {/* Resolution Notes */}
            <div className="space-y-2">
              <Label>Resolution Notes</Label>
              <Textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Describe how the fault was resolved (if applicable)..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-gradient-to-r from-red-900 to-rose-900 hover:from-red-950 hover:to-rose-950"
              >
                {saving ? "Saving..." : editingRecord ? "Update Record" : "Log Record"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={!!viewingRecord} onOpenChange={() => setViewingRecord(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-gray-600" />
              Faulty Asset Record — {viewingRecord?.id}
            </DialogTitle>
          </DialogHeader>
          {viewingRecord && (
            <div className="space-y-4 mt-2">
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs mb-0.5">Asset Name</p>
                    <p className="font-medium">{viewingRecord.assetName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-0.5">Asset Tag</p>
                    <p className="font-mono text-blue-700">{viewingRecord.assetTag || "—"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-0.5">Product</p>
                    <p>{viewingRecord.product || "—"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-0.5">Product Type</p>
                    <p>{viewingRecord.productType || "—"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-0.5">Department</p>
                    <p>{viewingRecord.department || "—"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-0.5">Assigned User</p>
                    <p>{viewingRecord.assignedUser || "—"}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Repair Status</span>
                  <StatusBadge status={viewingRecord.repairStatus} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Technician</span>
                  <span className="font-medium">{viewingRecord.technicianName || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Date Reported</span>
                  <span>{viewingRecord.reportedDate ? new Date(viewingRecord.reportedDate).toLocaleDateString() : "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Date Resolved</span>
                  <span>{viewingRecord.resolvedDate ? new Date(viewingRecord.resolvedDate).toLocaleDateString() : "—"}</span>
                </div>
              </div>

              {viewingRecord.faultDescription && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Fault Description</p>
                  <p className="text-sm bg-red-50 rounded p-3 border border-red-100">
                    {viewingRecord.faultDescription}
                  </p>
                </div>
              )}

              {viewingRecord.resolutionNotes && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Resolution Notes</p>
                  <p className="text-sm bg-green-50 rounded p-3 border border-green-100">
                    {viewingRecord.resolutionNotes}
                  </p>
                </div>
              )}

              <div className="text-xs text-gray-400 pt-2 border-t flex justify-between">
                <span>Created: {new Date(viewingRecord.createdAt).toLocaleString()}</span>
                <span>Updated: {new Date(viewingRecord.updatedAt).toLocaleString()}</span>
              </div>

              <div className="flex justify-end gap-2">
                {!isViewer && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setViewingRecord(null);
                      openEditForm(viewingRecord);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setViewingRecord(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}