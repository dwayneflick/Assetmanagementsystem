import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { toast } from "sonner@2.0.3";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import {
  Edit,
  Trash2,
  ChevronRight,
  Workflow,
  ChevronUp,
  ChevronDown,
  Plus,
  X,
  Save,
  Check,
  Pencil,
} from "lucide-react";

interface WorkflowType {
  id: string;
  name: string;
  stages: string[];
  createdAt: string;
  updatedAt: string;
}

export default function WorkflowSettings() {
  const [workflows, setWorkflows] = useState<WorkflowType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowType | null>(null);
  const [editingWorkflow, setEditingWorkflow] = useState(false);
  
  // Add workflow dialog states
  const [showAddWorkflow, setShowAddWorkflow] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState("");
  const [newWorkflowStages, setNewWorkflowStages] = useState<string[]>([]);
  const [newStageName, setNewStageName] = useState("");
  
  // Edit workflow states
  const [editStages, setEditStages] = useState<string[]>([]);
  const [editStageName, setEditStageName] = useState("");
  
  // Rename stage states
  const [renamingStageIndex, setRenamingStageIndex] = useState<number | null>(null);
  const [renameStageValue, setRenameStageValue] = useState("");

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/workflows`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch workflows");
      }

      const data = await response.json();
      setWorkflows(data.workflows || []);
    } catch (error) {
      console.error("Error fetching workflows:", error);
      toast.error("Failed to load workflows");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newWorkflowName.trim()) {
      toast.error("Please enter a workflow name");
      return;
    }

    if (newWorkflowStages.length === 0) {
      toast.error("Please add at least one stage");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/workflows`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            name: newWorkflowName,
            stages: newWorkflowStages,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to create workflow");
        return;
      }

      toast.success("Workflow created successfully!");
      setShowAddWorkflow(false);
      setNewWorkflowName("");
      setNewWorkflowStages([]);
      setNewStageName("");
      fetchWorkflows();
    } catch (error) {
      console.error("Error creating workflow:", error);
      toast.error("Failed to create workflow");
    } finally {
      setLoading(false);
    }
  };

  const handleEditWorkflow = (workflow: WorkflowType) => {
    setSelectedWorkflow(workflow);
    setEditStages(workflow.stages);
    setEditStageName(""); // Reset the add stage input
    setRenamingStageIndex(null); // Reset rename state
    setRenameStageValue("");
    setEditingWorkflow(true);
  };

  const handleSaveWorkflow = async () => {
    if (!selectedWorkflow) return;

    if (editStages.length === 0) {
      toast.error("Workflow must have at least one stage");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/workflows/${selectedWorkflow.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            stages: editStages,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to save workflow");
        return;
      }

      toast.success("Workflow updated successfully!");
      setEditingWorkflow(false);
      setSelectedWorkflow(null);
      setEditStages([]);
      fetchWorkflows();
    } catch (error) {
      console.error("Error saving workflow:", error);
      toast.error("Failed to save workflow");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorkflow = async (workflow: WorkflowType) => {
    if (workflow.id === "purchase_order") {
      toast.error("Cannot delete the default Purchase Order workflow");
      return;
    }

    if (!confirm(`Are you sure you want to delete "${workflow.name}"? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/workflows/${workflow.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to delete workflow");
        return;
      }

      toast.success("Workflow deleted successfully!");
      fetchWorkflows();
    } catch (error) {
      console.error("Error deleting workflow:", error);
      toast.error("Failed to delete workflow");
    } finally {
      setLoading(false);
    }
  };

  const handleAddStageToNew = () => {
    if (!newStageName.trim()) {
      toast.error("Please enter a stage name");
      return;
    }

    if (newWorkflowStages.includes(newStageName.trim())) {
      toast.error("This stage already exists");
      return;
    }

    setNewWorkflowStages([...newWorkflowStages, newStageName.trim()]);
    setNewStageName("");
  };

  const handleRemoveStageFromNew = (index: number) => {
    setNewWorkflowStages(newWorkflowStages.filter((_, i) => i !== index));
  };

  const handleMoveStageUpNew = (index: number) => {
    if (index === 0) return;
    const newList = [...newWorkflowStages];
    [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
    setNewWorkflowStages(newList);
  };

  const handleMoveStageDownNew = (index: number) => {
    if (index === newWorkflowStages.length - 1) return;
    const newList = [...newWorkflowStages];
    [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
    setNewWorkflowStages(newList);
  };

  const handleAddStageToEdit = () => {
    console.log("handleAddStageToEdit called, editStageName:", editStageName);
    console.log("editStageName.trim():", editStageName.trim());
    console.log("Is empty?", !editStageName.trim());
    
    if (!editStageName.trim()) {
      toast.error("Please enter a stage name");
      return;
    }

    if (editStages.includes(editStageName.trim())) {
      toast.error("This stage already exists");
      return;
    }

    console.log("Adding stage:", editStageName.trim());
    setEditStages([...editStages, editStageName.trim()]);
    setEditStageName("");
  };

  const handleRemoveStageFromEdit = (index: number) => {
    setEditStages(editStages.filter((_, i) => i !== index));
  };

  const handleMoveStageUpEdit = (index: number) => {
    if (index === 0) return;
    const newList = [...editStages];
    [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
    setEditStages(newList);
  };

  const handleMoveStageDownEdit = (index: number) => {
    if (index === editStages.length - 1) return;
    const newList = [...editStages];
    [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
    setEditStages(newList);
  };

  const handleStartRenamingStage = (index: number) => {
    setRenamingStageIndex(index);
    setRenameStageValue(editStages[index]);
  };

  const handleCancelRenamingStage = () => {
    setRenamingStageIndex(null);
    setRenameStageValue("");
  };

  const handleSaveRenamingStage = () => {
    if (!renameStageValue.trim()) {
      toast.error("Please enter a stage name");
      return;
    }

    if (editStages.includes(renameStageValue.trim()) && renameStageValue.trim() !== editStages[renamingStageIndex!]) {
      toast.error("This stage already exists");
      return;
    }

    const newStages = [...editStages];
    newStages[renamingStageIndex!] = renameStageValue.trim();
    setEditStages(newStages);
    setRenamingStageIndex(null);
    setRenameStageValue("");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="w-5 h-5" />
                Workflow Management
              </CardTitle>
              <CardDescription>
                Create and manage workflows for different processes
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowAddWorkflow(true)}
              className="bg-gradient-to-r from-red-900 to-rose-900 hover:from-red-800 hover:to-rose-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Workflow
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              Loading workflows...
            </div>
          ) : workflows.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No workflows found. Create your first workflow!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Workflow Name</TableHead>
                    <TableHead className="hidden md:table-cell">Stages</TableHead>
                    <TableHead className="hidden lg:table-cell">Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workflows.map((workflow) => (
                    <TableRow key={workflow.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{workflow.name}</span>
                          <span className="md:hidden text-xs text-gray-500">
                            {workflow.stages.length} stages
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm text-gray-600">
                          {workflow.stages.length} stages
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-gray-500">
                        {new Date(workflow.updatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditWorkflow(workflow)}
                            className="h-8 w-8 p-0"
                            title="Edit workflow"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteWorkflow(workflow)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Delete workflow"
                            disabled={workflow.id === "purchase_order"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Workflow Dialog */}
      <Dialog open={showAddWorkflow} onOpenChange={setShowAddWorkflow}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Workflow</DialogTitle>
            <DialogDescription>
              Define a new workflow with custom stages for your process
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateWorkflow} className="space-y-4">
            <div>
              <Label htmlFor="workflow-name">
                Workflow Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="workflow-name"
                value={newWorkflowName}
                onChange={(e) => setNewWorkflowName(e.target.value)}
                placeholder="e.g., Asset Approval Workflow"
                required
              />
            </div>

            <div>
              <Label>Add Workflow Stages</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Enter stage name..."
                  value={newStageName}
                  onChange={(e) => setNewStageName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddStageToNew();
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={handleAddStageToNew}
                  className="bg-gradient-to-r from-red-900 to-rose-900 hover:from-red-800 hover:to-rose-800"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Workflow Stages ({newWorkflowStages.length})</Label>
              {newWorkflowStages.length === 0 ? (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                  No stages yet. Add your first stage above.
                </div>
              ) : (
                <div className="space-y-2">
                  {newWorkflowStages.map((stage, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-3 bg-gray-50 border rounded-lg group hover:border-gray-400 transition-colors"
                    >
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveStageUpNew(index)}
                          disabled={index === 0}
                          className="h-8 w-8 p-0"
                          title="Move up"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveStageDownNew(index)}
                          disabled={index === newWorkflowStages.length - 1}
                          className="h-8 w-8 p-0"
                          title="Move down"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">#{index + 1}</span>
                          <span className="font-medium">{stage}</span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveStageFromNew(index)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove stage"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddWorkflow(false);
                  setNewWorkflowName("");
                  setNewWorkflowStages([]);
                  setNewStageName("");
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !newWorkflowName.trim() || newWorkflowStages.length === 0}
                className="bg-gradient-to-r from-red-900 to-rose-900 hover:from-red-800 hover:to-rose-800"
              >
                Create Workflow
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Workflow Dialog */}
      <Dialog 
        open={editingWorkflow} 
        onOpenChange={(open) => {
          setEditingWorkflow(open);
          if (!open) {
            // Reset all states when dialog closes
            setSelectedWorkflow(null);
            setEditStages([]);
            setEditStageName("");
            handleCancelRenamingStage();
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Workflow: {selectedWorkflow?.name}</DialogTitle>
            <DialogDescription>
              Modify workflow stages (workflow name cannot be changed)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Add New Stage</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Enter stage name..."
                  value={editStageName}
                  onChange={(e) => {
                    console.log("Input onChange fired, value:", e.target.value);
                    setEditStageName(e.target.value);
                  }}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddStageToEdit();
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={handleAddStageToEdit}
                  className="bg-gradient-to-r from-red-900 to-rose-900 hover:from-red-800 hover:to-rose-800"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Workflow Stages ({editStages.length})</Label>
              {editStages.length === 0 ? (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                  No stages. Add your first stage above.
                </div>
              ) : (
                <div className="space-y-2">
                  {editStages.map((stage, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-3 bg-gray-50 border rounded-lg group hover:border-gray-400 transition-colors"
                    >
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveStageUpEdit(index)}
                          disabled={index === 0}
                          className="h-8 w-8 p-0"
                          title="Move up"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveStageDownEdit(index)}
                          disabled={index === editStages.length - 1}
                          className="h-8 w-8 p-0"
                          title="Move down"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex-1">
                        {renamingStageIndex === index ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={renameStageValue}
                              onChange={(e) => setRenameStageValue(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleSaveRenamingStage();
                                } else if (e.key === "Escape") {
                                  e.preventDefault();
                                  handleCancelRenamingStage();
                                }
                              }}
                              className="flex-1"
                              autoFocus
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={handleSaveRenamingStage}
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                              title="Save"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={handleCancelRenamingStage}
                              className="h-8 w-8 p-0"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">#{index + 1}</span>
                            <span className="font-medium">{stage}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStartRenamingStage(index)}
                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Rename stage"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      {renamingStageIndex === index ? null : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveStageFromEdit(index)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove stage"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                Preview: {editStages.join(" → ")}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingWorkflow(false);
                setSelectedWorkflow(null);
                setEditStages([]);
                setEditStageName("");
                handleCancelRenamingStage();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveWorkflow}
              disabled={loading || editStages.length === 0}
              className="bg-gradient-to-r from-red-900 to-rose-900 hover:from-red-800 hover:to-rose-800"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}