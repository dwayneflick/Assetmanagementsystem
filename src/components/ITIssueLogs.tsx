import { useState, useEffect } from "react";
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
import { Textarea } from "./ui/textarea";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { toast } from "sonner@2.0.3";
import { Plus, Edit, Trash2, Eye } from "lucide-react";

interface ITIssueLogsProps {
  user: User;
}

interface ITIssueLog {
  id: string;
  issueId: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  status: string;
  reportedBy: string;
  assignedTo: string;
  affectedSystem: string;
  location: string;
  reportedDate: string;
  resolvedDate?: string;
  resolution?: string;
  rootCause?: string;
  preventiveAction?: string;
  downtime?: string;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  "Network Issue",
  "Hardware Failure",
  "Software Bug",
  "Security Incident",
  "Performance Issue",
  "Database Issue",
  "Email Issue",
  "Access Issue",
  "Other"
];

const SEVERITY_LEVELS = ["Critical", "High", "Medium", "Low"];
const STATUS_OPTIONS = ["Open", "In Progress", "Resolved", "Closed", "On Hold"];
const LOCATIONS = ["Andersen Place Lagos", "Remote", "Branch Office", "Data Center"];

export default function ITIssueLogs({ user }: ITIssueLogsProps) {
  const [issues, setIssues] = useState<ITIssueLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<ITIssueLog | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const emptyIssue: Partial<ITIssueLog> = {
    title: "",
    description: "",
    category: "Other",
    severity: "Medium",
    status: "Open",
    reportedBy: user.name,
    assignedTo: "",
    affectedSystem: "",
    location: "Andersen Place Lagos",
    reportedDate: new Date().toISOString().split("T")[0],
    resolution: "",
    rootCause: "",
    preventiveAction: "",
    downtime: "",
  };

  const [formData, setFormData] = useState<Partial<ITIssueLog>>(emptyIssue);

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      const data = await cachedFetch<{ issues: any[] }>(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/it-issue-logs`,
        { headers: { Authorization: `Bearer ${publicAnonKey}` } },
        30_000
      );
      setIssues(data.issues || []);
    } catch (error) {
      console.error("Error fetching IT issue logs:", error);
      toast.error("Failed to load IT issue logs");
    } finally {
      setLoading(false);
    }
  };

  const handleAddIssue = async () => {
    if (!formData.title || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/it-issue-logs`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) throw new Error("Failed to create issue log");

      toast.success("IT issue log created successfully");
      invalidateCache(`https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/it-issue-logs`);
      setShowAddDialog(false);
      setFormData(emptyIssue);
      fetchIssues();
    } catch (error) {
      console.error("Error creating issue log:", error);
      toast.error("Failed to create issue log");
    }
  };

  const handleUpdateIssue = async () => {
    if (!selectedIssue) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/it-issue-logs/${selectedIssue.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) throw new Error("Failed to update issue log");

      toast.success("IT issue log updated successfully");
      invalidateCache(`https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/it-issue-logs`);
      setShowEditDialog(false);
      setSelectedIssue(null);
      setFormData(emptyIssue);
      fetchIssues();
    } catch (error) {
      console.error("Error updating issue log:", error);
      toast.error("Failed to update issue log");
    }
  };

  const handleDeleteIssue = async (id: string) => {
    if (user.role !== "admin") {
      toast.error("Only admins can delete issue logs");
      return;
    }

    if (!confirm("Are you sure you want to delete this issue log?")) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/it-issue-logs/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }
      );

      if (!response.ok) throw new Error("Failed to delete issue log");

      toast.success("IT issue log deleted successfully");
      invalidateCache(`https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/it-issue-logs`);
      fetchIssues();
    } catch (error) {
      console.error("Error deleting issue log:", error);
      toast.error("Failed to delete issue log");
    }
  };

  const openEditDialog = (issue: ITIssueLog) => {
    setSelectedIssue(issue);
    setFormData(issue);
    setShowEditDialog(true);
  };

  const openViewDialog = (issue: ITIssueLog) => {
    setSelectedIssue(issue);
    setShowViewDialog(true);
  };

  const filteredIssues = issues.filter((issue) =>
    Object.values(issue).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical":
        return "bg-red-100 text-red-800";
      case "High":
        return "bg-orange-100 text-orange-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "Low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Resolved":
      case "Closed":
        return "bg-green-100 text-green-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "On Hold":
        return "bg-gray-100 text-gray-800";
      case "Open":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading IT issue logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl mb-2">IT Issue Logs</h1>
          <p className="text-sm sm:text-base text-gray-600">Track and manage IT issues and incidents</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-red-900 to-rose-900 hover:from-red-800 hover:to-rose-800 w-full sm:w-auto" onClick={() => setFormData(emptyIssue)}>
              <Plus className="w-4 h-4 mr-2" />
              Log New Issue
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Log New IT Issue</DialogTitle>
              <DialogDescription>Fill in the issue details below</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto p-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="title">Issue Title *</Label>
                <Input
                  id="title"
                  value={formData.title || ""}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category || ""}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="severity">Severity</Label>
                <Select
                  value={formData.severity || ""}
                  onValueChange={(value) => setFormData({ ...formData, severity: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEVERITY_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedTo">Assigned To</Label>
                <Input
                  id="assignedTo"
                  value={formData.assignedTo || ""}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="affectedSystem">Affected System</Label>
                <Input
                  id="affectedSystem"
                  value={formData.affectedSystem || ""}
                  onChange={(e) => setFormData({ ...formData, affectedSystem: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Select
                  value={formData.location || ""}
                  onValueChange={(value) => setFormData({ ...formData, location: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATIONS.map((loc) => (
                      <SelectItem key={loc} value={loc}>
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reportedDate">Reported Date</Label>
                <Input
                  id="reportedDate"
                  type="date"
                  value={formData.reportedDate || ""}
                  onChange={(e) => setFormData({ ...formData, reportedDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="downtime">Estimated Downtime</Label>
                <Input
                  id="downtime"
                  placeholder="e.g., 2 hours"
                  value={formData.downtime || ""}
                  onChange={(e) => setFormData({ ...formData, downtime: e.target.value })}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="rootCause">Root Cause</Label>
                <Textarea
                  id="rootCause"
                  value={formData.rootCause || ""}
                  onChange={(e) => setFormData({ ...formData, rootCause: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="resolution">Resolution</Label>
                <Textarea
                  id="resolution"
                  value={formData.resolution || ""}
                  onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="preventiveAction">Preventive Action</Label>
                <Textarea
                  id="preventiveAction"
                  value={formData.preventiveAction || ""}
                  onChange={(e) => setFormData({ ...formData, preventiveAction: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:space-x-2 p-4">
              <Button variant="outline" onClick={() => setShowAddDialog(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button onClick={handleAddIssue} className="bg-gradient-to-r from-red-900 to-rose-900 hover:from-red-800 hover:to-rose-800 w-full sm:w-auto">
                Create Issue Log
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <Input
            placeholder="Search issues by title, category, status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </CardContent>
      </Card>

      {/* Issues Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Issue ID</TableHead>
                  <TableHead className="whitespace-nowrap">Title</TableHead>
                  <TableHead className="whitespace-nowrap">Category</TableHead>
                  <TableHead className="whitespace-nowrap">Severity</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Reported By</TableHead>
                  <TableHead className="whitespace-nowrap">Assigned To</TableHead>
                  <TableHead className="whitespace-nowrap">Reported Date</TableHead>
                  <TableHead className="whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIssues.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-gray-500 py-8">
                      No issue logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredIssues.map((issue) => (
                    <TableRow key={issue.id}>
                      <TableCell className="whitespace-nowrap">{issue.issueId}</TableCell>
                      <TableCell className="whitespace-nowrap">{issue.title}</TableCell>
                      <TableCell className="whitespace-nowrap">{issue.category}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge className={getSeverityColor(issue.severity)}>
                          {issue.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge className={getStatusColor(issue.status)}>
                          {issue.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{issue.reportedBy}</TableCell>
                      <TableCell className="whitespace-nowrap">{issue.assignedTo || "-"}</TableCell>
                      <TableCell className="whitespace-nowrap">{issue.reportedDate}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openViewDialog(issue)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(issue)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {user.role === "admin" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteIssue(issue.id)}
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
            <DialogTitle>Edit IT Issue</DialogTitle>
            <DialogDescription>Update issue details</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto p-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit-title">Issue Title *</Label>
              <Input
                id="edit-title"
                value={formData.title || ""}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit-description">Description *</Label>
              <Textarea
                id="edit-description"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select
                value={formData.category || ""}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-severity">Severity</Label>
              <Select
                value={formData.severity || ""}
                onValueChange={(value) => setFormData({ ...formData, severity: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITY_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.status || ""}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-assignedTo">Assigned To</Label>
              <Input
                id="edit-assignedTo"
                value={formData.assignedTo || ""}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-affectedSystem">Affected System</Label>
              <Input
                id="edit-affectedSystem"
                value={formData.affectedSystem || ""}
                onChange={(e) => setFormData({ ...formData, affectedSystem: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-location">Location</Label>
              <Select
                value={formData.location || ""}
                onValueChange={(value) => setFormData({ ...formData, location: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-reportedDate">Reported Date</Label>
              <Input
                id="edit-reportedDate"
                type="date"
                value={formData.reportedDate || ""}
                onChange={(e) => setFormData({ ...formData, reportedDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-resolvedDate">Resolved Date</Label>
              <Input
                id="edit-resolvedDate"
                type="date"
                value={formData.resolvedDate || ""}
                onChange={(e) => setFormData({ ...formData, resolvedDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-downtime">Estimated Downtime</Label>
              <Input
                id="edit-downtime"
                placeholder="e.g., 2 hours"
                value={formData.downtime || ""}
                onChange={(e) => setFormData({ ...formData, downtime: e.target.value })}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit-rootCause">Root Cause</Label>
              <Textarea
                id="edit-rootCause"
                value={formData.rootCause || ""}
                onChange={(e) => setFormData({ ...formData, rootCause: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit-resolution">Resolution</Label>
              <Textarea
                id="edit-resolution"
                value={formData.resolution || ""}
                onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit-preventiveAction">Preventive Action</Label>
              <Textarea
                id="edit-preventiveAction"
                value={formData.preventiveAction || ""}
                onChange={(e) => setFormData({ ...formData, preventiveAction: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:space-x-2 p-4">
            <Button variant="outline" onClick={() => setShowEditDialog(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleUpdateIssue} className="bg-gradient-to-r from-red-900 to-rose-900 hover:from-red-800 hover:to-rose-800 w-full sm:w-auto">
              Update Issue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Issue Details</DialogTitle>
          </DialogHeader>
          {selectedIssue && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto p-4">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Issue ID</p>
                <p className="text-sm">{selectedIssue.issueId}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500">Status</p>
                <Badge className={getStatusColor(selectedIssue.status)}>
                  {selectedIssue.status}
                </Badge>
              </div>

              <div className="space-y-1 col-span-2">
                <p className="text-sm text-gray-500">Title</p>
                <p className="text-sm">{selectedIssue.title}</p>
              </div>

              <div className="space-y-1 col-span-2">
                <p className="text-sm text-gray-500">Description</p>
                <p className="text-sm">{selectedIssue.description}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500">Category</p>
                <p className="text-sm">{selectedIssue.category}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500">Severity</p>
                <Badge className={getSeverityColor(selectedIssue.severity)}>
                  {selectedIssue.severity}
                </Badge>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500">Reported By</p>
                <p className="text-sm">{selectedIssue.reportedBy}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500">Assigned To</p>
                <p className="text-sm">{selectedIssue.assignedTo || "-"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500">Affected System</p>
                <p className="text-sm">{selectedIssue.affectedSystem || "-"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500">Location</p>
                <p className="text-sm">{selectedIssue.location}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500">Reported Date</p>
                <p className="text-sm">{selectedIssue.reportedDate}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500">Resolved Date</p>
                <p className="text-sm">{selectedIssue.resolvedDate || "-"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500">Downtime</p>
                <p className="text-sm">{selectedIssue.downtime || "-"}</p>
              </div>

              {selectedIssue.rootCause && (
                <div className="space-y-1 col-span-2">
                  <p className="text-sm text-gray-500">Root Cause</p>
                  <p className="text-sm">{selectedIssue.rootCause}</p>
                </div>
              )}

              {selectedIssue.resolution && (
                <div className="space-y-1 col-span-2">
                  <p className="text-sm text-gray-500">Resolution</p>
                  <p className="text-sm">{selectedIssue.resolution}</p>
                </div>
              )}

              {selectedIssue.preventiveAction && (
                <div className="space-y-1 col-span-2">
                  <p className="text-sm text-gray-500">Preventive Action</p>
                  <p className="text-sm">{selectedIssue.preventiveAction}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}