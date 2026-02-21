/**
 * Centralized Audit Logging Utility
 * 
 * Provides a single interface for logging security events and user actions
 * to the activity_logs table. All logged events include:
 * - User ID
 * - Action type
 * - Timestamp (auto-added)
 * - Detailed context
 * - Optional IP address and user agent
 */

declare const process: { env: Record<string, string | undefined> }

import { createClient } from '@/lib/supabase/server'

export type AuditAction =
  | 'UPLOAD'
  | 'RECOVERY'
  | 'REVOKE'
  | 'HASH_VERIFY'
  | 'LOGIN'
  | 'LOGOUT'
  | 'ADMIN_ACCESS'
  | 'TAMPER_DETECTED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'AUTH_FAILED'

interface AuditLogOptions {
  userId: string
  action: AuditAction
  resourceId?: string
  details?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

/**
 * Log an activity to the audit trail
 * Safe error handling - does not throw, logs errors to console
 */
export async function logActivity(options: AuditLogOptions): Promise<void> {
  try {
    const supabase = await createClient()

    const logEntry = {
      user_id: options.userId,
      action: options.action,
      resource_id: options.resourceId || null,
      details: options.details || {},
      ip_address: options.ipAddress || null,
      user_agent: options.userAgent || null,
      // Timestamp is automatically added by database
    }

    const { error } = await supabase.from('activity_logs').insert(logEntry)

    if (error) {
      console.error(`[AUDIT LOG ERROR] Failed to log ${options.action}:`, error.message)
      // Do not throw - auditing should not block operations
      return
    }

    // Log success in development
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[AUDIT] ${options.action} logged for user ${options.userId.slice(0, 8)}...`)
    }
  } catch (error) {
    // Catch all - auditing must be fail-safe
    console.error('[AUDIT LOG ERROR] Unexpected error:', error instanceof Error ? error.message : String(error))
  }
}

/**
 * Log an upload operation
 */
export async function logUpload(
  userId: string,
  metadataId: string,
  fileName: string,
  fileSize: number,
  details?: Record<string, unknown>,
): Promise<void> {
  await logActivity({
    userId,
    action: 'UPLOAD',
    resourceId: metadataId,
    details: {
      original_filename: fileName,
      file_size: fileSize,
      ...details,
    },
  })
}

/**
 * Log a recovery operation
 */
export async function logRecovery(
  userId: string,
  metadataId: string,
  success: boolean,
  details?: Record<string, unknown>,
): Promise<void> {
  await logActivity({
    userId,
    action: 'RECOVERY',
    resourceId: metadataId,
    details: {
      success,
      ...details,
    },
  })
}

/**
 * Log a file revocation
 */
export async function logRevoke(userId: string, metadataId: string): Promise<void> {
  await logActivity({
    userId,
    action: 'REVOKE',
    resourceId: metadataId,
    details: {
      revoked_at: new Date().toISOString(),
    },
  })
}

/**
 * Log tamper detection
 */
export async function logTamperDetected(
  userId: string,
  metadataId: string,
  details?: Record<string, unknown>,
): Promise<void> {
  await logActivity({
    userId,
    action: 'TAMPER_DETECTED',
    resourceId: metadataId,
    details: {
      severity: 'HIGH',
      ...details,
    },
  })
}

/**
 * Log rate limit exceeded
 */
export async function logRateLimitExceeded(
  userId: string,
  action: AuditAction,
): Promise<void> {
  await logActivity({
    userId,
    action: 'RATE_LIMIT_EXCEEDED',
    details: {
      triggered_by_action: action,
    },
  })
}

/**
 * Log authentication failure
 */
export async function logAuthFailed(userId: string, reason: string): Promise<void> {
  await logActivity({
    userId,
    action: 'AUTH_FAILED',
    details: {
      reason,
    },
  })
}

/**
 * Log admin access
 */
export async function logAdminAccess(userId: string, operation: string): Promise<void> {
  await logActivity({
    userId,
    action: 'ADMIN_ACCESS',
    details: {
      operation,
      timestamp: new Date().toISOString(),
    },
  })
}

/**
 * Retrieve activity logs for a user with filtering
 */
export async function getUserActivityLogs(
  userId: string,
  options?: {
    action?: AuditAction
    resourceId?: string
    limit?: number
    offset?: number
  },
): Promise<Array<Record<string, unknown>>> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)

    if (options?.action) {
      query = query.eq('action', options.action)
    }

    if (options?.resourceId) {
      query = query.eq('resource_id', options.resourceId)
    }

    query = query
      .order('created_at', { ascending: false })
      .limit(options?.limit || 50)

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
    }

    const { data, error } = await query

    if (error) {
      console.error('[AUDIT LOG ERROR] Failed to fetch logs:', error.message)
      return []
    }

    return data || []
  } catch (error) {
    console.error('[AUDIT LOG ERROR] Unexpected error fetching logs:', error)
    return []
  }
}
