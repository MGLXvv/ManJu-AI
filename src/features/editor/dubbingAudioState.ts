const SAMPLE_RATE = 12000

const toLittleEndian16 = (value: number): [number, number] => [value & 0xff, (value >> 8) & 0xff]
const toLittleEndian32 = (value: number): [number, number, number, number] => [
  value & 0xff,
  (value >> 8) & 0xff,
  (value >> 16) & 0xff,
  (value >> 24) & 0xff,
]

const createSeedValue = (seed: string): number =>
  seed.split('').reduce((total, char, index) => total + char.charCodeAt(0) * (index + 1), 0)

const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

export const buildMockAudioDataUrl = (input: { seed: string; durationMs?: number }): string => {
  const durationMs = Math.max(180, input.durationMs ?? 640)
  const sampleCount = Math.floor((SAMPLE_RATE * durationMs) / 1000)
  const dataSize = sampleCount
  const buffer = new Uint8Array(44 + dataSize)
  const seedValue = createSeedValue(input.seed)
  const frequency = 220 + (seedValue % 180)

  const writeAscii = (offset: number, value: string): void => {
    for (let index = 0; index < value.length; index += 1) {
      buffer[offset + index] = value.charCodeAt(index)
    }
  }

  writeAscii(0, 'RIFF')
  buffer.set(toLittleEndian32(36 + dataSize), 4)
  writeAscii(8, 'WAVE')
  writeAscii(12, 'fmt ')
  buffer.set(toLittleEndian32(16), 16)
  buffer.set(toLittleEndian16(1), 20)
  buffer.set(toLittleEndian16(1), 22)
  buffer.set(toLittleEndian32(SAMPLE_RATE), 24)
  buffer.set(toLittleEndian32(SAMPLE_RATE), 28)
  buffer.set(toLittleEndian16(1), 32)
  buffer.set(toLittleEndian16(8), 34)
  writeAscii(36, 'data')
  buffer.set(toLittleEndian32(dataSize), 40)

  for (let index = 0; index < sampleCount; index += 1) {
    const t = index / SAMPLE_RATE
    const envelope = Math.min(1, index / 240) * Math.min(1, (sampleCount - index) / 240)
    const sample =
      Math.sin(2 * Math.PI * frequency * t) * 0.44 +
      Math.sin(2 * Math.PI * frequency * 1.5 * t) * 0.16 +
      Math.sin(2 * Math.PI * frequency * 2 * t) * 0.08
    const normalized = Math.max(-1, Math.min(1, sample * envelope))
    buffer[44 + index] = Math.round((normalized + 1) * 127.5)
  }

  return `data:audio/wav;base64,${bytesToBase64(buffer)}`
}
