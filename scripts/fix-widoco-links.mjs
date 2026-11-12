#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { PREFIXES } from '../src/rdf/namespaces.js'

const BARE_SSTIM_LINK = /href="([^"#/:?][^"]*)" title="https:\/\/w3id\.org\/sstim#([^"]+)"/g
const OBO_BASE = new URL('.', PREFIXES.bfo).href
const PLAIN_LINK_LABEL = /(<a\b[^>]*\shref="([^"]+)"[^>]*>)([^<]*)(<\/a>)/g

/**
 * WIDOCO occasionally rewrites an annotation-property IRI to a bare relative
 * filename even when it emits no corresponding section. Route those orphaned
 * SSTIM links into the Graph Navigator instead of publishing a guaranteed 404.
 */
export function repairWidocoLinks(html) {
  let repairs = 0
  const output = html.replace(BARE_SSTIM_LINK, (match, relative, term) => {
    if (relative !== term) return match
    repairs += 1
    return `href="../../graph/#sstim:${encodeURIComponent(term)}" title="https://w3id.org/sstim#${term}"`
  })
  return { output, repairs }
}

/**
 * WIDOCO's fallback humanizer turns OBO identifiers into labels such as
 * "U B E R O N 0016490", hiding them from browser Find for "UBERON".
 * Normalize only a generated identifier that agrees with its actual target;
 * preserve descriptive labels, other text, attributes and the target IRI.
 */
export function repairWidocoLabels(html) {
  let repairs = 0
  const output = html.replace(PLAIN_LINK_LABEL, (match, opening, href, label, closing) => {
    if (!href.startsWith(OBO_BASE)) return match
    const identifier = /^([A-Z][A-Z0-9]*)_(\d+)$/.exec(href.slice(OBO_BASE.length))
    if (!identifier) return match
    const [, prefix, local] = identifier
    if (label.replace(/\s+/g, '') !== prefix + local) return match
    repairs += 1
    return `${opening}${prefix}:${local}${closing}`
  })
  return { output, repairs }
}

async function main(files) {
  if (files.length === 0) throw new Error('usage: fix-widoco-links.mjs <html> [...]')
  let total = 0
  let labels = 0
  for (const file of files) {
    const { output, repairs } = repairWidocoLinks(await readFile(file, 'utf8'))
    const normalized = repairWidocoLabels(output)
    await writeFile(file, normalized.output)
    total += repairs
    labels += normalized.repairs
  }
  console.log(`fix-widoco-links: repaired ${total} orphaned SSTIM link(s)`)
  console.log(`fix-widoco-links: normalized ${labels} generated OBO identifier label(s)`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
