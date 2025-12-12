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
import { Plus, Eye, UserCheck } from "lucide-react";

interface AssetHandoverProps {
  user: User;
}

interface Asset {
  id: string;
  assetName: string;
  serialNumber: string;
  productType: string;
}

interface Handover {
  id: string;
  userName: string;
  status: string;
  product: string;
  serialNumber: string;
  department: string;
  deviceName: string;
  deviceHistory: string;
  dateAssigned: string;
  staffStatus: string;
  previousUser?: string;
  handoverDate?: string;
  returnDate?: string;
  conditionReturned?: string;
  returnedWithCharger?: string;
  createdAt: string;
}

const DEPARTMENTS = ["TP", "CP", "EMM", "RDS", "PCFW", "BAS", "FAS & PMG"];
const DEVICE_HISTORY = ["Previously used", "New"];
const STAFF_STATUS = ["Active", "On Leave", "Exited"];
const CONDITION_OPTIONS = ["Good condition", "Poor condition", "Bad condition"];

export default function AssetHandover({ user }: AssetHandoverProps) {
  const [handovers, setHandovers] = useState<Handover[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [selectedHandover, setSelectedHandover] = useState<Handover | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const emptyHandover: Partial<Handover> = {
    userName: "",
    status: "Active",
    product: "",
    serialNumber: "",
    department: "",
    deviceName: "",
    deviceHistory: "Previously used",
    dateAssigned: new Date().toISOString().split("T")[0],
    staffStatus: "Active",
  };

  const [formData, setFormData] = useState<Partial<Handover>>(emptyHandover);
  const [returnData, setReturnData] = useState({
    returnDate: new Date().toISOString().split("T")[0],
    conditionReturned: "Good condition",
    returnedWithCharger: "Yes",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const validateForm = (): boolean => {
    const errors: string[] = [];
    const requiredFields = [
      { field: 'userName', label: 'User Name' },
      { field: 'product', label: 'Product' },
      { field: 'serialNumber', label: 'Serial Number' },
      { field: 'department', label: 'Department' },
      { field: 'deviceName', label: 'Device Name' },
      { field: 'dateAssigned', label: 'Date Assigned' },
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

  const fetchData = async () => {
    try {
      const [handoversResponse, assetsResponse] = await Promise.all([
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/handovers`, {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/assets`, {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }),
      ]);

      const handoversData = await handoversResponse.json();
      const assetsData = await assetsResponse.json();

      setHandovers(handoversData.handovers || []);
      setAssets(assetsData.assets || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load handover data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddHandover = async () => {
    if (!validateForm()) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/handovers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) throw new Error("Failed to create handover");

      // Also create asset history entry
      const historyData = {
        assetId: formData.serialNumber, // Using serial number as reference
        previousUser: formData.previousUser || "New Assignment",
        handoverDate: formData.dateAssigned,
      };

      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/asset-history`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(historyData),
        }
      );

      toast.success("Asset handover created successfully");
      setShowAddDialog(false);
      setFormData(emptyHandover);
      fetchData();
    } catch (error) {
      console.error("Error creating handover:", error);
      toast.error("Failed to create handover");
    }
  };

  const handleReturnAsset = async () => {
    if (!selectedHandover) return;

    try {
      // Update handover with return information
      const updatedHandover = {
        ...selectedHandover,
        ...returnData,
        status: "Returned",
      };

      // Update handover in backend using PUT endpoint
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/handovers/${selectedHandover.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(updatedHandover),
        }
      );

      if (!response.ok) throw new Error("Failed to update handover");

      // Create asset history entry for return
      const historyData = {
        assetId: selectedHandover.serialNumber,
        previousUser: selectedHandover.userName,
        handoverDate: selectedHandover.dateAssigned,
        returnDate: returnData.returnDate,
        conditionReturned: returnData.conditionReturned,
        returnedWithCharger: returnData.returnedWithCharger,
      };

      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/asset-history`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(historyData),
        }
      );

      toast.success("Asset return recorded successfully");
      setShowReturnDialog(false);
      fetchData();
    } catch (error) {
      console.error("Error recording return:", error);
      toast.error("Failed to record asset return");
    }
  };

  const openViewDialog = (handover: Handover) => {
    setSelectedHandover(handover);
    setShowViewDialog(true);
  };

  const openReturnDialog = (handover: Handover) => {
    setSelectedHandover(handover);
    setShowReturnDialog(true);
  };

  const filteredHandovers = handovers.filter((handover) =>
    Object.values(handover).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Returned":
        return "bg-gray-100 text-gray-800";
      case "On Leave":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading handovers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl mb-1 sm:mb-2 break-words">Asset Handover</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage asset assignments and returns</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button
              className="bg-gradient-to-r from-red-900 to-rose-900 hover:from-red-800 hover:to-rose-800 whitespace-nowrap text-sm sm:text-base w-full sm:w-auto"
              onClick={() => setFormData(emptyHandover)}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Handover
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl mx-3 sm:mx-4 w-[calc(100%-1.5rem)] sm:w-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Asset Handover</DialogTitle>
              <DialogDescription>Record asset assignment to user</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto p-4">
              <div className="space-y-2">
                <Label htmlFor="userName">Name of User *</Label>
                <Input
                  id="userName"
                  value={formData.userName || ""}
                  onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
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
                <Label htmlFor="product">Product *</Label>
                <Input
                  id="product"
                  value={formData.product || ""}
                  onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deviceName">Device Name *</Label>
                <Input
                  id="deviceName"
                  value={formData.deviceName || ""}
                  onChange={(e) => setFormData({ ...formData, deviceName: e.target.value })}
                  required
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
                <Label htmlFor="deviceHistory">Device History *</Label>
                <Select
                  value={formData.deviceHistory || ""}
                  onValueChange={(value) => setFormData({ ...formData, deviceHistory: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEVICE_HISTORY.map((history) => (
                      <SelectItem key={history} value={history}>
                        {history}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateAssigned">Date Assigned *</Label>
                <Input
                  id="dateAssigned"
                  type="date"
                  value={formData.dateAssigned || ""}
                  onChange={(e) => setFormData({ ...formData, dateAssigned: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="staffStatus">Staff Status *</Label>
                <Select
                  value={formData.staffStatus || ""}
                  onValueChange={(value) => setFormData({ ...formData, staffStatus: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAFF_STATUS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.deviceHistory === "Previously used" && (
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="previousUser">Previous User</Label>
                  <Input
                    id="previousUser"
                    value={formData.previousUser || ""}
                    onChange={(e) => setFormData({ ...formData, previousUser: e.target.value })}
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-2 p-4">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddHandover}>Create Handover</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <Input
            placeholder="Search handovers by user, device, serial number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Handovers Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User Name</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Device History</TableHead>
                  <TableHead>Date Assigned</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHandovers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                      No handovers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHandovers.map((handover) => (
                    <TableRow key={handover.id}>
                      <TableCell>{handover.userName}</TableCell>
                      <TableCell>{handover.product}</TableCell>
                      <TableCell className="font-mono text-sm">{handover.serialNumber}</TableCell>
                      <TableCell>{handover.department}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{handover.deviceHistory}</Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(handover.dateAssigned).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(handover.status)}>
                          {handover.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openViewDialog(handover)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {handover.status === "Active" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openReturnDialog(handover)}
                            >
                              Return
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

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl mx-3 sm:mx-4 w-[calc(100%-1.5rem)] sm:w-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Handover Details</DialogTitle>
          </DialogHeader>
          {selectedHandover && (
            <div className="grid grid-cols-2 gap-4 p-4">
              {Object.entries(selectedHandover).map(([key, value]) => {
                if (key === "id" || key === "createdAt") return null;
                return (
                  <div key={key}>
                    <p className="text-sm text-gray-500 capitalize mb-1">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </p>
                    <p className="text-sm">
                      {key.includes("Date") || key.includes("date")
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

      {/* Return Dialog */}
      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent className="max-w-2xl mx-3 sm:mx-4 w-[calc(100%-1.5rem)] sm:w-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg md:text-xl">Record Asset Return</DialogTitle>
            <DialogDescription>
              Document the return of {selectedHandover?.deviceName} from {selectedHandover?.userName}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 p-4">
            <div className="space-y-2">
              <Label htmlFor="returnDate">Return Date *</Label>
              <Input
                id="returnDate"
                type="date"
                value={returnData.returnDate}
                onChange={(e) => setReturnData({ ...returnData, returnDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="conditionReturned">Condition Returned *</Label>
              <Select
                value={returnData.conditionReturned}
                onValueChange={(value) =>
                  setReturnData({ ...returnData, conditionReturned: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITION_OPTIONS.map((condition) => (
                    <SelectItem key={condition} value={condition}>
                      {condition}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="returnedWithCharger">Returned with Charger? *</Label>
              <Select
                value={returnData.returnedWithCharger}
                onValueChange={(value) =>
                  setReturnData({ ...returnData, returnedWithCharger: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end space-x-2 p-4">
            <Button variant="outline" onClick={() => setShowReturnDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleReturnAsset}>Record Return</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}