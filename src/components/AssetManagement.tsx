import { useState, useEffect, useCallback, useMemo } from "react";
import { User } from "../App";
import { Button } from "./ui/button";
import { cachedFetch, invalidateCache } from "../utils/cache";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardContent } from "./ui/card";
import { toast } from "sonner@2.0.3";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Filter,
  Eye,
  X as XIcon,
  Star,
  History,
} from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";

// ─── Types ────────────────────────────────────────────────
interface AssetManagementProps {
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
  unit?: string;
  bizOwner?: string;
  admin?: string;
  acqDate: string;
  vendor: string;
  cost: number;
  rating: string;
  os: string;
  processor: string;
  ram: string;
  manufacturer: string;
  site: string;
  function: string;
  serialNumber: string;
  warrantyStartDate?: string;
  warrantyExpiry?: string;
  deviceHistory: string;
  previousUser?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Constants ────────────────────────────────────────────
const PAGE_SIZE = 20;

const DEFAULT_DEPARTMENTS = ["TP", "CP", "EMM", "RDS", "PCFW", "BAS", "FAS & PMG",
  "Internal Audit and Enterprise Risk Services",
  "Forensic, Cybersecurity and Compliance Services",
  "Accounting Advisory", "F&A", "HR", "M&B", "ITS"];
const DEFAULT_UNITS = ["ITS", "Finance", "HR", "Marketing"];
const PRODUCT_TYPES = ["Hardware", "Software", "Network", "Others"];
const ASSET_STATES = ["Faulty", "Disposed", "In Use/Active", "Retired", "Unassigned", "Stolen"];
const OS_OPTIONS = ["Windows", "MacOS", "Linux", "Others", "N/A"];

const EMPTY_FORM: Partial<Asset> = {
  assetName: "", serviceTag: "", product: "", productType: "Hardware",
  assetState: "Unassigned", user: "", department: "", acqDate: "", vendor: "",
  cost: 0, rating: "0", os: "", processor: "", ram: "", manufacturer: "",
  site: "", function: "", serialNumber: "", warrantyStartDate: "",
  warrantyExpiry: "", deviceHistory: "", previousUser: "",
};

// ─── Star Rating ─────────────────────────────────────────
function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button"
          onMouseEnter={() => setHovered(star)} onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}>
          <Star className={`w-5 h-5 cursor-pointer transition-colors ${
            star <= (hovered || value) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }`} />
        </button>
      ))}
      {value > 0 && <span className="text-sm text-gray-500 ml-1">{value}/5</span>}
    </div>
  );
}

// ─── Asset State Color ─────────────────────────────────
function getStateColor(state: string) {
  switch (state) {
    case "In Use/Active": return "bg-green-100 text-green-800";
    case "Unassigned":    return "bg-yellow-100 text-yellow-800";
    case "Faulty":        return "bg-red-100 text-red-800";
    case "Stolen":        return "bg-red-100 text-red-800";
    case "Retired":       return "bg-gray-100 text-gray-700";
    case "Disposed":      return "bg-gray-100 text-gray-700";
    default:              return "bg-blue-100 text-blue-800";
  }
}

// ─── Main Component ───────────────────────────────────────
export default function AssetManagement({ user }: AssetManagementProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [departments, setDepartments] = useState<string[]>(DEFAULT_DEPARTMENTS);
  const [units, setUnits] = useState<string[]>(DEFAULT_UNITS);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  // Dialogs
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Form
  const [formData, setFormData] = useState<Partial<Asset>>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    productType: "", assetState: "", department: "", unit: "", vendor: "", os: "", yearPurchased: "",
  });

  // Role helpers
  const canDelete = user.role === "admin" || user.name === "Admin" || user.name === "Kingsley";
  const isViewer = user.role === "viewer";

  // ─── API helpers ──────────────────────────────────────
  const apiBase = `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e`;
  const headers = { Authorization: `Bearer ${publicAnonKey}`, "Content-Type": "application/json" };

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/departments`, { headers: { Authorization: `Bearer ${publicAnonKey}` } });
      const data = await res.json();
      if (data.departments && Array.isArray(data.departments)) {
        setDepartments(data.departments);
      }
    } catch (err) {
      console.error("Error fetching departments:", err);
    }
  }, []);

  const fetchUnits = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/units`, { headers: { Authorization: `Bearer ${publicAnonKey}` } });
      const data = await res.json();
      if (data.units && Array.isArray(data.units)) {
        setUnits(data.units);
      }
    } catch (err) {
      console.error("Error fetching units:", err);
    }
  }, []);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await cachedFetch<{ assets: Asset[] }>(
        `${apiBase}/assets`,
        { headers },
        30_000
      );
      setAssets(data.assets || []);
    } catch (err) {
      console.error("Error fetching assets:", err);
      toast.error("Failed to load assets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAssets(); fetchDepartments(); fetchUnits(); }, [fetchAssets, fetchDepartments, fetchUnits]);

  // ─── Filtered & paginated assets ──────────────────────
  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const match = Object.values(a).some((v) => String(v).toLowerCase().includes(q));
        if (!match) return false;
      }
      if (filters.productType && a.productType !== filters.productType) return false;
      if (filters.assetState && a.assetState !== filters.assetState) return false;
      if (filters.department && a.department !== filters.department) return false;
      if (filters.unit && a.unit !== filters.unit) return false;
      if (filters.vendor && a.vendor !== filters.vendor) return false;
      if (filters.os && a.os !== filters.os) return false;
      if (filters.yearPurchased && a.acqDate) {
        const year = new Date(a.acqDate).getFullYear().toString();
        if (year !== filters.yearPurchased) return false;
      } else if (filters.yearPurchased && !a.acqDate) return false;
      return true;
    });
  }, [assets, searchTerm, filters]);

  const totalPages = Math.ceil(filteredAssets.length / PAGE_SIZE);
  const pagedAssets = filteredAssets.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const uniqueVendors = useMemo(() => [...new Set(assets.map((a) => a.vendor).filter(Boolean))].sort(), [assets]);
  const uniqueYears = useMemo(() => {
    const years = assets
      .map((a) => a.acqDate ? new Date(a.acqDate).getFullYear().toString() : null)
      .filter((y): y is string => !!y);
    return [...new Set(years)].sort((a, b) => parseInt(b) - parseInt(a));
  }, [assets]);

  // Reset page on filter/search change
  useEffect(() => { setPage(0); }, [searchTerm, filters]);

  // ─── Handlers ─────────────────────────────────────────
  async function handleAdd() {
    const required = ["assetName", "serviceTag", "product", "productType", "assetState", "serialNumber"];
    const missing = required.filter((f) => !formData[f as keyof Asset]);
    if (missing.length) {
      toast.error(`Required: ${missing.join(", ")}`);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${apiBase}/assets`, {
        method: "POST", headers,
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to create asset");
      toast.success("Asset created successfully");
      invalidateCache(`${apiBase}/assets`);
      setShowAddDialog(false);
      setFormData(EMPTY_FORM);
      fetchAssets();
    } catch (err: any) {
      toast.error(err.message || "Failed to create asset");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate() {
    if (!selectedAsset) return;
    setSaving(true);
    try {
      const res = await fetch(`${apiBase}/assets/${selectedAsset.id}`, {
        method: "PUT", headers,
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to update asset");
      toast.success("Asset updated successfully");
      invalidateCache(`${apiBase}/assets`);
      setShowEditDialog(false);
      fetchAssets();
    } catch (err: any) {
      toast.error(err.message || "Failed to update asset");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedAsset) return;
    try {
      const res = await fetch(`${apiBase}/assets/${selectedAsset.id}`, {
        method: "DELETE", headers,
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to delete asset");
      toast.success("Asset deleted successfully");
      invalidateCache(`${apiBase}/assets`);
      setShowDeleteDialog(false);
      fetchAssets();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete asset");
    }
  }

  function openEdit(asset: Asset) {
    setSelectedAsset(asset);
    setFormData({ ...asset });
    setShowEditDialog(true);
  }

  function openView(asset: Asset) {
    setSelectedAsset(asset);
    setShowViewDialog(true);
  }

  function openDelete(asset: Asset) {
    setSelectedAsset(asset);
    setShowDeleteDialog(true);
  }

  function clearFilters() {
    setFilters({ productType: "", assetState: "", department: "", unit: "", vendor: "", os: "", yearPurchased: "" });
    setSearchTerm("");
  }

  // ─── Render ───────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Asset Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredAssets.length} of {assets.length} asset{assets.length !== 1 ? "s" : ""}
          </p>
        </div>
        {!isViewer && (
          <Button
            onClick={() => { setFormData(EMPTY_FORM); setShowAddDialog(true); }}
            className="bg-gradient-to-r from-red-900 to-rose-900 hover:from-red-800 hover:to-rose-800 text-white w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Asset
          </Button>
        )}
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search assets by name, tag, user, department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge className="bg-gradient-to-r from-red-900 to-rose-900 text-white text-xs px-1.5">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
              {(activeFilterCount > 0 || searchTerm) && (
                <Button variant="ghost" onClick={clearFilters} className="text-red-600 hover:text-red-700">
                  <XIcon className="w-4 h-4 mr-1" /> Clear
                </Button>
              )}
              <Button variant="outline" size="icon" onClick={fetchAssets} title="Refresh">
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>

          {/* Active filter tags */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2">
              {filters.productType && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Type: {filters.productType}
                  <button onClick={() => setFilters({ ...filters, productType: "" })}><XIcon className="w-3 h-3" /></button>
                </Badge>
              )}
              {filters.assetState && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  State: {filters.assetState}
                  <button onClick={() => setFilters({ ...filters, assetState: "" })}><XIcon className="w-3 h-3" /></button>
                </Badge>
              )}
              {filters.department && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Dept: {filters.department}
                  <button onClick={() => setFilters({ ...filters, department: "" })}><XIcon className="w-3 h-3" /></button>
                </Badge>
              )}
              {filters.unit && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Unit: {filters.unit}
                  <button onClick={() => setFilters({ ...filters, unit: "" })}><XIcon className="w-3 h-3" /></button>
                </Badge>
              )}
              {filters.vendor && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Vendor: {filters.vendor}
                  <button onClick={() => setFilters({ ...filters, vendor: "" })}><XIcon className="w-3 h-3" /></button>
                </Badge>
              )}
              {filters.os && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  OS: {filters.os}
                  <button onClick={() => setFilters({ ...filters, os: "" })}><XIcon className="w-3 h-3" /></button>
                </Badge>
              )}
              {filters.yearPurchased && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Year: {filters.yearPurchased}
                  <button onClick={() => setFilters({ ...filters, yearPurchased: "" })}><XIcon className="w-3 h-3" /></button>
                </Badge>
              )}
            </div>
          )}

          {/* Filter dropdowns */}
          {showFilters && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 border-t">
              <Select value={filters.productType || "all"} onValueChange={(v) => setFilters({ ...filters, productType: v === "all" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Product Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {PRODUCT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filters.assetState || "all"} onValueChange={(v) => setFilters({ ...filters, assetState: v === "all" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Asset State" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {ASSET_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filters.department || "all"} onValueChange={(v) => setFilters({ ...filters, department: v === "all" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Department" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filters.unit || "all"} onValueChange={(v) => setFilters({ ...filters, unit: v === "all" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Unit" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Units</SelectItem>
                  {units.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filters.vendor || "all"} onValueChange={(v) => setFilters({ ...filters, vendor: v === "all" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Vendor" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  {uniqueVendors.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filters.os || "all"} onValueChange={(v) => setFilters({ ...filters, os: v === "all" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="OS" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All OS</SelectItem>
                  {OS_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filters.yearPurchased || "all"} onValueChange={(v) => setFilters({ ...filters, yearPurchased: v === "all" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Year Purchased" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {uniqueYears.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="whitespace-nowrap min-w-[160px]">Asset Name</TableHead>
                <TableHead className="whitespace-nowrap min-w-[120px]">Service Tag</TableHead>
                <TableHead className="whitespace-nowrap min-w-[130px]">Serial Number</TableHead>
                <TableHead className="whitespace-nowrap min-w-[100px]">Type</TableHead>
                <TableHead className="whitespace-nowrap min-w-[120px]">State</TableHead>
                <TableHead className="whitespace-nowrap min-w-[120px]">Assigned User</TableHead>
                <TableHead className="whitespace-nowrap min-w-[120px]">Department</TableHead>
                <TableHead className="whitespace-nowrap min-w-[110px]">Unit</TableHead>
                <TableHead className="whitespace-nowrap min-w-[120px]">Vendor</TableHead>
                <TableHead className="whitespace-nowrap min-w-[130px] text-right">Cost (₦)</TableHead>
                <TableHead className="whitespace-nowrap min-w-[110px]">Rating</TableHead>
                <TableHead className="whitespace-nowrap min-w-[90px]">OS</TableHead>
                <TableHead className="whitespace-nowrap min-w-[130px]">Processor</TableHead>
                <TableHead className="whitespace-nowrap min-w-[80px]">RAM</TableHead>
                <TableHead className="whitespace-nowrap min-w-[120px]">Manufacturer</TableHead>
                <TableHead className="whitespace-nowrap min-w-[120px]">Location</TableHead>
                <TableHead className="whitespace-nowrap min-w-[120px]">Acq. Date</TableHead>
                <TableHead className="whitespace-nowrap min-w-[110px]">Year Purchased</TableHead>
                <TableHead className="whitespace-nowrap min-w-[130px]">Warranty Start</TableHead>
                <TableHead className="whitespace-nowrap min-w-[130px]">Warranty Expiry</TableHead>
                <TableHead className="whitespace-nowrap min-w-[120px]">Device History</TableHead>
                <TableHead className="whitespace-nowrap min-w-[120px]">Previous User</TableHead>
                <TableHead className="whitespace-nowrap text-right sticky right-0 bg-gray-50 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.08)]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 22 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : pagedAssets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={22} className="text-center py-12 text-gray-400">
                    {searchTerm || activeFilterCount > 0
                      ? "No assets match your filters"
                      : "No assets yet — click 'Add New Asset' to get started"}
                  </TableCell>
                </TableRow>
              ) : (
                pagedAssets.map((asset) => {
                  const ratingNum = parseInt(asset.rating || "0");
                  const acqYear = asset.acqDate ? new Date(asset.acqDate).getFullYear() : null;
                  return (
                    <TableRow key={asset.id} className="hover:bg-gray-50">
                      <TableCell className="min-w-[160px]">
                        <div className="font-medium text-gray-900 whitespace-nowrap">{asset.assetName}</div>
                        {asset.product && <div className="text-xs text-gray-400 whitespace-nowrap">{asset.product}</div>}
                      </TableCell>
                      <TableCell className="font-mono text-sm whitespace-nowrap">{asset.serviceTag}</TableCell>
                      <TableCell className="font-mono text-sm whitespace-nowrap">{asset.serialNumber || "—"}</TableCell>
                      <TableCell className="whitespace-nowrap">{asset.productType}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStateColor(asset.assetState)}`}>
                          {asset.assetState}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{asset.user || "—"}</TableCell>
                      <TableCell className="whitespace-nowrap">{asset.department || "—"}</TableCell>
                      <TableCell className="whitespace-nowrap">{asset.unit || "—"}</TableCell>
                      <TableCell className="whitespace-nowrap">{asset.vendor || "—"}</TableCell>
                      <TableCell className="text-right whitespace-nowrap font-mono text-sm">
                        {asset.cost ? `₦${Number(asset.cost).toLocaleString()}` : "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {ratingNum > 0 ? (
                          <div className="flex items-center gap-0.5">
                            {[1,2,3,4,5].map((s) => (
                              <Star key={s} className={`w-3.5 h-3.5 ${s <= ratingNum ? "fill-yellow-400 text-yellow-400" : "text-gray-200 fill-gray-200"}`} />
                            ))}
                            <span className="text-xs text-gray-500 ml-1">{ratingNum}/5</span>
                          </div>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{asset.os || "—"}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{asset.processor || "—"}</TableCell>
                      <TableCell className="whitespace-nowrap">{asset.ram || "—"}</TableCell>
                      <TableCell className="whitespace-nowrap">{asset.manufacturer || "—"}</TableCell>
                      <TableCell className="whitespace-nowrap">{asset.site || "—"}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{asset.acqDate || "—"}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{acqYear || "—"}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{asset.warrantyStartDate || "—"}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{asset.warrantyExpiry || "—"}</TableCell>
                      <TableCell className="whitespace-nowrap">{/* Device History badge */}
                        {asset.deviceHistory ? (
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${asset.deviceHistory === "New" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                            {asset.deviceHistory}
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{asset.previousUser || "—"}</TableCell>
                      <TableCell className="text-right sticky right-0 bg-white shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.08)]">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openView(asset)} title="View">
                            <Eye className="w-4 h-4" />
                          </Button>
                          {!isViewer && (
                            <Button variant="ghost" size="icon" onClick={() => openEdit(asset)} title="Edit">
                              <Pencil className="w-4 h-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button variant="ghost" size="icon" onClick={() => openDelete(asset)} title="Delete"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
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
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredAssets.length)} of {filteredAssets.length}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 0}>
              <ChevronLeft className="w-4 h-4" /> Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages - 1}>
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Add Dialog ─────────────────────────────────────── */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Add New Asset</DialogTitle>
          </DialogHeader>
          <AssetForm formData={formData} setFormData={setFormData} departments={departments} units={units} />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving}
              className="bg-gradient-to-r from-red-900 to-rose-900 hover:from-red-800 hover:to-rose-800 text-white">
              {saving ? "Creating..." : "Create Asset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ────────────────────────────────────── */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
          </DialogHeader>
          <AssetForm formData={formData} setFormData={setFormData} departments={departments} units={units} />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={saving}
              className="bg-gradient-to-r from-red-900 to-rose-900 hover:from-red-800 hover:to-rose-800 text-white">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── View Dialog ────────────────────────────────────── */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Asset Details</DialogTitle>
          </DialogHeader>
          {selectedAsset && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
              {[
                ["Asset Name", selectedAsset.assetName],
                ["Service Tag", selectedAsset.serviceTag],
                ["Product", selectedAsset.product],
                ["Product Type", selectedAsset.productType],
                ["Asset State", selectedAsset.assetState],
                ["Assigned User", selectedAsset.user],
                ["Department", selectedAsset.department],
                ["Unit", selectedAsset.unit || "—"],
                ["Acquisition Date", selectedAsset.acqDate],
                ["Vendor", selectedAsset.vendor],
                ["Cost (₦)", selectedAsset.cost ? `₦${Number(selectedAsset.cost).toLocaleString()}` : "—"],
                ["OS", selectedAsset.os],
                ["Processor", selectedAsset.processor],
                ["RAM", selectedAsset.ram],
                ["Manufacturer", selectedAsset.manufacturer],
                ["Serial Number", selectedAsset.serialNumber],
                ["Location", selectedAsset.site],
                ["Warranty Start", selectedAsset.warrantyStartDate || "—"],
                ["Warranty Expiry", selectedAsset.warrantyExpiry || "—"],
                ["Device History", selectedAsset.deviceHistory],
                ["Previous User", selectedAsset.previousUser || "—"],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
                  <p className="text-sm text-gray-900 mt-0.5">{value || "—"}</p>
                </div>
              ))}
              {selectedAsset.function && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Function</p>
                  <p className="text-sm text-gray-900 mt-0.5">{selectedAsset.function}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ────────────────────────────── */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{selectedAsset?.assetName}</span> ({selectedAsset?.serviceTag})?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}
              className="bg-gradient-to-r from-red-900 to-rose-900 hover:from-red-800 hover:to-rose-800 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Shared Asset Form ────────────────────────────────────
function AssetForm({
  formData,
  setFormData,
  departments,
  units,
}: {
  formData: Partial<Asset>;
  setFormData: (d: Partial<Asset>) => void;
  departments: string[];
  units: string[];
}) {
  const set = (field: keyof Asset, value: any) => setFormData({ ...formData, [field]: value });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[65vh] overflow-y-auto p-1">
      <div className="space-y-1">
        <Label>Asset Name <span className="text-red-500">*</span></Label>
        <Input value={formData.assetName || ""} onChange={(e) => set("assetName", e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label>Service Tag <span className="text-red-500">*</span></Label>
        <Input value={formData.serviceTag || ""} onChange={(e) => set("serviceTag", e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label>Product <span className="text-red-500">*</span></Label>
        <Input value={formData.product || ""} onChange={(e) => set("product", e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label>Product Type <span className="text-red-500">*</span></Label>
        <Select value={formData.productType || ""} onValueChange={(v) => set("productType", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{PRODUCT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Asset State <span className="text-red-500">*</span></Label>
        <Select value={formData.assetState || ""} onValueChange={(v) => set("assetState", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{ASSET_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Serial Number <span className="text-red-500">*</span></Label>
        <Input value={formData.serialNumber || ""} onChange={(e) => set("serialNumber", e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label>Assigned User</Label>
        <Input value={formData.user || ""} onChange={(e) => set("user", e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label>Department</Label>
        <Select value={formData.department || ""} onValueChange={(v) => set("department", v)}>
          <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
          <SelectContent>{departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Unit</Label>
        <Select value={formData.unit || ""} onValueChange={(v) => set("unit", v)}>
          <SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger>
          <SelectContent>{units.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Acquisition Date</Label>
        <Input type="date" value={formData.acqDate || ""} onChange={(e) => set("acqDate", e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label>Vendor</Label>
        <Input value={formData.vendor || ""} onChange={(e) => set("vendor", e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label>Cost (₦)</Label>
        <Input type="number" value={formData.cost || ""} onChange={(e) => set("cost", parseFloat(e.target.value) || 0)} />
      </div>
      <div className="space-y-1">
        <Label>Rating</Label>
        <StarRating value={parseInt(formData.rating || "0")} onChange={(v) => set("rating", v.toString())} />
      </div>
      <div className="space-y-1">
        <Label>Operating System</Label>
        <Select value={formData.os || ""} onValueChange={(v) => set("os", v)}>
          <SelectTrigger><SelectValue placeholder="Select OS" /></SelectTrigger>
          <SelectContent>{OS_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Processor</Label>
        <Input value={formData.processor || ""} onChange={(e) => set("processor", e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label>RAM</Label>
        <Input value={formData.ram || ""} onChange={(e) => set("ram", e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label>Manufacturer</Label>
        <Input value={formData.manufacturer || ""} onChange={(e) => set("manufacturer", e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label>Location / Site</Label>
        <Input value={formData.site || ""} onChange={(e) => set("site", e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label>Device History</Label>
        <Select value={formData.deviceHistory || ""} onValueChange={(v) => set("deviceHistory", v)}>
          <SelectTrigger><SelectValue placeholder="Select history" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="New">New</SelectItem>
            <SelectItem value="Previously Used">Previously Used</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {formData.deviceHistory === "Previously Used" && (
        <div className="space-y-1">
          <Label>Previous User</Label>
          <Input value={formData.previousUser || ""} onChange={(e) => set("previousUser", e.target.value)} placeholder="Name of previous user" />
        </div>
      )}
      <div className="space-y-1">
        <Label>Warranty Start Date</Label>
        <Input type="date" value={formData.warrantyStartDate || ""} onChange={(e) => set("warrantyStartDate", e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label>Warranty Expiry</Label>
        <Input type="date" value={formData.warrantyExpiry || ""} onChange={(e) => set("warrantyExpiry", e.target.value)} />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <Label>Function / Description</Label>
        <Textarea value={formData.function || ""} onChange={(e) => set("function", e.target.value)} rows={3} />
      </div>
    </div>
  );
}