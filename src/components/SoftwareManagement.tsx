import { useState, useEffect, useMemo } from "react";
import { User } from "../App";
import { Button } from "./ui/button";
import { cachedFetch, invalidateCache } from "../utils/cache";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Card, CardContent } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { toast } from "sonner@2.0.3";
import { Plus, Edit, Eye, Trash2, Code } from "lucide-react";

interface SoftwareManagementProps {
  user: User;
}

interface Software {
  id: string;
  softwareName: string;
  users: string;
  manufacturer: string;
  version: string;
  dateOfPurchase: string;
  renewalDate: string;
  expiryDate: string;
  subscriptionType: string;
  createdAt: string;
  updatedAt: string;
}

const SUBSCRIPTION_TYPES = ["Full Subscription", "Partial Subscription"];

export default function SoftwareManagement({ user }: SoftwareManagementProps) {
  const [software, setSoftware] = useState<Software[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedSoftware, setSelectedSoftware] = useState<Software | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const emptySoftware: Partial<Software> = {
    softwareName: "",
    users: "",
    manufacturer: "",
    version: "",
    dateOfPurchase: "",
    renewalDate: "",
    expiryDate: "",
    subscriptionType: "Full Subscription",
  };

  const [formData, setFormData] = useState<Partial<Software>>(emptySoftware);

  useEffect(() => {
    fetchSoftware();
  }, []);

  const validateForm = (): boolean => {
    const errors: string[] = [];
    const requiredFields = [
      { field: 'softwareName', label: 'Software Name' },
      { field: 'manufacturer', label: 'Manufacturer' },
      { field: 'version', label: 'Version' },
      { field: 'dateOfPurchase', label: 'Date of Purchase' },
      { field: 'subscriptionType', label: 'Subscription Type' },
    ];

    requiredFields.forEach(({ field, label }) => {
      const value = formData[field as keyof typeof formData];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors.push(label);
      }
    });

    if (errors.length > 0) {
      toast.error(`Please fill in all required fields: ${errors.join(', ')}`);
      return false;
    }

    return true;
  };

  const fetchSoftware = async () => {
    try {
      const data = await cachedFetch<{ software: any[] }>(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/software`,
        { headers: { Authorization: `Bearer ${publicAnonKey}` } },
        30_000
      );
      setSoftware(data.software || []);
    } catch (error) {
      console.error("Error fetching software:", error);
      toast.error("Failed to load software");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSoftware = async () => {
    if (!validateForm()) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/software`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) throw new Error("Failed to create software");

      toast.success("Software created successfully");
      invalidateCache(`https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/software`);
      setShowAddDialog(false);
      setFormData(emptySoftware);
      fetchSoftware();
    } catch (error) {
      console.error("Error creating software:", error);
      toast.error("Failed to create software");
    }
  };

  const handleUpdateSoftware = async () => {
    if (!selectedSoftware) return;
    if (!validateForm()) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/software/${selectedSoftware.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) throw new Error("Failed to update software");

      toast.success("Software updated successfully");
      invalidateCache(`https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/software`);
      setShowEditDialog(false);
      setSelectedSoftware(null);
      setFormData(emptySoftware);
      fetchSoftware();
    } catch (error) {
      console.error("Error updating software:", error);
      toast.error("Failed to update software");
    }
  };

  const handleDeleteSoftware = async (id: string) => {
    if (user.role !== "admin") {
      toast.error("Only admins can delete software");
      return;
    }

    if (!confirm("Are you sure you want to delete this software?")) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/software/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }
      );

      if (!response.ok) throw new Error("Failed to delete software");

      toast.success("Software deleted successfully");
      invalidateCache(`https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/software`);
      fetchSoftware();
    } catch (error) {
      console.error("Error deleting software:", error);
      toast.error("Failed to delete software");
    }
  };

  const openEditDialog = (sw: Software) => {
    setSelectedSoftware(sw);
    setFormData(sw);
    setShowEditDialog(true);
  };

  const openViewDialog = (sw: Software) => {
    setSelectedSoftware(sw);
    setShowViewDialog(true);
  };

  const filteredSoftware = software.filter((sw) =>
    Object.values(sw).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const isExpiringSoon = (expiryDate: string) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil(
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 60 && daysUntilExpiry > 0;
  };

  const isExpired = (expiryDate: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const getExpiryBadge = (expiryDate: string) => {
    if (isExpired(expiryDate)) {
      return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
    } else if (isExpiringSoon(expiryDate)) {
      return <Badge className="bg-yellow-100 text-yellow-800">Expiring Soon</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    }
  };

  const SoftwareForm = useMemo(() => (
    <div className="grid grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto p-4">
      <div className="space-y-2">
        <Label htmlFor="softwareName">Software Name *</Label>
        <Input
          id="softwareName"
          value={formData.softwareName || ""}
          onChange={(e) => setFormData({ ...formData, softwareName: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="manufacturer">Manufacturer *</Label>
        <Input
          id="manufacturer"
          value={formData.manufacturer || ""}
          onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="version">Version *</Label>
        <Input
          id="version"
          value={formData.version || ""}
          onChange={(e) => setFormData({ ...formData, version: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subscriptionType">Subscription Type *</Label>
        <Select
          value={formData.subscriptionType || ""}
          onValueChange={(value) => setFormData({ ...formData, subscriptionType: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUBSCRIPTION_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2 col-span-2">
        <Label htmlFor="users">Users (comma-separated)</Label>
        <Input
          id="users"
          value={formData.users || ""}
          onChange={(e) => setFormData({ ...formData, users: e.target.value })}
          placeholder="e.g., John Doe, Jane Smith"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dateOfPurchase">Date of Purchase *</Label>
        <Input
          id="dateOfPurchase"
          type="date"
          value={formData.dateOfPurchase || ""}
          onChange={(e) => setFormData({ ...formData, dateOfPurchase: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="renewalDate">Renewal Date</Label>
        <Input
          id="renewalDate"
          type="date"
          value={formData.renewalDate || ""}
          onChange={(e) => setFormData({ ...formData, renewalDate: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="expiryDate">Expiry Date</Label>
        <Input
          id="expiryDate"
          type="date"
          value={formData.expiryDate || ""}
          onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
        />
      </div>
    </div>
  ), [formData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading software...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl mb-1 sm:mb-2 break-words">Software Management</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage software licenses and subscriptions</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button
              className="bg-gradient-to-r from-red-900 to-rose-900 hover:from-red-800 hover:to-rose-800 whitespace-nowrap text-sm sm:text-base w-full sm:w-auto"
              onClick={() => setFormData(emptySoftware)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Software
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl mx-3 sm:mx-4 w-[calc(100%-1.5rem)] sm:w-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg md:text-xl">Add New Software</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">Fill in the software details below</DialogDescription>
            </DialogHeader>
            {SoftwareForm}
            <div className="flex justify-end space-x-2 p-4">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddSoftware}>Create Software</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <Input
            placeholder="Search software by name, manufacturer, users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Software Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Software Name</TableHead>
                  <TableHead>Manufacturer</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSoftware.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                      No software found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSoftware.map((sw) => (
                    <TableRow key={sw.id}>
                      <TableCell>{sw.softwareName}</TableCell>
                      <TableCell>{sw.manufacturer}</TableCell>
                      <TableCell>{sw.version || "-"}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {sw.users || "-"}
                      </TableCell>
                      <TableCell>{sw.subscriptionType}</TableCell>
                      <TableCell>
                        {sw.expiryDate
                          ? new Date(sw.expiryDate).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {sw.expiryDate && getExpiryBadge(sw.expiryDate)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openViewDialog(sw)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(sw)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {user.role === "admin" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteSoftware(sw.id)}
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
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Software</DialogTitle>
            <DialogDescription>Update software details</DialogDescription>
          </DialogHeader>
          {SoftwareForm}
          <div className="flex justify-end space-x-2 p-4">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSoftware}>Update Software</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Software Details</DialogTitle>
          </DialogHeader>
          {selectedSoftware && (
            <div className="grid grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto p-4">
              {Object.entries(selectedSoftware).map(([key, value]) => {
                if (key === "id" || key === "createdAt" || key === "updatedAt") return null;
                return (
                  <div key={key} className={key === "users" ? "col-span-2" : ""}>
                    <p className="text-sm text-gray-500 capitalize mb-1">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </p>
                    <p className="text-sm">
                      {key.includes("Date") && value
                        ? new Date(value).toLocaleDateString()
                        : value || "-"}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}