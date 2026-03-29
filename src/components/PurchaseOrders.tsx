import { cachedFetch, invalidateCache } from "../utils/cache";
import { useState, useEffect, useMemo } from "react";
import { User } from "../App";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { toast } from "sonner@2.0.3";
import { Plus, Edit, Eye, ShoppingCart, ChevronRight } from "lucide-react";

interface PurchaseOrdersProps {
  user: User;
}

interface PurchaseOrder {
  poNumber: string;
  poName: string;
  ownerName: string;
  vendorName: string;
  dateOrdered: string;
  requiredBy: string;
  totalCost: number;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const PO_STATUSES = [
  "Draft",
  "Submitted for Approval",
  "Approved",
  "Rejected",
  "Ordered",
  "Partial Received",
  "Received",
  "Invoice Received",
  "Payment Done",
  "Closed",
];

export default function PurchaseOrders({ user }: PurchaseOrdersProps) {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const emptyPO: Partial<PurchaseOrder> = {
    poName: "",
    ownerName: user.name,
    vendorName: "",
    dateOrdered: new Date().toISOString().split("T")[0],
    requiredBy: "",
    totalCost: 0,
    notes: "",
  };

  const [formData, setFormData] = useState<Partial<PurchaseOrder>>(emptyPO);

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const validateForm = (): boolean => {
    const errors: string[] = [];
    const requiredFields = [
      { field: 'poName', label: 'PO Name' },
      { field: 'ownerName', label: 'Owner Name' },
      { field: 'vendorName', label: 'Vendor Name' },
      { field: 'dateOrdered', label: 'Date Ordered' },
      { field: 'requiredBy', label: 'Required By Date' },
      { field: 'totalCost', label: 'Total Cost' },
    ];

    requiredFields.forEach(({ field, label }) => {
      const value = formData[field as keyof typeof formData];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors.push(label);
      }
      if (field === 'totalCost' && typeof value === 'number' && value <= 0) {
        errors.push(`${label} must be greater than 0`);
      }
    });

    if (errors.length > 0) {
      toast.error(`Please fill in all required fields: ${errors.join(', ')}`);
      return false;
    }

    return true;
  };

  const fetchPurchaseOrders = async () => {
    try {
      const data = await cachedFetch<{ purchaseOrders: any[] }>(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/purchase-orders`,
        { headers: { Authorization: `Bearer ${publicAnonKey}` } },
        30_000
      );
      setPurchaseOrders(data.purchaseOrders || []);
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
      toast.error("Failed to load purchase orders");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPO = async () => {
    if (!validateForm()) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/purchase-orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) throw new Error("Failed to create purchase order");

      toast.success("Purchase order created successfully");
      invalidateCache(`https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/purchase-orders`);
      setShowAddDialog(false);
      setFormData(emptyPO);
      fetchPurchaseOrders();
    } catch (error) {
      console.error("Error creating purchase order:", error);
      toast.error("Failed to create purchase order");
    }
  };

  const handleUpdatePO = async () => {
    if (!selectedPO) return;
    if (!validateForm()) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/purchase-orders/${selectedPO.poNumber}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) throw new Error("Failed to update purchase order");

      // Show notification about email if status changed to "Submitted for Approval"
      if (formData.status === "Submitted for Approval" && selectedPO.status !== "Submitted for Approval") {
        toast.success("Purchase order submitted for approval. Email notification sent to ITsupport@ng.andersen.com");
      } else {
        toast.success("Purchase order updated successfully");
      }

      setShowEditDialog(false);
      setSelectedPO(null);
      setFormData(emptyPO);
      fetchPurchaseOrders();
    } catch (error) {
      console.error("Error updating purchase order:", error);
      toast.error("Failed to update purchase order");
    }
  };

  const handleStatusChange = async (po: PurchaseOrder, newStatus: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/purchase-orders/${po.poNumber}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ ...po, status: newStatus }),
        }
      );

      if (!response.ok) throw new Error("Failed to update status");

      if (newStatus === "Submitted for Approval") {
        toast.success("Purchase order submitted for approval. Email notification sent to ITsupport@ng.andersen.com");
      } else {
        toast.success(`Status updated to ${newStatus}`);
      }

      fetchPurchaseOrders();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const openEditDialog = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setFormData(po);
    setShowEditDialog(true);
  };

  const openViewDialog = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setShowViewDialog(true);
  };

  const filteredPOs = purchaseOrders.filter((po) =>
    Object.values(po).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Draft":
        return "bg-gray-100 text-gray-800";
      case "Submitted for Approval":
        return "bg-blue-100 text-blue-800";
      case "Approved":
        return "bg-green-100 text-green-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      case "Ordered":
        return "bg-purple-100 text-purple-800";
      case "Partial Received":
        return "bg-yellow-100 text-yellow-800";
      case "Received":
        return "bg-teal-100 text-teal-800";
      case "Invoice Received":
        return "bg-indigo-100 text-indigo-800";
      case "Payment Done":
        return "bg-emerald-100 text-emerald-800";
      case "Closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getNextStatuses = (currentStatus: string): string[] => {
    const statusMap: { [key: string]: string[] } = {
      Draft: ["Submitted for Approval"],
      "Submitted for Approval": ["Approved", "Rejected"],
      Approved: ["Ordered"],
      Rejected: ["Draft"],
      Ordered: ["Partial Received", "Received"],
      "Partial Received": ["Received"],
      Received: ["Invoice Received"],
      "Invoice Received": ["Payment Done"],
      "Payment Done": ["Closed"],
      Closed: [],
    };
    return statusMap[currentStatus] || [];
  };

  const POForm = useMemo(() => (
    <div className="grid grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto p-4">
      <div className="space-y-2">
        <Label htmlFor="poName">PO Name *</Label>
        <Input
          id="poName"
          value={formData.poName || ""}
          onChange={(e) => setFormData({ ...formData, poName: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ownerName">Owner Name *</Label>
        <Input
          id="ownerName"
          value={formData.ownerName || ""}
          onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="vendorName">Vendor Name *</Label>
        <Input
          id="vendorName"
          value={formData.vendorName || ""}
          onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="totalCost">Total Cost (₦) *</Label>
        <Input
          id="totalCost"
          type="number"
          value={formData.totalCost || ""}
          onChange={(e) => setFormData({ ...formData, totalCost: parseFloat(e.target.value) || 0 })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dateOrdered">Date Ordered *</Label>
        <Input
          id="dateOrdered"
          type="date"
          value={formData.dateOrdered || ""}
          onChange={(e) => setFormData({ ...formData, dateOrdered: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="requiredBy">Required By *</Label>
        <Input
          id="requiredBy"
          type="date"
          value={formData.requiredBy || ""}
          onChange={(e) => setFormData({ ...formData, requiredBy: e.target.value })}
          required
        />
      </div>

      {selectedPO && (
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status || ""}
            onValueChange={(value) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PO_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2 col-span-2">
        <Label htmlFor="notes">Notes</Label>
        <Input
          id="notes"
          value={formData.notes || ""}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>
    </div>
  ), [formData, selectedPO]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading purchase orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl mb-1 sm:mb-2 break-words">Purchase Orders</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage purchase orders and procurement workflow</p>
        </div>
        <Dialog 
          open={showAddDialog} 
          onOpenChange={(open) => {
            setShowAddDialog(open);
            if (open) {
              // Reset form when dialog opens
              setFormData({
                poName: "",
                ownerName: user.name,
                vendorName: "",
                dateOrdered: new Date().toISOString().split("T")[0],
                requiredBy: "",
                totalCost: 0,
                notes: "",
              });
            }
          }}
        >
          <DialogTrigger asChild>
            <Button
              className="bg-gradient-to-r from-red-900 to-rose-900 hover:from-red-800 hover:to-rose-800 whitespace-nowrap text-sm sm:text-base w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Purchase Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl mx-3 sm:mx-4 w-[calc(100%-1.5rem)] sm:w-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg md:text-xl">New Purchase Order</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">Fill in the purchase order details below</DialogDescription>
            </DialogHeader>
            {POForm}
            <div className="flex justify-end space-x-2 p-4">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddPO}>Create Purchase Order</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> When a PO is submitted for approval, an email notification will be sent to ITsupport@ng.andersen.com
          </p>
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <Input
            placeholder="Search purchase orders by PO number, name, vendor, owner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Purchase Orders Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>PO Name</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Date Ordered</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPOs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                      No purchase orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPOs.map((po) => (
                    <TableRow key={po.poNumber}>
                      <TableCell className="font-mono text-sm">{po.poNumber}</TableCell>
                      <TableCell>{po.poName}</TableCell>
                      <TableCell>{po.ownerName}</TableCell>
                      <TableCell>{po.vendorName}</TableCell>
                      <TableCell>₦{po.totalCost?.toLocaleString() || 0}</TableCell>
                      <TableCell>
                        {new Date(po.dateOrdered).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(po.status)}>{po.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openViewDialog(po)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(po)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {getNextStatuses(po.status).map((nextStatus) => (
                            <Button
                              key={nextStatus}
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(po, nextStatus)}
                              className="text-xs"
                            >
                              {nextStatus}
                            </Button>
                          ))}
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
            <DialogTitle>Edit Purchase Order</DialogTitle>
            <DialogDescription>Update purchase order details</DialogDescription>
          </DialogHeader>
          {POForm}
          <div className="flex justify-end space-x-2 p-4">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePO}>Update Purchase Order</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Purchase Order Details</DialogTitle>
          </DialogHeader>
          {selectedPO && (
            <div className="space-y-6 p-4">
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(selectedPO).map(([key, value]) => {
                  if (key === "createdAt" || key === "updatedAt") return null;
                  return (
                    <div key={key}>
                      <p className="text-sm text-gray-500 capitalize mb-1">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </p>
                      <p className="text-sm">
                        {key === "totalCost"
                          ? `₦${value?.toLocaleString() || 0}`
                          : key.includes("Date") || key.includes("date")
                          ? new Date(value).toLocaleDateString()
                          : value || "-"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}