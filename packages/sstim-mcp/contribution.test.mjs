import { describe, expect, it } from 'vitest'
import { createContributionClient, draftContribution } from './contribution.mjs'

const base = {
  kind:'research-need', stance:'request', title:'Support auditory scene comparisons',
  description:'Comparing soundscape descriptions across independent research tools',
  reproduction:'Tool A and Tool B describe different modulation details',
}
const marker = '<!-- sstim-mcp-contribution-v1:'
function fixture({ issues = [] } = {}) {
  const calls = []
  const fetchImpl = async (url, options) => {
    calls.push({ url, options })
    if (options.method === 'POST') {
      const body = JSON.parse(options.body)
      return new Response(JSON.stringify({ number:31, html_url:'https://github.com/w3c-cg/sstim/issues/31',
        state:'open', body:body.body }),{status:201})
    }
    if (String(url).endsWith('/31')) {
      return new Response(JSON.stringify({ number:31,
        html_url:'https://github.com/w3c-cg/sstim/issues/31',state:'open',
        body:draftContribution(base).body, title:'Reference need',labels:[] }),{status:200})
    }
    return new Response(JSON.stringify(issues),{status:200})
  }
  return { calls, fetchImpl }
}

describe('review-only SSTIM MCP proposals', () => {
  it('drafts source-conscious proposals without sending any request', () => {
    const draft=draftContribution(base)
    expect(draft.public).toBe(true)
    expect(draft.body).toContain('Unreviewed community proposal')
    expect(draft.body).toContain('**Epistemic status:** request')
    expect(draft.fingerprint).toMatch(/^[a-f0-9]{64}$/)
    expect(draftContribution(base).fingerprint).toBe(draft.fingerprint)
    expect(() => draftContribution({...base,stance:'observed',reproduction:''})).toThrow(/source evidence/)
    expect(() => draftContribution({...base,targetIri:'javascript:alert(1)'})).toThrow(/HTTPS/)
    expect(() => draftContribution({...base,release:'0.20.0-dev'})).toThrow(/frozen/)
  })
  it('does not submit without authorization and a locally configured token', async () => {
    const fx=fixture()
    const c=createContributionClient({fetchImpl:fx.fetchImpl,token:'',allowSubmission:true})
    await expect(c.submitContribution(base)).rejects.toThrow(/Explicit authorization/)
    await expect(c.submitContribution({...base,approvedForPublicSubmission:true})).rejects.toThrow(/SSTIM_GITHUB_TOKEN/)
    expect(fx.calls).toHaveLength(0)
    const disabled=createContributionClient({fetchImpl:fx.fetchImpl,token:'fixture-only',allowSubmission:false})
    await expect(disabled.submitContribution({...base,approvedForPublicSubmission:true})).rejects.toThrow(/disabled/)
    expect(fx.calls).toHaveLength(0)
  })
  it('writes only a public proposal issue to the fixed GitHub repository after consent', async () => {
    const fx=fixture()
    const c=createContributionClient({fetchImpl:fx.fetchImpl,token:'fixture-only',allowSubmission:true})
    const result=await c.submitContribution({...base,approvedForPublicSubmission:true})
    expect(result.submitted).toBe(true)
    expect(result.number).toBe(31)
    expect(fx.calls.at(-1).url).toBe('https://api.github.com/repos/w3c-cg/sstim/issues')
    expect(fx.calls.at(-1).options.method).toBe('POST')
    expect(fx.calls.at(-1).options.redirect).toBe('error')
    expect(fx.calls.at(-1).options.headers.Authorization).toBe('Bearer fixture-only')
    expect(fx.calls.at(-1).options.body).not.toContain('fixture-only')
    expect(JSON.parse(fx.calls.at(-1).options.body).body).toContain(marker)
    await expect(c.submitContribution({...base,approvedForPublicSubmission:true})).rejects.toThrow(/15 seconds/)
  })
  it('avoids known duplicate issues, without a second POST', async () => {
    const original=draftContribution(base)
    const fx=fixture({issues:[{number:19,html_url:'https://github.com/w3c-cg/sstim/issues/19',
      body:original.body}]})
    const c=createContributionClient({fetchImpl:fx.fetchImpl,token:'fixture-only',allowSubmission:true})
    const result=await c.submitContribution({...base,approvedForPublicSubmission:true})
    expect(result.duplicate).toBe(true)
    expect(fx.calls.every(call=>call.options.method==='GET')).toBe(true)
  })
  it('lists and reads proposal issues without credentials and excludes unrelated issues', async () => {
    const draft=draftContribution(base)
    const fx=fixture({issues:[
      {number:12,state:'open',body:draft.body,labels:[{name:'needs-review'}],
        html_url:'https://github.com/w3c-cg/sstim/issues/12',title:'SSTIM proposal'},
      {number:99,state:'open',body:'Unrelated issue',labels:[]},
      {number:42,state:'open',body:draft.body,pull_request:{url:'not-an-issue'}},
    ]})
    const c=createContributionClient({fetchImpl:fx.fetchImpl,token:''})
    const list=await c.listContributions({state:'open'})
    expect(list.results.map(x=>x.number)).toEqual([12])
    expect(list.results[0].labels).toEqual(['needs-review'])
    const item=await c.getContribution({number:31})
    expect(item.body).toContain(marker)
    expect(item.notice).toContain('unverified')
    expect(fx.calls.every(call=>!call.options.headers.Authorization)).toBe(true)
  })
})
