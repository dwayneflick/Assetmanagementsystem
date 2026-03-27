import { useState, useEffect } from "react";
import { Plus, Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { toast } from "sonner@2.0.3";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { User } from "../App";

interface ITMaintenanceLogProps {
  user: User;
}

interface MaintenanceLog {
  id: string;
  date: string;
  assetIdName: string;
  techName: string;
  actionType: string;
  descriptionOfWork: string;
  status: string;
  nextDue: string;
  createdAt: string;
  updatedAt?: string;
}

const ACTION_TYPES = ["Routine", "Preventive", "Corrective", "Emergency", "Inspection"];
const STATUSES = ["Pending", "In Progress", "Completed", "Cancelled", "On Hold"];

export default function ITMaintenanceLog({ user }: ITMaintenanceLogProps) {
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedLog, setSelectedLog] = useState<MaintenanceLog | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const emptyLog: Partial<MaintenanceLog> = {
    date: new Date().toISOString().split("T")[0],
    assetIdName: "",
    techName: user.name,
    actionType: "Routine",
    descriptionOfWork: "",
    status: "Pending",
    nextDue: "",
  };

  const [formData, setFormData] = useState<Partial<MaintenanceLog>>(emptyLog);

  useEffect(() => {
    fetchLogs();
  }, []);

  const validateForm = (): boolean => {
    const errors: string[] = [];
    const requiredFields = [
      { field: "date", label: "Date" },
      { field: "assetIdName", label: "Asset ID/Name" },
      { field: "techName", label: "Tech Name" },
      { field: "actionType", label: "Action Type" },
      { field: "descriptionOfWork", label: "Description of Work" },
      { field: "status", label: "Status" },
      { field: "nextDue", label: "Next Due" },
    ];

    requiredFields.forEach(({ field, label }) => {
      const value = formData[field as keyof typeof formData];
      if (!value || (typeof value === "string" && value.trim() === "")) {
        errors.push(label);
      }
    });

    if (errors.length > 0) {
      toast.error(`Please fill in all required fields: ${errors.join(", ")}`);
      return false;
    }

    return true;
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/maintenance-logs`,
        {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }
      );
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error("Error fetching maintenance logs:", error);
      toast.error("Failed to load maintenance logs");
    } finally {
      setLoading(false);
    }
  };

  const handleAddLog = async () => {
    if (!validateForm()) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/maintenance-logs`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) throw new Error("Failed to create maintenance log");

      toast.success("Maintenance log created successfully");
      setShowAddDialog(false);
      setFormData(emptyLog);
      fetchLogs();
    } catch (error) {
      console.error("Error creating maintenance log:", error);
      toast.error("Failed to create maintenance log");
    }
  };

  const handleEditLog = async () => {
    if (!validateForm()) return;
    if (!selectedLog) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/maintenance-logs/${selectedLog.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) throw new Error("Failed to update maintenance log");

      toast.success("Maintenance log updated successfully");
      setShowEditDialog(false);
      setFormData(emptyLog);
      setSelectedLog(null);
      fetchLogs();
    } catch (error) {
      console.error("Error updating maintenance log:", error);
      toast.error("Failed to update maintenance log");
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this maintenance log? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/maintenance-logs/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to delete maintenance log");

      toast.success("Maintenance log deleted successfully");
      fetchLogs();
    } catch (error) {
      console.error("Error deleting maintenance log:", error);
      toast.error("Failed to delete maintenance log");
    }
  };

  const openEditDialog = (log: MaintenanceLog) => {
    setSelectedLog(log);
    setFormData(log);
    setShowEditDialog(true);
  };

  const openViewDialog = (log: MaintenanceLog) => {
    setSelectedLog(log);
    setShowViewDialog(true);
  };

  const filteredLogs = logs.filter((log) =>
    Object.values(log).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-red-100 text-red-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Cancelled":
        return "bg-gray-100 text-gray-800";
      case "On Hold":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getActionTypeColor = (type: string) => {
    switch (type) {
      case "Routine":
        return "bg-blue-100 text-blue-800";
      case "Preventive":
        return "bg-green-100 text-green-800";
      case "Corrective":
        return "bg-orange-100 text-orange-800";
      case "Emergency":
        return "bg-red-100 text-red-800";
      case "Inspection":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading maintenance logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl mb-1 sm:mb-2 break-words">
            IT Maintenance Log
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Track and manage IT asset maintenance activities
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button
              className="bg-gradient-to-r from-red-900 to-rose-900 hover:from-red-800 hover:to-rose-800 whitespace-nowrap text-sm sm:text-base w-full sm:w-auto"
              onClick={() => setFormData({ ...emptyLog, techName: user.name })}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Maintenance Log
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl mx-3 sm:mx-4 w-[calc(100%-1.5rem)] sm:w-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg md:text-xl">
                New Maintenance Log
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Record maintenance activity details
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date || ""}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nextDue">Next Due *</Label>
                  <Input
                    id="nextDue"
                    type="date"
                    value={formData.nextDue || ""}
                    onChange={(e) => setFormData({ ...formData, nextDue: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assetIdName">Asset ID/Name *</Label>
                <Input
                  id="assetIdName"
                  value={formData.assetIdName || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, assetIdName: e.target.value })
                  }
                  placeholder="e.g., CCTV, Printers, FM 200"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="techName">Tech Name *</Label>
                <Input
                  id="techName"
                  value={formData.techName || ""}
                  onChange={(e) => setFormData({ ...formData, techName: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="actionType">Action Type *</Label>
                  <Select
                    value={formData.actionType || ""}
                    onValueChange={(value) =>
                      setFormData({ ...formData, actionType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTION_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      {STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descriptionOfWork">Description of Work *</Label>
                <Textarea
                  id="descriptionOfWork"
                  value={formData.descriptionOfWork || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, descriptionOfWork: e.target.value })
                  }
                  placeholder="Describe the maintenance work performed..."
                  rows={4}
                  required
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 p-4">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddLog}>Create Log</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl mx-3 sm:mx-4 w-[calc(100%-1.5rem)] sm:w-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg md:text-xl">
                Edit Maintenance Log
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Update maintenance activity details
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date || ""}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nextDue">Next Due *</Label>
                  <Input
                    id="nextDue"
                    type="date"
                    value={formData.nextDue || ""}
                    onChange={(e) => setFormData({ ...formData, nextDue: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assetIdName">Asset ID/Name *</Label>
                <Input
                  id="assetIdName"
                  value={formData.assetIdName || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, assetIdName: e.target.value })
                  }
                  placeholder="e.g., CCTV, Printers, FM 200"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="techName">Tech Name *</Label>
                <Input
                  id="techName"
                  value={formData.techName || ""}
                  onChange={(e) => setFormData({ ...formData, techName: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="actionType">Action Type *</Label>
                  <Select
                    value={formData.actionType || ""}
                    onValueChange={(value) =>
                      setFormData({ ...formData, actionType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTION_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      {STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descriptionOfWork">Description of Work *</Label>
                <Textarea
                  id="descriptionOfWork"
                  value={formData.descriptionOfWork || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, descriptionOfWork: e.target.value })
                  }
                  placeholder="Describe the maintenance work performed..."
                  rows={4}
                  required
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 p-4">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditLog}>Update Log</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <Input
            placeholder="Search logs by asset, tech name, action type, status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Maintenance Logs Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Asset ID/Name</TableHead>
                  <TableHead>Tech Name</TableHead>
                  <TableHead>Action Type</TableHead>
                  <TableHead>Description of Work</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Next Due</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                      No maintenance logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {new Date(log.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{log.assetIdName}</TableCell>
                      <TableCell>{log.techName}</TableCell>
                      <TableCell>
                        <Badge className={getActionTypeColor(log.actionType)}>
                          {log.actionType}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {log.descriptionOfWork}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(log.status)}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(log.nextDue).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openViewDialog(log)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(log)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {(user.role === "admin" ||
                            user.name === "Admin" ||
                            user.name === "Kingsley") && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteLog(log.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl mx-3 sm:mx-4 w-[calc(100%-1.5rem)] sm:w-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg md:text-xl">
              Maintenance Log Details
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              View complete maintenance log information
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="grid grid-cols-2 gap-4 p-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Date</p>
                <p className="text-sm">{new Date(selectedLog.date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Next Due</p>
                <p className="text-sm">
                  {new Date(selectedLog.nextDue).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Asset ID/Name</p>
                <p className="text-sm">{selectedLog.assetIdName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Tech Name</p>
                <p className="text-sm">{selectedLog.techName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Action Type</p>
                <Badge className={getActionTypeColor(selectedLog.actionType)}>
                  {selectedLog.actionType}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Status</p>
                <Badge className={getStatusColor(selectedLog.status)}>
                  {selectedLog.status}
                </Badge>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500 mb-1">Description of Work</p>
                <p className="text-sm">{selectedLog.descriptionOfWork}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Created At</p>
                <p className="text-sm">
                  {new Date(selectedLog.createdAt).toLocaleString()}
                </p>
              </div>
              {selectedLog.updatedAt && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Last Updated</p>
                  <p className="text-sm">
                    {new Date(selectedLog.updatedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
