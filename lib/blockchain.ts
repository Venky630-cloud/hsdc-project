// ============================================
// HSDC Mock Blockchain Layer
// Interface-compatible mock for Phase 2 swap to real ethers.js
// ============================================
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import type { BlockchainHashRecord } from './types'

/**
 * Interface for blockchain operations.
 * Phase 2 will implement this with ethers.js + Polygon/Ethereum.
 */
export interface IBlockchainService {
  storeHash(hash: string, userId: string): Promise<BlockchainHashRecord>
  verifyHash(hash: string): Promise<BlockchainHashRecord | null>
  getRecordsByUser(userId: string): Promise<BlockchainHashRecord[]>
}

/**
 * Mock Blockchain Service
 *
 * Stores hashes in Supabase metadata table to simulate blockchain behavior.
 * Generates deterministic mock transaction IDs and block numbers.
 * Will be replaced by real blockchain in Phase 2.
 */
export class MockBlockchainService implements IBlockchainService {
  private network = 'mock-polygon'

  /**
   * "Store" a hash on the mock blockchain
   * Returns a simulated transaction record
   */
  async storeHash(hash: string, userId: string): Promise<BlockchainHashRecord> {
    // Generate deterministic mock tx ID from hash
    const txId = '0x' + crypto.createHash('sha256')
      .update(`tx:${hash}:${Date.now()}`)
      .digest('hex')

    // Simulate block number (incrementing)
    const blockNumber = Math.floor(Date.now() / 1000) - 1700000000

    const record: BlockchainHashRecord = {
      id: crypto.randomUUID(),
      hash,
      txId,
      network: this.network,
      timestamp: new Date().toISOString(),
      blockNumber,
      verified: true,
    }

    // Store in Supabase for persistence
    const supabase = await createClient()
    await supabase.from('metadata').update({
      blockchain_hash: hash,
      blockchain_tx_id: txId,
      blockchain_network: this.network,
    }).eq('integrity_hash', hash).eq('user_id', userId)

    // Log the action
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: 'HASH_STORE',
      details: {
        hash,
        txId,
        network: this.network,
        blockNumber,
        mock: true,
      },
    })

    return record
  }

  /**
   * Verify a hash exists on the mock blockchain
   */
  async verifyHash(hash: string): Promise<BlockchainHashRecord | null> {
    const supabase = await createClient()

    const { data } = await supabase
      .from('metadata')
      .select('*')
      .eq('blockchain_hash', hash)
      .single()

    if (!data) return null

    return {
      id: data.id,
      hash: data.blockchain_hash,
      txId: data.blockchain_tx_id,
      network: data.blockchain_network,
      timestamp: data.created_at,
      verified: true,
    }
  }

  /**
   * Get all blockchain records for a user
   */
  async getRecordsByUser(userId: string): Promise<BlockchainHashRecord[]> {
    const supabase = await createClient()

    const { data } = await supabase
      .from('metadata')
      .select('*')
      .eq('user_id', userId)
      .not('blockchain_hash', 'is', null)
      .order('created_at', { ascending: false })

    if (!data) return []

    return data.map((row) => ({
      id: row.id,
      hash: row.blockchain_hash,
      txId: row.blockchain_tx_id,
      network: row.blockchain_network,
      timestamp: row.created_at,
      verified: true,
    }))
  }
}

// Singleton for app usage
let _blockchainService: IBlockchainService | null = null

export function getBlockchainService(): IBlockchainService {
  if (!_blockchainService) {
    _blockchainService = new MockBlockchainService()
  }
  return _blockchainService
}
