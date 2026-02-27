// ============================================
// HSDC Steganography Engine
// PRNG LSB Implementation (Cryptographically Synchronized)
// ============================================
import crypto from 'crypto'
import type { StegoEmbedResult, StegoExtractResult } from './types'

const HSDC_MAGIC = Buffer.from('HSDC', 'ascii')
const LENGTH_BYTES = 4
const CRC_BYTES = 4

// The true start of the payload is after the Magic + Length (8 bytes)
const PREFIX_SIZE = HSDC_MAGIC.length + LENGTH_BYTES 
const HEADER_SIZE = PREFIX_SIZE + CRC_BYTES // Total overhead (12 bytes)

class SeededPRNG {
  private state: number

  constructor(seed: string) {
    const hash = crypto.createHash('md5').update(seed).digest()
    this.state = hash.readUInt32BE(0)
  }

  next(): number {
    this.state = (Math.imul(this.state, 1664525) + 1013904223) >>> 0
    return this.state
  }

  shuffleIndices(length: number): number[] {
    const indices = Array.from({ length }, (_, i) => i)
    for (let i = length - 1; i > 0; i--) {
      const j = this.next() % (i + 1)
      const temp = indices[i]
      indices[i] = indices[j]
      indices[j] = temp
    }
    return indices
  }
}

function crc32(data: Buffer): number {
  let crc = 0xffffffff
  const table = getCRC32Table()
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xff]
  }
  return (crc ^ 0xffffffff) >>> 0
}

let crc32Table: Uint32Array | null = null
function getCRC32Table(): Uint32Array {
  if (crc32Table) return crc32Table
  crc32Table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    crc32Table[i] = c
  }
  return crc32Table
}

export function calculateCapacity(width: number, height: number, channels: number): number {
  const usableChannels = Math.min(channels, 3) 
  const totalBits = width * height * usableChannels * 2 
  const totalBytes = Math.floor(totalBits / 8)
  return Math.max(0, totalBytes - HEADER_SIZE)
}

export async function embed(
  imageData: Buffer,
  width: number,
  height: number,
  channels: number,
  payload: Buffer,
  seed: string,
): Promise<StegoEmbedResult> {
  const capacity = calculateCapacity(width, height, channels)
  if (payload.length > capacity) throw new Error(`Payload exceeds capacity`)

  const lengthBuf = Buffer.alloc(LENGTH_BYTES)
  lengthBuf.writeUInt32BE(payload.length, 0)

  const crcValue = crc32(payload)
  const crcBuf = Buffer.alloc(CRC_BYTES)
  crcBuf.writeUInt32BE(crcValue, 0)

  const frame = Buffer.concat([HSDC_MAGIC, lengthBuf, payload, crcBuf])
  const output = Buffer.from(imageData)
  const usableChannels = Math.min(channels, 3)

  const totalPixels = width * height
  const prng = new SeededPRNG(seed)
  const pixelOrder = prng.shuffleIndices(totalPixels)

  let pixelsModified = 0
  let frameByteIdx = 0
  let frameBitIdx = 0

  for (let p = 0; p < pixelOrder.length && frameByteIdx < frame.length; p++) {
    const pixelIdx = pixelOrder[p]
    const baseOffset = pixelIdx * channels
    let modified = false

    for (let c = 0; c < usableChannels && frameByteIdx < frame.length; c++) {
      const byteOffset = baseOffset + c
      let byte = output[byteOffset]

      if (frameBitIdx < 8) {
        const bit0 = (frame[frameByteIdx] >> (7 - frameBitIdx)) & 1
        byte = (byte & 0xfe) | bit0 
        frameBitIdx++
        modified = true
      }

      if (frameBitIdx === 8) {
        frameByteIdx++
        frameBitIdx = 0
        if (frameByteIdx >= frame.length) break
      }

      if (frameBitIdx < 8) {
        const bit1 = (frame[frameByteIdx] >> (7 - frameBitIdx)) & 1
        byte = (byte & 0xfd) | (bit1 << 1) 
        frameBitIdx++
      }

      if (frameBitIdx === 8) {
        frameByteIdx++
        frameBitIdx = 0
      }

      output[byteOffset] = byte
    }
    if (modified) pixelsModified++
  }

  return {
    stegoImageBuffer: output,
    capacityUsed: payload.length,
    capacityTotal: capacity,
    pixelsModified,
  }
}

export function extract(
  imageData: Buffer,
  width: number,
  height: number,
  channels: number,
  seed: string,
): StegoExtractResult {
  const totalPixels = width * height
  const prng = new SeededPRNG(seed)
  const pixelOrder = prng.shuffleIndices(totalPixels)
  const usableChannels = Math.min(channels, 3)
  
  const maxBytes = calculateCapacity(width, height, channels) + HEADER_SIZE
  const extractedBytes = Buffer.alloc(maxBytes)
  
  let byteIdx = 0
  let bitIdx = 0
  let currentByte = 0
  
  let extractedLength = 0
  let isHeaderParsed = false
  let targetSize = PREFIX_SIZE // We initially only need the first 8 bytes to parse the header

  for (let p = 0; p < pixelOrder.length; p++) {
    const pixelIdx = pixelOrder[p]
    const baseOffset = pixelIdx * channels

    for (let c = 0; c < usableChannels; c++) {
      const byte = imageData[baseOffset + c]

      for (let bit = 0; bit < 2; bit++) {
        const extractedBit = (byte >> bit) & 1
        currentByte = (currentByte << 1) | extractedBit
        bitIdx++

        if (bitIdx === 8) {
          extractedBytes[byteIdx++] = currentByte
          currentByte = 0
          bitIdx = 0

          // Dynamic header validation - triggers exactly when byte 8 is reached
          if (!isHeaderParsed && byteIdx === PREFIX_SIZE) {
            const magic = extractedBytes.subarray(0, HSDC_MAGIC.length)
            if (!magic.equals(HSDC_MAGIC)) {
              throw new Error('No HSDC data found in this image (magic header mismatch)')
            }
            extractedLength = extractedBytes.readUInt32BE(HSDC_MAGIC.length)
            if (extractedLength <= 0 || extractedLength > maxBytes - HEADER_SIZE) {
              throw new Error('Invalid payload length detected')
            }
            // Now we know the length, we target the full frame
            targetSize = PREFIX_SIZE + extractedLength + CRC_BYTES
            isHeaderParsed = true
          }
        }
        if (isHeaderParsed && byteIdx === targetSize) break
      }
      if (isHeaderParsed && byteIdx === targetSize) break
    }
    if (isHeaderParsed && byteIdx === targetSize) break
  }

  if (byteIdx < targetSize) {
    throw new Error('Image does not contain a complete payload')
  }

  // BUG FIXED: We slice the payload starting at Byte 8 (PREFIX_SIZE), not Byte 12!
  const payloadStart = PREFIX_SIZE
  const payload = extractedBytes.subarray(payloadStart, payloadStart + extractedLength)
  const storedCRC = extractedBytes.readUInt32BE(payloadStart + extractedLength)

  const computedCRC = crc32(payload)
  const integrityValid = storedCRC === computedCRC

  return {
    extractedData: Buffer.from(payload),
    dataLength: extractedLength,
    integrityValid,
  }
}
