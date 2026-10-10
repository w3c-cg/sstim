import { createHash } from 'node:crypto'

// Proposal issues are not authoritative ontology statements. Fixed GitHub host/repo.
const API = 'https://api.github.com/repos/w3c-cg/sstim/issues'
const MARKER = 'sstim-mcp-contribution-v1'
export const KINDS = ['correction','missing-knowledge','scientific-evidence',
  'interoperability','research-need','other']
const STANCES = ['observed','inferred','hypothesis','request']

function textField(value, name, max, required = false) {
  if (value === undefined && !required) return ''
  if (typeof value !== 'string' || value.length > max ||
      (required && !value.trim()) || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) {
    throw new Error(name + ': invalid text or length (maximum ' + max + ')')
  }
  return value.trim()
}
function normalize(a) {
  if (!a || typeof a !== 'object' || Array.isArray(a)) throw new Error('Invalid contribution')
  if (!KINDS.includes(a.kind)) throw new Error('Invalid contribution kind')
  if (!STANCES.includes(a.stance)) throw new Error('Invalid epistemic status')
  const c = {
    kind:a.kind, stance:a.stance,
    title:textField(a.title,'title',140,true),
    description:textField(a.description,'description',4000,true),
    evidence:textField(a.evidence,'evidence',2400),
    reproduction:textField(a.reproduction,'reproduction',1200),
    targetIri:textField(a.targetIri,'targetIri',1024),
    release:textField(a.release,'release',35),
  }
  if (c.release && !/^\d+\.\d+\.\d+$/.test(c.release))
    throw new Error('Release must be a frozen x.y.z version')
  if (c.targetIri) {
    let u
    try { u = new URL(c.targetIri) } catch { throw new Error('Invalid target IRI') }
    if (u.protocol !== 'https:' || u.username || u.password || u.search)
      throw new Error('Target must be a public HTTPS IRI without credentials or query')
  }
  if (c.stance === 'observed' && !c.evidence && !c.reproduction)
    throw new Error('Observed defects require source evidence or reproduction steps')
  return c
}
export function draftContribution(args) {
  const c = normalize(args)
  const fingerprint = createHash('sha256').update(JSON.stringify(c)).digest('hex')
  const value = v => v || 'Not supplied'
  const body = [
    '<!-- ' + MARKER + ':' + fingerprint + ' -->',
    '> **Unreviewed community proposal, not canonical SSTIM knowledge.**',
    '> Sources and scientific claims below are contributor-supplied and unverified.',
    '',
    '**Kind:** ' + c.kind,
    '**Epistemic status:** ' + c.stance,
    '**Target IRI:** ' + value(c.targetIri),
    '**Frozen release:** ' + value(c.release),
    '',
    '### Proposed information / problem', value(c.description), '',
    '### Evidence (not yet reviewed)', value(c.evidence), '',
    '### Reproduction / concrete use case', value(c.reproduction), '',
    '### Review boundary',
    'No canonical change occurs by submitting this issue. Scientific claims and source relevance require review.',
    'Submitted via SSTIM MCP with operator authorization.',
  ].join('\n')
  return { title:'[SSTIM proposal / ' + c.kind + '] ' + c.title,
    body, fingerprint, repository:'w3c-cg/sstim', public:true,
    notice:'Draft only. Nothing submitted. Remove private, unpublished or unauthorized information before publishing.' }
}

export function createContributionClient({
  fetchImpl = globalThis.fetch, token = process.env.SSTIM_GITHUB_TOKEN,
  timeoutMs = 10000,
  allowSubmission = process.env.SSTIM_ENABLE_PUBLIC_SUBMISSIONS === '1',
} = {}) {
  if (typeof fetchImpl !== 'function') throw new TypeError('fetch implementation required')
  let lastSubmission = 0
  async function request(method, path, body) {
    if (!(path === '' || /^\d+$/.test(path) ||
      /^\?state=(open|closed|all)&per_page=100(?:&page=[123])?$/.test(path))) {
      throw new Error('Invalid GitHub issue path')
    }
    const url = API + (path ? (path.startsWith('?') ? path : '/' + path) : '')
    const headers = { Accept:'application/vnd.github+json',
      'X-GitHub-Api-Version':'2022-11-28',
      ...(token ? { Authorization:'Bearer ' + token } : {}),
      ...(body ? { 'Content-Type':'application/json' } : {}) }
    const response = await fetchImpl(url, {
      method, headers, ...(body ? { body:JSON.stringify(body) } : {}),
      redirect:'error', signal:AbortSignal.timeout(timeoutMs),
    })
    if (!response.ok) {
      if ([401,403].includes(response.status)) throw new Error('GitHub authorization failed or submission forbidden')
      if (response.status === 404) throw new Error('GitHub issue not found')
      if (response.status === 422) throw new Error('GitHub rejected the issue content')
      throw new Error('GitHub issue API returned HTTP ' + response.status)
    }
    const raw = await response.text()
    if (raw.length > 2_000_000) throw new Error('GitHub response too large')
    return JSON.parse(raw)
  }
  function filtered(i, full=false) {
    if (!i || i.pull_request || !String(i.body ?? '').includes('<!-- '+MARKER+':')) return null
    return {
      number:i.number, title:i.title, url:i.html_url, state:i.state,
      labels:(i.labels ?? []).map(x=>typeof x === 'string' ? x : x.name),
      updatedAt:i.updated_at,
      ...(full ? { body:i.body,
        notice:'Contributor claims are unverified. Closed does not necessarily mean accepted.' } : {}),
    }
  }
  async function listContributions({state='open',limit=20}={}) {
    if (!['open','closed','all'].includes(state)) throw new Error('Invalid state')
    if (!Number.isInteger(limit) || limit < 1 || limit > 20) throw new Error('limit must be 1 to 20')
    const issues = await request('GET','?state='+state+'&per_page=100')
    if (!Array.isArray(issues)) throw new Error('Invalid GitHub response')
    const items=issues.map(x=>filtered(x)).filter(Boolean)
    return { state, results:items.slice(0,limit), scanned:issues.length,
      truncated:issues.length === 100 || items.length > limit,
      note:'Scans recent public issues only. Issue state is not scientific adjudication.' }
  }
  async function getContribution({number}={}) {
    if (!Number.isSafeInteger(number)||number<1) throw new Error('Positive issue number required')
    const item=filtered(await request('GET',String(number)),true)
    if (!item) throw new Error('Issue is not an SSTIM MCP contribution')
    return item
  }
  async function submitContribution(args={}) {
    if (args.approvedForPublicSubmission !== true)
      throw new Error('Explicit authorization for this exact public proposal is required')
    if (!allowSubmission)
      throw new Error('Public issue submissions are disabled. Set SSTIM_ENABLE_PUBLIC_SUBMISSIONS=1 explicitly in the host environment.')
    if (!token || typeof token !== 'string')
      throw new Error('Submission unavailable. Set SSTIM_GITHUB_TOKEN with Issues write access.')
    const draft=draftContribution(args)
    if (Date.now()-lastSubmission<15000) throw new Error('Wait 15 seconds between submissions')
    for(let page=1;page<=3;page++) {
      const issues=await request('GET','?state=all&per_page=100&page='+page)
      if(!Array.isArray(issues)) throw new Error('Invalid GitHub response')
      const original=issues.find(x=>!x.pull_request && String(x.body ?? '').includes(
        '<!-- '+MARKER+':'+draft.fingerprint+' -->'))
      if(original) return {submitted:false,duplicate:true,number:original.number,
        url:original.html_url,notice:'Duplicate found; no new issue created.'}
      if(issues.length<100) break
    }
    const issue=await request('POST','',{title:draft.title,body:draft.body})
    lastSubmission=Date.now()
    return { submitted:true,number:issue.number,url:issue.html_url,state:issue.state,
      notice:'Public proposal submitted for review; not canonical SSTIM knowledge.' }
  }
  return {draftContribution,submitContribution,listContributions,getContribution}
}
