import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Alert, AlertDescription } from "./ui/alert";
import { toast } from "sonner@2.0.3";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import {
  Upload,
  Download,
  FileSpreadsheet,
  Database,
  AlertCircle,
  CheckCircle,
  Package,
  FileText,
  AlertTriangle,
  ShoppingCart,
  UserCheck,
  UserMinus,
  Code,
} from "lucide-react";

export default function DataManagement() {
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadResults, setUploadResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  // Generate sample CSV for Asset Management
  const generateAssetSampleCSV = () => {
    const headers = [
      "Asset Name",
      "Service Tag",
      "Product Type",
      "Asset State",
      "User",
      "Department",
      "Acquisition Date",
      "Vendor",
      "Cost (₦)",
      "Warranty Expiry",
      "Processor",
      "RAM",
      "Storage",
      "OS",
      "Notes",
    ];

    const sampleData = [
      [
        "Dell Latitude 5420",
        "SVC123456",
        "Laptop",
        "In Use",
        "John Doe",
        "IT",
        "2024-01-15",
        "Dell Technologies",
        "450000",
        "2027-01-15",
        "Intel Core i5-11th Gen",
        "16GB DDR4",
        "512GB SSD",
        "Windows 11 Pro",
        "Assigned to developer team",
      ],
      [
        "HP EliteBook 840",
        "SVC789012",
        "Laptop",
        "Available",
        "",
        "IT",
        "2024-02-20",
        "HP Inc.",
        "520000",
        "2027-02-20",
        "Intel Core i7-11th Gen",
        "32GB DDR4",
        "1TB SSD",
        "Windows 11 Pro",
        "High performance unit",
      ],
      [
        "Lenovo ThinkPad X1",
        "SVC345678",
        "Laptop",
        "Under Repair",
        "",
        "IT",
        "2023-11-10",
        "Lenovo",
        "480000",
        "2026-11-10",
        "Intel Core i5-10th Gen",
        "16GB DDR4",
        "512GB SSD",
        "Windows 10 Pro",
        "Battery replacement needed",
      ],
    ];

    const csv = [headers.join(","), ...sampleData.map((row) => row.join(","))].join("\n");
    return csv;
  };

  // Generate sample CSV for Software
  const generateSoftwareSampleCSV = () => {
    const headers = [
      "Software Name",
      "Version",
      "Vendor",
      "License Type",
      "License Key",
      "Number of Licenses",
      "Purchase Date",
      "Expiry Date",
      "Cost (₦)",
      "Assigned To",
      "Status",
      "Notes",
    ];

    const sampleData = [
      [
        "Microsoft Office 365",
        "2024",
        "Microsoft",
        "Subscription",
        "XXXXX-XXXXX-XXXXX-XXXXX",
        "50",
        "2024-01-01",
        "2025-01-01",
        "2500000",
        "All Staff",
        "Active",
        "Enterprise subscription",
      ],
      [
        "Adobe Creative Cloud",
        "2024",
        "Adobe",
        "Subscription",
        "YYYYY-YYYYY-YYYYY-YYYYY",
        "10",
        "2024-03-15",
        "2025-03-15",
        "1200000",
        "Design Team",
        "Active",
        "Team license",
      ],
    ];

    const csv = [headers.join(","), ...sampleData.map((row) => row.join(","))].join("\n");
    return csv;
  };

  // Generate sample CSV for Incident Reports
  const generateIncidentSampleCSV = () => {
    const headers = [
      "Title",
      "Description",
      "Priority",
      "Category",
      "Reported By",
      "Assigned To",
      "Status",
      "Location",
    ];

    const sampleData = [
      [
        "Network connectivity issue in 3rd floor",
        "Multiple users reporting intermittent network drops",
        "High",
        "Network",
        "John Doe",
        "IT Support Team",
        "Open",
        "3rd Floor, West Wing",
      ],
      [
        "Printer not responding",
        "HP LaserJet printer in conference room not printing",
        "Medium",
        "Hardware",
        "Jane Smith",
        "Kelvin",
        "In Progress",
        "Conference Room A",
      ],
    ];

    const csv = [headers.join(","), ...sampleData.map((row) => row.join(","))].join("\n");
    return csv;
  };

  // Generate sample CSV for Purchase Orders
  const generatePurchaseOrderSampleCSV = () => {
    const headers = [
      "Item Name",
      "Quantity",
      "Unit Price (₦)",
      "Total Amount (₦)",
      "Vendor",
      "Requested By",
      "Department",
      "Priority",
      "Justification",
    ];

    const sampleData = [
      [
        "Dell Monitor 27 inch",
        "10",
        "85000",
        "850000",
        "Dell Technologies",
        "John Doe",
        "IT",
        "Medium",
        "Required for new workstations",
      ],
      [
        "Wireless Mouse",
        "20",
        "3500",
        "70000",
        "Logitech",
        "Jane Smith",
        "Administration",
        "Low",
        "Replacement for old mice",
      ],
    ];

    const csv = [headers.join(","), ...sampleData.map((row) => row.join(","))].join("\n");
    return csv;
  };

  // Generate sample CSV for Asset Handover
  const generateAssetHandoverSampleCSV = () => {
    const headers = [
      "Asset Name",
      "Serial Number",
      "Product Type",
      "Handed To",
      "Department",
      "Handover Date",
      "Condition",
      "Notes",
    ];

    const sampleData = [
      [
        "Dell Latitude 5420",
        "SVC123456",
        "Laptop",
        "John Doe",
        "IT",
        "2024-12-01",
        "Excellent",
        "All accessories included",
      ],
      [
        "iPhone 14 Pro",
        "IMEI987654321",
        "Mobile Device",
        "Jane Smith",
        "Sales",
        "2024-12-05",
        "Good",
        "Charger and case included",
      ],
    ];

    const csv = [headers.join(","), ...sampleData.map((row) => row.join(","))].join("\n");
    return csv;
  };

  // Generate sample CSV for IT Deregistration
  const generateDeregistrationSampleCSV = () => {
    const headers = [
      "Asset Name",
      "Serial Number",
      "Product Type",
      "Previous User",
      "Department",
      "Deregistration Date",
      "Reason",
      "Asset Condition",
      "Disposal Method",
      "Notes",
    ];

    const sampleData = [
      [
        "HP EliteBook 840",
        "SVC789012",
        "Laptop",
        "John Doe",
        "IT",
        "2024-12-10",
        "End of Life",
        "Poor",
        "Recycling",
        "Hard drive wiped",
      ],
      [
        "Old Server HP DL380",
        "SRV001234",
        "Server",
        "IT Department",
        "IT",
        "2024-12-08",
        "Upgrade",
        "Fair",
        "Donation",
        "Being replaced with new model",
      ],
    ];

    const csv = [headers.join(","), ...sampleData.map((row) => row.join(","))].join("\n");
    return csv;
  };

  const downloadSampleCSV = (type: string) => {
    let csv = "";
    let filename = "";

    switch (type) {
      case "assets":
        csv = generateAssetSampleCSV();
        filename = "asset_sample_template.csv";
        break;
      case "software":
        csv = generateSoftwareSampleCSV();
        filename = "software_sample_template.csv";
        break;
      case "incidents":
        csv = generateIncidentSampleCSV();
        filename = "incident_sample_template.csv";
        break;
      case "purchase-orders":
        csv = generatePurchaseOrderSampleCSV();
        filename = "purchase_order_sample_template.csv";
        break;
      case "handover":
        csv = generateAssetHandoverSampleCSV();
        filename = "asset_handover_sample_template.csv";
        break;
      case "deregistration":
        csv = generateDeregistrationSampleCSV();
        filename = "deregistration_sample_template.csv";
        break;
      default:
        return;
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Sample CSV template downloaded!`);
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: string
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }

    setUploading(type);
    setUploadResults(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/bulk-upload/${type}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to upload file");
        return;
      }

      setUploadResults({
        success: data.success || 0,
        failed: data.failed || 0,
        errors: data.errors || [],
      });

      if (data.success > 0) {
        toast.success(
          `Successfully uploaded ${data.success} record${data.success > 1 ? "s" : ""}!`
        );
      }

      if (data.failed > 0) {
        toast.error(
          `Failed to upload ${data.failed} record${data.failed > 1 ? "s" : ""}`
        );
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("An error occurred while uploading the file");
    } finally {
      setUploading(null);
      // Reset file input
      event.target.value = "";
    }
  };

  const dataModules = [
    {
      id: "assets",
      name: "Asset Management",
      description: "Upload and manage hardware assets in bulk",
      icon: Package,
      color: "blue",
    },
    {
      id: "software",
      name: "Software Management",
      description: "Upload and manage software licenses in bulk",
      icon: Code,
      color: "purple",
    },
    {
      id: "incidents",
      name: "Incident Reports",
      description: "Upload and manage incident reports in bulk",
      icon: AlertTriangle,
      color: "red",
    },
    {
      id: "purchase-orders",
      name: "Purchase Orders",
      description: "Upload and manage purchase orders in bulk",
      icon: ShoppingCart,
      color: "green",
    },
    {
      id: "handover",
      name: "Asset Handover",
      description: "Upload and manage asset handovers in bulk",
      icon: UserCheck,
      color: "teal",
    },
    {
      id: "deregistration",
      name: "IT Deregistration",
      description: "Upload and manage deregistrations in bulk",
      icon: UserMinus,
      color: "orange",
    },
  ];

  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 border-blue-200">
        <Database className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 text-sm">
          <strong>Data Management:</strong> Download sample CSV templates to see
          the exact format required, then upload your data in bulk. Each module
          has its own specific format.
        </AlertDescription>
      </Alert>

      {/* Upload Results */}
      {uploadResults && (
        <Alert
          className={
            uploadResults.failed > 0
              ? "bg-yellow-50 border-yellow-200"
              : "bg-green-50 border-green-200"
          }
        >
          <CheckCircle
            className={`h-4 w-4 ${uploadResults.failed > 0 ? "text-yellow-600" : "text-green-600"}`}
          />
          <AlertDescription
            className={`text-sm ${uploadResults.failed > 0 ? "text-yellow-800" : "text-green-800"}`}
          >
            <div className="space-y-2">
              <p>
                <strong>Upload Complete:</strong> {uploadResults.success}{" "}
                successful, {uploadResults.failed} failed
              </p>
              {uploadResults.errors.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium mb-1">Errors:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    {uploadResults.errors.slice(0, 5).map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                    {uploadResults.errors.length > 5 && (
                      <li className="text-gray-600">
                        ... and {uploadResults.errors.length - 5} more errors
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Data Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {dataModules.map((module) => {
          const Icon = module.icon;
          return (
            <Card key={module.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className={`w-5 h-5 text-${module.color}-600`} />
                  {module.name}
                </CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Download Sample */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Step 1: Download Sample Template
                  </Label>
                  <Button
                    onClick={() => downloadSampleCSV(module.id)}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download CSV Template
                  </Button>
                </div>

                {/* Upload File */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Step 2: Upload Your Data
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept=".csv"
                      onChange={(e) => handleFileUpload(e, module.id)}
                      disabled={uploading !== null}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => {
                        const input = document.querySelector(
                          `input[type="file"]`
                        ) as HTMLInputElement;
                        input?.click();
                      }}
                      disabled={uploading === module.id}
                      className="bg-gradient-to-r from-red-900 to-rose-900"
                    >
                      {uploading === module.id ? (
                        <>
                          <FileSpreadsheet className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Only CSV files are supported. Max 1000 records per upload.
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Important Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                1
              </div>
              <div>
                <p className="font-medium">Download the template first</p>
                <p className="text-gray-600 text-xs">
                  Each module has a specific CSV format. Download the sample to
                  see exactly what columns are required.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                2
              </div>
              <div>
                <p className="font-medium">Use the exact column names</p>
                <p className="text-gray-600 text-xs">
                  Column headers must match exactly (case-sensitive). Don't add
                  or remove columns.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                3
              </div>
              <div>
                <p className="font-medium">Follow the sample data format</p>
                <p className="text-gray-600 text-xs">
                  Date format: YYYY-MM-DD, Numbers: no commas or currency
                  symbols (₦), Text: avoid special characters in CSV.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                4
              </div>
              <div>
                <p className="font-medium">Check for errors after upload</p>
                <p className="text-gray-600 text-xs">
                  If any records fail, review the error messages and fix your
                  CSV file before re-uploading.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                ⚠
              </div>
              <div>
                <p className="font-medium text-yellow-700">
                  Maximum 1000 records per upload
                </p>
                <p className="text-gray-600 text-xs">
                  For larger datasets, split them into multiple CSV files.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
