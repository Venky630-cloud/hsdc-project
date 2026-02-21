## ⚡ Quick Reference Guide - HSDC Implementation

**Last Updated:** February 21, 2026

---

## 🚀 Quick Start

### **Installation**
```bash
npm install
# or
pnpm install
```

### **Environment Setup**
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
RSA_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
RSA_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n..."
```

### **Run Development Server**
```bash
npm run dev
# Open http://localhost:3000
```

---

## 📁 Project Structure Quick Map

| Path | Purpose | Status |
|------|---------|--------|
| `app/upload` | Upload & encrypt files | ✅ Complete |
| `app/recovery` | Recover & decrypt files | ✅ Complete |
| `app/dashboard` | User dashboard | ✅ Complete |
| `app/admin` | Admin monitoring | ✅ Complete |
| `actions/` | Server Actions (RPC) | ✅ Complete |
| `lib/crypto.ts` | AES-256-GCM encryption | ✅ Complete |
| `lib/stego.ts` | LSB steganography | ✅ Complete |
| `lib/blockchain.ts` | Hash storage (mock) | ✅ Complete |
| **`lib/env.ts`** | **Env validation** | **✅ NEW** |
| **`lib/rate-limit.ts`** | **Rate limiting** | **✅ NEW** |
| **`lib/audit.ts`** | **Audit logging** | **✅ NEW** |
| `components/` | React UI components | ✅ Complete |

---

## 🔐 Core APIs Quick Reference

### **Encryption & Decryption**
```typescript
import { encrypt, decrypt } from '@/lib/crypto'

// Encrypt file
const result = encrypt(buffer)
// Returns: { encryptedData, iv, authTag, encryptedKey, algorithm }

// Decrypt file
const decrypted = decrypt({
  encryptedData: buffer,
  iv: 'hex-string',
  authTag: 'hex-string',
  encryptedKey: 'base64-string'
})
```

### **Steganography**
```typescript
import { embed, extract, calculateCapacity } from '@/lib/stego'

// Embed data into image
const result = embed(pixels, width, height, channels, data, seed)
// Returns: { stegoImageBuffer, capacityUsed, capacityTotal, pixelsModified }

// Extract data from image
const result = extract(pixels, width, height, channels, seed)
// Returns: { extractedData, dataLength, integrityValid }

// Check capacity
const capacity = calculateCapacity(width, height, channels)
```

### **Blockchain**
```typescript
import { getBlockchainService } from '@/lib/blockchain'

const blockchain = getBlockchainService()

// Store hash
const record = await blockchain.storeHash(hash, userId)
// Returns: { txId, network, hash }

// Verify hash
const verified = await blockchain.verifyHash(hash)
```

### **Rate Limiting** ⭐ NEW
```typescript
import { checkRateLimit, uploadLimiter, recoveryLimiter } from '@/lib/rate-limit'

// Check if user can perform action
try {
  await checkRateLimit(userId, uploadLimiter)
  // Proceed
} catch (error) {
  // Rate limited - error.message is safe to show user
}

// Get status
import { getRateLimitStatus } from '@/lib/rate-limit'
const status = getRateLimitStatus(userId, uploadLimiter)
// Returns: { allowed, remaining, resetIn }
```

### **Audit Logging** ⭐ NEW
```typescript
import { 
  logUpload, 
  logRecovery, 
  logTamperDetected,
  getUserActivityLogs 
} from '@/lib/audit'

// Log upload
await logUpload(userId, metadataId, fileName, fileSize, {
  encryption_algo: 'AES-256-GCM',
  stego_seed: seed
})

// Log recovery
await logRecovery(userId, metadataId, true, {
  integrity_verified: true,
  blockchain_verified: true
})

// Log tamper detection
await logTamperDetected(userId, metadataId, {
  reason: 'Hash mismatch'
})

// Query logs
const logs = await getUserActivityLogs(userId, {
  action: 'RECOVERY',
  limit: 50,
  offset: 0
})
```

### **Environment Validation** ⭐ NEW
```typescript
import { 
  validateEnvironment, 
  initializeEnvironment,
  getRequiredEnv,
  getOptionalEnv 
} from '@/lib/env'

// Full validation (returns object)
const result = validateEnvironment()
// Returns: { valid, errors[], warnings[] }

// Initialize (throws on missing vars)
initializeEnvironment()

// Safe getters
const url = getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL') // throws if missing
const debug = getOptionalEnv('DEBUG', 'false') // returns default if missing
```

---

## 📝 Common Patterns

### **Server Action with Rate Limiting**
```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { uploadLimiter, checkRateLimit } from '@/lib/rate-limit'
import { logUpload } from '@/lib/audit'

export async function doSomething(formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Check rate limit
    try {
      await checkRateLimit(user.id, uploadLimiter)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Rate limited'
      }
    }

    // Do work...
    
    // Log activity
    await logUpload(user.id, resourceId, 'filename', 1000, { extra: 'data' })

    return { success: true }
  } catch (error) {
    console.error('Error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred'
    }
  }
}
```

### **Query User Files with RLS Protection**
```typescript
'use server'

import { createClient } from '@/lib/supabase/server'

export async function getUserFiles() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { files: [], error: 'Not authenticated' }

  // RLS automatically filters to user's files
  const { data, error } = await supabase
    .from('metadata')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return { files: [], error: error.message }
  return { files: data || [] }
}
```

### **Admin-Only Operation**
```typescript
'use server'

import { createClient } from '@/lib/supabase/server'

export async function getSystemStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { success: false, error: 'Not authenticated' }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'ADMIN') {
    return { success: false, error: 'Admin access required' }
  }

  // Proceed with admin operation...
}
```

---

## 🧪 Testing the Flows

### **Test Upload**
1. Go to `/upload`
2. Select a file (< 5MB)
3. Select a carrier image (PNG/BMP/TIFF)
4. Click "Encrypt & Embed"
5. See progress stages animate
6. Download stego image
7. Check `/dashboard` - should see new file listed

### **Test Recovery**
1. Go to `/recovery`
2. Select previously uploaded file from dropdown
3. Select the stego image you downloaded
4. Click "Extract & Decrypt"
5. See integrity and blockchain verification badges
6. Download recovered file
7. Verify file contents match original

### **Test Rate Limiting**
1. Upload 5 files in quick succession
2. Try to upload 6th - should get rate limit error
3. Wait 60 seconds
4. Try again - should succeed

### **Test Admin Panel**
1. Login as admin user (role='ADMIN' in profiles table)
2. Go to `/admin`
3. See system stats and activity log
4. Perform a file recovery
5. Check that recovery appears in activity log
6. Try to modify another user's file - should fail

---

## 🔍 Debugging Tips

### **Check Rate Limiter State**
```typescript
import { uploadLimiter } from '@/lib/rate-limit'

// Check status for specific user
const status = uploadLimiter.isAllowed(userId)
const remaining = uploadLimiter.getRemaining(userId)
const resetTime = uploadLimiter.getResetTime(userId)

console.log(`Allowed: ${status}, Remaining: ${remaining}, Reset in: ${resetTime}ms`)

// Clear for testing
uploadLimiter.reset()
```

### **Check Audit Logs**
```typescript
import { getUserActivityLogs } from '@/lib/audit'

// Get all logs for user
const logs = await getUserActivityLogs(userId, { limit: 100 })
console.table(logs)

// Filter by action
const uploads = await getUserActivityLogs(userId, { 
  action: 'UPLOAD',
  limit: 50 
})
```

### **Check Environment Validation**
```typescript
import { validateEnvironment } from '@/lib/env'

const result = validateEnvironment()
console.log('Valid:', result.valid)
console.log('Errors:', result.errors)
console.log('Warnings:', result.warnings)
```

### **Enable Development Logging**
```bash
# Set DEBUG flag
export NODE_ENV=development

# Then audit logs will show in console
```

---

## 🚨 Error Handling Guide

### **Rate Limit Error**
**User sees:** "Rate limit exceeded. Please try again in X second(s)."  
**What to do:** Wait for specified time, then retry

### **Integrity Verification Failed**
**User sees:** "TAMPERING DETECTED" badge  
**What to do:** File may be corrupted. Admin should investigate activity logs

### **Authentication Required**
**User sees:** "Authentication required"  
**What to do:** User is not logged in. Redirect to `/auth/login`

### **Admin Access Required**
**User sees:** "Access Denied - Administrator privileges required"  
**What to do:** Only users with `role='ADMIN'` can access admin panel

### **File Size Exceeded**
**User sees:** "Secret file exceeds 5MB limit" or "Carrier image exceeds 5MB limit"  
**What to do:** Select a smaller file

### **Wrong Image Format**
**User sees:** "Carrier image must be a PNG, BMP, or TIFF image"  
**What to do:** Convert image to PNG and try again

---

## 📊 Monitoring Checklist

### **Daily**
- [ ] Check audit logs for suspicious activity
- [ ] Verify rate limit errors are within expected range
- [ ] Monitor error logs for exceptions

### **Weekly**
- [ ] Review tamper detection alerts
- [ ] Check database query performance
- [ ] Verify backups are running

### **Monthly**
- [ ] Audit user activity patterns
- [ ] Review security header effectiveness
- [ ] Check certificate expiration dates

---

## 🔗 Important URLs

| Page | Path | Purpose |
|------|------|---------|
| Upload | `/upload` | Encrypt and hide files |
| Recovery | `/recovery` | Extract and decrypt files |
| Dashboard | `/dashboard` | User file history |
| Admin | `/admin` | System monitoring |
| Login | `/auth/login` | User authentication |
| Sign Up | `/auth/sign-up` | New user registration |

---

## 📚 Documentation Map

| Document | Contains |
|----------|----------|
| [DEVELOPMENT.md](DEVELOPMENT.md) | Detailed dev guide |
| [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) | Phase summaries |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Visual diagrams |
| [CHANGELOG.md](CHANGELOG.md) | All changes made |
| [README_QUICK_START.md](README_QUICK_START.md) | **← You are here** |

---

## 🆘 Need Help?

1. **Installation issues?** Check [DEVELOPMENT.md](DEVELOPMENT.md#deployment--setup)
2. **API questions?** See [ARCHITECTURE.md](ARCHITECTURE.md) for data flows
3. **Want to understand changes?** Review [CHANGELOG.md](CHANGELOG.md)
4. **Integration help?** Check code comments in [lib/audit.ts](lib/audit.ts)
5. **Security concerns?** Review [ARCHITECTURE.md](ARCHITECTURE.md#security-layers)

---

**All 5 phases complete. System production-ready. 🎉**
