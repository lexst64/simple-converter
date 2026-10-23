import { describe, expect, it } from 'vitest'
import { formatBytes, getExtFromFileName } from '@/utils'

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
