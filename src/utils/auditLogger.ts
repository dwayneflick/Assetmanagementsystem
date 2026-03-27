import { projectId, publicAnonKey } from './supabase/info';

export interface AuditLogEntry {
  user: string;
  action: string;
  module: string;
  details: string;
  status: 'success' | 'failed';
  ipAddress?: string;
  changes?: any;
}

/**
 * Logs an audit entry to the backend
 * This function fails silently to not disrupt user experience if logging fails
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/log-audit`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          ...entry,
          timestamp: new Date().toISOString(),
        }),
      }
    );

    if (!response.ok) {
      // Log to console but don't throw - audit logging should not break user flow
      console.warn('Audit logging failed:', response.status, response.statusText);
    }
  } catch (error) {
    // Silent fail - audit logging is not critical for app functionality
    console.warn('Failed to log audit:', error);
  }
}
