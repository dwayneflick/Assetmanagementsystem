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
import { Textarea } from "./ui/textarea";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { toast } from "sonner@2.0.3";
import { Plus, Edit, Eye, AlertTriangle } from "lucide-react";

interface IncidentReportsProps {
  user: User;
}

interface Incident {
  id: string;
  incidentType: string;
  dateOfIncident: string;
  timeOfIncident: string;
  location: string;
  reporterName: string;
  dateReported: string;
  involvedIndividuals: string;
  witnesses: string;
  detailedDescription: string;
  immediateAction: string;
  impactSeverity: string;
  injuryDamageDescription: string;
  estimatedCost: number;
  identifiedRootCause: string;
  correctiveAction: string;
  preventiveAction: string;
  responsibleParty: string;
  targetCompletionDate: string;
  status: string;
  dateClosed?: string;
  evidenceAttached: string;
  createdAt: string;
  updatedAt: string;
}

const INCIDENT_TYPES = [
  "Safety",
  "Security",
  "IT",
  "Network",
  "Equipment",
  "Software",
];

const SEVERITY_LEVELS = ["High", "Medium", "Low"];
const STATUS_OPTIONS = ["Open", "In Progress", "Complete", "Closed"];

export default function IncidentReports({ user }: IncidentReportsProps) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const emptyIncident: Partial<Incident> = {
    incidentType: "",
    dateOfIncident: "",
    timeOfIncident: "",
    location: "",
    reporterName: user.name,
    dateReported: new Date().toISOString().split("T")[0],
    involvedIndividuals: "",
    witnesses: "",
    detailedDescription: "",
    immediateAction: "",
    impactSeverity: "Medium",
    injuryDamageDescription: "",
    estimatedCost: 0,
    identifiedRootCause: "",
    correctiveAction: "",
    preventiveAction: "",
    responsibleParty: "",
    targetCompletionDate: "",
    status: "Open",
    evidenceAttached: "No",
  };

  const [formData, setFormData] = useState<Partial<Incident>>(emptyIncident);

  useEffect(() => {
    fetchIncidents();
  }, []);

  const validateForm = (): boolean => {
    const errors: string[] = [];
    const requiredFields = [
      { field: 'incidentType', label: 'Incident Type' },
      { field: 'dateOfIncident', label: 'Date of Incident' },
      { field: 'timeOfIncident', label: 'Time of Incident' },
      { field: 'location', label: 'Location' },
      { field: 'reporterName', label: 'Reporter Name' },
      { field: 'detailedDescription', label: 'Detailed Description' },
      { field: 'impactSeverity', label: 'Impact Severity' },
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

  const fetchIncidents = async () => {
    try {
      const data = await cachedFetch<{ incidents: any[] }>(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/incidents`,
        { headers: { Authorization: `Bearer ${publicAnonKey}` } },
        30_000
      );
      setIncidents(data.incidents || []);
    } catch (error) {
      console.error("Error fetching incidents:", error);
      toast.error("Failed to load incidents");
    } finally {
      setLoading(false);
    }
  };

  const handleAddIncident = async () => {
    if (!validateForm()) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/incidents`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) throw new Error("Failed to create incident");

      toast.success("Incident created successfully");
      invalidateCache(`https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/incidents`);
      setShowAddDialog(false);
      setFormData(emptyIncident);
      fetchIncidents();
    } catch (error) {
      console.error("Error creating incident:", error);
      toast.error("Failed to create incident");
    }
  };

  const handleUpdateIncident = async () => {
    if (!selectedIncident) return;
    if (!validateForm()) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/incidents/${selectedIncident.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) throw new Error("Failed to update incident");

      toast.success("Incident updated successfully");
      invalidateCache(`https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/incidents`);
      setShowEditDialog(false);
      setSelectedIncident(null);
      setFormData(emptyIncident);
      fetchIncidents();
    } catch (error) {
      console.error("Error updating incident:", error);
      toast.error("Failed to update incident");
    }
  };

  const openEditDialog = (incident: Incident) => {
    setSelectedIncident(incident);
    setFormData(incident);
    setShowEditDialog(true);
  };

  const openViewDialog = (incident: Incident) => {
    setSelectedIncident(incident);
    setShowViewDialog(true);
  };

  const filteredIncidents = incidents.filter((incident) =>
    Object.values(incident).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "High":
        return "bg-red-100 text-red-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "Low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-blue-100 text-blue-800";
      case "In Progress":
        return "bg-yellow-100 text-yellow-800";
      case "Complete":
        return "bg-green-100 text-green-800";
      case "Closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const IncidentForm = useMemo(() => (
    <div className="grid grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto p-4">
      <div className="space-y-2">
        <Label htmlFor="incidentType">Incident Type *</Label>
        <Select
          value={formData.incidentType || ""}
          onValueChange={(value) => setFormData({ ...formData, incidentType: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {INCIDENT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="impactSeverity">Impact Severity *</Label>
        <Select
          value={formData.impactSeverity || ""}
          onValueChange={(value) => setFormData({ ...formData, impactSeverity: value })}
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
        <Label htmlFor="dateOfIncident">Date of Incident *</Label>
        <Input
          id="dateOfIncident"
          type="date"
          value={formData.dateOfIncident || ""}
          onChange={(e) => setFormData({ ...formData, dateOfIncident: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="timeOfIncident">Time of Incident *</Label>
        <Input
          id="timeOfIncident"
          type="time"
          value={formData.timeOfIncident || ""}
          onChange={(e) => setFormData({ ...formData, timeOfIncident: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location *</Label>
        <Input
          id="location"
          value={formData.location || ""}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reporterName">Reporter Name *</Label>
        <Input
          id="reporterName"
          value={formData.reporterName || ""}
          onChange={(e) => setFormData({ ...formData, reporterName: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dateReported">Date Reported *</Label>
        <Input
          id="dateReported"
          type="date"
          value={formData.dateReported || ""}
          onChange={(e) => setFormData({ ...formData, dateReported: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="involvedIndividuals">Involved Individual(s)</Label>
        <Input
          id="involvedIndividuals"
          value={formData.involvedIndividuals || ""}
          onChange={(e) => setFormData({ ...formData, involvedIndividuals: e.target.value })}
        />
      </div>

      <div className="space-y-2 col-span-2">
        <Label htmlFor="witnesses">Witness(es) Name</Label>
        <Input
          id="witnesses"
          value={formData.witnesses || ""}
          onChange={(e) => setFormData({ ...formData, witnesses: e.target.value })}
        />
      </div>

      <div className="space-y-2 col-span-2">
        <Label htmlFor="detailedDescription">Detailed Description *</Label>
        <Textarea
          id="detailedDescription"
          value={formData.detailedDescription || ""}
          onChange={(e) => setFormData({ ...formData, detailedDescription: e.target.value })}
          rows={4}
          required
        />
      </div>

      <div className="space-y-2 col-span-2">
        <Label htmlFor="immediateAction">Immediate Action Taken</Label>
        <Textarea
          id="immediateAction"
          value={formData.immediateAction || ""}
          onChange={(e) => setFormData({ ...formData, immediateAction: e.target.value })}
          rows={3}
        />
      </div>

      <div className="space-y-2 col-span-2">
        <Label htmlFor="injuryDamageDescription">Injury/Damage Description</Label>
        <Textarea
          id="injuryDamageDescription"
          value={formData.injuryDamageDescription || ""}
          onChange={(e) => setFormData({ ...formData, injuryDamageDescription: e.target.value })}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="estimatedCost">Estimated Cost of Damage/Loss (₦)</Label>
        <Input
          id="estimatedCost"
          type="number"
          value={formData.estimatedCost || ""}
          onChange={(e) => setFormData({ ...formData, estimatedCost: parseFloat(e.target.value) || 0 })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="responsibleParty">Responsible Party</Label>
        <Input
          id="responsibleParty"
          value={formData.responsibleParty || ""}
          onChange={(e) => setFormData({ ...formData, responsibleParty: e.target.value })}
        />
      </div>

      <div className="space-y-2 col-span-2">
        <Label htmlFor="identifiedRootCause">Identified Root Cause</Label>
        <Textarea
          id="identifiedRootCause"
          value={formData.identifiedRootCause || ""}
          onChange={(e) => setFormData({ ...formData, identifiedRootCause: e.target.value })}
          rows={3}
        />
      </div>

      <div className="space-y-2 col-span-2">
        <Label htmlFor="correctiveAction">Corrective Action Required</Label>
        <Textarea
          id="correctiveAction"
          value={formData.correctiveAction || ""}
          onChange={(e) => setFormData({ ...formData, correctiveAction: e.target.value })}
          rows={3}
        />
      </div>

      <div className="space-y-2 col-span-2">
        <Label htmlFor="preventiveAction">Preventive Action Required</Label>
        <Textarea
          id="preventiveAction"
          value={formData.preventiveAction || ""}
          onChange={(e) => setFormData({ ...formData, preventiveAction: e.target.value })}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="targetCompletionDate">Target Completion Date</Label>
        <Input
          id="targetCompletionDate"
          type="date"
          value={formData.targetCompletionDate || ""}
          onChange={(e) => setFormData({ ...formData, targetCompletionDate: e.target.value })}
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
            {STATUS_OPTIONS.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {formData.status === "Closed" && (
        <div className="space-y-2">
          <Label htmlFor="dateClosed">Date Closed</Label>
          <Input
            id="dateClosed"
            type="date"
            value={formData.dateClosed || ""}
            onChange={(e) => setFormData({ ...formData, dateClosed: e.target.value })}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="evidenceAttached">Evidence Attached? *</Label>
        <Select
          value={formData.evidenceAttached || ""}
          onValueChange={(value) => setFormData({ ...formData, evidenceAttached: value })}
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
  ), [formData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading incidents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl mb-2">Incident Reports</h1>
          <p className="text-sm sm:text-base text-gray-600">Track and manage organizational incidents</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button
              className="bg-gradient-to-r from-red-900 to-rose-900 hover:from-red-800 hover:to-rose-800 w-full sm:w-auto"
              onClick={() => setFormData({ ...emptyIncident, reporterName: user.name })}
            >
              <Plus className="w-4 h-4 mr-2" />
              Report New Incident
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Report New Incident</DialogTitle>
              <DialogDescription>Fill in the incident details below</DialogDescription>
            </DialogHeader>
            {IncidentForm}
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:space-x-2 p-4">
              <Button variant="outline" onClick={() => setShowAddDialog(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button onClick={handleAddIncident} className="w-full sm:w-auto">Create Incident Report</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <Input
            placeholder="Search incidents by ID, type, location, reporter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </CardContent>
      </Card>

      {/* Incidents Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Incident ID</TableHead>
                  <TableHead className="whitespace-nowrap">Type</TableHead>
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                  <TableHead className="whitespace-nowrap">Location</TableHead>
                  <TableHead className="whitespace-nowrap">Reporter</TableHead>
                  <TableHead className="whitespace-nowrap">Severity</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIncidents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                      No incidents found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredIncidents.map((incident) => (
                    <TableRow key={incident.id}>
                      <TableCell className="font-mono text-sm whitespace-nowrap">{incident.id}</TableCell>
                      <TableCell className="whitespace-nowrap">{incident.incidentType}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {new Date(incident.dateOfIncident).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{incident.location}</TableCell>
                      <TableCell className="whitespace-nowrap">{incident.reporterName}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge className={getSeverityColor(incident.impactSeverity)}>
                          {incident.impactSeverity}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge className={getStatusColor(incident.status)}>
                          {incident.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openViewDialog(incident)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(incident)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
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
            <DialogTitle>Edit Incident Report</DialogTitle>
            <DialogDescription>Update incident details</DialogDescription>
          </DialogHeader>
          {IncidentForm}
          <div className="flex justify-end space-x-2 p-4">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateIncident}>Update Incident</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Incident Details</DialogTitle>
          </DialogHeader>
          {selectedIncident && (
            <div className="grid grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto p-4">
              {Object.entries(selectedIncident).map(([key, value]) => {
                if (key === "createdAt" || key === "updatedAt") return null;
                return (
                  <div key={key} className={key.includes("Description") || key.includes("Action") || key.includes("Cause") ? "col-span-2" : ""}>
                    <p className="text-sm text-gray-500 capitalize mb-1">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </p>
                    <p className="text-sm">
                      {key === "estimatedCost"
                        ? `₦${value?.toLocaleString() || 0}`
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