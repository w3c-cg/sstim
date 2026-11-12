import { describe, expect, it } from 'vitest'
import { repairWidocoLinks, repairWidocoLabels } from './fix-widoco-links.mjs'
import { PREFIXES } from '../src/rdf/namespaces.js'

const OBO_BASE = new URL('.', PREFIXES.bfo).href

describe('WIDOCO link repair', () => {
  it('routes an orphaned SSTIM term to the mounted Graph Navigator relatively', () => {
    const input = '<a href="evidenceNotes" title="https://w3id.org/sstim#evidenceNotes">notes</a>'
    const result = repairWidocoLinks(input)
    expect(result.repairs).toBe(1)
    expect(result.output).toContain('href="../../graph/#sstim:evidenceNotes"')
  })

  it('leaves valid local anchors and unrelated links unchanged', () => {
    const input = [
      '<a href="#FrequencyBand" title="https://w3id.org/sstim#FrequencyBand">band</a>',
      '<a href="vocab/">vocabulary</a>',
    ].join('')
    expect(repairWidocoLinks(input)).toEqual({ output: input, repairs: 0 })
  })
})

describe('WIDOCO identifier labels', () => {
  it('makes the deployed UBERON mapping searchable without changing its target', () => {
    const iri = `${OBO_BASE}UBERON_0016490`
    const input = `<a href="${iri}" target="_blank" title="${iri}">U B E R O N 0016490</a>`
    expect(repairWidocoLabels(input)).toEqual({
      output: `<a href="${iri}" target="_blank" title="${iri}">UBERON:0016490</a>`,
      repairs: 1,
    })
  })

  it.each(['BFO', 'OBI', 'IAO', 'COB'])('keeps %s identifiers searchable too', (prefix) => {
    const input = `<a class="entity" href="${OBO_BASE}${prefix}_0000015">${prefix.split('').join(' ')} 0000015</a>`
    expect(repairWidocoLabels(input).output).toContain(`>${prefix}:0000015</a>`)
  })

  it('preserves human labels, unrelated links, mismatched IDs and non-link prose', () => {
    const iri = `${OBO_BASE}UBERON_0016490`
    const input = [
      `<a href="${iri}">auditory system</a>`,
      `<a href="${iri}"><span>U B E R O N 0016490</span></a>`,
      `<a href="${iri}">U B E R O N 0000955</a>`,
      '<a href="https://example.org/UBERON_0016490">U B E R O N 0016490</a>',
      '<p>U B E R O N 0016490</p>',
    ].join('')
    expect(repairWidocoLabels(input)).toEqual({ output: input, repairs: 0 })
  })

  it('is idempotent', () => {
    const input = `<a href="${OBO_BASE}UBERON_0016490">U B E R O N 0016490</a>`
    const first = repairWidocoLabels(input)
    expect(repairWidocoLabels(first.output)).toEqual({ output: first.output, repairs: 0 })
  })
})
