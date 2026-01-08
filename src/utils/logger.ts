import { projectId, publicAnonKey } from "./supabase/info";

// Error severity levels
export type ErrorSeverity = "critical" | "error" | "warning" | "info";

// Audit action status
export type AuditStatus = "success" | "failed";

// Log an error to the system
export async function logError(
  severity: ErrorSeverity,
  module: string,
  errorMessage: string,
  options?: {
    user?: string;
    action?: string;
    errorStack?: string;
    additionalInfo?: any;
  }
) {
  try {
    const errorLog = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      severity,
      module,
      errorMessage,
      user: options?.user || "System",
      action: options?.action,
      errorStack: options?.errorStack,
      additionalInfo: options?.additionalInfo,
    };

    // Send to backend
    await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/log-error`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify(errorLog),
      }
    );

    // Also log to console in development
    console.error(`[${severity.toUpperCase()}] ${module}: ${errorMessage}`, options);
  } catch (error) {
    // Fail silently to avoid infinite loops
    console.error("Failed to log error:", error);
  }
}

// Log an audit trail entry
export async function logAudit(
  user: string,
  action: string,
  module: string,
  details: string,
  status: AuditStatus = "success",
  options?: {
    ipAddress?: string;
    changes?: any;
  }
) {
  try {
    const auditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      user,
      action,
      module,
      details,
      status,
      ipAddress: options?.ipAddress || "Unknown",
      changes: options?.changes,
    };

    // Send to backend
    await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/log-audit`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify(auditLog),
      }
    );

    // Also log to console in development
    console.log(`[AUDIT] ${user} - ${action} in ${module}: ${details} (${status})`);
  } catch (error) {
    // Fail silently to avoid infinite loops
    console.error("Failed to log audit:", error);
  }
}

// Convenience functions for common error types
export const logger = {
  // Critical errors
  critical: (module: string, message: string, options?: any) =>
    logError("critical", module, message, options),

  // Regular errors
  error: (module: string, message: string, options?: any) =>
    logError("error", module, message, options),

  // Warnings
  warning: (module: string, message: string, options?: any) =>
    logError("warning", module, message, options),

  // Info logs
  info: (module: string, message: string, options?: any) =>
    logError("info", module, message, options),

  // Audit logs
  audit: (user: string, action: string, module: string, details: string, status?: AuditStatus, options?: any) =>
    logAudit(user, action, module, details, status || "success", options),
};

// Wrap async functions with automatic error logging
export function withErrorLogging<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  module: string,
  action: string
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error: any) {
      await logError("error", module, error.message || String(error), {
        action,
        errorStack: error.stack,
      });
      throw error;
    }
  }) as T;
}
