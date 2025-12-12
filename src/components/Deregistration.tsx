import { useState, useEffect } from "react";
import { User } from "../App";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Card, CardContent } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { toast } from "sonner@2.0.3";
import { Plus, Eye, UserMinus } from "lucide-react";

interface DeregistrationProps {
  user: User;
}

interface Deregistration {
  id: string;
  assetType: string;
  assetName: string;
  userName: string;
  deregisteredBy: string;
  status: string;
  reason?: string;
  createdAt: string;
}

const ASSET_TYPES = ["Software", "Hardware", "Network"];
const DEREG_STATUSES = ["Pending", "In Progress", "Completed", "Cancelled"];

export default function Deregistration({ user }: DeregistrationProps) {
  const [deregistrations, setDeregistrations] = useState<Deregistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedDereg, setSelectedDereg] = useState<Deregistration | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const emptyDereg: Partial<Deregistration> = {
    assetType: "Hardware",
    assetName: "",
    userName: "",
    deregisteredBy: user.name,
    status: "Pending",
    reason: "",
  };

  const [formData, setFormData] = useState<Partial<Deregistration>>(emptyDereg);

  useEffect(() => {
    fetchDeregistrations();
  }, []);

  const validateForm = (): boolean => {
    const errors: string[] = [];
    const requiredFields = [
      { field: 'assetType', label: 'Asset Type' },
      { field: 'assetName', label: 'Asset Name' },
      { field: 'userName', label: 'User Name' },
      { field: 'deregisteredBy', label: 'Deregistered By' },
      { field: 'status', label: 'Status' },
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

  const fetchDeregistrations = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/deregistrations`,
        {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }
      );
      const data = await response.json();
      setDeregistrations(data.deregistrations || []);
    } catch (error) {
      console.error("Error fetching deregistrations:", error);
      toast.error("Failed to load deregistrations");
    } finally {
      setLoading(false);
    }
  };

  const handleAddDeregistration = async () => {
    if (!validateForm()) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/deregistrations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) throw new Error("Failed to create deregistration");

      toast.success("IT deregistration created successfully");
      setShowAddDialog(false);
      setFormData(emptyDereg);
      fetchDeregistrations();
    } catch (error) {
      console.error("Error creating deregistration:", error);
      toast.error("Failed to create deregistration");
    }
  };

  const openViewDialog = (dereg: Deregistration) => {
    setSelectedDereg(dereg);
    setShowViewDialog(true);
  };

  const filteredDeregistrations = deregistrations.filter((dereg) =>
    Object.values(dereg).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getAssetTypeColor = (type: string) => {
    switch (type) {
      case "Hardware":
        return "bg-purple-100 text-purple-800";
      case "Software":
        return "bg-indigo-100 text-indigo-800";
      case "Network":
        return "bg-teal-100 text-teal-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading deregistrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl mb-1 sm:mb-2 break-words">IT Deregistration</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage IT asset deregistrations</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button
              className="bg-gradient-to-r from-red-900 to-rose-900 hover:from-red-800 hover:to-rose-800 whitespace-nowrap text-sm sm:text-base w-full sm:w-auto"
              onClick={() => setFormData({ ...emptyDereg, deregisteredBy: user.name })}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Deregistration
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl mx-3 sm:mx-4 w-[calc(100%-1.5rem)] sm:w-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg md:text-xl">New IT Deregistration</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Record asset deregistration details
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 p-4">
              <div className="space-y-2">
                <Label htmlFor="assetType">Type of Asset *</Label>
                <Select
                  value={formData.assetType || ""}
                  onValueChange={(value) => setFormData({ ...formData, assetType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assetName">Name of Asset *</Label>
                <Input
                  id="assetName"
                  value={formData.assetName || ""}
                  onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="userName">User Name *</Label>
                <Input
                  id="userName"
                  value={formData.userName || ""}
                  onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deregisteredBy">Deregistered By *</Label>
                <Input
                  id="deregisteredBy"
                  value={formData.deregisteredBy || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, deregisteredBy: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status || ""}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEREG_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Deregistration</Label>
                <Input
                  id="reason"
                  value={formData.reason || ""}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="e.g., Employee exit, asset disposal"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 p-4">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddDeregistration}>Create Deregistration</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <Input
            placeholder="Search deregistrations by ID, asset name, user, type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Deregistrations Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Asset Type</TableHead>
                  <TableHead>Asset Name</TableHead>
                  <TableHead>User Name</TableHead>
                  <TableHead>Deregistered By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeregistrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                      No deregistrations found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDeregistrations.map((dereg) => (
                    <TableRow key={dereg.id}>
                      <TableCell className="font-mono text-sm">{dereg.id}</TableCell>
                      <TableCell>
                        <Badge className={getAssetTypeColor(dereg.assetType)}>
                          {dereg.assetType}
                        </Badge>
                      </TableCell>
                      <TableCell>{dereg.assetName}</TableCell>
                      <TableCell>{dereg.userName}</TableCell>
                      <TableCell>{dereg.deregisteredBy}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(dereg.status)}>
                          {dereg.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(dereg.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openViewDialog(dereg)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl mx-3 sm:mx-4 w-[calc(100%-1.5rem)] sm:w-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg md:text-xl">Deregistration Details</DialogTitle>
          </DialogHeader>
          {selectedDereg && (
            <div className="grid grid-cols-2 gap-4 p-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">ID</p>
                <p className="text-sm font-mono">{selectedDereg.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Asset Type</p>
                <Badge className={getAssetTypeColor(selectedDereg.assetType)}>
                  {selectedDereg.assetType}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Asset Name</p>
                <p className="text-sm">{selectedDereg.assetName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">User Name</p>
                <p className="text-sm">{selectedDereg.userName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Deregistered By</p>
                <p className="text-sm">{selectedDereg.deregisteredBy}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Status</p>
                <Badge className={getStatusColor(selectedDereg.status)}>
                  {selectedDereg.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Date Created</p>
                <p className="text-sm">
                  {new Date(selectedDereg.createdAt).toLocaleString()}
                </p>
              </div>
              {selectedDereg.reason && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-500 mb-1">Reason</p>
                  <p className="text-sm">{selectedDereg.reason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}