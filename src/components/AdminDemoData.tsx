import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { toast } from "sonner@2.0.3";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { Database, Sparkles, Trash2, Wrench } from "lucide-react";
import { useState } from "react";

export default function AdminDemoData() {
  const [loading, setLoading] = useState(false);

  const seedDemoLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/seed-demo-logs`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to seed demo logs");
        return;
      }

      toast.success("✨ Demo logs created successfully!");
    } catch (error) {
      console.error("Error seeding demo logs:", error);
      toast.error("An error occurred while seeding demo logs");
    } finally {
      setLoading(false);
    }
  };

  const seedDemoMaintenance = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/seed-demo-maintenance`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to seed demo maintenance logs");
        return;
      }

      toast.success("✨ Demo maintenance logs created successfully!");
    } catch (error) {
      console.error("Error seeding demo maintenance logs:", error);
      toast.error("An error occurred while seeding demo maintenance logs");
    } finally {
      setLoading(false);
    }
  };

  const clearAllData = async () => {
    if (!confirm("⚠️ This will delete ALL data including assets, users (except current), incidents, and logs. Are you sure?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/clear-all-data`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to clear data");
        return;
      }

      toast.success("🗑️ All data cleared successfully!");
    } catch (error) {
      console.error("Error clearing data:", error);
      toast.error("An error occurred while clearing data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Alert className="bg-purple-50 border-purple-200">
        <Sparkles className="h-4 w-4 text-purple-600" />
        <AlertDescription className="text-purple-800 text-sm">
          <strong>Admin Tools:</strong> Seed demo data for testing or clear all system data. Use with caution!
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Seed Demo Logs
            </CardTitle>
            <CardDescription>
              Create sample error logs and audit trail entries for testing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2">
                <p className="font-medium text-gray-900">This will create:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>15 Error Logs (various severity levels)</li>
                  <li>20 Audit Trail Logs (user actions)</li>
                  <li>Sample data from different modules</li>
                  <li>Realistic timestamps and details</li>
                </ul>
              </div>
              <Button
                onClick={seedDemoLogs}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {loading ? "Seeding..." : "Seed Demo Logs"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-purple-600" />
              Seed Demo Maintenance
            </CardTitle>
            <CardDescription>
              Create sample maintenance logs for testing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2">
                <p className="font-medium text-gray-900">This will create:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>10 Maintenance Logs (various types)</li>
                  <li>Sample data from different modules</li>
                  <li>Realistic timestamps and details</li>
                </ul>
              </div>
              <Button
                onClick={seedDemoMaintenance}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              >
                <Wrench className="w-4 h-4 mr-2" />
                {loading ? "Seeding..." : "Seed Demo Maintenance"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <Trash2 className="w-5 h-5" />
              Clear All Data
            </CardTitle>
            <CardDescription className="text-red-600">
              ⚠️ Danger Zone: Remove all system data (irreversible)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm space-y-2">
                <p className="font-medium text-red-900">This will delete:</p>
                <ul className="list-disc list-inside space-y-1 text-red-800">
                  <li>All Assets, Software, Incidents</li>
                  <li>All Purchase Orders & Handovers</li>
                  <li>All Error & Audit Logs</li>
                  <li>All Users (except your current account)</li>
                </ul>
              </div>
              <Button
                onClick={clearAllData}
                disabled={loading}
                variant="destructive"
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {loading ? "Clearing..." : "Clear All Data"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Alert className="bg-yellow-50 border-yellow-200">
        <Database className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800 text-sm">
          <strong>Note:</strong> Demo data is useful for testing features, training users, or demonstrating the system. Always back up important data before clearing.
        </AlertDescription>
      </Alert>
    </div>
  );
}