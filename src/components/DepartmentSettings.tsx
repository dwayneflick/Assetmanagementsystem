import { useState, useEffect, useCallback } from "react";
import { User } from "../App";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
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
import { toast } from "sonner@2.0.3";
import { Plus, Pencil, Trash2, Check, X, RefreshCw, Building2 } from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";

interface DepartmentSettingsProps {
  user: User;
}

const DEFAULT_DEPARTMENTS = [
  "TP","CP","EMM","RDS","PCFW","BAS","FAS & PMG",
  "Internal Audit and Enterprise Risk Services",
  "Forensic, Cybersecurity and Compliance Services",
  "Accounting Advisory","F&A","HR","M&B","ITS",
];

export default function DepartmentSettings({ user }: DepartmentSettingsProps) {
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Add state
  const [addValue, setAddValue] = useState("");
  const [adding, setAdding] = useState(false);

  // Edit state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  // Delete state
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const canEdit = user.role === "admin";

  const apiBase = `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e`;
  const headers = { Authorization: `Bearer ${publicAnonKey}`, "Content-Type": "application/json" };

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/departments`, { headers });
      const data = await res.json();
      setDepartments(data.departments || DEFAULT_DEPARTMENTS);
    } catch (err) {
      console.error("Error fetching departments:", err);
      setDepartments(DEFAULT_DEPARTMENTS);
      toast.error("Failed to load departments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDepartments(); }, [fetchDepartments]);

  const saveDepartments = async (newList: string[]) => {
    setSaving(true);
    try {
      const res = await fetch(`${apiBase}/departments`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ departments: newList }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to save");
      setDepartments(newList);
      return true;
    } catch (err: any) {
      toast.error(err.message || "Failed to save departments");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    const val = addValue.trim();
    if (!val) { toast.error("Department name cannot be empty"); return; }
    if (departments.some((d) => d.toLowerCase() === val.toLowerCase())) {
      toast.error("Department already exists");
      return;
    }
    const newList = [...departments, val];
    const ok = await saveDepartments(newList);
    if (ok) {
      toast.success(`Department "${val}" added`);
      setAddValue("");
      setAdding(false);
    }
  };

  const handleEdit = async (index: number) => {
    const val = editValue.trim();
    if (!val) { toast.error("Department name cannot be empty"); return; }
    if (departments.some((d, i) => i !== index && d.toLowerCase() === val.toLowerCase())) {
      toast.error("Department already exists");
      return;
    }
    const newList = departments.map((d, i) => (i === index ? val : d));
    const ok = await saveDepartments(newList);
    if (ok) {
      toast.success(`Department updated to "${val}"`);
      setEditingIndex(null);
      setEditValue("");
    }
  };

  const handleDelete = async (index: number) => {
    const name = departments[index];
    const newList = departments.filter((_, i) => i !== index);
    const ok = await saveDepartments(newList);
    if (ok) {
      toast.success(`Department "${name}" deleted`);
      setDeleteIndex(null);
    }
  };

  const handleReset = async () => {
    if (!confirm("Reset departments to the default list? This will overwrite all custom changes.")) return;
    const ok = await saveDepartments(DEFAULT_DEPARTMENTS);
    if (ok) toast.success("Departments reset to defaults");
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" /> Departments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Departments
              </CardTitle>
              <CardDescription className="mt-1">
                Manage the departments available across Asset Management and other modules.
                {departments.length > 0 && (
                  <span className="ml-1 font-medium text-gray-700">{departments.length} departments</span>
                )}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchDepartments} disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
              {canEdit && (
                <Button variant="outline" size="sm" onClick={handleReset} disabled={saving}>
                  Reset to Defaults
                </Button>
              )}
              {canEdit && (
                <Button
                  size="sm"
                  onClick={() => { setAdding(true); setAddValue(""); }}
                  className="bg-gradient-to-r from-red-900 to-rose-900 hover:from-red-800 hover:to-rose-800 text-white"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Department
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Add row */}
          {adding && (
            <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
              <Input
                autoFocus
                placeholder="Enter department name..."
                value={addValue}
                onChange={(e) => setAddValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") { setAdding(false); setAddValue(""); } }}
                className="flex-1"
              />
              <Button size="sm" onClick={handleAdd} disabled={saving}
                className="bg-gradient-to-r from-red-900 to-rose-900 hover:from-red-800 hover:to-rose-800 text-white">
                <Check className="w-4 h-4 mr-1" /> Add
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setAddValue(""); }}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Department list */}
          {departments.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No departments yet — click "Add Department" to get started.
            </div>
          ) : (
            <div className="divide-y border rounded-lg overflow-hidden">
              {departments.map((dept, index) => (
                <div key={`${dept}-${index}`}
                  className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 transition-colors">
                  {editingIndex === index ? (
                    <>
                      <Input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleEdit(index); if (e.key === "Escape") { setEditingIndex(null); } }}
                        className="flex-1"
                      />
                      <Button size="sm" onClick={() => handleEdit(index)} disabled={saving}
                        className="bg-gradient-to-r from-red-900 to-rose-900 hover:from-red-800 hover:to-rose-800 text-white">
                        <Check className="w-4 h-4 mr-1" /> Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingIndex(null)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm font-medium text-gray-800">{dept}</span>
                      <Badge variant="secondary" className="text-xs text-gray-500">#{index + 1}</Badge>
                      {canEdit && (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8"
                            onClick={() => { setEditingIndex(index); setEditValue(dept); }}>
                            <Pencil className="w-3.5 h-3.5 text-gray-500" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setDeleteIndex(index)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {!canEdit && (
            <p className="text-xs text-gray-400 mt-2">
              Only administrators can add, edit, or delete departments.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <AlertDialog open={deleteIndex !== null} onOpenChange={(open) => { if (!open) setDeleteIndex(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Department</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {deleteIndex !== null ? departments[deleteIndex] : ""}
              </span>?
              This will remove it from all dropdowns. Existing asset records are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteIndex !== null && handleDelete(deleteIndex)}
              className="bg-gradient-to-r from-red-900 to-rose-900 hover:from-red-800 hover:to-rose-800 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
