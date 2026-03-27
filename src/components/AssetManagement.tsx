import { useState, useEffect, useMemo } from "react";
import { User } from "../App";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Card, CardContent } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { toast } from "sonner@2.0.3";
import { Plus, Edit, Trash2, Eye, History, Package, Star, Filter, X as XIcon } from "lucide-react";
import { Textarea } from "./ui/textarea";

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
  bizOwner: string;
  admin: string;
  acqDate: string;
  vendor: string;
  cost: number;
  rating: string;
  os: string;
  processor: string;
  expiryDate?: string;
  warrantyExpiry?: string;
  warrantyStartDate?: string;
  ram: string;
  manufacturer: string;
  site: string;
  function: string;
  serialNumber: string;
  deviceHistory: string;
  previousUser: string;
  createdAt: string;
  updatedAt: string;
}

interface AssetHistory {
  id: string;
  assetId: string;
  previousUser: string;
  handoverDate: string;
  exitDate?: string;
  returnDate?: string;
  conditionReturned?: string;
  returnedWithCharger?: string;
  createdAt: string;
}

const DEPARTMENTS = ["TP", "CP", "EMM", "RDS", "PCFW", "BAS", "FAS & PMG"];
const UNITS = [
  "TP", "CP", "EMM", "RDS", "PCFW", "BAS",
  "Internal Audit and Enterprise Risk Services",
  "Forensic, Cybersecurity and Compliance Services",
  "Accounting Advisory", "F&A", "HR", "M&B", "ITS"
];
const PRODUCT_TYPES = ["Hardware", "Software", "Network", "Others"];
const ASSET_STATES = ["Faulty", "Disposed", "In Use/Active", "Retired", "Unassigned", "Stolen"];
const CONDITION_OPTIONS = ["Good condition", "Poor condition", "Bad condition"];
const OS_OPTIONS = ["Windows", "MacOS", "Linux", "Others"];

const StarRating = ({ value, onChange }: { value: number; onChange: (val: number) => void }) => {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="p-0 focus:outline-none"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
        >
          <Star
            className={`w-6 h-6 cursor-pointer transition-colors ${
              star <= (hovered || value)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
      {value > 0 && <span className="text-sm text-gray-500 ml-2">{value}/5</span>}
    </div>
  );
};

export default function AssetManagement({ user }: AssetManagementProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [assetHistory, setAssetHistory] = useState<AssetHistory[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Column filters
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    productType: "",
    assetState: "",
    department: "",
    vendor: "",
    os: "",
    acqDate: "",
    deviceHistory: "",
    rating: "",
  });

  const emptyAsset: Partial<Asset> = {
    assetName: "",
    serviceTag: "",
    product: "",
    productType: "Hardware",
    assetState: "Unassigned",
    user: "",
    department: "",
    acqDate: "",
    vendor: "",
    cost: 0,
    rating: "",
    os: "",
    processor: "",
    ram: "",
    manufacturer: "",
    site: "",
    function: "",
    serialNumber: "",
    warrantyStartDate: "",
    warrantyExpiry: "",
    deviceHistory: "",
    previousUser: "",
  };

  const [formData, setFormData] = useState<Partial<Asset>>(emptyAsset);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    fetchAssets();
  }, []);

  const validateForm = (): boolean => {
    const errors: string[] = [];
    const requiredFields = [
      { field: 'assetName', label: 'Asset Name' },
      { field: 'serviceTag', label: 'Service Tag' },
      { field: 'product', label: 'Product' },
      { field: 'productType', label: 'Product Type' },
      { field: 'assetState', label: 'Asset State' },
      { field: 'serialNumber', label: 'Serial Number' },
    ];

    requiredFields.forEach(({ field, label }) => {
      const value = formData[field as keyof typeof formData];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors.push(label);
      }
    });

    setValidationErrors(errors);
    
    if (errors.length > 0) {
      toast.error(`Please fill in all required fields: ${errors.join(', ')}`);
      return false;
    }
    
    return true;
  };

  const fetchAssets = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/assets`,
        {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }
      );
      const data = await response.json();
      setAssets(data.assets || []);
    } catch (error) {
      console.error("Error fetching assets:", error);
      toast.error("Failed to load assets");
    } finally {
      setLoading(false);
    }
  };

  const fetchAssetHistory = async (assetId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/asset-history/${assetId}`,
        {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }
      );
      const data = await response.json();
      setAssetHistory(data.history || []);
    } catch (error) {
      console.error("Error fetching asset history:", error);
      toast.error("Failed to load asset history");
    }
  };

  const handleAddAsset = async () => {
    if (!validateForm()) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/assets`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) throw new Error("Failed to create asset");

      toast.success("Asset created successfully");
      setShowAddDialog(false);
      setFormData(emptyAsset);
      fetchAssets();
    } catch (error) {
      console.error("Error creating asset:", error);
      toast.error("Failed to create asset");
    }
  };

  const handleUpdateAsset = async () => {
    if (!selectedAsset) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/assets/${selectedAsset.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) throw new Error("Failed to update asset");

      toast.success("Asset updated successfully");
      setShowEditDialog(false);
      setSelectedAsset(null);
      setFormData(emptyAsset);
      fetchAssets();
    } catch (error) {
      console.error("Error updating asset:", error);
      toast.error("Failed to update asset");
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (user.role !== "admin" && user.name !== "Admin" && user.name !== "Kingsley") {
      toast.error("Only admins can delete assets");
      return;
    }

    if (!confirm("Are you sure you want to delete this asset?")) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/assets/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }
      );

      if (!response.ok) throw new Error("Failed to delete asset");

      toast.success("Asset deleted successfully");
      fetchAssets();
    } catch (error) {
      console.error("Error deleting asset:", error);
      toast.error("Failed to delete asset");
    }
  };

  const openEditDialog = (asset: Asset) => {
    setSelectedAsset(asset);
    setFormData(asset);
    setShowEditDialog(true);
  };

  const openViewDialog = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowViewDialog(true);
  };

  const openHistoryDialog = (asset: Asset) => {
    setSelectedAsset(asset);
    fetchAssetHistory(asset.id);
    setShowHistoryDialog(true);
  };

  // Derive unique values for dynamic filter dropdowns
  const uniqueVendors = useMemo(() => [...new Set(assets.map(a => a.vendor).filter(Boolean))].sort(), [assets]);
  const uniqueYears = useMemo(() => [...new Set(assets.map(a => a.acqDate?.slice(0, 4)).filter(Boolean))].sort().reverse(), [assets]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const clearAllFilters = () => {
    setFilters({
      productType: "",
      assetState: "",
      department: "",
      vendor: "",
      os: "",
      acqDate: "",
      deviceHistory: "",
      rating: "",
    });
    setSearchTerm("");
  };

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      // Text search
      if (searchTerm) {
        const matches = Object.values(asset).some((value) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (!matches) return false;
      }

      // Column filters
      if (filters.productType && asset.productType !== filters.productType) return false;
      if (filters.assetState && asset.assetState !== filters.assetState) return false;
      if (filters.department && asset.department !== filters.department) return false;
      if (filters.vendor && asset.vendor !== filters.vendor) return false;
      if (filters.os && asset.os !== filters.os) return false;
      if (filters.acqDate && (!asset.acqDate || !asset.acqDate.startsWith(filters.acqDate))) return false;
      if (filters.deviceHistory && asset.deviceHistory !== filters.deviceHistory) return false;
      if (filters.rating && asset.rating !== filters.rating) return false;

      return true;
    });
  }, [assets, searchTerm, filters]);

  const getAssetStateColor = (state: string) => {
    switch (state) {
      case "In Use/Active":
        return "bg-green-100 text-green-800";
      case "Unassigned":
        return "bg-yellow-100 text-yellow-800";
      case "Faulty":
        return "bg-red-100 text-red-800";
      case "Retired":
        return "bg-gray-100 text-gray-800";
      case "Disposed":
        return "bg-gray-100 text-gray-800";
      case "Stolen":
        return "bg-red-100 text-red-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading assets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl mb-2">Asset Management</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage and track all organizational assets</p>
        </div>
        {user.role !== "viewer" && (
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-red-900 to-rose-900 hover:from-red-800 hover:to-rose-800 w-full sm:w-auto" onClick={() => setFormData(emptyAsset)}>
              <Plus className="w-4 h-4 mr-2" />
              Add New Asset
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Asset</DialogTitle>
              <DialogDescription>Fill in the asset details below</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto p-4">
              <div className="space-y-2">
                <Label htmlFor="assetName">Asset Name *</Label>
                <Input
                  id="assetName"
                  value={formData.assetName || ""}
                  onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceTag">Service Tag *</Label>
                <Input
                  id="serviceTag"
                  value={formData.serviceTag || ""}
                  onChange={(e) => setFormData({ ...formData, serviceTag: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product">Product *</Label>
                <Input
                  id="product"
                  value={formData.product || ""}
                  onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="productType">Product Type *</Label>
                <Select
                  value={formData.productType || ""}
                  onValueChange={(value) => setFormData({ ...formData, productType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assetState">Asset State *</Label>
                <Select
                  value={formData.assetState || ""}
                  onValueChange={(value) => setFormData({ ...formData, assetState: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_STATES.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="user">User</Label>
                <Input
                  id="user"
                  value={formData.user || ""}
                  onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select
                  value={formData.department || ""}
                  onValueChange={(value) => setFormData({ ...formData, department: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="acqDate">Acquisition Date</Label>
                <Input
                  id="acqDate"
                  type="date"
                  value={formData.acqDate || ""}
                  onChange={(e) => setFormData({ ...formData, acqDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor</Label>
                <Input
                  id="vendor"
                  value={formData.vendor || ""}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost">Cost (₦)</Label>
                <Input
                  id="cost"
                  type="number"
                  value={formData.cost || ""}
                  onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rating">Rating</Label>
                <StarRating
                  value={parseInt(formData.rating || "0")}
                  onChange={(value) => setFormData({ ...formData, rating: value.toString() })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="os">Operating System</Label>
                <Select
                  value={formData.os || ""}
                  onValueChange={(value) => setFormData({ ...formData, os: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select OS" />
                  </SelectTrigger>
                  <SelectContent>
                    {OS_OPTIONS.map((os) => (
                      <SelectItem key={os} value={os}>
                        {os}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="processor">Processor</Label>
                <Input
                  id="processor"
                  value={formData.processor || ""}
                  onChange={(e) => setFormData({ ...formData, processor: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ram">RAM</Label>
                <Input
                  id="ram"
                  value={formData.ram || ""}
                  onChange={(e) => setFormData({ ...formData, ram: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer || ""}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serialNumber">Serial Number *</Label>
                <Input
                  id="serialNumber"
                  value={formData.serialNumber || ""}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="warrantyStartDate">Warranty Start Date</Label>
                <Input
                  id="warrantyStartDate"
                  type="date"
                  value={formData.warrantyStartDate || ""}
                  onChange={(e) => setFormData({ ...formData, warrantyStartDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="warrantyExpiry">Warranty Expiry</Label>
                <Input
                  id="warrantyExpiry"
                  type="date"
                  value={formData.warrantyExpiry || ""}
                  onChange={(e) => setFormData({ ...formData, warrantyExpiry: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="site">Location</Label>
                <Input
                  id="site"
                  value={formData.site || ""}
                  onChange={(e) => setFormData({ ...formData, site: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deviceHistory">Device History</Label>
                <Select
                  value={formData.deviceHistory || ""}
                  onValueChange={(value) => setFormData({ ...formData, deviceHistory: value, previousUser: value === "New" ? "" : formData.previousUser || "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select device history" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Previously Used">Previously Used</SelectItem>
                    <SelectItem value="New">New</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.deviceHistory === "Previously Used" && (
                <div className="space-y-2 col-span-2">
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Previous User</h4>
                    <Input
                      id="previousUser"
                      placeholder="Enter the name of the previous user"
                      value={formData.previousUser || ""}
                      onChange={(e) => setFormData({ ...formData, previousUser: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2 col-span-2">
                <Label htmlFor="function">Function</Label>
                <Textarea
                  id="function"
                  value={formData.function || ""}
                  onChange={(e) => setFormData({ ...formData, function: e.target.value })}
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:space-x-2 p-4">
              <Button variant="outline" onClick={() => setShowAddDialog(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button onClick={handleAddAsset} className="w-full sm:w-auto">Create Asset</Button>
            </div>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search assets by name, tag, user, department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge className="bg-gradient-to-r from-red-900 to-rose-900 text-white ml-1 text-xs px-1.5 py-0.5">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
            {(activeFilterCount > 0 || searchTerm) && (
              <Button
                variant="ghost"
                onClick={clearAllFilters}
                className="text-red-600 hover:text-red-700 w-full sm:w-auto"
              >
                <XIcon className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>

          {/* Active Filter Tags */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2">
              {filters.productType && (
                <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1">
                  Type: {filters.productType}
                  <button onClick={() => setFilters({ ...filters, productType: "" })} className="ml-1 hover:text-red-600"><XIcon className="w-3 h-3" /></button>
                </Badge>
              )}
              {filters.assetState && (
                <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1">
                  State: {filters.assetState}
                  <button onClick={() => setFilters({ ...filters, assetState: "" })} className="ml-1 hover:text-red-600"><XIcon className="w-3 h-3" /></button>
                </Badge>
              )}
              {filters.department && (
                <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1">
                  Dept: {filters.department}
                  <button onClick={() => setFilters({ ...filters, department: "" })} className="ml-1 hover:text-red-600"><XIcon className="w-3 h-3" /></button>
                </Badge>
              )}
              {filters.vendor && (
                <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1">
                  Vendor: {filters.vendor}
                  <button onClick={() => setFilters({ ...filters, vendor: "" })} className="ml-1 hover:text-red-600"><XIcon className="w-3 h-3" /></button>
                </Badge>
              )}
              {filters.os && (
                <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1">
                  OS: {filters.os}
                  <button onClick={() => setFilters({ ...filters, os: "" })} className="ml-1 hover:text-red-600"><XIcon className="w-3 h-3" /></button>
                </Badge>
              )}
              {filters.acqDate && (
                <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1">
                  Year: {filters.acqDate}
                  <button onClick={() => setFilters({ ...filters, acqDate: "" })} className="ml-1 hover:text-red-600"><XIcon className="w-3 h-3" /></button>
                </Badge>
              )}
              {filters.deviceHistory && (
                <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1">
                  History: {filters.deviceHistory}
                  <button onClick={() => setFilters({ ...filters, deviceHistory: "" })} className="ml-1 hover:text-red-600"><XIcon className="w-3 h-3" /></button>
                </Badge>
              )}
              {filters.rating && (
                <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1">
                  Rating: {filters.rating} star{filters.rating !== "1" ? "s" : ""}
                  <button onClick={() => setFilters({ ...filters, rating: "" })} className="ml-1 hover:text-red-600"><XIcon className="w-3 h-3" /></button>
                </Badge>
              )}
            </div>
          )}

          {/* Expandable Filter Panel */}
          {showFilters && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Filter className="w-4 h-4" /> Filter by Column
                </h3>
                <p className="text-xs text-gray-500">
                  Showing {filteredAssets.length} of {assets.length} assets
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Product Type</Label>
                  <Select
                    value={filters.productType || "all"}
                    onValueChange={(value) => setFilters({ ...filters, productType: value === "all" ? "" : value })}
                  >
                    <SelectTrigger className="h-9 bg-white">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {PRODUCT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Asset State</Label>
                  <Select
                    value={filters.assetState || "all"}
                    onValueChange={(value) => setFilters({ ...filters, assetState: value === "all" ? "" : value })}
                  >
                    <SelectTrigger className="h-9 bg-white">
                      <SelectValue placeholder="All States" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All States</SelectItem>
                      {ASSET_STATES.map((state) => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Department</Label>
                  <Select
                    value={filters.department || "all"}
                    onValueChange={(value) => setFilters({ ...filters, department: value === "all" ? "" : value })}
                  >
                    <SelectTrigger className="h-9 bg-white">
                      <SelectValue placeholder="All Departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Vendor</Label>
                  <Select
                    value={filters.vendor || "all"}
                    onValueChange={(value) => setFilters({ ...filters, vendor: value === "all" ? "" : value })}
                  >
                    <SelectTrigger className="h-9 bg-white">
                      <SelectValue placeholder="All Vendors" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Vendors</SelectItem>
                      {uniqueVendors.map((vendor) => (
                        <SelectItem key={vendor} value={vendor}>{vendor}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Operating System</Label>
                  <Select
                    value={filters.os || "all"}
                    onValueChange={(value) => setFilters({ ...filters, os: value === "all" ? "" : value })}
                  >
                    <SelectTrigger className="h-9 bg-white">
                      <SelectValue placeholder="All OS" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All OS</SelectItem>
                      {OS_OPTIONS.map((os) => (
                        <SelectItem key={os} value={os}>{os}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Acquisition Year</Label>
                  <Select
                    value={filters.acqDate || "all"}
                    onValueChange={(value) => setFilters({ ...filters, acqDate: value === "all" ? "" : value })}
                  >
                    <SelectTrigger className="h-9 bg-white">
                      <SelectValue placeholder="All Years" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      {uniqueYears.map((year) => (
                        <SelectItem key={year} value={year}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Device History</Label>
                  <Select
                    value={filters.deviceHistory || "all"}
                    onValueChange={(value) => setFilters({ ...filters, deviceHistory: value === "all" ? "" : value })}
                  >
                    <SelectTrigger className="h-9 bg-white">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="Previously Used">Previously Used</SelectItem>
                      <SelectItem value="New">New</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Rating</Label>
                  <Select
                    value={filters.rating || "all"}
                    onValueChange={(value) => setFilters({ ...filters, rating: value === "all" ? "" : value })}
                  >
                    <SelectTrigger className="h-9 bg-white">
                      <SelectValue placeholder="All Ratings" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Ratings</SelectItem>
                      {["1", "2", "3", "4", "5"].map((r) => (
                        <SelectItem key={r} value={r}>{r} Star{r !== "1" ? "s" : ""}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assets Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Asset Name</TableHead>
                  <TableHead className="whitespace-nowrap">Service Tag</TableHead>
                  <TableHead className="whitespace-nowrap">Product</TableHead>
                  <TableHead className="whitespace-nowrap">Product Type</TableHead>
                  <TableHead className="whitespace-nowrap">State</TableHead>
                  <TableHead className="whitespace-nowrap">User</TableHead>
                  <TableHead className="whitespace-nowrap">Department</TableHead>
                  <TableHead className="whitespace-nowrap">Acquisition Date</TableHead>
                  <TableHead className="whitespace-nowrap">Vendor</TableHead>
                  <TableHead className="whitespace-nowrap">Cost (₦)</TableHead>
                  <TableHead className="whitespace-nowrap">Rating</TableHead>
                  <TableHead className="whitespace-nowrap">Operating System</TableHead>
                  <TableHead className="whitespace-nowrap">Processor</TableHead>
                  <TableHead className="whitespace-nowrap">RAM</TableHead>
                  <TableHead className="whitespace-nowrap">Manufacturer</TableHead>
                  <TableHead className="whitespace-nowrap">Serial Number</TableHead>
                  <TableHead className="whitespace-nowrap">Device History</TableHead>
                  <TableHead className="whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={18} className="text-center text-gray-500 py-8">
                      No assets found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAssets.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell className="whitespace-nowrap">{asset.assetName}</TableCell>
                      <TableCell className="whitespace-nowrap">{asset.serviceTag}</TableCell>
                      <TableCell className="whitespace-nowrap">{asset.product || "-"}</TableCell>
                      <TableCell className="whitespace-nowrap">{asset.productType}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge className={getAssetStateColor(asset.assetState)}>
                          {asset.assetState}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{asset.user || "-"}</TableCell>
                      <TableCell className="whitespace-nowrap">{asset.department || "-"}</TableCell>
                      <TableCell className="whitespace-nowrap">{asset.acqDate || "-"}</TableCell>
                      <TableCell className="whitespace-nowrap">{asset.vendor || "-"}</TableCell>
                      <TableCell className="whitespace-nowrap">₦{asset.cost?.toLocaleString() || 0}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {asset.rating ? (
                          <span className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3.5 h-3.5 ${
                                  star <= parseInt(asset.rating)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </span>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{asset.os || "-"}</TableCell>
                      <TableCell className="whitespace-nowrap">{asset.processor || "-"}</TableCell>
                      <TableCell className="whitespace-nowrap">{asset.ram || "-"}</TableCell>
                      <TableCell className="whitespace-nowrap">{asset.manufacturer || "-"}</TableCell>
                      <TableCell className="whitespace-nowrap">{asset.serialNumber || "-"}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex flex-col">
                          <span>{asset.deviceHistory || "-"}</span>
                          {asset.deviceHistory === "Previously Used" && asset.previousUser && (
                            <span className="text-xs text-gray-500">Prev: {asset.previousUser}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openViewDialog(asset)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {user.role !== "viewer" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditDialog(asset)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openHistoryDialog(asset)}
                          >
                            <History className="w-4 h-4" />
                          </Button>
                          {(user.role === "admin" || user.name === "Admin" || user.name === "Kingsley") && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteAsset(asset.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
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
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
            <DialogDescription>Update asset details</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto p-4">
            <div className="space-y-2">
              <Label htmlFor="edit-assetName">Asset Name *</Label>
              <Input
                id="edit-assetName"
                value={formData.assetName || ""}
                onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-serviceTag">Service Tag *</Label>
              <Input
                id="edit-serviceTag"
                value={formData.serviceTag || ""}
                onChange={(e) => setFormData({ ...formData, serviceTag: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-product">Product *</Label>
              <Input
                id="edit-product"
                value={formData.product || ""}
                onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-productType">Product Type *</Label>
              <Select
                value={formData.productType || ""}
                onValueChange={(value) => setFormData({ ...formData, productType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-assetState">Asset State *</Label>
              <Select
                value={formData.assetState || ""}
                onValueChange={(value) => setFormData({ ...formData, assetState: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-user">User</Label>
              <Input
                id="edit-user"
                value={formData.user || ""}
                onChange={(e) => setFormData({ ...formData, user: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-department">Department</Label>
              <Select
                value={formData.department || ""}
                onValueChange={(value) => setFormData({ ...formData, department: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-acqDate">Acquisition Date</Label>
              <Input
                id="edit-acqDate"
                type="date"
                value={formData.acqDate || ""}
                onChange={(e) => setFormData({ ...formData, acqDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-vendor">Vendor</Label>
              <Input
                id="edit-vendor"
                value={formData.vendor || ""}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-cost">Cost (₦)</Label>
              <Input
                id="edit-cost"
                type="number"
                value={formData.cost || ""}
                onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-rating">Rating</Label>
              <StarRating
                value={parseInt(formData.rating || "0")}
                onChange={(value) => setFormData({ ...formData, rating: value.toString() })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-os">Operating System</Label>
              <Select
                value={formData.os || ""}
                onValueChange={(value) => setFormData({ ...formData, os: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select OS" />
                </SelectTrigger>
                <SelectContent>
                  {OS_OPTIONS.map((os) => (
                    <SelectItem key={os} value={os}>
                      {os}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-processor">Processor</Label>
              <Input
                id="edit-processor"
                value={formData.processor || ""}
                onChange={(e) => setFormData({ ...formData, processor: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-ram">RAM</Label>
              <Input
                id="edit-ram"
                value={formData.ram || ""}
                onChange={(e) => setFormData({ ...formData, ram: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-manufacturer">Manufacturer</Label>
              <Input
                id="edit-manufacturer"
                value={formData.manufacturer || ""}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-serialNumber">Serial Number *</Label>
              <Input
                id="edit-serialNumber"
                value={formData.serialNumber || ""}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-warrantyStartDate">Warranty Start Date</Label>
              <Input
                id="edit-warrantyStartDate"
                type="date"
                value={formData.warrantyStartDate || ""}
                onChange={(e) => setFormData({ ...formData, warrantyStartDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-warrantyExpiry">Warranty Expiry</Label>
              <Input
                id="edit-warrantyExpiry"
                type="date"
                value={formData.warrantyExpiry || ""}
                onChange={(e) => setFormData({ ...formData, warrantyExpiry: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-site">Location</Label>
              <Input
                id="edit-site"
                value={formData.site || ""}
                onChange={(e) => setFormData({ ...formData, site: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-deviceHistory">Device History</Label>
              <Select
                value={formData.deviceHistory || ""}
                onValueChange={(value) => setFormData({ ...formData, deviceHistory: value, previousUser: value === "New" ? "" : formData.previousUser || "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select device history" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Previously Used">Previously Used</SelectItem>
                  <SelectItem value="New">New</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.deviceHistory === "Previously Used" && (
              <div className="space-y-2 col-span-2">
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Previous User</h4>
                  <Input
                    id="edit-previousUser"
                    placeholder="Enter the name of the previous user"
                    value={formData.previousUser || ""}
                    onChange={(e) => setFormData({ ...formData, previousUser: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit-function">Function</Label>
              <Textarea
                id="edit-function"
                value={formData.function || ""}
                onChange={(e) => setFormData({ ...formData, function: e.target.value })}
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:space-x-2 p-4">
            <Button variant="outline" onClick={() => setShowEditDialog(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleUpdateAsset} className="w-full sm:w-auto">Update Asset</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Asset Details</DialogTitle>
            <DialogDescription>View complete asset information</DialogDescription>
          </DialogHeader>
          {selectedAsset && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto p-4">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Asset Name</p>
                <p className="text-sm">{selectedAsset.assetName || "-"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500">Service Tag</p>
                <p className="text-sm">{selectedAsset.serviceTag || "-"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500">Product</p>
                <p className="text-sm">{selectedAsset.product || "-"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500">Product Type</p>
                <p className="text-sm">{selectedAsset.productType || "-"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500">Asset State</p>
                <p className="text-sm">
                  <Badge className={getAssetStateColor(selectedAsset.assetState)}>
                    {selectedAsset.assetState}
                  </Badge>
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500">User</p>
                <p className="text-sm">{selectedAsset.user || "-"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500">Department</p>
                <p className="text-sm">{selectedAsset.department || "-"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500">Acquisition Date</p>
                <p className="text-sm">{selectedAsset.acqDate || "-"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500">Vendor</p>
                <p className="text-sm">{selectedAsset.vendor || "-"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500">Cost</p>
                <p className="text-sm">₦{selectedAsset.cost?.toLocaleString() || 0}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500">Rating</p>
                <p className="text-sm">
                  {selectedAsset.rating ? (
                    <span className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= parseInt(selectedAsset.rating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                      <span className="ml-1 text-gray-500">{selectedAsset.rating}/5</span>
                    </span>
                  ) : "-"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500">Operating System</p>
                <p className="text-sm">{selectedAsset.os || "-"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500">Processor</p>
                <p className="text-sm">{selectedAsset.processor || "-"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500">RAM</p>
                <p className="text-sm">{selectedAsset.ram || "-"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500">Manufacturer</p>
                <p className="text-sm">{selectedAsset.manufacturer || "-"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500">Serial Number</p>
                <p className="text-sm">{selectedAsset.serialNumber || "-"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500">Warranty Start Date</p>
                <p className="text-sm">{selectedAsset.warrantyStartDate || "-"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500">Warranty Expiry</p>
                <p className="text-sm">{selectedAsset.warrantyExpiry || "-"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500">Location</p>
                <p className="text-sm">{selectedAsset.site || "-"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500">Device History</p>
                <p className="text-sm">{selectedAsset.deviceHistory || "-"}</p>
              </div>

              {selectedAsset.deviceHistory === "Previously Used" && selectedAsset.previousUser && (
                <div className="space-y-1 col-span-2">
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <p className="text-sm text-gray-500 font-semibold">Previous User</p>
                    <p className="text-sm mt-1">{selectedAsset.previousUser}</p>
                  </div>
                </div>
              )}

              <div className="space-y-1 col-span-2">
                <p className="text-sm text-gray-500">Function</p>
                <p className="text-sm">{selectedAsset.function || "-"}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Asset History</DialogTitle>
            <DialogDescription>
              Previous users and handover details for {selectedAsset?.assetName}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {assetHistory.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No history available</p>
            ) : (
              <div className="space-y-4">
                {assetHistory.map((history) => (
                  <Card key={history.id}>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Previous User</p>
                          <p className="text-sm">{history.previousUser}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Handover Date</p>
                          <p className="text-sm">{new Date(history.handoverDate).toLocaleDateString()}</p>
                        </div>
                        {history.returnDate && (
                          <>
                            <div>
                              <p className="text-sm text-gray-500">Return Date</p>
                              <p className="text-sm">{new Date(history.returnDate).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Condition</p>
                              <p className="text-sm">{history.conditionReturned}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Returned with Charger</p>
                              <p className="text-sm">{history.returnedWithCharger}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}