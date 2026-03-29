import { useState, useEffect, useCallback } from "react";
import {
  getAssetsPaginated,
  createAsset,
  updateAsset,
  deleteAsset,
  type Asset,
  type AssetStatus,
} from "@/supabase/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Filter,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────
const PAGE_SIZE = 20;

const STATUS_COLORS: Record<AssetStatus, string> = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-700",
  faulty: "bg-red-100 text-red-800",
  deregistered: "bg-orange-100 text-orange-800",
  under_maintenance: "bg-yellow-100 text-yellow-800",
};

const CATEGORIES = [
  "Laptop", "Desktop", "Monitor", "Printer", "Server",
  "Networking", "Phone", "Tablet", "Peripheral", "Other",
];

const DEPARTMENTS = [
  "IT", "Finance", "HR", "Operations", "Sales",
  "Marketing", "Legal", "Executive", "Engineering",
];

const EMPTY_FORM = {
  asset_tag: "",
  name: "",
  category: "",
  status: "active" as AssetStatus,
  serial_number: "",
  model: "",
  manufacturer: "",
  purchase_date: "",
  purchase_price: "",
  warranty_expiry: "",
  location: "",
  department: "",
  notes: "",
};

// ─── Component ────────────────────────────────────────────
export default function AssetManagement() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [totalAssets, setTotalAssets] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Dialogs
  const [showForm, setShowForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<Asset | null>(null);

  // Form
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, statusFilter]);

  // Fetch assets
  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const { data, total } = await getAssetsPaginated(page, PAGE_SIZE, {
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: debouncedSearch || undefined,
      });
      setAssets(data);
      setTotalAssets(total);
    } catch (err) {
      toast.error("Failed to load assets");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // ─── Handlers ─────────────────────────────────────────
  function openCreate() {
    setEditingAsset(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(asset: Asset) {
    setEditingAsset(asset);
    setForm({
      asset_tag: asset.asset_tag,
      name: asset.name,
      category: asset.category,
      status: asset.status,
      serial_number: asset.serial_number ?? "",
      model: asset.model ?? "",
      manufacturer: asset.manufacturer ?? "",
      purchase_date: asset.purchase_date ?? "",
      purchase_price: asset.purchase_price?.toString() ?? "",
      warranty_expiry: asset.warranty_expiry ?? "",
      location: asset.location ?? "",
      department: asset.department ?? "",
      notes: asset.notes ?? "",
    });
    setShowForm(true);
  }

  function openDelete(asset: Asset) {
    setDeletingAsset(asset);
    setShowDeleteDialog(true);
  }

  async function handleSave() {
    if (!form.asset_tag || !form.name || !form.category) {
      toast.error("Asset Tag, Name and Category are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        asset_tag: form.asset_tag,
        name: form.name,
        category: form.category,
        status: form.status,
        serial_number: form.serial_number || undefined,
        model: form.model || undefined,
        manufacturer: form.manufacturer || undefined,
        purchase_date: form.purchase_date || undefined,
        purchase_price: form.purchase_price ? parseFloat(form.purchase_price) : undefined,
        warranty_expiry: form.warranty_expiry || undefined,
        location: form.location || undefined,
        department: form.department || undefined,
        notes: form.notes || undefined,
      };

      if (editingAsset) {
        await updateAsset(editingAsset.id, payload);
        toast.success("Asset updated successfully");
      } else {
        await createAsset(payload as any);
        toast.success("Asset created successfully");
      }

      setShowForm(false);
      fetchAssets();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save asset");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingAsset) return;
    try {
      await deleteAsset(deletingAsset.id);
      toast.success("Asset deleted");
      setShowDeleteDialog(false);
      fetchAssets();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to delete asset");
    }
  }

  function updateForm(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // ─── Pagination ───────────────────────────────────────
  const totalPages = Math.ceil(totalAssets / PAGE_SIZE);
  const hasPrev = page > 0;
  const hasNext = page < totalPages - 1;

  // ─── Render ───────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Asset Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            {totalAssets} total assets
          </p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Asset
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="faulty">Faulty</SelectItem>
              <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
              <SelectItem value="deregistered">Deregistered</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="icon" onClick={fetchAssets} title="Refresh">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Asset Tag</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Warranty</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : assets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-gray-400">
                  {debouncedSearch || statusFilter !== "all"
                    ? "No assets match your filters"
                    : "No assets yet — click 'Add Asset' to get started"}
                </TableCell>
              </TableRow>
            ) : (
              assets.map((asset) => (
                <TableRow key={asset.id} className="hover:bg-gray-50">
                  <TableCell className="font-mono text-sm font-medium">
                    {asset.asset_tag}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{asset.name}</div>
                    {asset.model && (
                      <div className="text-xs text-gray-400">{asset.model}</div>
                    )}
                  </TableCell>
                  <TableCell>{asset.category}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[asset.status]}`}>
                      {asset.status.replace("_", " ")}
                    </span>
                  </TableCell>
                  <TableCell>{asset.department ?? "—"}</TableCell>
                  <TableCell>
                    {(asset.assigned_to as any)?.full_name ?? "Unassigned"}
                  </TableCell>
                  <TableCell>
                    {asset.warranty_expiry ? (
                      <WarrantyBadge date={asset.warranty_expiry} />
                    ) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(asset)}
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDelete(asset)}
                        title="Delete"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalAssets)} of {totalAssets}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={!hasPrev}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasNext}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAsset ? "Edit Asset" : "Add New Asset"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="space-y-1">
              <Label>Asset Tag <span className="text-red-500">*</span></Label>
              <Input
                value={form.asset_tag}
                onChange={(e) => updateForm("asset_tag", e.target.value)}
                placeholder="e.g. AST-001"
              />
            </div>
            <div className="space-y-1">
              <Label>Name <span className="text-red-500">*</span></Label>
              <Input
                value={form.name}
                onChange={(e) => updateForm("name", e.target.value)}
                placeholder="e.g. Dell Latitude 5520"
              />
            </div>
            <div className="space-y-1">
              <Label>Category <span className="text-red-500">*</span></Label>
              <Select value={form.category} onValueChange={(v) => updateForm("category", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => updateForm("status", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="faulty">Faulty</SelectItem>
                  <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
                  <SelectItem value="deregistered">Deregistered</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Manufacturer</Label>
              <Input
                value={form.manufacturer}
                onChange={(e) => updateForm("manufacturer", e.target.value)}
                placeholder="e.g. Dell"
              />
            </div>
            <div className="space-y-1">
              <Label>Model</Label>
              <Input
                value={form.model}
                onChange={(e) => updateForm("model", e.target.value)}
                placeholder="e.g. Latitude 5520"
              />
            </div>
            <div className="space-y-1">
              <Label>Serial Number</Label>
              <Input
                value={form.serial_number}
                onChange={(e) => updateForm("serial_number", e.target.value)}
                placeholder="e.g. SN123456789"
              />
            </div>
            <div className="space-y-1">
              <Label>Department</Label>
              <Select value={form.department} onValueChange={(v) => updateForm("department", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Location</Label>
              <Input
                value={form.location}
                onChange={(e) => updateForm("location", e.target.value)}
                placeholder="e.g. Office Floor 2"
              />
            </div>
            <div className="space-y-1">
              <Label>Purchase Date</Label>
              <Input
                type="date"
                value={form.purchase_date}
                onChange={(e) => updateForm("purchase_date", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Purchase Price (₦)</Label>
              <Input
                type="number"
                value={form.purchase_price}
                onChange={(e) => updateForm("purchase_price", e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1">
              <Label>Warranty Expiry</Label>
              <Input
                type="date"
                value={form.warranty_expiry}
                onChange={(e) => updateForm("warranty_expiry", e.target.value)}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => updateForm("notes", e.target.value)}
                placeholder="Any additional notes..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editingAsset ? "Save Changes" : "Create Asset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{deletingAsset?.name}</span> ({deletingAsset?.asset_tag})?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Warranty Badge Helper ─────────────────────────────────
function WarrantyBadge({ date }: { date: string }) {
  const expiry = new Date(date);
  const now = new Date();
  const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return <Badge variant="destructive">Expired</Badge>;
  }
  if (daysLeft <= 30) {
    return <Badge className="bg-orange-100 text-orange-800">Expires in {daysLeft}d</Badge>;
  }
  return <Badge className="bg-green-100 text-green-800">{expiry.toLocaleDateString()}</Badge>;
}