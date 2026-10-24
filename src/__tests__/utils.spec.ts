import { describe, expect, it } from 'vitest'
import {
  fileSizeLimitReason,
  formatBytes,
  getExtFromFileName,
  MAX_FILE_SIZE,
  splitBySize,
} from '@/utils'
import { makeFile } from './component-helpers'

describe('formatBytes', () => {
  it('returns "0 B" for zero', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(-0)).toBe('0 B')
  })

  it('returns "0 B" for non-finite input', () => {
    expect(formatBytes(NaN)).toBe('0 B')
    expect(formatBytes(Infinity)).toBe('0 B')
    expect(formatBytes(-Infinity)).toBe('0 B')
  })

  it('uses the absolute value of negative numbers', () => {
    expect(formatBytes(-1024)).toBe('1.00 KB')
    expect(formatBytes(-500)).toBe('500.00 B')
  })

  it('truncates fractional bytes', () => {
    expect(formatBytes(0.9)).toBe('0 B')
    expect(formatBytes(1.9)).toBe('1.00 B')
  })

  it('switches units at each 1024 boundary', () => {
    expect(formatBytes(1)).toBe('1.00 B')
    expect(formatBytes(1023)).toBe('1023.00 B')
    expect(formatBytes(1024)).toBe('1.00 KB')
    expect(formatBytes(1536)).toBe('1.50 KB')
    expect(formatBytes(1024 ** 2 - 1)).toBe('1024.00 KB')
    expect(formatBytes(1024 ** 2)).toBe('1.00 MB')
    expect(formatBytes(1024 ** 3)).toBe('1.00 GB')
    expect(formatBytes(1024 ** 4)).toBe('1.00 TB')
    expect(formatBytes(1024 ** 5)).toBe('1.00 PB')
  })

  it('caps the unit at PB', () => {
    expect(formatBytes(1024 ** 6)).toBe('1024.00 PB')
    expect(formatBytes(2 * 1024 ** 7)).toBe('2097152.00 PB')
  })

  it('respects the decimals argument', () => {
    expect(formatBytes(1536, 0)).toBe('2 KB')
    expect(formatBytes(1536, 1)).toBe('1.5 KB')
    expect(formatBytes(1234567, 3)).toBe('1.177 MB')
  })

  it('treats negative decimals as zero', () => {
    expect(formatBytes(1536, -2)).toBe('2 KB')
  })
})

describe('getExtFromFileName', () => {
  it('returns the extension of a simple file name', () => {
    expect(getExtFromFileName('video.mp4')).toBe('mp4')
  })

  it('returns the last extension when there are multiple dots', () => {
    expect(getExtFromFileName('archive.tar.gz')).toBe('gz')
    expect(getExtFromFileName('my.holiday.photo.JPG')).toBe('JPG')
  })

  it('returns an empty string when there is no extension', () => {
    expect(getExtFromFileName('README')).toBe('')
    expect(getExtFromFileName('')).toBe('')
  })

  it('treats a leading dot as part of the name (dotfiles)', () => {
    expect(getExtFromFileName('.gitignore')).toBe('')
    expect(getExtFromFileName('.env.local')).toBe('local')
  })

  it('returns an empty string for a trailing dot', () => {
    expect(getExtFromFileName('file.')).toBe('')
  })
})

describe('MAX_FILE_SIZE', () => {
  it('is 1 GB', () => {
    expect(MAX_FILE_SIZE).toBe(1073741824)
    expect(formatBytes(MAX_FILE_SIZE, 1)).toBe('1.0 GB')
  })
})

describe('fileSizeLimitReason', () => {
  it('formats the limit with formatBytes', () => {
    expect(fileSizeLimitReason(1024 * 1024)).toBe('File size exceeds 1.0 MB limit')
    expect(fileSizeLimitReason(MAX_FILE_SIZE)).toBe('File size exceeds 1.0 GB limit')
  })
})

describe('splitBySize', () => {
  it('splits files at the default limit, keeping files exactly at the limit', () => {
    const atLimit = makeFile('at.mp4', MAX_FILE_SIZE)
    const over = makeFile('over.mp4', MAX_FILE_SIZE + 1)
    const small = makeFile('small.mp4', 10)

    expect(splitBySize([atLimit, over, small])).toEqual({
      valid: [atLimit, small],
      rejected: [{ file: over, reason: 'File size exceeds 1.0 GB limit' }],
    })
  })

  it('uses a custom limit', () => {
    const big = makeFile('big.mp4', 2 * 1024 * 1024)
    expect(splitBySize([big], 1024 * 1024)).toEqual({
      valid: [],
      rejected: [{ file: big, reason: 'File size exceeds 1.0 MB limit' }],
    })
  })

  it('treats a zero limit as no limit', () => {
    const big = makeFile('big.mp4', MAX_FILE_SIZE * 2)
    expect(splitBySize([big], 0)).toEqual({ valid: [big], rejected: [] })
  })

  it('returns empty lists for no files', () => {
    expect(splitBySize([])).toEqual({ valid: [], rejected: [] })
  })
})
