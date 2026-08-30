import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseRegistry } from './parseRegistry'

const csv = readFileSync(join(__dirname, 'fixtures/registry-sample.csv'), 'utf8')

describe('parseRegistry', () => {
  it('parses valid rows and maps Hebrew type labels', () => {
    const { rows } = parseRegistry(csv)
    expect(rows).toHaveLength(4)
    expect(rows[0]).toEqual({ semel: '412345', name: 'בית ספר יסודי הדסים', city: 'רעננה', type: 'elementary' })
    expect(rows[1]!.type).toBe('gan')
    expect(rows[2]!.type).toBe('middle')
    expect(rows[3]!.type).toBe('high')
  })

  it('skips rows with a missing name, missing semel, or unknown type, with a reason', () => {
    const { skipped } = parseRegistry(csv)
    expect(skipped).toHaveLength(3)
    expect(skipped.map((s) => s.reason).sort()).toEqual(['missing_name', 'missing_semel', 'unknown_type'])
  })

  it('never throws on malformed input', () => {
    expect(() => parseRegistry('not,a,valid\nregistry')).not.toThrow()
  })
})
