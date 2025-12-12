import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { X, Shield, Lock, Database, Users, FileText, Mail } from "lucide-react";
import andersenLogo from "figma:asset/c5292bdd917281e818e79b22fa402c2806ae9d2e.png";

interface PrivacyPolicyProps {
  onClose: () => void;
}

export default function PrivacyPolicy({ onClose }: PrivacyPolicyProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-screen flex items-start justify-center p-4 sm:p-6 md:p-8 py-8">
        <Card className="w-full max-w-4xl bg-white shadow-2xl">
          <CardHeader className="border-b border-gray-200 sticky top-0 bg-white z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img src={andersenLogo} alt="Andersen Logo" className="h-10 sm:h-12 object-contain" />
                <CardTitle className="text-2xl">Privacy Policy</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-10 w-10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-6 sm:p-8 space-y-6 sm:space-y-8">
            {/* Effective Date */}
            <div className="text-center pb-4 border-b border-gray-200">
              <p className="text-sm text-gray-600">
                <strong>Effective Date:</strong> December 12, 2025
              </p>
              <p className="text-sm text-gray-600 mt-1">
                <strong>Last Updated:</strong> December 12, 2025
              </p>
            </div>

            {/* Introduction */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-6 h-6 text-red-900" />
                <h2 className="text-xl">1. Introduction</h2>
              </div>
              <div className="space-y-3 text-gray-700">
                <p>
                  Andersen Tax LLC and Andersen Tax LP (collectively "Andersen," "we," "us," or "our") respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use the Andersen Asset Management System (the "System").
                </p>
                <p>
                  This Privacy Policy applies to all users of the System, including employees, agents, administrators, and authorized personnel. By accessing or using the System, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy.
                </p>
              </div>
            </section>

            {/* Information We Collect */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Database className="w-6 h-6 text-red-900" />
                <h2 className="text-xl">2. Information We Collect</h2>
              </div>
              <div className="space-y-4 text-gray-700">
                <div>
                  <h3 className="font-semibold mb-2">2.1 Personal Information</h3>
                  <p className="mb-2">We collect the following personal information:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>User credentials (username and password)</li>
                    <li>Full name and employee ID</li>
                    <li>Email address</li>
                    <li>Department and job title</li>
                    <li>Role and permission levels within the System</li>
                    <li>User activity logs and timestamps</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">2.2 Asset Information</h3>
                  <p className="mb-2">The System collects and processes asset-related data including:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Asset names, service tags, and serial numbers</li>
                    <li>Product types and technical specifications</li>
                    <li>Asset state and location information</li>
                    <li>User assignments and department allocations</li>
                    <li>Acquisition dates, vendor information, and costs</li>
                    <li>Warranty and maintenance records</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">2.3 System Usage Data</h3>
                  <p className="mb-2">We automatically collect technical information including:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>IP addresses and device information</li>
                    <li>Browser type and operating system</li>
                    <li>Login times and session duration</li>
                    <li>Pages viewed and actions performed</li>
                    <li>Error logs and system diagnostics</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">2.4 Files and Documents</h3>
                  <p className="mb-2">The System stores uploaded files including:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Invoices and purchase orders</li>
                    <li>Evidence files and incident reports</li>
                    <li>Software licenses and certificates</li>
                    <li>Asset handover documentation</li>
                    <li>Deregistration forms and approvals</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* How We Use Your Information */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-6 h-6 text-red-900" />
                <h2 className="text-xl">3. How We Use Your Information</h2>
              </div>
              <div className="space-y-3 text-gray-700">
                <p>We use the collected information for the following purposes:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>Asset Management:</strong> To track, manage, and maintain organizational assets</li>
                  <li><strong>User Authentication:</strong> To verify user identity and manage access controls</li>
                  <li><strong>Incident Management:</strong> To process and track incident reports and resolutions</li>
                  <li><strong>Purchase Order Processing:</strong> To manage procurement workflows and approvals</li>
                  <li><strong>Software Licensing:</strong> To track software installations and license compliance</li>
                  <li><strong>Asset Handover:</strong> To document and process asset transfers between users</li>
                  <li><strong>IT Deregistration:</strong> To manage asset retirement and disposal processes</li>
                  <li><strong>Analytics and Reporting:</strong> To generate insights and dashboard reports for administrators</li>
                  <li><strong>System Security:</strong> To monitor, detect, and prevent unauthorized access or fraudulent activities</li>
                  <li><strong>Communication:</strong> To send email notifications, approvals, and system updates</li>
                  <li><strong>Compliance:</strong> To maintain audit trails and meet regulatory requirements</li>
                  <li><strong>System Improvement:</strong> To analyze usage patterns and improve System functionality</li>
                </ul>
              </div>
            </section>

            {/* Data Security */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Lock className="w-6 h-6 text-red-900" />
                <h2 className="text-xl">4. Data Security</h2>
              </div>
              <div className="space-y-3 text-gray-700">
                <p>
                  We implement appropriate technical and organizational security measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>Encryption:</strong> Data is encrypted in transit using HTTPS/TLS protocols</li>
                  <li><strong>Access Controls:</strong> Role-based access control (RBAC) limits data access to authorized personnel only</li>
                  <li><strong>Authentication:</strong> Strong password requirements (alphanumeric with symbols, 6-12 characters)</li>
                  <li><strong>Audit Logs:</strong> All system activities are logged and monitored for security purposes</li>
                  <li><strong>Secure Storage:</strong> Data is stored in secure, professionally managed cloud infrastructure (Supabase)</li>
                  <li><strong>Regular Updates:</strong> Security patches and system updates are applied regularly</li>
                  <li><strong>Access Monitoring:</strong> Continuous monitoring of unauthorized access attempts</li>
                </ul>
                <p className="mt-4">
                  Despite our security measures, no electronic transmission or storage method is 100% secure. While we strive to protect your personal data, we cannot guarantee absolute security.
                </p>
              </div>
            </section>

            {/* Data Sharing and Disclosure */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-6 h-6 text-red-900" />
                <h2 className="text-xl">5. Data Sharing and Disclosure</h2>
              </div>
              <div className="space-y-3 text-gray-700">
                <p>We may share your information in the following circumstances:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>Within Andersen:</strong> Information is shared with authorized employees, agents, and administrators on a need-to-know basis</li>
                  <li><strong>Service Providers:</strong> We may share data with trusted third-party service providers (e.g., cloud hosting, email services) who assist in System operations</li>
                  <li><strong>Legal Compliance:</strong> We may disclose information when required by law, court order, or government regulation</li>
                  <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, user data may be transferred to the acquiring entity</li>
                  <li><strong>Protection of Rights:</strong> To protect the rights, property, or safety of Andersen, our users, or the public</li>
                </ul>
                <p className="mt-4">
                  We do not sell, rent, or trade your personal information to third parties for marketing purposes.
                </p>
              </div>
            </section>

            {/* Data Retention */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Database className="w-6 h-6 text-red-900" />
                <h2 className="text-xl">6. Data Retention</h2>
              </div>
              <div className="space-y-3 text-gray-700">
                <p>
                  We retain your personal data for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>User Accounts:</strong> Retained for the duration of employment and up to 7 years after termination for audit purposes</li>
                  <li><strong>Asset Records:</strong> Retained for the lifecycle of the asset and up to 10 years after disposal</li>
                  <li><strong>Financial Records:</strong> Retained in accordance with tax and accounting regulations (minimum 7 years)</li>
                  <li><strong>Incident Reports:</strong> Retained for 5 years for security and compliance purposes</li>
                  <li><strong>System Logs:</strong> Retained for 90 days for operational purposes, longer for security incidents</li>
                </ul>
                <p className="mt-4">
                  When data is no longer required, we will securely delete or anonymize it in accordance with our data retention policy.
                </p>
              </div>
            </section>

            {/* Your Rights */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-6 h-6 text-red-900" />
                <h2 className="text-xl">7. Your Rights</h2>
              </div>
              <div className="space-y-3 text-gray-700">
                <p>Depending on your jurisdiction, you may have the following rights regarding your personal data:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>Right to Access:</strong> Request a copy of the personal data we hold about you</li>
                  <li><strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete data</li>
                  <li><strong>Right to Erasure:</strong> Request deletion of your personal data (subject to legal retention requirements)</li>
                  <li><strong>Right to Restrict Processing:</strong> Request limitation of how we use your data</li>
                  <li><strong>Right to Data Portability:</strong> Request transfer of your data to another organization</li>
                  <li><strong>Right to Object:</strong> Object to certain types of data processing</li>
                  <li><strong>Right to Withdraw Consent:</strong> Withdraw consent for data processing where applicable</li>
                </ul>
                <p className="mt-4">
                  To exercise any of these rights, please contact us using the information provided in Section 11.
                </p>
              </div>
            </section>

            {/* Cookies and Tracking */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-6 h-6 text-red-900" />
                <h2 className="text-xl">8. Cookies and Tracking Technologies</h2>
              </div>
              <div className="space-y-3 text-gray-700">
                <p>
                  The System uses cookies and similar tracking technologies to maintain user sessions and improve user experience:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>Session Cookies:</strong> Essential for authentication and maintaining logged-in sessions</li>
                  <li><strong>Functional Cookies:</strong> Remember user preferences and settings</li>
                  <li><strong>Analytics Cookies:</strong> Help us understand how users interact with the System</li>
                </ul>
                <p className="mt-4">
                  Most browsers allow you to control cookies through settings. However, disabling cookies may limit System functionality.
                </p>
              </div>
            </section>

            {/* Third-Party Services */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-6 h-6 text-red-900" />
                <h2 className="text-xl">9. Third-Party Services</h2>
              </div>
              <div className="space-y-3 text-gray-700">
                <p>The System utilizes the following third-party services:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>Supabase:</strong> Cloud database and authentication services</li>
                  <li><strong>Email Service Provider:</strong> For sending notifications and approvals</li>
                </ul>
                <p className="mt-4">
                  These third-party services have their own privacy policies governing their collection and use of your information. We encourage you to review their privacy policies.
                </p>
              </div>
            </section>

            {/* Changes to Privacy Policy */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-6 h-6 text-red-900" />
                <h2 className="text-xl">10. Changes to This Privacy Policy</h2>
              </div>
              <div className="space-y-3 text-gray-700">
                <p>
                  We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. When we make changes, we will:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Update the "Last Updated" date at the top of this Privacy Policy</li>
                  <li>Notify users of material changes via email or System notification</li>
                  <li>Post the updated Privacy Policy on the System</li>
                </ul>
                <p className="mt-4">
                  Your continued use of the System after changes are posted constitutes acceptance of the updated Privacy Policy.
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Mail className="w-6 h-6 text-red-900" />
                <h2 className="text-xl">11. Contact Information</h2>
              </div>
              <div className="space-y-3 text-gray-700">
                <p>
                  If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg mt-4 space-y-2">
                  <p><strong>Andersen Tax LLC and Andersen Tax LP</strong></p>
                  <p><strong>Data Protection Officer</strong></p>
                  <p><strong>Email:</strong> ITsupport@ng.andersen.com</p>
                  <p><strong>Address:</strong> Andersen Place, Nigeria</p>
                </div>
                <p className="mt-4">
                  We will respond to your inquiry within 30 days of receipt.
                </p>
              </div>
            </section>

            {/* Acknowledgment */}
            <section className="border-t border-gray-200 pt-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
                <h2 className="text-base sm:text-lg mb-3">Acknowledgment</h2>
                <p className="text-sm sm:text-base text-gray-700">
                  By using the Andersen Asset Management System, you acknowledge that you have read and understood this Privacy Policy and agree to the collection, use, and disclosure of your information as described herein.
                </p>
              </div>
            </section>

            {/* Footer */}
            <div className="text-center pt-6 border-t border-gray-200">
              <p className="text-xs sm:text-sm text-gray-600">
                © 2025 Andersen Tax LLC and Andersen Tax LP. All Rights Reserved.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}