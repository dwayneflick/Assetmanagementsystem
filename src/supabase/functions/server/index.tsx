import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use("*", logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// ============== EMAIL HELPER FUNCTIONS ==============

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(
  options: EmailOptions,
): Promise<boolean> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  if (!resendApiKey) {
    console.log(
      "RESEND_API_KEY not configured, email not sent",
    );
    return false;
  }

  try {
    // TESTING MODE: Resend only allows sending to verified email in testing mode
    // All emails will be sent to dwayneflicker@gmail.com with original recipient info in subject
    const testingEmail = "dwayneflicker@gmail.com";
    const originalRecipient = options.to;

    // Modify subject to include original recipient for testing
    const testingSubject = `[TO: ${originalRecipient}] ${options.subject}`;

    // Add note to email body about testing mode
    const testingHtml = `
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin-bottom: 20px;">
        <p style="margin: 0; color: #92400e; font-weight: bold;">📧 Testing Mode</p>
        <p style="margin: 5px 0 0 0; color: #92400e; font-size: 14px;">
          This email was intended for: <strong>${originalRecipient}</strong><br>
          In production, verify a domain at resend.com/domains to send to actual recipients.
        </p>
      </div>
      ${options.html}
    `;

    const emailResponse = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Asset Management System <onboarding@resend.dev>",
          to: [testingEmail],
          subject: testingSubject,
          html: testingHtml,
        }),
      },
    );

    if (emailResponse.ok) {
      console.log(
        `Email sent successfully to ${testingEmail} (intended for: ${originalRecipient})`,
      );
      return true;
    } else {
      const errorData = await emailResponse.json();
      console.error("Failed to send email:", errorData);
      return false;
    }
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

async function getUserByName(name: string) {
  const allUsers = await kv.getByPrefix("user:");
  return allUsers.find(
    (user: any) =>
      user.name.toLowerCase() === name.toLowerCase(),
  );
}

// ============== USER INITIALIZATION ==============

// Initialize default users on first run
const initializeUsers = async () => {
  const usersExist = await kv.get("users_initialized");
  if (!usersExist) {
    const defaultUsers = [
      {
        id: "1",
        username: "admin",
        password: "P@ssw0rd",
        role: "admin",
        name: "Admin",
      },
      {
        id: "2",
        username: "kingsley",
        password: "P@ssw0rd",
        role: "admin",
        name: "Kingsley",
      },
      {
        id: "3",
        username: "lateef",
        password: "P@ssw0rd",
        role: "agent",
        name: "Lateef",
      },
      {
        id: "4",
        username: "kelvin",
        password: "P@ssw0rd",
        role: "agent",
        name: "Kelvin",
      },
      {
        id: "5",
        username: "mosun",
        password: "P@ssw0rd",
        role: "agent",
        name: "Mosun",
      },
    ];

    for (const user of defaultUsers) {
      await kv.set(`user:${user.username}`, user);
    }
    await kv.set("users_initialized", true);
    await kv.set("user_id_counter", 5);
  }
};

// Initialize demo data
const initializeDemoData = async () => {
  const demoDataExists = await kv.get("demo_data_initialized");
  if (!demoDataExists) {
    // Demo Assets (5 samples)
    const demoAssets = [
      {
        id: "1",
        assetName: "Dell Latitude 5520",
        serviceTag: "DELLAP-2024-001",
        product: "Dell Latitude 5520",
        productType: "Hardware",
        assetState: "In Use/Active",
        user: "Lateef",
        department: "FAS & PMG",
        acqDate: "2024-01-15",
        vendor: "Dell Technologies Nigeria",
        cost: 450000,
        rating: "4.5",
        os: "Windows 11 Pro",
        processor: "Intel Core i7-1165G7",
        ram: "16GB DDR4",
        manufacturer: "Dell Inc.",
        serialNumber: "SN-DELL-5520-001",
        site: "Andersen Place Lagos",
        function: "Business Laptop",
        warrantyExpiry: "2027-01-15",
        warrantyStartDate: "2024-01-15",
        createdAt: new Date("2024-01-15").toISOString(),
        updatedAt: new Date("2024-01-15").toISOString(),
      },
      {
        id: "2",
        assetName: "HP EliteBook 840",
        serviceTag: "HPLAP-2024-002",
        product: "HP EliteBook 840 G8",
        productType: "Hardware",
        assetState: "In Use/Active",
        user: "Kelvin",
        department: "ITS",
        acqDate: "2024-02-20",
        vendor: "HP Nigeria Limited",
        cost: 520000,
        rating: "5.0",
        os: "Windows 11 Pro",
        processor: "Intel Core i7-1185G7",
        ram: "32GB DDR4",
        manufacturer: "HP Inc.",
        serialNumber: "SN-HP-840-002",
        site: "Andersen Place Lagos",
        function: "IT Support Laptop",
        warrantyExpiry: "2027-02-20",
        warrantyStartDate: "2024-02-20",
        createdAt: new Date("2024-02-20").toISOString(),
        updatedAt: new Date("2024-02-20").toISOString(),
      },
      {
        id: "3",
        assetName: "LG 27-inch Monitor",
        serviceTag: "LGMON-2024-003",
        product: "LG 27UK850-W",
        productType: "Hardware",
        assetState: "In Use/Active",
        user: "Mosun",
        department: "HR",
        acqDate: "2024-03-10",
        vendor: "LG Electronics Nigeria",
        cost: 185000,
        rating: "4.8",
        os: "N/A",
        processor: "N/A",
        ram: "N/A",
        manufacturer: "LG Electronics",
        serialNumber: "SN-LG-27UK-003",
        site: "Andersen Place Lagos",
        function: "Display Monitor",
        warrantyExpiry: "2026-03-10",
        warrantyStartDate: "2024-03-10",
        createdAt: new Date("2024-03-10").toISOString(),
        updatedAt: new Date("2024-03-10").toISOString(),
      },
      {
        id: "4",
        assetName: "Cisco IP Phone 8861",
        serviceTag: "CISPH-2024-004",
        product: "Cisco IP Phone 8861",
        productType: "Hardware",
        assetState: "In Use/Active",
        user: "Lateef",
        department: "FAS & PMG",
        acqDate: "2024-04-05",
        vendor: "Cisco Nigeria",
        cost: 95000,
        rating: "4.2",
        os: "Cisco Firmware",
        processor: "N/A",
        ram: "N/A",
        manufacturer: "Cisco Systems",
        serialNumber: "SN-CISCO-8861-004",
        site: "Andersen Place Lagos",
        function: "VoIP Phone",
        warrantyExpiry: "2025-04-05",
        warrantyStartDate: "2024-04-05",
        createdAt: new Date("2024-04-05").toISOString(),
        updatedAt: new Date("2024-04-05").toISOString(),
      },
      {
        id: "5",
        assetName: "MacBook Pro 16-inch",
        serviceTag: "MBPRO-2024-005",
        product: "MacBook Pro 16-inch M3 Pro",
        productType: "Hardware",
        assetState: "Faulty",
        user: "Kingsley",
        department: "TP",
        acqDate: "2024-05-12",
        vendor: "Apple Authorized Reseller Nigeria",
        cost: 1250000,
        rating: "5.0",
        os: "macOS Sonoma 14.5",
        processor: "Apple M3 Pro 12-Core",
        ram: "32GB Unified Memory",
        manufacturer: "Apple Inc.",
        serialNumber: "SN-APPLE-MBP16-005",
        site: "Andersen Place Lagos",
        function: "Executive Laptop",
        warrantyExpiry: "2027-05-12",
        warrantyStartDate: "2024-05-12",
        createdAt: new Date("2024-05-12").toISOString(),
        updatedAt: new Date("2024-05-12").toISOString(),
      },
    ];

    // Demo Incidents (5 samples)
    const demoIncidents = [
      {
        id: "AND-INC-2025-001",
        title: "Laptop won't power on",
        description: "Dell Latitude 5520 not responding to power button. Battery indicator not lighting up.",
        priority: "High",
        status: "Open",
        reporter: "Lateef",
        assignedTo: "Kelvin",
        assetId: "1",
        createdAt: new Date("2025-01-05").toISOString(),
        updatedAt: new Date("2025-01-05").toISOString(),
      },
      {
        id: "AND-INC-2025-002",
        title: "Monitor flickering issue",
        description: "LG monitor experiencing intermittent flickering, especially when displaying dark content.",
        priority: "Medium",
        status: "In Progress",
        reporter: "Mosun",
        assignedTo: "Kelvin",
        assetId: "3",
        createdAt: new Date("2025-01-08").toISOString(),
        updatedAt: new Date("2025-01-10").toISOString(),
      },
      {
        id: "AND-INC-2025-003",
        title: "IP Phone no dial tone",
        description: "Cisco IP Phone showing registered status but no dial tone when handset is lifted.",
        priority: "High",
        status: "Open",
        reporter: "Lateef",
        assignedTo: "Kelvin",
        assetId: "4",
        createdAt: new Date("2025-01-12").toISOString(),
        updatedAt: new Date("2025-01-12").toISOString(),
      },
      {
        id: "AND-INC-2025-004",
        title: "MacBook keyboard malfunction",
        description: "Several keys on MacBook Pro keyboard are sticky and not registering keystrokes properly.",
        priority: "High",
        status: "Resolved",
        reporter: "Kingsley",
        assignedTo: "Kelvin",
        assetId: "5",
        resolution: "Keyboard replaced under AppleCare+ warranty",
        createdAt: new Date("2024-12-20").toISOString(),
        updatedAt: new Date("2025-01-03").toISOString(),
      },
      {
        id: "AND-INC-2025-005",
        title: "Slow laptop performance",
        description: "HP EliteBook running extremely slow, high disk usage, applications taking long to open.",
        priority: "Low",
        status: "In Progress",
        reporter: "Kelvin",
        assignedTo: "Kelvin",
        assetId: "2",
        createdAt: new Date("2025-01-15").toISOString(),
        updatedAt: new Date("2025-01-16").toISOString(),
      },
    ];

    // Demo Software (5 samples)
    const demoSoftware = [
      {
        id: "1",
        softwareName: "Microsoft Office 365",
        version: "2024",
        licenseKey: "XXXXX-XXXXX-XXXXX-XXXXX-XXXXX",
        vendor: "Microsoft Corporation",
        purchaseDate: "2024-01-10",
        expiryDate: "2025-01-10",
        cost: "85000",
        assignedTo: "Company Wide",
        totalLicenses: "50",
        usedLicenses: "48",
        status: "Active",
        createdAt: new Date("2024-01-10").toISOString(),
        updatedAt: new Date("2024-01-10").toISOString(),
      },
      {
        id: "2",
        softwareName: "Adobe Creative Cloud",
        version: "2024",
        licenseKey: "XXXXX-XXXXX-XXXXX-XXXXX-XXXXX",
        vendor: "Adobe Inc.",
        purchaseDate: "2024-02-15",
        expiryDate: "2025-02-15",
        cost: "320000",
        assignedTo: "Design Team",
        totalLicenses: "10",
        usedLicenses: "8",
        status: "Active",
        createdAt: new Date("2024-02-15").toISOString(),
        updatedAt: new Date("2024-02-15").toISOString(),
      },
      {
        id: "3",
        softwareName: "Zoom Pro",
        version: "5.17.5",
        licenseKey: "XXXXX-XXXXX-XXXXX-XXXXX-XXXXX",
        vendor: "Zoom Video Communications",
        purchaseDate: "2024-03-01",
        expiryDate: "2025-03-01",
        cost: "125000",
        assignedTo: "All Staff",
        totalLicenses: "25",
        usedLicenses: "25",
        status: "Active",
        createdAt: new Date("2024-03-01").toISOString(),
        updatedAt: new Date("2024-03-01").toISOString(),
      },
      {
        id: "4",
        softwareName: "AutoCAD 2024",
        version: "2024.1",
        licenseKey: "XXXXX-XXXXX-XXXXX-XXXXX-XXXXX",
        vendor: "Autodesk Inc.",
        purchaseDate: "2024-04-20",
        expiryDate: "2025-04-20",
        cost: "450000",
        assignedTo: "Engineering Department",
        totalLicenses: "5",
        usedLicenses: "5",
        status: "Active",
        createdAt: new Date("2024-04-20").toISOString(),
        updatedAt: new Date("2024-04-20").toISOString(),
      },
      {
        id: "5",
        softwareName: "Slack Business+",
        version: "4.36.140",
        licenseKey: "XXXXX-XXXXX-XXXXX-XXXXX-XXXXX",
        vendor: "Salesforce Inc.",
        purchaseDate: "2023-12-01",
        expiryDate: "2024-12-01",
        cost: "175000",
        assignedTo: "Company Wide",
        totalLicenses: "50",
        usedLicenses: "42",
        status: "Expired",
        createdAt: new Date("2023-12-01").toISOString(),
        updatedAt: new Date("2024-12-15").toISOString(),
      },
    ];

    // Demo Purchase Orders (5 samples)
    const demoPOs = [
      {
        poNumber: "PO-2025-0001",
        vendor: "Dell Technologies Nigeria",
        items: "10x Dell Latitude 5530 Laptops",
        totalAmount: "4500000",
        requestedBy: "Lateef",
        department: "IT",
        requestDate: "2025-01-05",
        status: "Pending Approval",
        approvalEmail: "ITsupport@ng.andersen.com",
        notes: "Quarterly hardware refresh for IT department",
        createdAt: new Date("2025-01-05").toISOString(),
        updatedAt: new Date("2025-01-05").toISOString(),
      },
      {
        poNumber: "PO-2025-0002",
        vendor: "HP Nigeria Limited",
        items: "15x HP EliteDisplay E27 Monitors",
        totalAmount: "2775000",
        requestedBy: "Mosun",
        department: "HR",
        requestDate: "2025-01-10",
        status: "Approved",
        approvalEmail: "ITsupport@ng.andersen.com",
        approvedBy: "Kingsley",
        approvalDate: "2025-01-12",
        notes: "Monitor upgrade for HR department",
        createdAt: new Date("2025-01-10").toISOString(),
        updatedAt: new Date("2025-01-12").toISOString(),
      },
      {
        poNumber: "PO-2025-0003",
        vendor: "Microsoft Nigeria",
        items: "25x Microsoft 365 Business Premium Licenses",
        totalAmount: "2125000",
        requestedBy: "Kelvin",
        department: "IT",
        requestDate: "2025-01-15",
        status: "Approved",
        approvalEmail: "ITsupport@ng.andersen.com",
        approvedBy: "Admin",
        approvalDate: "2025-01-16",
        notes: "Additional licenses for new hires in Q1 2025",
        createdAt: new Date("2025-01-15").toISOString(),
        updatedAt: new Date("2025-01-16").toISOString(),
      },
      {
        poNumber: "PO-2025-0004",
        vendor: "Cisco Nigeria",
        items: "20x Cisco IP Phone 8861 + Network Switches",
        totalAmount: "3500000",
        requestedBy: "Lateef",
        department: "Finance",
        requestDate: "2025-01-20",
        status: "Rejected",
        approvalEmail: "ITsupport@ng.andersen.com",
        rejectedBy: "Kingsley",
        rejectionDate: "2025-01-22",
        rejectionReason: "Budget exceeded for Q1. Resubmit in Q2.",
        notes: "Phone system upgrade for Finance department",
        createdAt: new Date("2025-01-20").toISOString(),
        updatedAt: new Date("2025-01-22").toISOString(),
      },
      {
        poNumber: "PO-2024-0125",
        vendor: "Apple Authorized Reseller Nigeria",
        items: "3x MacBook Pro 16-inch M3 Pro",
        totalAmount: "3750000",
        requestedBy: "Kingsley",
        department: "Management",
        requestDate: "2024-12-15",
        status: "Delivered",
        approvalEmail: "ITsupport@ng.andersen.com",
        approvedBy: "Admin",
        approvalDate: "2024-12-16",
        deliveryDate: "2025-01-05",
        notes: "Executive laptops for senior management",
        createdAt: new Date("2024-12-15").toISOString(),
        updatedAt: new Date("2025-01-05").toISOString(),
      },
    ];

    // Demo Asset Handovers (5 samples)
    const demoHandovers = [
      {
        id: "1",
        assetId: "1",
        assetName: "Dell Latitude 5520",
        serviceTag: "DELLAP-2024-001",
        fromUser: "Kelvin",
        toUser: "Lateef",
        department: "Finance",
        handoverDate: "2024-06-15",
        reason: "Department transfer",
        condition: "Good",
        accessories: "Charger, Laptop Bag",
        handoverBy: "Kelvin",
        receivedBy: "Lateef",
        status: "Completed",
        createdAt: new Date("2024-06-15").toISOString(),
        updatedAt: new Date("2024-06-15").toISOString(),
      },
      {
        id: "2",
        assetId: "3",
        assetName: "LG 27-inch Monitor",
        serviceTag: "LGMON-2024-003",
        fromUser: "Lateef",
        toUser: "Mosun",
        department: "HR",
        handoverDate: "2024-08-20",
        reason: "Office relocation",
        condition: "Excellent",
        accessories: "Power Cable, HDMI Cable, Stand",
        handoverBy: "Lateef",
        receivedBy: "Mosun",
        status: "Completed",
        createdAt: new Date("2024-08-20").toISOString(),
        updatedAt: new Date("2024-08-20").toISOString(),
      },
      {
        id: "3",
        assetId: "4",
        assetName: "Cisco IP Phone 8861",
        serviceTag: "CISPH-2024-004",
        fromUser: "Mosun",
        toUser: "Lateef",
        department: "Finance",
        handoverDate: "2024-09-10",
        reason: "Role change",
        condition: "Good",
        accessories: "Network Cable, Handset",
        handoverBy: "Mosun",
        receivedBy: "Lateef",
        status: "Completed",
        createdAt: new Date("2024-09-10").toISOString(),
        updatedAt: new Date("2024-09-10").toISOString(),
      },
      {
        id: "4",
        assetId: "2",
        assetName: "HP EliteBook 840",
        serviceTag: "HPLAP-2024-002",
        fromUser: "Lateef",
        toUser: "Kelvin",
        department: "IT",
        handoverDate: "2025-01-08",
        reason: "New assignment",
        condition: "Excellent",
        accessories: "Charger, Docking Station, Laptop Bag",
        handoverBy: "Lateef",
        receivedBy: "Kelvin",
        status: "Pending",
        createdAt: new Date("2025-01-08").toISOString(),
        updatedAt: new Date("2025-01-08").toISOString(),
      },
      {
        id: "5",
        assetId: "5",
        assetName: "MacBook Pro 16-inch",
        serviceTag: "MBPRO-2024-005",
        fromUser: "Admin",
        toUser: "Kingsley",
        department: "Management",
        handoverDate: "2024-05-12",
        reason: "New purchase assignment",
        condition: "New",
        accessories: "Charger, USB-C Cable, Original Box",
        handoverBy: "Admin",
        receivedBy: "Kingsley",
        status: "Completed",
        createdAt: new Date("2024-05-12").toISOString(),
        updatedAt: new Date("2024-05-12").toISOString(),
      },
    ];

    // Demo Deregistrations (5 samples)
    const demoDeregistrations = [
      {
        id: "1",
        assetName: "Dell Inspiron 15",
        serviceTag: "DELLOLD-2020-001",
        productType: "Laptop",
        user: "Former Employee",
        department: "Finance",
        reason: "End of Life",
        deregistrationDate: "2024-11-15",
        condition: "Poor",
        disposalMethod: "Recycling",
        approvedBy: "Kingsley",
        status: "Completed",
        notes: "5-year-old laptop, battery swollen, not economical to repair",
        createdAt: new Date("2024-11-15").toISOString(),
        updatedAt: new Date("2024-11-15").toISOString(),
      },
      {
        id: "2",
        assetName: "HP LaserJet Pro M404",
        serviceTag: "HPPRINT-2019-005",
        productType: "Printer",
        user: "IT Department",
        department: "IT",
        reason: "Replaced with newer model",
        deregistrationDate: "2024-10-20",
        condition: "Fair",
        disposalMethod: "Donation",
        approvedBy: "Admin",
        status: "Completed",
        notes: "Still functional, donated to local school",
        createdAt: new Date("2024-10-20").toISOString(),
        updatedAt: new Date("2024-10-20").toISOString(),
      },
      {
        id: "3",
        assetName: "Samsung 24-inch Monitor",
        serviceTag: "SAMMON-2018-012",
        productType: "Monitor",
        user: "HR Department",
        department: "HR",
        reason: "Damaged",
        deregistrationDate: "2024-12-05",
        condition: "Damaged",
        disposalMethod: "Recycling",
        approvedBy: "Kingsley",
        status: "Completed",
        notes: "Screen cracked, no longer usable",
        createdAt: new Date("2024-12-05").toISOString(),
        updatedAt: new Date("2024-12-05").toISOString(),
      },
      {
        id: "4",
        assetName: "Lenovo ThinkPad T480",
        serviceTag: "LENOVOLD-2019-008",
        productType: "Laptop",
        user: "Kelvin",
        department: "IT",
        reason: "Upgrade",
        deregistrationDate: "2025-01-10",
        condition: "Good",
        disposalMethod: "Resale",
        approvedBy: "Admin",
        status: "Pending",
        notes: "Good condition, to be sold in bulk with other devices",
        createdAt: new Date("2025-01-10").toISOString(),
        updatedAt: new Date("2025-01-10").toISOString(),
      },
      {
        id: "5",
        assetName: "Polycom VoIP Phone",
        serviceTag: "POLYPH-2017-015",
        productType: "Phone",
        user: "Finance Department",
        department: "Finance",
        reason: "End of Life",
        deregistrationDate: "2025-01-18",
        condition: "Poor",
        disposalMethod: "Recycling",
        approvedBy: "Kingsley",
        status: "Approved",
        notes: "8 years old, incompatible with new phone system",
        createdAt: new Date("2025-01-18").toISOString(),
        updatedAt: new Date("2025-01-18").toISOString(),
      },
    ];

    // Demo Knowledge Base Posts (5 samples)
    const demoKBPosts = [
      {
        id: "1",
        title: "How to Connect to Office Wi-Fi",
        category: "Network",
        content: "Step-by-step guide to connect to the Andersen office Wi-Fi network:\n\n1. Open your device's Wi-Fi settings\n2. Select 'Andersen-Secure' network\n3. Enter your company email as username\n4. Enter your network password (same as your computer login)\n5. Accept the security certificate if prompted\n\nIf you encounter any issues, contact IT support.",
        author: "Kelvin",
        tags: "wifi, network, connectivity",
        views: 245,
        helpful: 38,
        status: "Published",
        createdAt: new Date("2024-10-15").toISOString(),
        updatedAt: new Date("2024-10-15").toISOString(),
      },
      {
        id: "2",
        title: "Password Reset Procedure",
        category: "Account",
        content: "If you need to reset your password:\n\n1. Go to the login page\n2. Click 'Forgot Password' link\n3. Enter your username\n4. Check your email for reset instructions\n5. Follow the link in the email\n6. Create a new password (must be alphanumeric with symbols, 6-12 characters)\n\nNote: Passwords expire every 90 days for security purposes.",
        author: "Kelvin",
        tags: "password, security, login",
        views: 312,
        helpful: 56,
        status: "Published",
        createdAt: new Date("2024-09-20").toISOString(),
        updatedAt: new Date("2024-11-05").toISOString(),
      },
      {
        id: "3",
        title: "Requesting New Hardware",
        category: "Hardware",
        content: "To request new hardware (laptop, monitor, phone, etc.):\n\n1. Log into the Asset Management System\n2. Navigate to Purchase Orders module\n3. Click 'Create New PO'\n4. Fill in all required details:\n   - Vendor name\n   - Item description and quantity\n   - Estimated cost\n   - Justification for purchase\n5. Submit for approval\n\nApprovals typically take 2-3 business days. You'll receive an email notification when approved/rejected.",
        author: "Lateef",
        tags: "hardware, purchase, procurement",
        views: 189,
        helpful: 42,
        status: "Published",
        createdAt: new Date("2024-11-10").toISOString(),
        updatedAt: new Date("2024-11-10").toISOString(),
      },
      {
        id: "4",
        title: "Reporting IT Issues",
        category: "Support",
        content: "When experiencing IT issues:\n\n1. Access the Incident Reports module\n2. Click 'Create New Incident'\n3. Provide detailed information:\n   - Clear title describing the issue\n   - Detailed description of the problem\n   - Steps to reproduce (if applicable)\n   - Priority level (Low/Medium/High)\n   - Related asset if applicable\n4. Submit the incident\n\nYou'll receive an auto-generated incident ID (e.g., AND-INC-2025-001). IT will respond within:\n- High priority: 2 hours\n- Medium priority: 4 hours\n- Low priority: 24 hours",
        author: "Kelvin",
        tags: "support, incident, troubleshooting",
        views: 428,
        helpful: 87,
        status: "Published",
        createdAt: new Date("2024-08-15").toISOString(),
        updatedAt: new Date("2024-12-01").toISOString(),
      },
      {
        id: "5",
        title: "Software License Management",
        category: "Software",
        content: "Understanding software licenses at Andersen:\n\n**Available Software:**\n- Microsoft 365: All employees\n- Adobe Creative Cloud: Design team only\n- Zoom Pro: All employees\n- AutoCAD: Engineering team only\n\n**Requesting Software:**\n1. Check if you already have access\n2. Contact IT if you need additional software\n3. Provide business justification\n4. Wait for approval from your department head\n\n**License Compliance:**\n- Never share license keys\n- Don't install personal software on company devices\n- Report unused licenses so they can be reassigned\n- Licenses are audited quarterly",
        author: "Lateef",
        tags: "software, licenses, compliance",
        views: 156,
        helpful: 29,
        status: "Published",
        createdAt: new Date("2024-12-01").toISOString(),
        updatedAt: new Date("2024-12-01").toISOString(),
      },
    ];

    // Demo IT Issue Logs (5 samples)
    const demoITIssues = [
      {
        id: "1",
        issueId: "AND-ISSUE-2025-001",
        title: "Email Server Outage",
        description: "Email server experiencing complete outage. Users unable to send or receive emails. Error message: 'Cannot connect to mail server'.",
        category: "Email Issue",
        severity: "Critical",
        status: "Resolved",
        reportedBy: "Mosun",
        assignedTo: "Kelvin",
        affectedSystem: "Microsoft Exchange Server",
        location: "Andersen Place Lagos",
        reportedDate: "2025-01-10",
        resolvedDate: "2025-01-10",
        downtime: "3 hours",
        rootCause: "Exchange server service stopped due to memory leak",
        resolution: "Restarted Exchange services and increased memory allocation. Implemented monitoring for early detection.",
        preventiveAction: "Set up automated memory monitoring and alerts. Schedule weekly server health checks.",
        createdAt: new Date("2025-01-10").toISOString(),
        updatedAt: new Date("2025-01-10").toISOString(),
      },
      {
        id: "2",
        issueId: "AND-ISSUE-2025-002",
        title: "Network Connectivity Issue - Finance Floor",
        description: "Intermittent network connectivity on the Finance floor. Users experiencing frequent disconnections from shared drives and applications.",
        category: "Network Issue",
        severity: "High",
        status: "In Progress",
        reportedBy: "Lateef",
        assignedTo: "Kelvin",
        affectedSystem: "Finance Floor Network Switch",
        location: "Andersen Place Lagos",
        reportedDate: "2025-01-18",
        downtime: "Intermittent - 30% packet loss",
        rootCause: "Investigation ongoing - suspected faulty network switch",
        resolution: "",
        preventiveAction: "",
        createdAt: new Date("2025-01-18").toISOString(),
        updatedAt: new Date("2025-01-19").toISOString(),
      },
      {
        id: "3",
        issueId: "AND-ISSUE-2025-003",
        title: "Database Performance Degradation",
        description: "Asset management database queries taking significantly longer than normal. Application response time increased from 2s to 30s.",
        category: "Database Issue",
        severity: "High",
        status: "Resolved",
        reportedBy: "Kingsley",
        assignedTo: "Lateef",
        affectedSystem: "PostgreSQL Asset DB",
        location: "Data Center",
        reportedDate: "2024-12-15",
        resolvedDate: "2024-12-16",
        downtime: "12 hours degraded performance",
        rootCause: "Missing database indexes on frequently queried tables causing full table scans",
        resolution: "Created proper indexes on asset and handover tables. Ran VACUUM ANALYZE to optimize query planner.",
        preventiveAction: "Implement quarterly database performance audits. Set up query performance monitoring.",
        createdAt: new Date("2024-12-15").toISOString(),
        updatedAt: new Date("2024-12-16").toISOString(),
      },
      {
        id: "4",
        issueId: "AND-ISSUE-2025-004",
        title: "Ransomware Security Alert",
        description: "Security system detected suspicious encrypted file activity on workstation in HR department. Potential ransomware threat.",
        category: "Security Incident",
        severity: "Critical",
        status: "Closed",
        reportedBy: "Security System",
        assignedTo: "Kingsley",
        affectedSystem: "HR Workstation #12",
        location: "Andersen Place Lagos",
        reportedDate: "2024-11-20",
        resolvedDate: "2024-11-20",
        downtime: "1 hour - workstation isolated",
        rootCause: "User opened phishing email attachment. Malware caught by endpoint protection before encryption.",
        resolution: "Isolated workstation immediately. Ran full malware scan and removal. Restored from backup. Changed all user credentials.",
        preventiveAction: "Conducted security awareness training for all staff. Implemented additional email filtering rules. Enhanced endpoint protection policies.",
        createdAt: new Date("2024-11-20").toISOString(),
        updatedAt: new Date("2024-11-21").toISOString(),
      },
      {
        id: "5",
        issueId: "AND-ISSUE-2025-005",
        title: "Printer Queue Stuck - Shared Printer",
        description: "Shared office printer queue stuck with multiple pending jobs. Users unable to print. Printer shows 'Ready' status but jobs not processing.",
        category: "Hardware Failure",
        severity: "Low",
        status: "Open",
        reportedBy: "Mosun",
        assignedTo: "Lateef",
        affectedSystem: "HP LaserJet Pro M404 - 3rd Floor",
        location: "Andersen Place Lagos",
        reportedDate: "2025-01-20",
        downtime: "4 hours",
        rootCause: "",
        resolution: "",
        preventiveAction: "",
        createdAt: new Date("2025-01-20").toISOString(),
        updatedAt: new Date("2025-01-20").toISOString(),
      },
    ];

    // Demo Notifications (3 per user - mix of read/unread)
    const demoNotifications = [
      // Lateef notifications
      {
        id: "notif-1",
        userId: "1",
        title: "New Asset Assigned",
        message: "Dell Latitude 5530 (AND-AST-2025-001) has been assigned to you.",
        type: "info",
        read: false,
        createdAt: new Date("2025-01-18T10:30:00").toISOString(),
      },
      {
        id: "notif-2",
        userId: "1",
        title: "Incident Report Updated",
        message: "Your incident AND-INC-2025-002 has been resolved by IT team.",
        type: "success",
        read: false,
        createdAt: new Date("2025-01-17T14:20:00").toISOString(),
      },
      {
        id: "notif-3",
        userId: "1",
        title: "Software License Expiring",
        message: "Your Adobe Creative Cloud license expires in 15 days. Please renew.",
        type: "warning",
        read: true,
        createdAt: new Date("2025-01-15T09:00:00").toISOString(),
      },
      // Kelvin notifications
      {
        id: "notif-4",
        userId: "2",
        title: "IT Issue Assigned",
        message: "You have been assigned to IT issue AND-ISSUE-2025-002: Network Connectivity Issue.",
        type: "info",
        read: false,
        createdAt: new Date("2025-01-19T11:45:00").toISOString(),
      },
      {
        id: "notif-5",
        userId: "2",
        title: "Purchase Order Approved",
        message: "Purchase Order PO-2025-0003 has been approved by Admin.",
        type: "success",
        read: true,
        createdAt: new Date("2025-01-16T16:30:00").toISOString(),
      },
      {
        id: "notif-6",
        userId: "2",
        title: "Asset Handover Pending",
        message: "Asset handover AND-HO-2025-004 requires your approval.",
        type: "warning",
        read: false,
        createdAt: new Date("2025-01-14T13:15:00").toISOString(),
      },
      // Mosun notifications
      {
        id: "notif-7",
        userId: "3",
        title: "Knowledge Base Post Published",
        message: "Your post 'Software License Management' has been published.",
        type: "success",
        read: true,
        createdAt: new Date("2025-01-19T08:00:00").toISOString(),
      },
      {
        id: "notif-8",
        userId: "3",
        title: "Asset Maintenance Due",
        message: "MacBook Pro M2 (AND-AST-2025-003) is due for maintenance inspection.",
        type: "warning",
        read: false,
        createdAt: new Date("2025-01-18T15:00:00").toISOString(),
      },
      {
        id: "notif-9",
        userId: "3",
        title: "IT Issue Logged",
        message: "Your IT issue AND-ISSUE-2025-005 has been logged and assigned to Lateef.",
        type: "info",
        read: true,
        createdAt: new Date("2025-01-20T10:30:00").toISOString(),
      },
      // Kingsley notifications
      {
        id: "notif-10",
        userId: "4",
        title: "Critical Security Alert",
        message: "Ransomware threat detected and neutralized. Review incident AND-ISSUE-2025-004.",
        type: "error",
        read: true,
        createdAt: new Date("2024-11-20T14:00:00").toISOString(),
      },
      {
        id: "notif-11",
        userId: "4",
        title: "Purchase Order Requires Approval",
        message: "Purchase Order PO-2025-0005 from Lateef awaits your approval.",
        type: "warning",
        read: false,
        createdAt: new Date("2025-01-19T12:00:00").toISOString(),
      },
      {
        id: "notif-12",
        userId: "4",
        title: "Monthly Report Available",
        message: "Asset management report for December 2024 is ready for review.",
        type: "info",
        read: false,
        createdAt: new Date("2025-01-05T09:00:00").toISOString(),
      },
      // Admin notifications
      {
        id: "notif-13",
        userId: "5",
        title: "System Backup Completed",
        message: "Daily system backup completed successfully at 02:00 AM.",
        type: "success",
        read: true,
        createdAt: new Date("2025-01-20T02:00:00").toISOString(),
      },
      {
        id: "notif-14",
        userId: "5",
        title: "New User Registration",
        message: "New agent 'Mosun' has been added to the system.",
        type: "info",
        read: true,
        createdAt: new Date("2024-12-15T10:00:00").toISOString(),
      },
      {
        id: "notif-15",
        userId: "5",
        title: "Database Performance Alert",
        message: "Database query performance degraded. Issue AND-ISSUE-2025-003 created.",
        type: "warning",
        read: true,
        createdAt: new Date("2024-12-15T11:30:00").toISOString(),
      },
    ];

    // Save all demo data
    for (const asset of demoAssets) {
      await kv.set(`asset:${asset.id}`, asset);
    }
    await kv.set("asset_id_counter", 5);

    for (const incident of demoIncidents) {
      await kv.set(`incident:${incident.id}`, incident);
    }
    await kv.set("incident_counter", 5);

    for (const software of demoSoftware) {
      await kv.set(`software:${software.id}`, software);
    }
    await kv.set("software_id_counter", 5);

    for (const po of demoPOs) {
      await kv.set(`po:${po.poNumber}`, po);
    }
    await kv.set("po_counter", 4);

    for (const handover of demoHandovers) {
      await kv.set(`handover:${handover.id}`, handover);
    }
    await kv.set("handover_id_counter", 5);

    for (const dereg of demoDeregistrations) {
      await kv.set(`deregistration:${dereg.id}`, dereg);
    }
    await kv.set("deregistration_id_counter", 5);

    for (const post of demoKBPosts) {
      await kv.set(`kb_post:${post.id}`, post);
    }
    await kv.set("kb_post_id_counter", 5);

    for (const issue of demoITIssues) {
      await kv.set(`it_issue:${issue.id}`, issue);
    }
    await kv.set("it_issue_counter", 5);

    for (const notification of demoNotifications) {
      await kv.set(`notification:${notification.id}`, notification);
    }

    await kv.set("demo_data_initialized", true);
    console.log("✅ Demo data initialized successfully!");
  }
};

// Initialize on startup
initializeUsers();
initializeDemoData();

// Health check endpoint
app.get("/make-server-5921d82e/health", (c) => {
  return c.json({ status: "ok" });
});

// ============== AUTH ENDPOINTS ==============

app.post("/make-server-5921d82e/auth/login", async (c) => {
  try {
    const { username, password } = await c.req.json();
    const user = await kv.get(`user:${username.toLowerCase()}`);

    if (!user || user.password !== password) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return c.json({ user: userWithoutPassword });
  } catch (error) {
    console.error("Login error:", error);
    return c.json({ error: "Login failed" }, 500);
  }
});

app.post(
  "/make-server-5921d82e/auth/change-password",
  async (c) => {
    try {
      const { username, currentPassword, newPassword } =
        await c.req.json();
      const user = await kv.get(
        `user:${username.toLowerCase()}`,
      );

      if (!user || user.password !== currentPassword) {
        return c.json(
          { error: "Invalid current password" },
          401,
        );
      }

      user.password = newPassword;
      await kv.set(`user:${username.toLowerCase()}`, user);

      return c.json({ success: true });
    } catch (error) {
      console.error("Change password error:", error);
      return c.json(
        { error: "Failed to change password" },
        500,
      );
    }
  },
);

app.post(
  "/make-server-5921d82e/auth/create-user",
  async (c) => {
    try {
      const { adminUsername, username, password, role, name } =
        await c.req.json();

      // Check if requester is admin
      const admin = await kv.get(
        `user:${adminUsername.toLowerCase()}`,
      );
      if (!admin || admin.role !== "admin") {
        return c.json(
          { error: "Only admins can create users" },
          403,
        );
      }

      // Check if user already exists
      const existingUser = await kv.get(
        `user:${username.toLowerCase()}`,
      );
      if (existingUser) {
        return c.json({ error: "User already exists" }, 400);
      }

      // Create new user
      const counter = (await kv.get("user_id_counter")) || 5;
      const newUserId = counter + 1;

      const newUser = {
        id: String(newUserId),
        username: username.toLowerCase(),
        password: password || "P@ssw0rd",
        role,
        name,
      };

      await kv.set(`user:${username.toLowerCase()}`, newUser);
      await kv.set("user_id_counter", newUserId);

      const { password: _, ...userWithoutPassword } = newUser;
      return c.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Create user error:", error);
      return c.json({ error: "Failed to create user" }, 500);
    }
  },
);

app.get("/make-server-5921d82e/users", async (c) => {
  try {
    const users = await kv.getByPrefix("user:");
    const usersWithoutPasswords = users.map(
      ({ password, ...user }) => user,
    );
    return c.json({ users: usersWithoutPasswords });
  } catch (error) {
    console.error("Get users error:", error);
    return c.json({ error: "Failed to get users" }, 500);
  }
});

// ============== USER MANAGEMENT ENDPOINTS ==============

// Create new user (admin only)
app.post("/make-server-5921d82e/users", async (c) => {
  try {
    const { username, name, role, email, password } =
      await c.req.json();

    // Check if user already exists
    const existingUser = await kv.get(
      `user:${username.toLowerCase()}`,
    );
    if (existingUser) {
      return c.json({ error: "Username already exists" }, 400);
    }

    // Create new user
    const counter = (await kv.get("user_id_counter")) || 5;
    const newUserId = counter + 1;

    const newUser = {
      id: String(newUserId),
      username: username.toLowerCase(),
      password: password || "P@ssw0rd",
      role,
      name,
      email: email || undefined,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`user:${username.toLowerCase()}`, newUser);
    await kv.set("user_id_counter", newUserId);

    const { password: _, ...userWithoutPassword } = newUser;
    return c.json({ user: userWithoutPassword });
  } catch (error) {
    console.error("Create user error:", error);
    return c.json({ error: "Failed to create user" }, 500);
  }
});

// Update user profile (admin only)
app.put("/make-server-5921d82e/users/:id", async (c) => {
  try {
    const userId = c.req.param("id");
    const { name, role, email } = await c.req.json();

    // Find user by ID
    const allUsers = await kv.getByPrefix("user:");
    const user = allUsers.find((u) => u.id === userId);

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    // Update user
    user.name = name;
    user.role = role;
    user.email = email || undefined;

    await kv.set(`user:${user.username}`, user);

    const { password: _, ...userWithoutPassword } = user;
    return c.json({ user: userWithoutPassword });
  } catch (error) {
    console.error("Update user error:", error);
    return c.json({ error: "Failed to update user" }, 500);
  }
});

// Change user password (admin only)
app.put(
  "/make-server-5921d82e/users/:id/password",
  async (c) => {
    try {
      const userId = c.req.param("id");
      const { password } = await c.req.json();

      if (!password || password.length < 6) {
        return c.json(
          { error: "Password must be at least 6 characters" },
          400,
        );
      }

      // Find user by ID
      const allUsers = await kv.getByPrefix("user:");
      const user = allUsers.find((u) => u.id === userId);

      if (!user) {
        return c.json({ error: "User not found" }, 404);
      }

      // Update password
      user.password = password;
      await kv.set(`user:${user.username}`, user);

      return c.json({ success: true });
    } catch (error) {
      console.error("Change password error:", error);
      return c.json(
        { error: "Failed to change password" },
        500,
      );
    }
  },
);

// Delete user (admin only)
app.delete("/make-server-5921d82e/users/:id", async (c) => {
  try {
    const userId = c.req.param("id");
    console.log("Delete user request for ID:", userId);

    // Find user by ID
    const allUsers = await kv.getByPrefix("user:");
    console.log("Total users found:", allUsers.length);
    console.log(
      "All user IDs:",
      allUsers.map((u) => u.id),
    );

    const user = allUsers.find((u) => u.id === userId);

    if (!user) {
      console.log("User not found with ID:", userId);
      return c.json({ error: "User not found" }, 404);
    }

    console.log(
      "Found user to delete:",
      user.username,
      "with ID:",
      user.id,
    );

    // Prevent deleting the last admin
    const admins = allUsers.filter((u) => u.role === "admin");
    if (user.role === "admin" && admins.length <= 1) {
      console.log("Cannot delete last admin");
      return c.json(
        { error: "Cannot delete the last admin user" },
        400,
      );
    }

    // Delete user - check both possible key formats
    // Old format: user:username
    // New format: user:userId (from invite)
    console.log(
      "Deleting user from KV with key:",
      `user:${user.username}`,
    );
    await kv.del(`user:${user.username}`);

    // Also try deleting by userId in case it's stored that way
    if (user.id !== user.username) {
      console.log(
        "Also trying to delete with userId key:",
        `user:${user.id}`,
      );
      await kv.del(`user:${user.id}`);
    }

    console.log("User deleted successfully");

    return c.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    return c.json(
      { error: `Failed to delete user: ${error.message}` },
      500,
    );
  }
});

// Send invitation email
app.post("/make-server-5921d82e/users/invite", async (c) => {
  try {
    const { email, role } = await c.req.json();

    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }

    // Generate a temporary username and password for the invited user
    const username = email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    const tempPassword =
      Math.random().toString(36).slice(-10) +
      Math.random().toString(36).slice(-10).toUpperCase();

    // Create the user account
    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newUser = {
      id: userId,
      username: username,
      name: email.split("@")[0], // Use email prefix as name initially
      role: role || "agent",
      email: email,
      password: tempPassword, // Store temporarily - user should change on first login
      createdAt: new Date().toISOString(),
    };

    await kv.set(`user:${userId}`, newUser);

    // Try to send email if RESEND_API_KEY is configured
    const emailSent = await sendEmail({
      to: email,
      subject: "You've been invited to Asset Management System",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Asset Management System</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                🛡️ Asset Management System
              </h1>
              <p style="margin: 10px 0 0; color: #dbeafe; font-size: 16px;">
                You've been invited to join our platform
              </p>
            </div>
            
            <!-- Content -->
            <div style="background-color: #ffffff; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Hello,
              </p>
              
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                You've been invited to join our <strong>Asset Management System</strong> as a <strong style="color: ${role === "admin" ? "#7c3aed" : "#2563eb"};">${role === "admin" ? "Administrator" : "Agent"}</strong>.
              </p>
              
              <!-- Credentials Box -->
              <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-left: 4px solid #2563eb; padding: 24px; border-radius: 8px; margin: 24px 0;">
                <h2 style="margin: 0 0 16px; color: #1e40af; font-size: 18px; font-weight: 600;">
                  🔑 Your Login Credentials
                </h2>
                
                <div style="margin-bottom: 12px;">
                  <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                    Username
                  </div>
                  <div style="background-color: #ffffff; padding: 12px; border-radius: 6px; font-family: 'Courier New', monospace; font-size: 15px; color: #1f2937; font-weight: 600; border: 1px solid #cbd5e1;">
                    ${username}
                  </div>
                </div>
                
                <div style="margin-bottom: 0;">
                  <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                    Temporary Password
                  </div>
                  <div style="background-color: #ffffff; padding: 12px; border-radius: 6px; font-family: 'Courier New', monospace; font-size: 15px; color: #1f2937; font-weight: 600; border: 1px solid #cbd5e1;">
                    ${tempPassword}
                  </div>
                </div>
              </div>
              
              <!-- Security Notice -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 24px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                  <strong>🔒 Security Notice:</strong> Please log in and change your password immediately for security purposes. This is a temporary password.
                </p>
              </div>
              
              <p style="margin: 24px 0 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Click the button below to access the system and get started:
              </p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${Deno.env.get("APP_URL") || "your-app-url"}" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);">
                  Access Asset Management System →
                </a>
              </div>
              
              <!-- Footer Note -->
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #9ca3af; font-size: 13px; line-height: 1.5;">
                  If you didn't expect this invitation or have any questions, please contact your administrator.
                </p>
                <p style="margin: 12px 0 0; color: #9ca3af; font-size: 13px;">
                  <strong>Email:</strong> ${email}
                </p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 24px; padding: 20px;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Asset Management System. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    return c.json({
      success: true,
      emailSent: emailSent,
      message: emailSent
        ? `Invitation email sent to ${email}`
        : "User created. Please share credentials manually.",
      credentials: {
        email: email,
        username: username,
        password: tempPassword,
        role: role,
        emailSent: emailSent,
      },
    });
  } catch (error) {
    console.error("Send invite error:", error);
    return c.json({ error: "Failed to send invitation" }, 500);
  }
});

// ============== ASSETS ENDPOINTS ==============

app.get("/make-server-5921d82e/assets", async (c) => {
  try {
    const assets = await kv.getByPrefix("asset:");
    return c.json({ assets });
  } catch (error) {
    console.error("Get assets error:", error);
    return c.json({ error: "Failed to get assets" }, 500);
  }
});

app.get("/make-server-5921d82e/assets/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const asset = await kv.get(`asset:${id}`);
    if (!asset) {
      return c.json({ error: "Asset not found" }, 404);
    }
    return c.json({ asset });
  } catch (error) {
    console.error("Get asset error:", error);
    return c.json({ error: "Failed to get asset" }, 500);
  }
});

app.post("/make-server-5921d82e/assets", async (c) => {
  try {
    const assetData = await c.req.json();
    const counter = (await kv.get("asset_id_counter")) || 0;
    const newId = counter + 1;

    const asset = {
      id: String(newId),
      ...assetData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`asset:${newId}`, asset);
    await kv.set("asset_id_counter", newId);

    return c.json({ asset });
  } catch (error) {
    console.error("Create asset error:", error);
    return c.json({ error: "Failed to create asset" }, 500);
  }
});

app.put("/make-server-5921d82e/assets/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const updates = await c.req.json();

    const asset = await kv.get(`asset:${id}`);
    if (!asset) {
      return c.json({ error: "Asset not found" }, 404);
    }

    const updatedAsset = {
      ...asset,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`asset:${id}`, updatedAsset);
    return c.json({ asset: updatedAsset });
  } catch (error) {
    console.error("Update asset error:", error);
    return c.json({ error: "Failed to update asset" }, 500);
  }
});

app.delete("/make-server-5921d82e/assets/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await kv.del(`asset:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.error("Delete asset error:", error);
    return c.json({ error: "Failed to delete asset" }, 500);
  }
});

// ============== INCIDENTS ENDPOINTS ==============

app.get("/make-server-5921d82e/incidents", async (c) => {
  try {
    const incidents = await kv.getByPrefix("incident:");
    return c.json({ incidents });
  } catch (error) {
    console.error("Get incidents error:", error);
    return c.json({ error: "Failed to get incidents" }, 500);
  }
});

app.post("/make-server-5921d82e/incidents", async (c) => {
  try {
    const incidentData = await c.req.json();
    const counter = (await kv.get("incident_counter")) || 0;
    const newCounter = counter + 1;

    // Generate incident ID like AND-INC-2025-001
    const year = new Date().getFullYear();
    const incidentId = `AND-INC-${year}-${String(newCounter).padStart(3, "0")}`;

    const incident = {
      id: incidentId,
      ...incidentData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`incident:${incidentId}`, incident);
    await kv.set("incident_counter", newCounter);

    return c.json({ incident });
  } catch (error) {
    console.error("Create incident error:", error);
    return c.json({ error: "Failed to create incident" }, 500);
  }
});

app.put("/make-server-5921d82e/incidents/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const updates = await c.req.json();

    const incident = await kv.get(`incident:${id}`);
    if (!incident) {
      return c.json({ error: "Incident not found" }, 404);
    }

    const updatedIncident = {
      ...incident,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`incident:${id}`, updatedIncident);
    return c.json({ incident: updatedIncident });
  } catch (error) {
    console.error("Update incident error:", error);
    return c.json({ error: "Failed to update incident" }, 500);
  }
});

app.delete("/make-server-5921d82e/incidents/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await kv.del(`incident:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.error("Delete incident error:", error);
    return c.json({ error: "Failed to delete incident" }, 500);
  }
});

// ============== SOFTWARE ENDPOINTS ==============

app.get("/make-server-5921d82e/software", async (c) => {
  try {
    const software = await kv.getByPrefix("software:");
    return c.json({ software });
  } catch (error) {
    console.error("Get software error:", error);
    return c.json({ error: "Failed to get software" }, 500);
  }
});

app.post("/make-server-5921d82e/software", async (c) => {
  try {
    const softwareData = await c.req.json();
    const counter = (await kv.get("software_id_counter")) || 0;
    const newId = counter + 1;

    const software = {
      id: String(newId),
      ...softwareData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`software:${newId}`, software);
    await kv.set("software_id_counter", newId);

    return c.json({ software });
  } catch (error) {
    console.error("Create software error:", error);
    return c.json({ error: "Failed to create software" }, 500);
  }
});

app.put("/make-server-5921d82e/software/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const updates = await c.req.json();

    const software = await kv.get(`software:${id}`);
    if (!software) {
      return c.json({ error: "Software not found" }, 404);
    }

    const updatedSoftware = {
      ...software,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`software:${id}`, updatedSoftware);
    return c.json({ software: updatedSoftware });
  } catch (error) {
    console.error("Update software error:", error);
    return c.json({ error: "Failed to update software" }, 500);
  }
});

app.delete("/make-server-5921d82e/software/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await kv.del(`software:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.error("Delete software error:", error);
    return c.json({ error: "Failed to delete software" }, 500);
  }
});

// ============== IT ISSUE LOGS ENDPOINTS ==============

app.get("/make-server-5921d82e/it-issue-logs", async (c) => {
  try {
    const issues = await kv.getByPrefix("it_issue:");
    return c.json({ issues });
  } catch (error) {
    console.error("Get IT issue logs error:", error);
    return c.json({ error: "Failed to get IT issue logs" }, 500);
  }
});

// Alias endpoint for dashboard
app.get("/make-server-5921d82e/it-issues", async (c) => {
  try {
    const issues = await kv.getByPrefix("it_issue:");
    return c.json({ issues });
  } catch (error) {
    console.error("Get IT issues error:", error);
    return c.json({ error: "Failed to get IT issues" }, 500);
  }
});

app.post("/make-server-5921d82e/it-issue-logs", async (c) => {
  try {
    const issueData = await c.req.json();
    const counter = (await kv.get("it_issue_counter")) || 0;
    const newCounter = counter + 1;

    const issueId = `AND-ISSUE-${new Date().getFullYear()}-${String(newCounter).padStart(3, "0")}`;
    const id = `${Date.now()}-${newCounter}`;

    const issue = {
      id,
      issueId,
      ...issueData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`it_issue:${id}`, issue);
    await kv.set("it_issue_counter", newCounter);
    return c.json({ issue });
  } catch (error) {
    console.error("Create IT issue log error:", error);
    return c.json({ error: "Failed to create IT issue log" }, 500);
  }
});

app.put("/make-server-5921d82e/it-issue-logs/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const updates = await c.req.json();

    const issue = await kv.get(`it_issue:${id}`);
    if (!issue) {
      return c.json({ error: "IT issue log not found" }, 404);
    }

    const updatedIssue = {
      ...issue,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`it_issue:${id}`, updatedIssue);
    return c.json({ issue: updatedIssue });
  } catch (error) {
    console.error("Update IT issue log error:", error);
    return c.json({ error: "Failed to update IT issue log" }, 500);
  }
});

app.delete("/make-server-5921d82e/it-issue-logs/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await kv.del(`it_issue:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.error("Delete IT issue log error:", error);
    return c.json({ error: "Failed to delete IT issue log" }, 500);
  }
});

// ============== PURCHASE ORDERS ENDPOINTS ==============

app.get("/make-server-5921d82e/purchase-orders", async (c) => {
  try {
    const pos = await kv.getByPrefix("po:");
    return c.json({ purchaseOrders: pos });
  } catch (error) {
    console.error("Get purchase orders error:", error);
    return c.json(
      { error: "Failed to get purchase orders" },
      500,
    );
  }
});

app.post("/make-server-5921d82e/purchase-orders", async (c) => {
  try {
    const poData = await c.req.json();
    const counter = (await kv.get("po_counter")) || 0;
    const newCounter = counter + 1;

    const poNumber = `PO-${new Date().getFullYear()}-${String(newCounter).padStart(4, "0")}`;

    const po = {
      poNumber,
      ...poData,
      status: "Draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`po:${poNumber}`, po);
    await kv.set("po_counter", newCounter);

    // Send email confirmation to creator
    if (po.ownerName) {
      const creator = await getUserByName(po.ownerName);
      if (creator && creator.email) {
        await sendEmail({
          to: creator.email,
          subject: `Purchase Order ${poNumber} Created`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Purchase Order Created</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #7c2d12 0%, #9f1239 100%); padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                    📋 Purchase Order Created
                  </h1>
                  <p style="margin: 10px 0 0; color: #fecaca; font-size: 16px;">
                    Asset Management System
                  </p>
                </div>
                
                <!-- Content -->
                <div style="background-color: #ffffff; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                    Hello <strong>${po.ownerName}</strong>,
                  </p>
                  
                  <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                    Your purchase order has been successfully created in the system.
                  </p>
                  
                  <!-- PO Details Box -->
                  <div style="background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%); border-left: 4px solid #c2410c; padding: 24px; border-radius: 8px; margin: 24px 0;">
                    <h2 style="margin: 0 0 16px; color: #9a3412; font-size: 18px; font-weight: 600;">
                      Purchase Order Details
                    </h2>
                    
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">PO Number:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">${poNumber}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">PO Name:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">${po.poName || "N/A"}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Vendor:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">${po.vendorName || "N/A"}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Total Cost:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">₦${po.totalCost ? po.totalCost.toLocaleString() : "0"}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Status:</td>
                        <td style="padding: 8px 0;"><span style="background-color: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">Draft</span></td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Date Created:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">${new Date(po.createdAt).toLocaleDateString()}</td>
                      </tr>
                    </table>
                  </div>
                  
                  <p style="margin: 24px 0 0; color: #374151; font-size: 16px; line-height: 1.6;">
                    You can view and manage this purchase order in the Asset Management System.
                  </p>
                  
                  <!-- Footer Note -->
                  <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; color: #9ca3af; font-size: 13px; line-height: 1.5;">
                      This is an automated notification from the Asset Management System.
                    </p>
                  </div>
                </div>
                
                <!-- Footer -->
                <div style="text-align: center; margin-top: 24px; padding: 20px;">
                  <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                    © ${new Date().getFullYear()} Asset Management System. All rights reserved.
                  </p>
                </div>
              </div>
            </body>
            </html>
          `,
        });
        console.log(
          `PO creation confirmation email sent to ${creator.email}`,
        );
      } else {
        console.log(
          `Creator ${po.ownerName} does not have an email address configured`,
        );
      }
    }

    return c.json({ purchaseOrder: po });
  } catch (error) {
    console.error("Create purchase order error:", error);
    return c.json(
      { error: "Failed to create purchase order" },
      500,
    );
  }
});

app.put(
  "/make-server-5921d82e/purchase-orders/:poNumber",
  async (c) => {
    try {
      const poNumber = c.req.param("poNumber");
      const updates = await c.req.json();

      const po = await kv.get(`po:${poNumber}`);
      if (!po) {
        return c.json(
          { error: "Purchase order not found" },
          404,
        );
      }

      const updatedPO = {
        ...po,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await kv.set(`po:${poNumber}`, updatedPO);

      // Send email notification if status changed to "Submitted for Approval"
      if (
        updates.status === "Submitted for Approval" &&
        po.status !== "Submitted for Approval"
      ) {
        // Send to ITsupport@ng.andersen.com
        await sendEmail({
          to: "ITsupport@ng.andersen.com",
          subject: `Purchase Order ${poNumber} Submitted for Approval`,
          html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>PO Approval Request</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #7c2d12 0%, #9f1239 100%); padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                  ⏳ Approval Required
                </h1>
                <p style="margin: 10px 0 0; color: #fecaca; font-size: 16px;">
                  Purchase Order Submitted
                </p>
              </div>
              
              <div style="background-color: #ffffff; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                  A purchase order has been submitted and requires your approval.
                </p>
                
                <div style="background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%); border-left: 4px solid #c2410c; padding: 24px; border-radius: 8px; margin: 24px 0;">
                  <h2 style="margin: 0 0 16px; color: #9a3412; font-size: 18px; font-weight: 600;">
                    Purchase Order Details
                  </h2>
                  
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">PO Number:</td>
                      <td style="padding: 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">${poNumber}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">PO Name:</td>
                      <td style="padding: 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">${updatedPO.poName || "N/A"}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Owner:</td>
                      <td style="padding: 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">${updatedPO.ownerName || "N/A"}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Vendor:</td>
                      <td style="padding: 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">${updatedPO.vendorName || "N/A"}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Total Cost:</td>
                      <td style="padding: 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">₦${updatedPO.totalCost ? updatedPO.totalCost.toLocaleString() : "0"}</td>
                    </tr>
                  </table>
                </div>
                
                <p style="margin: 24px 0 0; color: #374151; font-size: 16px; line-height: 1.6;">
                  Please log in to the Asset Management System to review and take action on this purchase order.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
        });
        console.log(
          `Approval request email sent to ITsupport@ng.andersen.com for PO ${poNumber}`,
        );
      }

      // Send email notification when status changes to "Approved by Manager" or "Rejected by Manager"
      if (
        (updates.status === "Approved by Manager" ||
          updates.status === "Rejected by Manager") &&
        po.status !== updates.status
      ) {
        const statusAction =
          updates.status === "Approved by Manager"
            ? "Approved"
            : "Rejected";
        const statusColor =
          updates.status === "Approved by Manager"
            ? "#10b981"
            : "#ef4444";
        const statusBgColor =
          updates.status === "Approved by Manager"
            ? "#d1fae5"
            : "#fee2e2";

        // Get all admin users to send notification to managers
        const allUsers = await kv.getByPrefix("user:");
        const adminUsers = allUsers.filter(
          (user: any) => user.role === "admin" && user.email,
        );

        // Send email to each admin/manager
        for (const admin of adminUsers) {
          await sendEmail({
            to: admin.email,
            subject: `Purchase Order ${poNumber} ${statusAction}`,
            html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>PO ${statusAction}</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #7c2d12 0%, #9f1239 100%); padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                    ${updates.status === "Approved by Manager" ? "✅" : "❌"} Purchase Order ${statusAction}
                  </h1>
                  <p style="margin: 10px 0 0; color: #fecaca; font-size: 16px;">
                    Asset Management System
                  </p>
                </div>
                
                <div style="background-color: #ffffff; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                    Hello <strong>${admin.name}</strong>,
                  </p>
                  
                  <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                    A purchase order has been <strong style="color: ${statusColor};">${statusAction.toLowerCase()}</strong> by a manager.
                  </p>
                  
                  <div style="background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%); border-left: 4px solid #c2410c; padding: 24px; border-radius: 8px; margin: 24px 0;">
                    <h2 style="margin: 0 0 16px; color: #9a3412; font-size: 18px; font-weight: 600;">
                      Purchase Order Details
                    </h2>
                    
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">PO Number:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">${poNumber}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">PO Name:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">${updatedPO.poName || "N/A"}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Owner:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">${updatedPO.ownerName || "N/A"}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Vendor:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">${updatedPO.vendorName || "N/A"}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Total Cost:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">₦${updatedPO.totalCost ? updatedPO.totalCost.toLocaleString() : "0"}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Status:</td>
                        <td style="padding: 8px 0;"><span style="background-color: ${statusBgColor}; color: ${statusColor}; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">${updates.status}</span></td>
                      </tr>
                    </table>
                  </div>
                  
                  <p style="margin: 24px 0 0; color: #374151; font-size: 16px; line-height: 1.6;">
                    You can view this purchase order in the Asset Management System.
                  </p>
                  
                  <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; color: #9ca3af; font-size: 13px; line-height: 1.5;">
                      This is an automated notification from the Asset Management System.
                    </p>
                  </div>
                </div>
                
                <div style="text-align: center; margin-top: 24px; padding: 20px;">
                  <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                    © ${new Date().getFullYear()} Asset Management System. All rights reserved.
                  </p>
                </div>
              </div>
            </body>
            </html>
          `,
          });
        }

        console.log(
          `${statusAction} notification emails sent to ${adminUsers.length} manager(s) for PO ${poNumber}`,
        );
      }

      return c.json({ purchaseOrder: updatedPO });
    } catch (error) {
      console.error("Update purchase order error:", error);
      return c.json(
        { error: "Failed to update purchase order" },
        500,
      );
    }
  },
);

app.delete(
  "/make-server-5921d82e/purchase-orders/:poNumber",
  async (c) => {
    try {
      const poNumber = c.req.param("poNumber");
      await kv.del(`po:${poNumber}`);
      return c.json({ success: true });
    } catch (error) {
      console.error("Delete purchase order error:", error);
      return c.json(
        { error: "Failed to delete purchase order" },
        500,
      );
    }
  },
);

// ============== DEREGISTRATION ENDPOINTS ==============

app.get("/make-server-5921d82e/deregistrations", async (c) => {
  try {
    const deregistrations = await kv.getByPrefix("deregistration:");
    return c.json({ deregistrations });
  } catch (error) {
    console.error("Get deregistrations error:", error);
    return c.json(
      { error: "Failed to get deregistrations" },
      500,
    );
  }
});

app.post("/make-server-5921d82e/deregistrations", async (c) => {
  try {
    const deregData = await c.req.json();
    const counter = (await kv.get("deregistration_id_counter")) || 0;
    const newCounter = counter + 1;

    const deregId = `DEREG-${String(newCounter).padStart(5, "0")}`;

    const deregistration = {
      id: deregId,
      ...deregData,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`deregistration:${deregId}`, deregistration);
    await kv.set("deregistration_id_counter", newCounter);

    return c.json({ deregistration });
  } catch (error) {
    console.error("Create deregistration error:", error);
    return c.json(
      { error: "Failed to create deregistration" },
      500,
    );
  }
});

// ============== ASSET HANDOVER ENDPOINTS ==============

app.get("/make-server-5921d82e/handovers", async (c) => {
  try {
    const handovers = await kv.getByPrefix("handover:");
    return c.json({ handovers });
  } catch (error) {
    console.error("Get handovers error:", error);
    return c.json({ error: "Failed to get handovers" }, 500);
  }
});

app.post("/make-server-5921d82e/handovers", async (c) => {
  try {
    const handoverData = await c.req.json();
    const counter = (await kv.get("handover_id_counter")) || 0;
    const newId = counter + 1;

    const handover = {
      id: String(newId),
      ...handoverData,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`handover:${newId}`, handover);
    await kv.set("handover_id_counter", newId);

    return c.json({ handover });
  } catch (error) {
    console.error("Create handover error:", error);
    return c.json({ error: "Failed to create handover" }, 500);
  }
});

app.put("/make-server-5921d82e/handovers/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const updates = await c.req.json();

    const handover = await kv.get(`handover:${id}`);
    if (!handover) {
      return c.json({ error: "Handover not found" }, 404);
    }

    const updatedHandover = {
      ...handover,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`handover:${id}`, updatedHandover);
    return c.json({ handover: updatedHandover });
  } catch (error) {
    console.error("Update handover error:", error);
    return c.json({ error: "Failed to update handover" }, 500);
  }
});

// ============== ASSET HISTORY ENDPOINTS ==============

app.get(
  "/make-server-5921d82e/asset-history/:assetId",
  async (c) => {
    try {
      const assetId = c.req.param("assetId");
      const history = await kv.getByPrefix(
        `history:${assetId}:`,
      );
      return c.json({ history });
    } catch (error) {
      console.error("Get asset history error:", error);
      return c.json(
        { error: "Failed to get asset history" },
        500,
      );
    }
  },
);

app.post("/make-server-5921d82e/asset-history", async (c) => {
  try {
    const historyData = await c.req.json();
    const { assetId } = historyData;
    const timestamp = new Date().getTime();

    const history = {
      id: `${assetId}-${timestamp}`,
      ...historyData,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`history:${assetId}:${timestamp}`, history);
    return c.json({ history });
  } catch (error) {
    console.error("Create asset history error:", error);
    return c.json(
      { error: "Failed to create asset history" },
      500,
    );
  }
});

// ============== KNOWLEDGE BASE / FORUMS ENDPOINTS ==============

app.get("/make-server-5921d82e/forums", async (c) => {
  try {
    const forums = await kv.getByPrefix("forum:");
    return c.json({ forums });
  } catch (error) {
    console.error("Get forums error:", error);
    return c.json({ error: "Failed to get forums" }, 500);
  }
});

app.post("/make-server-5921d82e/forums", async (c) => {
  try {
    const forumData = await c.req.json();
    const counter = (await kv.get("forum_id_counter")) || 0;
    const newId = counter + 1;

    const forum = {
      id: String(newId),
      ...forumData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      replies: [],
    };

    await kv.set(`forum:${newId}`, forum);
    await kv.set("forum_id_counter", newId);

    return c.json({ forum });
  } catch (error) {
    console.error("Create forum error:", error);
    return c.json({ error: "Failed to create forum" }, 500);
  }
});

app.post(
  "/make-server-5921d82e/forums/:id/reply",
  async (c) => {
    try {
      const id = c.req.param("id");
      const replyData = await c.req.json();

      const forum = await kv.get(`forum:${id}`);
      if (!forum) {
        return c.json({ error: "Forum not found" }, 404);
      }

      const reply = {
        id: `${id}-${Date.now()}`,
        ...replyData,
        createdAt: new Date().toISOString(),
      };

      forum.replies.push(reply);
      forum.updatedAt = new Date().toISOString();

      await kv.set(`forum:${id}`, forum);
      return c.json({ forum });
    } catch (error) {
      console.error("Create forum reply error:", error);
      return c.json(
        { error: "Failed to create forum reply" },
        500,
      );
    }
  },
);

// ============== WORKFLOW MANAGEMENT ENDPOINTS ==============

// Get all workflows
app.get("/make-server-5921d82e/workflows", async (c) => {
  try {
    const workflows = await kv.getByPrefix("workflow:");
    return c.json({ workflows: workflows || [] });
  } catch (error) {
    console.error("Get workflows error:", error);
    return c.json({ error: "Failed to get workflows" }, 500);
  }
});

// Get workflow configuration (legacy endpoint for PO workflow)
app.get("/make-server-5921d82e/workflow", async (c) => {
  try {
    const workflow = await kv.get("workflow:purchase_order");

    // Return default workflow if not set
    if (!workflow) {
      const defaultWorkflow = {
        id: "purchase_order",
        name: "Purchase Order Workflow",
        stages: [
          "Draft",
          "Submitted for Approval",
          "Approved",
          "Rejected",
          "Ordered",
          "Partial Received",
          "Received",
          "Invoice Received",
        ],
      };
      await kv.set("workflow:purchase_order", defaultWorkflow);
      return c.json({ workflow: defaultWorkflow.stages });
    }

    return c.json({ workflow: workflow.stages });
  } catch (error) {
    console.error("Get workflow error:", error);
    return c.json({ error: "Failed to get workflow" }, 500);
  }
});

// Create new workflow
app.post("/make-server-5921d82e/workflows", async (c) => {
  try {
    const { name, stages } = await c.req.json();

    if (!name || !name.trim()) {
      return c.json(
        { error: "Workflow name is required" },
        400,
      );
    }

    if (
      !stages ||
      !Array.isArray(stages) ||
      stages.length === 0
    ) {
      return c.json(
        { error: "At least one workflow stage is required" },
        400,
      );
    }

    // Validate stages are non-empty strings
    const isValid = stages.every(
      (stage) =>
        typeof stage === "string" && stage.trim().length > 0,
    );
    if (!isValid) {
      return c.json(
        {
          error:
            "All workflow stages must be non-empty strings",
        },
        400,
      );
    }

    // Generate ID from name
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "_");

    // Check if workflow already exists
    const existing = await kv.get(`workflow:${id}`);
    if (existing) {
      return c.json(
        { error: "A workflow with this name already exists" },
        400,
      );
    }

    const workflow = {
      id,
      name: name.trim(),
      stages,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`workflow:${id}`, workflow);
    return c.json({ workflow });
  } catch (error) {
    console.error("Create workflow error:", error);
    return c.json({ error: "Failed to create workflow" }, 500);
  }
});

// Update workflow configuration
app.put("/make-server-5921d82e/workflow", async (c) => {
  try {
    const { workflow } = await c.req.json();

    if (
      !workflow ||
      !Array.isArray(workflow) ||
      workflow.length === 0
    ) {
      return c.json(
        { error: "Invalid workflow configuration" },
        400,
      );
    }

    // Validate workflow stages are non-empty strings
    const isValid = workflow.every(
      (stage) =>
        typeof stage === "string" && stage.trim().length > 0,
    );
    if (!isValid) {
      return c.json(
        {
          error:
            "All workflow stages must be non-empty strings",
        },
        400,
      );
    }

    // Update the purchase order workflow
    const existingWorkflow = await kv.get(
      "workflow:purchase_order",
    );
    const updatedWorkflow = {
      id: "purchase_order",
      name: existingWorkflow?.name || "Purchase Order Workflow",
      stages: workflow,
      createdAt:
        existingWorkflow?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await kv.set("workflow:purchase_order", updatedWorkflow);
    return c.json({ success: true, workflow });
  } catch (error) {
    console.error("Update workflow error:", error);
    return c.json({ error: "Failed to update workflow" }, 500);
  }
});

// Update specific workflow by ID
app.put("/make-server-5921d82e/workflows/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const { name, stages } = await c.req.json();

    const existingWorkflow = await kv.get(`workflow:${id}`);
    if (!existingWorkflow) {
      return c.json({ error: "Workflow not found" }, 404);
    }

    if (name && !name.trim()) {
      return c.json(
        { error: "Workflow name cannot be empty" },
        400,
      );
    }

    if (stages) {
      if (!Array.isArray(stages) || stages.length === 0) {
        return c.json(
          { error: "At least one workflow stage is required" },
          400,
        );
      }

      const isValid = stages.every(
        (stage) =>
          typeof stage === "string" && stage.trim().length > 0,
      );
      if (!isValid) {
        return c.json(
          {
            error:
              "All workflow stages must be non-empty strings",
          },
          400,
        );
      }
    }

    const updatedWorkflow = {
      ...existingWorkflow,
      name: name?.trim() || existingWorkflow.name,
      stages: stages || existingWorkflow.stages,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`workflow:${id}`, updatedWorkflow);
    return c.json({ workflow: updatedWorkflow });
  } catch (error) {
    console.error("Update workflow error:", error);
    return c.json({ error: "Failed to update workflow" }, 500);
  }
});

// Delete workflow
app.delete("/make-server-5921d82e/workflows/:id", async (c) => {
  try {
    const id = c.req.param("id");

    // Prevent deletion of purchase order workflow
    if (id === "purchase_order") {
      return c.json(
        {
          error:
            "Cannot delete the default Purchase Order workflow",
        },
        400,
      );
    }

    const existingWorkflow = await kv.get(`workflow:${id}`);
    if (!existingWorkflow) {
      return c.json({ error: "Workflow not found" }, 404);
    }

    await kv.del(`workflow:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.error("Delete workflow error:", error);
    return c.json({ error: "Failed to delete workflow" }, 500);
  }
});

// ============== NOTIFICATIONS ENDPOINTS ==============

app.get("/make-server-5921d82e/notifications/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const allNotifications = await kv.getByPrefix("notification:");
    const userNotifications = allNotifications.filter(
      (n: any) => n.userId === userId
    );
    // Sort by createdAt descending (newest first)
    userNotifications.sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return c.json({ notifications: userNotifications });
  } catch (error) {
    console.error("Get notifications error:", error);
    return c.json({ error: "Failed to get notifications" }, 500);
  }
});

app.put("/make-server-5921d82e/notifications/:id/read", async (c) => {
  try {
    const id = c.req.param("id");
    const notification = await kv.get(`notification:${id}`);
    if (!notification) {
      return c.json({ error: "Notification not found" }, 404);
    }

    const updatedNotification = {
      ...notification,
      read: true,
    };

    await kv.set(`notification:${id}`, updatedNotification);
    return c.json({ notification: updatedNotification });
  } catch (error) {
    console.error("Update notification error:", error);
    return c.json({ error: "Failed to update notification" }, 500);
  }
});

app.delete("/make-server-5921d82e/notifications/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await kv.del(`notification:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.error("Delete notification error:", error);
    return c.json({ error: "Failed to delete notification" }, 500);
  }
});

Deno.serve(app.fetch);